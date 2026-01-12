from datetime import datetime, time
from typing import Literal
from uuid import UUID

from pydantic import BaseModel


class CellBase(BaseModel):
    name: str
    description: str | None = None
    leader_id: UUID | None = None
    assistant_leader_id: UUID | None = None
    meeting_day: (
        Literal[
            "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"
        ]
        | None
    ) = None
    meeting_time: time | None = None
    meeting_location: str | None = None


class CellCreate(CellBase):
    pass


class CellUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    leader_id: UUID | None = None
    assistant_leader_id: UUID | None = None
    meeting_day: (
        Literal[
            "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"
        ]
        | None
    ) = None
    meeting_time: time | None = None
    meeting_location: str | None = None


class CellMemberInfo(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    photo_url: str | None = None
    email: str | None = None
    phone: str | None = None

    class Config:
        from_attributes = True


class CellLeaderInfo(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    photo_url: str | None = None

    class Config:
        from_attributes = True


class CellResponse(CellBase):
    id: UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    leader: CellLeaderInfo | None = None
    assistant_leader: CellLeaderInfo | None = None
    member_count: int = 0

    class Config:
        from_attributes = True


class CellListResponse(BaseModel):
    items: list[CellResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class CellDetailResponse(CellResponse):
    members: list[CellMemberInfo] = []


class CellMemberCreate(BaseModel):
    member_id: UUID


class CellMemberResponse(BaseModel):
    id: UUID
    cell_id: UUID
    member_id: UUID
    joined_at: datetime
    is_active: bool
    member: CellMemberInfo

    class Config:
        from_attributes = True
