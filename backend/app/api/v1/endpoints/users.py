"""
Admin endpoints for user management.
Only accessible by admin users.
"""

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.v1.deps import require_admin
from app.core.database import get_db
from app.models import User
from app.schemas import UserDetailResponse, UserListResponse, UserUpdate
from app.services import get_auth_service

router = APIRouter(prefix="/admin/users", tags=["admin-users"])


@router.get("", response_model=UserListResponse)
def list_users(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_admin)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    role: str | None = None,
    is_active: bool | None = None,
    search: str | None = Query(None, description="Search by email"),
):
    """
    List all users with pagination and filtering.
    Admin only.
    """
    auth_service = get_auth_service(db)
    users, total = auth_service.get_users(
        page=page,
        page_size=page_size,
        role=role,
        is_active=is_active,
        search=search,
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return UserListResponse(
        items=[UserDetailResponse.model_validate(u) for u in users],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/stats")
def get_user_stats(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_admin)],
):
    """
    Get user statistics by role.
    Admin only.
    """
    auth_service = get_auth_service(db)
    role_counts = auth_service.get_user_count_by_role()

    return {
        "total_users": sum(role_counts.values()),
        "by_role": role_counts,
    }


@router.get("/{user_id}", response_model=UserDetailResponse)
def get_user(
    user_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_admin)],
):
    """
    Get a specific user by ID.
    Admin only.
    """
    auth_service = get_auth_service(db)
    user = auth_service.get_user_by_id(user_id)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


@router.put("/{user_id}", response_model=UserDetailResponse)
def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_admin)],
):
    """
    Update a user's role, active status, or verification status.
    Admin only.

    - **role**: Change user role (member, leader, pastor, admin)
    - **is_active**: Activate or deactivate user account
    - **is_verified**: Mark user as verified or unverified
    """
    # Prevent admin from demoting themselves
    if user_id == current_user.id and user_data.role and user_data.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot demote yourself from admin role",
        )

    # Prevent admin from deactivating themselves
    if user_id == current_user.id and user_data.is_active is False:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account",
        )

    auth_service = get_auth_service(db)
    user = auth_service.update_user(user_id, user_data)

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_admin)],
):
    """
    Delete a user account.
    Admin only.

    This will also delete the associated member profile.
    """
    # Prevent admin from deleting themselves
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account",
        )

    auth_service = get_auth_service(db)
    success = auth_service.delete_user(user_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return None


@router.post("/{user_id}/promote", response_model=UserDetailResponse)
def promote_to_admin(
    user_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_admin)],
):
    """
    Shortcut to promote a user to admin role.
    Admin only.
    """
    auth_service = get_auth_service(db)
    user = auth_service.update_user(user_id, UserUpdate(role="admin"))

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user


@router.post("/{user_id}/demote", response_model=UserDetailResponse)
def demote_to_member(
    user_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_admin)],
):
    """
    Shortcut to demote a user to member role.
    Admin only.
    """
    # Prevent admin from demoting themselves
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot demote yourself",
        )

    auth_service = get_auth_service(db)
    user = auth_service.update_user(user_id, UserUpdate(role="member"))

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    return user
