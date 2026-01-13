from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user, require_leader_or_above
from app.core.database import get_db
from app.core.security import decode_token
from app.models import Member, User
from app.schemas.prayer import (
    MarkAnsweredRequest,
    MarkAnsweredResponse,
    PrayerModerationRequest,
    PrayerModerationResponse,
    PrayerRequestCreate,
    PrayerRequestDetailResponse,
    PrayerRequestListResponse,
    PrayerRequestResponse,
    PrayerRequestUpdate,
    PrayResponse,
    PublicPrayerListResponse,
    PublicPrayerResponse,
)
from app.services import get_prayer_service

router = APIRouter(prefix="/prayer-requests", tags=["prayer-requests"])
optional_security = HTTPBearer(auto_error=False)


def get_optional_member_id(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None, Depends(optional_security)
    ],
    db: Annotated[Session, Depends(get_db)],
) -> UUID | None:
    """Get member ID from token if provided, otherwise return None."""
    if not credentials:
        return None

    token = credentials.credentials
    payload = decode_token(token)

    if not payload or payload.get("type") != "access":
        return None

    user_id = payload.get("sub")
    if not user_id:
        return None

    # Get member linked to this user
    from sqlalchemy import select

    stmt = select(Member).where(Member.user_id == user_id)
    member = db.execute(stmt).scalar_one_or_none()
    return member.id if member else None


def get_current_member_id(
    current_user: Annotated[User, Depends(get_current_user)],
    db: Annotated[Session, Depends(get_db)],
) -> UUID | None:
    """Get member ID for the current user."""
    from sqlalchemy import select

    stmt = select(Member).where(Member.user_id == current_user.id)
    member = db.execute(stmt).scalar_one_or_none()
    return member.id if member else None


# ==================== ADMIN ENDPOINTS ====================


@router.get("", response_model=PrayerRequestListResponse)
def list_prayer_requests(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = None,
):
    """List all prayer requests (admin view)."""
    prayer_service = get_prayer_service(db)
    requests, total = prayer_service.get_prayer_requests(
        page=page,
        page_size=page_size,
        status=status,
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PrayerRequestListResponse(
        items=[PrayerRequestResponse(**r) for r in requests],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/pending", response_model=PrayerRequestListResponse)
def list_pending_requests(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """List pending prayer requests for moderation."""
    prayer_service = get_prayer_service(db)
    requests, total = prayer_service.get_pending_requests(
        page=page,
        page_size=page_size,
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PrayerRequestListResponse(
        items=[PrayerRequestResponse(**r) for r in requests],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.put("/{request_id}/moderate", response_model=PrayerModerationResponse)
def moderate_prayer_request(
    request_id: UUID,
    moderation: PrayerModerationRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Approve or reject a prayer request."""
    prayer_service = get_prayer_service(db)
    success, message, new_status = prayer_service.moderate_request(
        request_id, moderation.action, moderation.rejection_reason
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=message,
        )

    return PrayerModerationResponse(
        success=success,
        message=message,
        status=new_status,
    )


# ==================== PUBLIC ENDPOINTS ====================


@router.get("/wall", response_model=PublicPrayerListResponse)
def get_prayer_wall(
    db: Annotated[Session, Depends(get_db)],
    member_id: Annotated[UUID | None, Depends(get_optional_member_id)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = Query(
        None, description="Filter by status: approved, answered"
    ),
):
    """Get the public prayer wall with approved requests."""
    prayer_service = get_prayer_service(db)
    requests, total = prayer_service.get_public_requests(
        page=page,
        page_size=page_size,
        status=status,
        current_member_id=member_id,
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PublicPrayerListResponse(
        items=[PublicPrayerResponse(**r) for r in requests],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post(
    "", response_model=PrayerRequestResponse, status_code=status.HTTP_201_CREATED
)
def submit_prayer_request(
    request_data: PrayerRequestCreate,
    db: Annotated[Session, Depends(get_db)],
    member_id: Annotated[UUID | None, Depends(get_optional_member_id)],
):
    """Submit a new prayer request (logged-in members or guests)."""
    # Guests must provide author_name
    if not member_id and not request_data.author_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Guest submissions require author_name",
        )

    prayer_service = get_prayer_service(db)
    request = prayer_service.create_request(request_data, member_id)
    return PrayerRequestResponse(**prayer_service._request_to_dict(request))


@router.get("/my", response_model=PrayerRequestListResponse)
def get_my_prayer_requests(
    db: Annotated[Session, Depends(get_db)],
    member_id: Annotated[UUID | None, Depends(get_current_member_id)],
    current_user: Annotated[User, Depends(get_current_user)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """Get prayer requests submitted by the current user."""
    if not member_id:
        return PrayerRequestListResponse(
            items=[],
            total=0,
            page=page,
            page_size=page_size,
            total_pages=1,
        )

    prayer_service = get_prayer_service(db)
    requests, total = prayer_service.get_my_requests(
        member_id=member_id,
        page=page,
        page_size=page_size,
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PrayerRequestListResponse(
        items=[PrayerRequestResponse(**r) for r in requests],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{request_id}", response_model=PrayerRequestDetailResponse)
def get_prayer_request(
    request_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get a prayer request by ID."""
    prayer_service = get_prayer_service(db)
    request = prayer_service.get_request_by_id(request_id)

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prayer request not found",
        )

    return PrayerRequestDetailResponse(**prayer_service._request_to_dict(request))


@router.put("/{request_id}", response_model=PrayerRequestResponse)
def update_prayer_request(
    request_id: UUID,
    request_data: PrayerRequestUpdate,
    db: Annotated[Session, Depends(get_db)],
    member_id: Annotated[UUID | None, Depends(get_current_member_id)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Update a prayer request (author only)."""
    prayer_service = get_prayer_service(db)
    request = prayer_service.update_request(request_id, request_data, member_id)

    if not request:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prayer request not found or not authorized",
        )

    return PrayerRequestResponse(**prayer_service._request_to_dict(request))


@router.delete("/{request_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_prayer_request(
    request_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    member_id: Annotated[UUID | None, Depends(get_current_member_id)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Delete a prayer request (author or admin)."""
    is_admin = current_user.role in ("admin", "pastor", "leader")
    prayer_service = get_prayer_service(db)
    success = prayer_service.delete_request(request_id, member_id, is_admin)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prayer request not found or not authorized",
        )

    return None


@router.post("/{request_id}/pray", response_model=PrayResponse)
def pray_for_request(
    request_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    member_id: Annotated[UUID | None, Depends(get_current_member_id)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Record that the current user has prayed for this request."""
    if not member_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must be a member to record prayers",
        )

    prayer_service = get_prayer_service(db)
    success, prayer_count, message = prayer_service.pray_for_request(
        request_id, member_id
    )

    if not success and prayer_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=message,
        )

    return PrayResponse(
        success=success,
        prayer_count=prayer_count,
        message=message,
    )


@router.put("/{request_id}/answered", response_model=MarkAnsweredResponse)
def mark_request_answered(
    request_id: UUID,
    answered_data: MarkAnsweredRequest,
    db: Annotated[Session, Depends(get_db)],
    member_id: Annotated[UUID | None, Depends(get_current_member_id)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Mark a prayer request as answered."""
    is_admin = current_user.role in ("admin", "pastor", "leader")
    prayer_service = get_prayer_service(db)
    success, message = prayer_service.mark_answered(
        request_id,
        member_id,
        answered_data.answer_testimony,
        is_admin,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=message,
        )

    return MarkAnsweredResponse(success=success, message=message)
