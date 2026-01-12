from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user
from app.core.database import get_db
from app.models import User
from app.schemas import DashboardStats, RecentMember, RecentMembersResponse
from app.services import get_dashboard_service

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_dashboard_stats(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get dashboard statistics."""
    dashboard_service = get_dashboard_service(db)
    stats = dashboard_service.get_stats()
    return DashboardStats(**stats)


@router.get("/recent-members", response_model=RecentMembersResponse)
def get_recent_members(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    limit: int = 10,
):
    """Get recently added members."""
    dashboard_service = get_dashboard_service(db)
    members = dashboard_service.get_recent_members(limit=limit)
    return RecentMembersResponse(
        members=[RecentMember.model_validate(m) for m in members]
    )
