from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel

CheckInMethod = Literal["manual", "self", "qr"]


class AttendanceBase(BaseModel):
    notes: str | None = None


class AttendanceCreate(AttendanceBase):
    member_id: UUID


class AttendanceBulkCreate(BaseModel):
    member_ids: list[UUID]
    notes: str | None = None


class MemberInfo(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    photo_url: str | None = None

    class Config:
        from_attributes = True


class AttendanceResponse(AttendanceBase):
    id: UUID
    event_id: UUID
    member_id: UUID
    checked_in_at: datetime
    check_in_method: str
    checked_in_by: UUID | None = None
    member: MemberInfo

    class Config:
        from_attributes = True


class AttendanceListResponse(BaseModel):
    items: list[AttendanceResponse]
    total: int
    event_id: UUID
    event_title: str


class SelfCheckInResponse(BaseModel):
    success: bool
    message: str
    attendance_id: UUID | None = None


class AttendanceUpdate(BaseModel):
    notes: str | None = None


# Reports
class MemberAttendanceRecord(BaseModel):
    event_id: UUID
    event_title: str
    event_type: str
    event_date: datetime
    checked_in_at: datetime


class MemberAttendanceReport(BaseModel):
    member_id: UUID
    member_name: str
    total_events_attended: int
    attendance_records: list[MemberAttendanceRecord]


class EventAttendanceSummary(BaseModel):
    event_id: UUID
    event_title: str
    event_type: str
    event_date: datetime
    attendance_count: int
    capacity: int | None = None


class AttendanceSummaryReport(BaseModel):
    period_start: datetime
    period_end: datetime
    total_events: int
    total_attendance: int
    average_attendance: float
    events: list[EventAttendanceSummary]


class CellAttendanceComparison(BaseModel):
    cell_id: UUID
    cell_name: str
    total_attendance: int
    average_attendance: float
    member_count: int


class AttendanceExportRow(BaseModel):
    member_name: str
    member_email: str | None
    member_phone: str | None
    checked_in_at: str
    check_in_method: str
    notes: str | None
