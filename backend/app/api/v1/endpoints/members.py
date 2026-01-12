from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.deps import get_current_user, require_leader_or_above
from app.models import User
from app.schemas import (
    MemberCreate,
    MemberUpdate,
    MemberResponse,
    MemberListResponse,
    FamilyRelationshipCreate,
    FamilyMemberResponse,
    PhotoUploadResponse,
)
from app.services import get_member_service


router = APIRouter(prefix="/members", tags=["members"])


@router.get("", response_model=MemberListResponse)
def list_members(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    status: Literal["active", "inactive", "visitor"] | None = None,
    sort_by: Literal["name", "join_date"] = "name",
    sort_order: Literal["asc", "desc"] = "asc",
):
    """List members with pagination, search, and filtering."""
    member_service = get_member_service(db)
    members, total = member_service.get_members(
        page=page,
        page_size=page_size,
        search=search,
        status=status,
        sort_by=sort_by,
        sort_order=sort_order,
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return MemberListResponse(
        items=members,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("", response_model=MemberResponse, status_code=status.HTTP_201_CREATED)
def create_member(
    member_data: MemberCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Create a new member."""
    member_service = get_member_service(db)
    member = member_service.create_member(member_data)
    return member


@router.get("/{member_id}", response_model=MemberResponse)
def get_member(
    member_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get a member by ID."""
    member_service = get_member_service(db)
    member = member_service.get_member_by_id(member_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )
    return member


@router.put("/{member_id}", response_model=MemberResponse)
def update_member(
    member_id: UUID,
    member_data: MemberUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Update a member."""
    member_service = get_member_service(db)
    member = member_service.update_member(member_id, member_data)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )
    return member


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_member(
    member_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Soft delete a member (set status to inactive)."""
    member_service = get_member_service(db)
    success = member_service.delete_member(member_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )
    return None


@router.post("/{member_id}/reactivate", response_model=MemberResponse)
def reactivate_member(
    member_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Reactivate an inactive member."""
    member_service = get_member_service(db)
    member = member_service.reactivate_member(member_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )
    return member


@router.get("/{member_id}/family", response_model=list[FamilyMemberResponse])
def get_member_family(
    member_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get family relationships for a member."""
    member_service = get_member_service(db)

    # Verify member exists
    member = member_service.get_member_by_id(member_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )

    family = member_service.get_family_relationships(member_id)
    return family


@router.post(
    "/{member_id}/family",
    response_model=FamilyMemberResponse,
    status_code=status.HTTP_201_CREATED,
)
def add_family_relationship(
    member_id: UUID,
    relationship_data: FamilyRelationshipCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Add a family relationship for a member."""
    member_service = get_member_service(db)

    # Verify both members exist
    member = member_service.get_member_by_id(member_id)
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )

    related_member = member_service.get_member_by_id(
        relationship_data.related_member_id
    )
    if not related_member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Related member not found",
        )

    if member_id == relationship_data.related_member_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create relationship with self",
        )

    try:
        relationship = member_service.add_family_relationship(
            member_id,
            relationship_data.related_member_id,
            relationship_data.relationship_type,
        )
        return FamilyMemberResponse(
            id=relationship.id,
            first_name=related_member.first_name,
            last_name=related_member.last_name,
            photo_url=related_member.photo_url,
            relationship_type=relationship.relationship_type,
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Relationship already exists",
        )


@router.delete(
    "/{member_id}/family/{relationship_id}", status_code=status.HTTP_204_NO_CONTENT
)
def remove_family_relationship(
    member_id: UUID,
    relationship_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Remove a family relationship."""
    member_service = get_member_service(db)
    success = member_service.remove_family_relationship(member_id, relationship_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Relationship not found",
        )
    return None


@router.post("/{member_id}/photo", response_model=PhotoUploadResponse)
def get_photo_upload_url(
    member_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Get a presigned URL for uploading a member photo."""
    member_service = get_member_service(db)
    result = member_service.get_photo_upload_url(member_id)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )
    upload_url, photo_url = result
    return PhotoUploadResponse(upload_url=upload_url, photo_url=photo_url)
