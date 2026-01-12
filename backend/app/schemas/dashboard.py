from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_members: int
    new_members_this_month: int
    active_cells: int
    upcoming_events: int


class RecentMember(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    photo_url: str | None = None
    join_date: datetime | None = None
    created_at: datetime

    class Config:
        from_attributes = True


class RecentMembersResponse(BaseModel):
    members: list[RecentMember]
