from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user, require_leader_or_above
from app.core.database import get_db
from app.core.security import decode_token
from app.models import Member, User
from app.schemas.testimony import (
    PublicTestimonyListResponse,
    PublicTestimonyResponse,
    TestimonyCreate,
    TestimonyDetailResponse,
    TestimonyFeatureRequest,
    TestimonyFeatureResponse,
    TestimonyListResponse,
    TestimonyMediaComplete,
    TestimonyMediaUploadRequest,
    TestimonyMediaUploadResponse,
    TestimonyModerationRequest,
    TestimonyModerationResponse,
    TestimonyResponse,
    TestimonyUpdate,
)
from app.services import get_testimony_service

router = APIRouter(prefix="/testimonies", tags=["testimonies"])
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


@router.get("", response_model=TestimonyListResponse)
def list_testimonies(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = None,
    category: str | None = None,
    is_featured: bool | None = None,
):
    """List all testimonies (admin view)."""
    testimony_service = get_testimony_service(db)
    testimonies, total = testimony_service.get_testimonies(
        page=page,
        page_size=page_size,
        status=status,
        category=category,
        is_featured=is_featured,
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return TestimonyListResponse(
        items=[TestimonyResponse(**t) for t in testimonies],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/pending", response_model=TestimonyListResponse)
def list_pending_testimonies(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """List pending testimonies for moderation."""
    testimony_service = get_testimony_service(db)
    testimonies, total = testimony_service.get_pending_testimonies(
        page=page,
        page_size=page_size,
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return TestimonyListResponse(
        items=[TestimonyResponse(**t) for t in testimonies],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.put("/{testimony_id}/approve", response_model=TestimonyModerationResponse)
def moderate_testimony(
    testimony_id: UUID,
    moderation: TestimonyModerationRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Approve or reject a testimony."""
    testimony_service = get_testimony_service(db)
    success, message, new_status = testimony_service.moderate_testimony(
        testimony_id,
        moderation.action,
        current_user.id,
        moderation.rejection_reason,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=message,
        )

    return TestimonyModerationResponse(
        success=success,
        message=message,
        status=new_status,
    )


@router.put("/{testimony_id}/feature", response_model=TestimonyFeatureResponse)
def set_testimony_featured(
    testimony_id: UUID,
    feature_request: TestimonyFeatureRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Set or unset a testimony as featured."""
    testimony_service = get_testimony_service(db)
    success, message, is_featured = testimony_service.set_featured(
        testimony_id, feature_request.is_featured
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=message,
        )

    return TestimonyFeatureResponse(
        success=success,
        message=message,
        is_featured=is_featured,
    )


# ==================== PUBLIC ENDPOINTS ====================


@router.get("/public", response_model=PublicTestimonyListResponse)
def list_public_testimonies(
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: str | None = None,
):
    """List approved testimonies for public display."""
    testimony_service = get_testimony_service(db)
    testimonies, total = testimony_service.get_public_testimonies(
        page=page,
        page_size=page_size,
        category=category,
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PublicTestimonyListResponse(
        items=[PublicTestimonyResponse(**t) for t in testimonies],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/featured", response_model=list[PublicTestimonyResponse])
def get_featured_testimonies(
    db: Annotated[Session, Depends(get_db)],
    limit: int = Query(5, ge=1, le=20),
):
    """Get featured testimonies for homepage display."""
    testimony_service = get_testimony_service(db)
    testimonies = testimony_service.get_featured_testimonies(limit=limit)
    return [PublicTestimonyResponse(**t) for t in testimonies]


@router.post("", response_model=TestimonyResponse, status_code=status.HTTP_201_CREATED)
def submit_testimony(
    testimony_data: TestimonyCreate,
    db: Annotated[Session, Depends(get_db)],
    member_id: Annotated[UUID | None, Depends(get_optional_member_id)],
):
    """Submit a new testimony (logged-in members or guests)."""
    # Guests must provide author_name
    if not member_id and not testimony_data.author_name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Guest submissions require author_name",
        )

    testimony_service = get_testimony_service(db)
    testimony = testimony_service.create_testimony(testimony_data, member_id)
    return TestimonyResponse(**testimony_service._testimony_to_dict(testimony))


@router.get("/my", response_model=TestimonyListResponse)
def get_my_testimonies(
    db: Annotated[Session, Depends(get_db)],
    member_id: Annotated[UUID | None, Depends(get_current_member_id)],
    current_user: Annotated[User, Depends(get_current_user)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
):
    """Get testimonies submitted by the current user."""
    if not member_id:
        return TestimonyListResponse(
            items=[],
            total=0,
            page=page,
            page_size=page_size,
            total_pages=1,
        )

    testimony_service = get_testimony_service(db)
    testimonies, total = testimony_service.get_my_testimonies(
        member_id=member_id,
        page=page,
        page_size=page_size,
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return TestimonyListResponse(
        items=[TestimonyResponse(**t) for t in testimonies],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/{testimony_id}", response_model=TestimonyDetailResponse)
def get_testimony(
    testimony_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get a testimony by ID."""
    testimony_service = get_testimony_service(db)
    testimony = testimony_service.get_testimony_by_id(testimony_id)

    if not testimony:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Testimony not found",
        )

    return TestimonyDetailResponse(**testimony_service._testimony_to_dict(testimony))


@router.get("/{testimony_id}/public", response_model=PublicTestimonyResponse)
def get_testimony_public(
    testimony_id: UUID,
    db: Annotated[Session, Depends(get_db)],
):
    """Get an approved testimony by ID (public view)."""
    testimony_service = get_testimony_service(db)
    testimony = testimony_service.get_testimony_by_id(testimony_id)

    if not testimony or testimony.status != "approved":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Testimony not found",
        )

    return PublicTestimonyResponse(
        **testimony_service._public_testimony_to_dict(testimony)
    )


@router.put("/{testimony_id}", response_model=TestimonyResponse)
def update_testimony(
    testimony_id: UUID,
    testimony_data: TestimonyUpdate,
    db: Annotated[Session, Depends(get_db)],
    member_id: Annotated[UUID | None, Depends(get_current_member_id)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Update a testimony (author only, pending status only)."""
    testimony_service = get_testimony_service(db)
    testimony = testimony_service.update_testimony(
        testimony_id, testimony_data, member_id
    )

    if not testimony:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Testimony not found, not authorized, or already processed",
        )

    return TestimonyResponse(**testimony_service._testimony_to_dict(testimony))


@router.delete("/{testimony_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_testimony(
    testimony_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    member_id: Annotated[UUID | None, Depends(get_current_member_id)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Delete a testimony (author or admin)."""
    is_admin = current_user.role in ("admin", "pastor", "leader")
    testimony_service = get_testimony_service(db)
    success = testimony_service.delete_testimony(testimony_id, member_id, is_admin)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Testimony not found or not authorized",
        )

    return None


@router.post("/{testimony_id}/upload", response_model=TestimonyMediaUploadResponse)
def get_media_upload_url(
    testimony_id: UUID,
    upload_request: TestimonyMediaUploadRequest,
    db: Annotated[Session, Depends(get_db)],
    member_id: Annotated[UUID | None, Depends(get_current_member_id)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get a presigned URL for uploading testimony media."""
    testimony_service = get_testimony_service(db)

    # Verify ownership
    testimony = testimony_service.get_testimony_by_id(testimony_id)
    if not testimony:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Testimony not found",
        )

    is_admin = current_user.role in ("admin", "pastor", "leader")
    if not is_admin and testimony.member_id != member_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to upload media for this testimony",
        )

    result = testimony_service.get_media_upload_url(
        testimony_id,
        upload_request.file_name,
        upload_request.content_type,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to generate upload URL. Check file type.",
        )

    upload_url, file_key = result
    return TestimonyMediaUploadResponse(
        upload_url=upload_url,
        file_key=file_key,
    )


@router.post("/{testimony_id}/upload/complete", response_model=TestimonyResponse)
def complete_media_upload(
    testimony_id: UUID,
    complete_request: TestimonyMediaComplete,
    db: Annotated[Session, Depends(get_db)],
    member_id: Annotated[UUID | None, Depends(get_current_member_id)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Complete a media upload and update the testimony with the media URL."""
    testimony_service = get_testimony_service(db)

    # Verify ownership
    testimony = testimony_service.get_testimony_by_id(testimony_id)
    if not testimony:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Testimony not found",
        )

    is_admin = current_user.role in ("admin", "pastor", "leader")
    if not is_admin and testimony.member_id != member_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to upload media for this testimony",
        )

    testimony = testimony_service.complete_media_upload(
        testimony_id,
        complete_request.file_key,
    )

    if not testimony:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Testimony not found",
        )

    return TestimonyResponse(**testimony_service._testimony_to_dict(testimony))
