from datetime import datetime
from uuid import UUID

import boto3
from botocore.config import Config
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Member, Testimony
from app.schemas.testimony import TestimonyCreate, TestimonyUpdate


class TestimonyService:
    def __init__(self, db: Session):
        self.db = db

    def get_testimony_by_id(self, testimony_id: UUID) -> Testimony | None:
        stmt = select(Testimony).where(Testimony.id == testimony_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_testimonies(
        self,
        page: int = 1,
        page_size: int = 20,
        status: str | None = None,
        category: str | None = None,
        member_id: UUID | None = None,
        is_featured: bool | None = None,
    ) -> tuple[list[dict], int]:
        """Get testimonies (admin view)."""
        stmt = select(Testimony)

        if status:
            stmt = stmt.where(Testimony.status == status)

        if category:
            stmt = stmt.where(Testimony.category == category)

        if member_id:
            stmt = stmt.where(Testimony.member_id == member_id)

        if is_featured is not None:
            stmt = stmt.where(Testimony.is_featured == is_featured)

        # Get total count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar() or 0

        # Order and paginate
        stmt = stmt.order_by(Testimony.created_at.desc())
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        testimonies = list(self.db.execute(stmt).scalars().all())
        result = [self._testimony_to_dict(t) for t in testimonies]

        return result, total

    def get_public_testimonies(
        self,
        page: int = 1,
        page_size: int = 20,
        category: str | None = None,
    ) -> tuple[list[dict], int]:
        """Get approved testimonies for public display."""
        stmt = select(Testimony).where(Testimony.status == "approved")

        if category:
            stmt = stmt.where(Testimony.category == category)

        # Get total count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar() or 0

        # Order and paginate
        stmt = stmt.order_by(Testimony.created_at.desc())
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        testimonies = list(self.db.execute(stmt).scalars().all())
        result = [self._public_testimony_to_dict(t) for t in testimonies]

        return result, total

    def get_featured_testimonies(self, limit: int = 5) -> list[dict]:
        """Get featured testimonies for homepage display."""
        stmt = (
            select(Testimony)
            .where(
                Testimony.status == "approved",
                Testimony.is_featured == True,  # noqa: E712
            )
            .order_by(Testimony.approved_at.desc())
            .limit(limit)
        )
        testimonies = list(self.db.execute(stmt).scalars().all())
        return [self._public_testimony_to_dict(t) for t in testimonies]

    def get_my_testimonies(
        self, member_id: UUID, page: int = 1, page_size: int = 20
    ) -> tuple[list[dict], int]:
        """Get testimonies submitted by a specific member."""
        stmt = select(Testimony).where(Testimony.member_id == member_id)

        # Get total count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar() or 0

        # Order and paginate
        stmt = stmt.order_by(Testimony.created_at.desc())
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        testimonies = list(self.db.execute(stmt).scalars().all())
        result = [self._testimony_to_dict(t) for t in testimonies]

        return result, total

    def get_pending_testimonies(
        self, page: int = 1, page_size: int = 20
    ) -> tuple[list[dict], int]:
        """Get pending testimonies for moderation."""
        return self.get_testimonies(page=page, page_size=page_size, status="pending")

    def _testimony_to_dict(self, testimony: Testimony) -> dict:
        author = None
        if testimony.member_id:
            member = self.db.execute(
                select(Member).where(Member.id == testimony.member_id)
            ).scalar_one_or_none()
            if member:
                author = {
                    "id": member.id,
                    "first_name": member.first_name,
                    "last_name": member.last_name,
                }

        return {
            "id": testimony.id,
            "member_id": testimony.member_id,
            "author_name": testimony.author_name,
            "title": testimony.title,
            "content": testimony.content,
            "category": testimony.category,
            "media_url": testimony.media_url,
            "status": testimony.status,
            "is_featured": testimony.is_featured,
            "rejection_reason": testimony.rejection_reason,
            "approved_by": testimony.approved_by,
            "approved_at": testimony.approved_at,
            "created_at": testimony.created_at,
            "updated_at": testimony.updated_at,
            "author": author,
        }

    def _public_testimony_to_dict(self, testimony: Testimony) -> dict:
        # Get author name
        author_name = testimony.author_name
        if not author_name and testimony.member_id:
            member = self.db.execute(
                select(Member).where(Member.id == testimony.member_id)
            ).scalar_one_or_none()
            if member:
                author_name = f"{member.first_name} {member.last_name}"

        return {
            "id": testimony.id,
            "title": testimony.title,
            "content": testimony.content,
            "category": testimony.category,
            "author_name": author_name,
            "media_url": testimony.media_url,
            "is_featured": testimony.is_featured,
            "created_at": testimony.created_at,
        }

    def create_testimony(
        self, testimony_data: TestimonyCreate, member_id: UUID | None = None
    ) -> Testimony:
        # Determine author name
        author_name = testimony_data.author_name
        if member_id and not author_name:
            member = self.db.execute(
                select(Member).where(Member.id == member_id)
            ).scalar_one_or_none()
            if member:
                author_name = f"{member.first_name} {member.last_name}"

        testimony = Testimony(
            member_id=member_id,
            title=testimony_data.title,
            content=testimony_data.content,
            category=testimony_data.category,
            author_name=author_name,
            status="pending",
        )
        self.db.add(testimony)
        self.db.commit()
        self.db.refresh(testimony)
        return testimony

    def update_testimony(
        self,
        testimony_id: UUID,
        testimony_data: TestimonyUpdate,
        member_id: UUID | None = None,
    ) -> Testimony | None:
        testimony = self.get_testimony_by_id(testimony_id)
        if not testimony:
            return None

        # Only allow author to update pending testimonies
        if member_id:
            if testimony.member_id != member_id:
                return None
            if testimony.status != "pending":
                return None

        update_dict = testimony_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(testimony, field, value)

        self.db.commit()
        self.db.refresh(testimony)
        return testimony

    def delete_testimony(
        self, testimony_id: UUID, member_id: UUID | None = None, is_admin: bool = False
    ) -> bool:
        testimony = self.get_testimony_by_id(testimony_id)
        if not testimony:
            return False

        # Only allow author or admin to delete
        if not is_admin and member_id and testimony.member_id != member_id:
            return False

        self.db.delete(testimony)
        self.db.commit()
        return True

    def moderate_testimony(
        self,
        testimony_id: UUID,
        action: str,
        approved_by: UUID,
        rejection_reason: str | None = None,
    ) -> tuple[bool, str, str]:
        """Approve or reject a testimony."""
        testimony = self.get_testimony_by_id(testimony_id)
        if not testimony:
            return False, "Testimony not found", ""

        if action == "approve":
            testimony.status = "approved"
            testimony.approved_by = approved_by
            testimony.approved_at = datetime.utcnow()
            testimony.rejection_reason = None
            message = "Testimony approved"
        elif action == "reject":
            testimony.status = "rejected"
            testimony.rejection_reason = rejection_reason
            message = "Testimony rejected"
        else:
            return False, "Invalid action", ""

        self.db.commit()
        self.db.refresh(testimony)
        return True, message, testimony.status

    def set_featured(
        self, testimony_id: UUID, is_featured: bool
    ) -> tuple[bool, str, bool]:
        """Set or unset a testimony as featured."""
        testimony = self.get_testimony_by_id(testimony_id)
        if not testimony:
            return False, "Testimony not found", False

        if testimony.status != "approved":
            return False, "Only approved testimonies can be featured", False

        testimony.is_featured = is_featured
        self.db.commit()
        self.db.refresh(testimony)

        action = "featured" if is_featured else "unfeatured"
        return True, f"Testimony {action} successfully", testimony.is_featured

    def get_media_upload_url(
        self, testimony_id: UUID, file_name: str, content_type: str
    ) -> tuple[str, str] | None:
        testimony = self.get_testimony_by_id(testimony_id)
        if not testimony:
            return None

        allowed_types = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "video/mp4",
            "video/quicktime",
        ]
        if content_type not in allowed_types:
            return None

        ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else "jpg"

        s3_client = boto3.client(
            "s3",
            region_name=settings.AWS_REGION,
            config=Config(signature_version="s3v4"),
        )

        key = f"testimonies/{testimony_id}/media.{ext}"
        upload_url = s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.S3_BUCKET_NAME,
                "Key": key,
                "ContentType": content_type,
            },
            ExpiresIn=3600,
        )

        return upload_url, key

    def complete_media_upload(
        self, testimony_id: UUID, file_key: str
    ) -> Testimony | None:
        testimony = self.get_testimony_by_id(testimony_id)
        if not testimony:
            return None

        media_url = f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{file_key}"
        testimony.media_url = media_url

        self.db.commit()
        self.db.refresh(testimony)
        return testimony


def get_testimony_service(db: Session) -> TestimonyService:
    return TestimonyService(db)
