from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, field_validator


EventType = Literal["service", "cell_meeting", "conference", "special", "other"]
RecurrenceRule = Literal["weekly", "biweekly", "monthly"]


class EventBase(BaseModel):
    title: str
    description: str | None = None
    event_type: EventType
    start_datetime: datetime
    end_datetime: datetime | None = None
    location: str | None = None
    capacity: int | None = None
    is_public: bool = True
    allow_self_checkin: bool = False

    @field_validator("end_datetime")
    @classmethod
    def end_after_start(cls, v: datetime | None, info) -> datetime | None:
        if v is not None and "start_datetime" in info.data:
            start = info.data["start_datetime"]
            if v <= start:
                raise ValueError("end_datetime must be after start_datetime")
        return v


class EventCreate(EventBase):
    is_recurring: bool = False
    recurrence_rule: RecurrenceRule | None = None

    @field_validator("recurrence_rule")
    @classmethod
    def validate_recurrence(cls, v: str | None, info) -> str | None:
        if info.data.get("is_recurring") and not v:
            raise ValueError("recurrence_rule is required for recurring events")
        return v


class EventUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    event_type: EventType | None = None
    start_datetime: datetime | None = None
    end_datetime: datetime | None = None
    location: str | None = None
    capacity: int | None = None
    is_public: bool | None = None
    allow_self_checkin: bool | None = None


class EventResponse(EventBase):
    id: UUID
    is_recurring: bool
    recurrence_rule: str | None = None
    parent_event_id: UUID | None = None
    qr_code_token: str | None = None
    is_cancelled: bool
    created_by: UUID | None = None
    created_at: datetime
    updated_at: datetime
    attendance_count: int = 0

    class Config:
        from_attributes = True


class EventListResponse(BaseModel):
    items: list[EventResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class EventDetailResponse(EventResponse):
    pass


class CalendarEventResponse(BaseModel):
    id: UUID
    title: str
    event_type: str
    start_datetime: datetime
    end_datetime: datetime | None = None
    is_cancelled: bool
    is_recurring: bool

    class Config:
        from_attributes = True


class RecurringEventUpdate(BaseModel):
    """Used when updating recurring events - allows specifying update scope."""

    update_scope: Literal["single", "all"] = "single"
    data: EventUpdate


class QRCodeResponse(BaseModel):
    event_id: UUID
    qr_code_token: str
    event_title: str


class QRVerifyRequest(BaseModel):
    qr_token: str
    member_id: UUID


class QRVerifyResponse(BaseModel):
    success: bool
    message: str
    attendance_id: UUID | None = None
