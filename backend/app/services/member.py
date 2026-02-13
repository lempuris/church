from typing import Any, Literal
from uuid import UUID

import boto3
from botocore.config import Config
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import FamilyRelationship, Member, User
from app.schemas.member import MemberCreate, MemberUpdate

# Reciprocal relationship mapping
RECIPROCAL_RELATIONSHIPS = {
    "spouse": "spouse",
    "child": "parent",
    "parent": "child",
    "sibling": "sibling",
}


class MemberService:
    def __init__(self, db: Session):
        self.db = db

    def get_member_by_id(self, member_id: UUID) -> Member | None:
        stmt = select(Member).where(Member.id == member_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_members(
        self,
        page: int = 1,
        page_size: int = 20,
        search: str | None = None,
        status: Literal["active", "inactive", "visitor"] | None = None,
        sort_by: str = "name",
        sort_order: str = "asc",
    ) -> tuple[list[Member], int]:
        stmt = select(Member)

        # Filter by status (default to active only)
        if status:
            stmt = stmt.where(Member.member_status == status)
        else:
            stmt = stmt.where(Member.member_status != "inactive")

        # Search by name
        if search:
            search_term = f"%{search}%"
            stmt = stmt.where(
                or_(
                    Member.first_name.ilike(search_term),
                    Member.last_name.ilike(search_term),
                )
            )

        # Get total count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar() or 0

        # Sorting
        order_expression: Any
        if sort_by == "join_date":
            order_expression = (
                Member.join_date.desc() if sort_order == "desc" else Member.join_date
            )
        else:
            order_expression = (
                Member.last_name.desc() if sort_order == "desc" else Member.last_name
            )

        stmt = stmt.order_by(order_expression, Member.first_name)

        # Pagination
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        members = list(self.db.execute(stmt).scalars().all())
        return members, total

    def create_member(self, member_data: MemberCreate) -> Member:
        member = Member(**member_data.model_dump())

        # Auto-link to user if email matches
        if member_data.email:
            user = self.db.execute(
                select(User).where(User.email == member_data.email)
            ).scalar_one_or_none()
            if user:
                member.user_id = user.id

        self.db.add(member)
        self.db.commit()
        self.db.refresh(member)
        return member

    def update_member(
        self, member_id: UUID, member_data: MemberUpdate
    ) -> Member | None:
        member = self.get_member_by_id(member_id)
        if not member:
            return None

        update_data = member_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(member, field, value)

        self.db.commit()
        self.db.refresh(member)
        return member

    def delete_member(self, member_id: UUID) -> bool:
        member = self.get_member_by_id(member_id)
        if not member:
            return False

        # Soft delete - set status to inactive
        member.member_status = "inactive"
        self.db.commit()
        return True

    def reactivate_member(self, member_id: UUID) -> Member | None:
        member = self.get_member_by_id(member_id)
        if not member:
            return None

        member.member_status = "active"
        self.db.commit()
        self.db.refresh(member)
        return member

    def get_family_relationships(self, member_id: UUID) -> list[dict]:
        stmt = select(FamilyRelationship).where(
            FamilyRelationship.member_id == member_id
        )
        relationships = self.db.execute(stmt).scalars().all()

        family = []
        for rel in relationships:
            related = self.get_member_by_id(rel.related_member_id)
            if related:
                family.append(
                    {
                        "id": rel.id,
                        "first_name": related.first_name,
                        "last_name": related.last_name,
                        "photo_url": related.photo_url,
                        "relationship_type": rel.relationship_type,
                        "member_id": related.id,
                    }
                )
        return family

    def add_family_relationship(
        self,
        member_id: UUID,
        related_member_id: UUID,
        relationship_type: str,
    ) -> FamilyRelationship:
        # Create the relationship
        relationship = FamilyRelationship(
            member_id=member_id,
            related_member_id=related_member_id,
            relationship_type=relationship_type,
        )
        self.db.add(relationship)

        # Create reciprocal relationship
        reciprocal_type = RECIPROCAL_RELATIONSHIPS.get(
            relationship_type, relationship_type
        )
        reciprocal = FamilyRelationship(
            member_id=related_member_id,
            related_member_id=member_id,
            relationship_type=reciprocal_type,
        )
        self.db.add(reciprocal)

        self.db.commit()
        self.db.refresh(relationship)
        return relationship

    def remove_family_relationship(
        self, member_id: UUID, relationship_id: UUID
    ) -> bool:
        # Get the relationship
        stmt = select(FamilyRelationship).where(
            FamilyRelationship.id == relationship_id,
            FamilyRelationship.member_id == member_id,
        )
        relationship = self.db.execute(stmt).scalar_one_or_none()
        if not relationship:
            return False

        # Find and delete reciprocal
        reciprocal_stmt = select(FamilyRelationship).where(
            FamilyRelationship.member_id == relationship.related_member_id,
            FamilyRelationship.related_member_id == member_id,
        )
        reciprocal = self.db.execute(reciprocal_stmt).scalar_one_or_none()
        if reciprocal:
            self.db.delete(reciprocal)

        self.db.delete(relationship)
        self.db.commit()
        return True

    def get_photo_upload_url(self, member_id: UUID) -> tuple[str, str] | None:
        member = self.get_member_by_id(member_id)
        if not member:
            return None

        s3_client = boto3.client(
            "s3",
            region_name=settings.AWS_REGION,
            config=Config(signature_version="s3v4"),
        )

        key = f"members/{member_id}/photo.jpg"
        upload_url = s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.S3_BUCKET_NAME,
                "Key": key,
                "ContentType": "image/jpeg",
            },
            ExpiresIn=3600,
        )

        photo_url = f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"

        # Update member photo URL
        member.photo_url = photo_url
        self.db.commit()

        return upload_url, photo_url


def get_member_service(db: Session) -> MemberService:
    return MemberService(db)
