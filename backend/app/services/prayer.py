from datetime import datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Member, PrayerInteraction, PrayerRequest
from app.schemas.prayer import PrayerRequestCreate, PrayerRequestUpdate


class PrayerService:
    def __init__(self, db: Session):
        self.db = db

    def get_request_by_id(self, request_id: UUID) -> PrayerRequest | None:
        stmt = select(PrayerRequest).where(PrayerRequest.id == request_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_prayer_requests(
        self,
        page: int = 1,
        page_size: int = 20,
        status: str | None = None,
        member_id: UUID | None = None,
        is_public: bool | None = None,
    ) -> tuple[list[dict], int]:
        """Get prayer requests (admin view)."""
        stmt = select(PrayerRequest)

        if status:
            stmt = stmt.where(PrayerRequest.status == status)

        if member_id:
            stmt = stmt.where(PrayerRequest.member_id == member_id)

        if is_public is not None:
            stmt = stmt.where(PrayerRequest.is_public == is_public)

        # Get total count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar() or 0

        # Order and paginate
        stmt = stmt.order_by(PrayerRequest.created_at.desc())
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        requests = list(self.db.execute(stmt).scalars().all())
        result = [self._request_to_dict(r) for r in requests]

        return result, total

    def get_public_requests(
        self,
        page: int = 1,
        page_size: int = 20,
        status: str | None = None,
        current_member_id: UUID | None = None,
    ) -> tuple[list[dict], int]:
        """Get approved public prayer requests for the prayer wall."""
        stmt = select(PrayerRequest).where(
            PrayerRequest.is_public == True,  # noqa: E712
            PrayerRequest.status.in_(["approved", "answered"]),
        )

        if status:
            stmt = stmt.where(PrayerRequest.status == status)

        # Get total count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar() or 0

        # Order and paginate
        stmt = stmt.order_by(PrayerRequest.created_at.desc())
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        requests = list(self.db.execute(stmt).scalars().all())
        result = [self._public_request_to_dict(r, current_member_id) for r in requests]

        return result, total

    def get_my_requests(
        self, member_id: UUID, page: int = 1, page_size: int = 20
    ) -> tuple[list[dict], int]:
        """Get prayer requests submitted by a specific member."""
        stmt = select(PrayerRequest).where(PrayerRequest.member_id == member_id)

        # Get total count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar() or 0

        # Order and paginate
        stmt = stmt.order_by(PrayerRequest.created_at.desc())
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        requests = list(self.db.execute(stmt).scalars().all())
        result = [self._request_to_dict(r) for r in requests]

        return result, total

    def get_pending_requests(
        self, page: int = 1, page_size: int = 20
    ) -> tuple[list[dict], int]:
        """Get pending requests for moderation."""
        return self.get_prayer_requests(
            page=page, page_size=page_size, status="pending"
        )

    def _request_to_dict(self, request: PrayerRequest) -> dict:
        author = None
        if request.member_id:
            member = self.db.execute(
                select(Member).where(Member.id == request.member_id)
            ).scalar_one_or_none()
            if member:
                author = {
                    "id": member.id,
                    "first_name": member.first_name,
                    "last_name": member.last_name,
                }

        return {
            "id": request.id,
            "member_id": request.member_id,
            "author_name": request.author_name,
            "author_email": request.author_email,
            "title": request.title,
            "description": request.description,
            "is_anonymous": request.is_anonymous,
            "is_public": request.is_public,
            "status": request.status,
            "prayer_count": request.prayer_count,
            "answered_at": request.answered_at,
            "answer_testimony": request.answer_testimony,
            "created_at": request.created_at,
            "updated_at": request.updated_at,
            "author": author,
        }

    def _public_request_to_dict(
        self, request: PrayerRequest, current_member_id: UUID | None = None
    ) -> dict:
        # Check if current user has prayed
        has_prayed = False
        if current_member_id:
            interaction = self.db.execute(
                select(PrayerInteraction).where(
                    PrayerInteraction.prayer_request_id == request.id,
                    PrayerInteraction.member_id == current_member_id,
                )
            ).scalar_one_or_none()
            has_prayed = interaction is not None

        # Determine author name to display
        author_name = None
        if not request.is_anonymous:
            if request.author_name:
                author_name = request.author_name
            elif request.member_id:
                member = self.db.execute(
                    select(Member).where(Member.id == request.member_id)
                ).scalar_one_or_none()
                if member:
                    author_name = f"{member.first_name} {member.last_name}"

        return {
            "id": request.id,
            "title": request.title,
            "description": request.description,
            "author_name": author_name,
            "is_anonymous": request.is_anonymous,
            "status": request.status,
            "prayer_count": request.prayer_count,
            "answered_at": request.answered_at,
            "answer_testimony": request.answer_testimony,
            "created_at": request.created_at,
            "has_prayed": has_prayed,
        }

    def create_request(
        self, request_data: PrayerRequestCreate, member_id: UUID | None = None
    ) -> PrayerRequest:
        # Determine author name
        author_name = request_data.author_name
        if member_id and not author_name:
            member = self.db.execute(
                select(Member).where(Member.id == member_id)
            ).scalar_one_or_none()
            if member:
                author_name = f"{member.first_name} {member.last_name}"

        request = PrayerRequest(
            member_id=member_id,
            title=request_data.title,
            description=request_data.description,
            is_anonymous=request_data.is_anonymous,
            is_public=request_data.is_public,
            author_name=author_name,
            author_email=request_data.author_email,
            status="pending",
        )
        self.db.add(request)
        self.db.commit()
        self.db.refresh(request)
        return request

    def update_request(
        self,
        request_id: UUID,
        request_data: PrayerRequestUpdate,
        member_id: UUID | None = None,
    ) -> PrayerRequest | None:
        request = self.get_request_by_id(request_id)
        if not request:
            return None

        # Only allow author to update their own request
        if member_id and request.member_id != member_id:
            return None

        update_dict = request_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(request, field, value)

        self.db.commit()
        self.db.refresh(request)
        return request

    def delete_request(
        self, request_id: UUID, member_id: UUID | None = None, is_admin: bool = False
    ) -> bool:
        request = self.get_request_by_id(request_id)
        if not request:
            return False

        # Only allow author or admin to delete
        if not is_admin and member_id and request.member_id != member_id:
            return False

        self.db.delete(request)
        self.db.commit()
        return True

    def pray_for_request(
        self, request_id: UUID, member_id: UUID
    ) -> tuple[bool, int, str]:
        """Record that a member has prayed for a request."""
        request = self.get_request_by_id(request_id)
        if not request:
            return False, 0, "Prayer request not found"

        if request.status not in ["approved", "answered"]:
            return False, 0, "Cannot pray for unapproved requests"

        # Check if already prayed
        existing = self.db.execute(
            select(PrayerInteraction).where(
                PrayerInteraction.prayer_request_id == request_id,
                PrayerInteraction.member_id == member_id,
            )
        ).scalar_one_or_none()

        if existing:
            return (
                True,
                request.prayer_count,
                "You have already prayed for this request",
            )

        # Create interaction
        interaction = PrayerInteraction(
            prayer_request_id=request_id,
            member_id=member_id,
        )
        self.db.add(interaction)

        # Increment prayer count
        request.prayer_count += 1
        self.db.commit()
        self.db.refresh(request)

        return True, request.prayer_count, "Prayer recorded"

    def mark_answered(
        self,
        request_id: UUID,
        member_id: UUID | None = None,
        answer_testimony: str | None = None,
        is_admin: bool = False,
    ) -> tuple[bool, str]:
        """Mark a prayer request as answered."""
        request = self.get_request_by_id(request_id)
        if not request:
            return False, "Prayer request not found"

        # Only allow author or admin to mark as answered
        if not is_admin and member_id and request.member_id != member_id:
            return False, "Not authorized to mark this request as answered"

        request.status = "answered"
        request.answered_at = datetime.utcnow()
        if answer_testimony:
            request.answer_testimony = answer_testimony

        self.db.commit()
        return True, "Prayer request marked as answered"

    def moderate_request(
        self, request_id: UUID, action: str, rejection_reason: str | None = None
    ) -> tuple[bool, str, str]:
        """Approve or reject a prayer request."""
        request = self.get_request_by_id(request_id)
        if not request:
            return False, "Prayer request not found", ""

        if action == "approve":
            request.status = "approved"
            message = "Prayer request approved"
        elif action == "reject":
            request.status = "rejected"
            message = "Prayer request rejected"
        else:
            return False, "Invalid action", ""

        self.db.commit()
        self.db.refresh(request)
        return True, message, request.status


def get_prayer_service(db: Session) -> PrayerService:
    return PrayerService(db)
