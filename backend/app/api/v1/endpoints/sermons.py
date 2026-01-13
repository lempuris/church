from datetime import date
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user, require_leader_or_above
from app.core.database import get_db
from app.models import User
from app.schemas.sermon import (
    MediaUploadComplete,
    MediaUploadRequest,
    MediaUploadResponse,
    PublicSermonListResponse,
    PublicSermonResponse,
    SermonCreate,
    SermonDetailResponse,
    SermonListResponse,
    SermonPublishRequest,
    SermonResponse,
    SermonSeriesCreate,
    SermonSeriesListResponse,
    SermonSeriesResponse,
    SermonSeriesUpdate,
    SermonUpdate,
)
from app.services import get_sermon_service

router = APIRouter(prefix="/sermons", tags=["sermons"])


# ==================== SERIES ENDPOINTS ====================


@router.get("/series", response_model=SermonSeriesListResponse)
def list_series(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    active_only: bool = Query(True, description="Only show active series"),
):
    """List all sermon series."""
    sermon_service = get_sermon_service(db)
    series_list, total = sermon_service.get_all_series(active_only=active_only)
    return SermonSeriesListResponse(
        items=[SermonSeriesResponse(**s) for s in series_list],
        total=total,
    )


@router.post(
    "/series", response_model=SermonSeriesResponse, status_code=status.HTTP_201_CREATED
)
def create_series(
    series_data: SermonSeriesCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Create a new sermon series."""
    sermon_service = get_sermon_service(db)
    series = sermon_service.create_series(series_data)
    sermon_count = sermon_service._get_series_sermon_count(series.id)
    return SermonSeriesResponse(**sermon_service._series_to_dict(series, sermon_count))


@router.get("/series/{series_id}", response_model=SermonSeriesResponse)
def get_series(
    series_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get a sermon series by ID."""
    sermon_service = get_sermon_service(db)
    series = sermon_service.get_series_by_id(series_id)

    if not series:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Series not found",
        )

    sermon_count = sermon_service._get_series_sermon_count(series.id)
    return SermonSeriesResponse(**sermon_service._series_to_dict(series, sermon_count))


@router.put("/series/{series_id}", response_model=SermonSeriesResponse)
def update_series(
    series_id: UUID,
    series_data: SermonSeriesUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Update a sermon series."""
    sermon_service = get_sermon_service(db)
    series = sermon_service.update_series(series_id, series_data)

    if not series:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Series not found",
        )

    sermon_count = sermon_service._get_series_sermon_count(series.id)
    return SermonSeriesResponse(**sermon_service._series_to_dict(series, sermon_count))


@router.delete("/series/{series_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_series(
    series_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Delete a sermon series."""
    sermon_service = get_sermon_service(db)
    success = sermon_service.delete_series(series_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Series not found",
        )

    return None


@router.post("/series/{series_id}/thumbnail", response_model=MediaUploadResponse)
def get_series_thumbnail_upload_url(
    series_id: UUID,
    upload_request: MediaUploadRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Get a presigned URL for uploading a series thumbnail."""
    sermon_service = get_sermon_service(db)
    result = sermon_service.get_series_thumbnail_upload_url(
        series_id, upload_request.file_name, upload_request.content_type
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to generate upload URL",
        )

    upload_url, file_key = result
    return MediaUploadResponse(
        upload_url=upload_url,
        file_key=file_key,
        media_type="thumbnail",
    )


# ==================== SERMON ENDPOINTS ====================


@router.get("", response_model=SermonListResponse)
def list_sermons(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    series_id: UUID | None = None,
    speaker_id: UUID | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    is_published: bool | None = None,
):
    """List all sermons with pagination and filtering (admin view)."""
    sermon_service = get_sermon_service(db)
    sermons, total = sermon_service.get_sermons(
        page=page,
        page_size=page_size,
        search=search,
        series_id=series_id,
        speaker_id=speaker_id,
        start_date=start_date,
        end_date=end_date,
        is_published=is_published,
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return SermonListResponse(
        items=[SermonResponse(**s) for s in sermons],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/public", response_model=PublicSermonListResponse)
def list_public_sermons(
    db: Annotated[Session, Depends(get_db)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    series_id: UUID | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
):
    """List published sermons for public display."""
    sermon_service = get_sermon_service(db)
    sermons, total = sermon_service.get_public_sermons(
        page=page,
        page_size=page_size,
        search=search,
        series_id=series_id,
        start_date=start_date,
        end_date=end_date,
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return PublicSermonListResponse(
        items=[PublicSermonResponse(**s) for s in sermons],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("", response_model=SermonResponse, status_code=status.HTTP_201_CREATED)
def create_sermon(
    sermon_data: SermonCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Create a new sermon."""
    sermon_service = get_sermon_service(db)
    sermon = sermon_service.create_sermon(sermon_data)
    return SermonResponse(**sermon_service._sermon_to_dict(sermon))


@router.get("/{sermon_id}", response_model=SermonDetailResponse)
def get_sermon(
    sermon_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get a sermon by ID (admin view)."""
    sermon_service = get_sermon_service(db)
    sermon = sermon_service.get_sermon_by_id(sermon_id)

    if not sermon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sermon not found",
        )

    sermon_dict = sermon_service._sermon_to_dict(sermon)
    related = sermon_service.get_related_sermons(sermon_id)
    sermon_dict["related_sermons"] = related

    return SermonDetailResponse(**sermon_dict)


@router.get("/{sermon_id}/public", response_model=SermonDetailResponse)
def get_sermon_public(
    sermon_id: UUID,
    db: Annotated[Session, Depends(get_db)],
):
    """Get a published sermon by ID (public view)."""
    sermon_service = get_sermon_service(db)
    sermon = sermon_service.get_sermon_by_id(sermon_id)

    if not sermon or not sermon.is_published:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sermon not found",
        )

    # Increment view count
    sermon_service.increment_view_count(sermon_id)

    sermon_dict = sermon_service._sermon_to_dict(sermon)
    related = sermon_service.get_related_sermons(sermon_id)
    sermon_dict["related_sermons"] = related

    return SermonDetailResponse(**sermon_dict)


@router.put("/{sermon_id}", response_model=SermonResponse)
def update_sermon(
    sermon_id: UUID,
    sermon_data: SermonUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Update a sermon."""
    sermon_service = get_sermon_service(db)
    sermon = sermon_service.update_sermon(sermon_id, sermon_data)

    if not sermon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sermon not found",
        )

    return SermonResponse(**sermon_service._sermon_to_dict(sermon))


@router.delete("/{sermon_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_sermon(
    sermon_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Delete a sermon."""
    sermon_service = get_sermon_service(db)
    success = sermon_service.delete_sermon(sermon_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sermon not found",
        )

    return None


@router.put("/{sermon_id}/publish", response_model=SermonResponse)
def publish_sermon(
    sermon_id: UUID,
    publish_request: SermonPublishRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Publish a sermon (immediately or scheduled)."""
    sermon_service = get_sermon_service(db)
    sermon = sermon_service.publish_sermon(
        sermon_id, scheduled_at=publish_request.scheduled_publish_at
    )

    if not sermon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sermon not found",
        )

    return SermonResponse(**sermon_service._sermon_to_dict(sermon))


@router.put("/{sermon_id}/unpublish", response_model=SermonResponse)
def unpublish_sermon(
    sermon_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Unpublish a sermon."""
    sermon_service = get_sermon_service(db)
    sermon = sermon_service.unpublish_sermon(sermon_id)

    if not sermon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sermon not found",
        )

    return SermonResponse(**sermon_service._sermon_to_dict(sermon))


@router.post("/{sermon_id}/upload", response_model=MediaUploadResponse)
def get_media_upload_url(
    sermon_id: UUID,
    upload_request: MediaUploadRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Get a presigned URL for uploading sermon media."""
    sermon_service = get_sermon_service(db)
    result = sermon_service.get_media_upload_url(
        sermon_id,
        upload_request.media_type,
        upload_request.file_name,
        upload_request.content_type,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to generate upload URL. Check file type and format.",
        )

    upload_url, file_key = result
    return MediaUploadResponse(
        upload_url=upload_url,
        file_key=file_key,
        media_type=upload_request.media_type,
    )


@router.post("/{sermon_id}/upload/complete", response_model=SermonResponse)
def complete_media_upload(
    sermon_id: UUID,
    complete_request: MediaUploadComplete,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Complete a media upload and update the sermon with the media URL."""
    sermon_service = get_sermon_service(db)
    sermon = sermon_service.complete_media_upload(
        sermon_id,
        complete_request.media_type,
        complete_request.file_key,
        complete_request.duration_seconds,
    )

    if not sermon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Sermon not found",
        )

    return SermonResponse(**sermon_service._sermon_to_dict(sermon))
