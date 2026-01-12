import csv
import io
from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Attendance, Cell, CellMember, Event, Member
from app.schemas.attendance import (
    CellAttendanceComparison,
    EventAttendanceSummary,
    MemberAttendanceRecord,
)


class AttendanceService:
    def __init__(self, db: Session):
        self.db = db

    def get_attendance_by_id(self, attendance_id: UUID) -> Attendance | None:
        stmt = select(Attendance).where(Attendance.id == attendance_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_event_attendance(self, event_id: UUID) -> list[dict]:
        """Get all attendance records for an event."""
        stmt = (
            select(Attendance)
            .where(Attendance.event_id == event_id)
            .order_by(Attendance.checked_in_at)
        )
        records = list(self.db.execute(stmt).scalars().all())

        result = []
        for record in records:
            member = self.db.execute(
                select(Member).where(Member.id == record.member_id)
            ).scalar_one_or_none()
            if member:
                result.append(
                    {
                        "id": record.id,
                        "event_id": record.event_id,
                        "member_id": record.member_id,
                        "checked_in_at": record.checked_in_at,
                        "check_in_method": record.check_in_method,
                        "checked_in_by": record.checked_in_by,
                        "notes": record.notes,
                        "member": {
                            "id": member.id,
                            "first_name": member.first_name,
                            "last_name": member.last_name,
                            "photo_url": member.photo_url,
                        },
                    }
                )
        return result

    def check_in_member(
        self,
        event_id: UUID,
        member_id: UUID,
        checked_in_by: UUID | None = None,
        check_in_method: str = "manual",
        notes: str | None = None,
    ) -> Attendance | None:
        """Record attendance for a member at an event."""
        # Verify event exists and is not cancelled
        event = self.db.execute(
            select(Event).where(Event.id == event_id)
        ).scalar_one_or_none()
        if not event or event.is_cancelled:
            return None

        # Verify member exists
        member = self.db.execute(
            select(Member).where(Member.id == member_id)
        ).scalar_one_or_none()
        if not member:
            return None

        # Check if already checked in
        existing = self.db.execute(
            select(Attendance).where(
                Attendance.event_id == event_id,
                Attendance.member_id == member_id,
            )
        ).scalar_one_or_none()
        if existing:
            return existing

        # Create attendance record
        attendance = Attendance(
            event_id=event_id,
            member_id=member_id,
            checked_in_by=checked_in_by,
            check_in_method=check_in_method,
            notes=notes,
        )
        self.db.add(attendance)
        self.db.commit()
        self.db.refresh(attendance)
        return attendance

    def bulk_check_in(
        self,
        event_id: UUID,
        member_ids: list[UUID],
        checked_in_by: UUID | None = None,
        notes: str | None = None,
    ) -> list[Attendance]:
        """Bulk check-in multiple members at once."""
        results = []
        for member_id in member_ids:
            attendance = self.check_in_member(
                event_id=event_id,
                member_id=member_id,
                checked_in_by=checked_in_by,
                check_in_method="manual",
                notes=notes,
            )
            if attendance:
                results.append(attendance)
        return results

    def remove_attendance(self, event_id: UUID, member_id: UUID) -> bool:
        """Remove an attendance record."""
        stmt = select(Attendance).where(
            Attendance.event_id == event_id,
            Attendance.member_id == member_id,
        )
        attendance = self.db.execute(stmt).scalar_one_or_none()
        if not attendance:
            return False

        self.db.delete(attendance)
        self.db.commit()
        return True

    def self_check_in(
        self, event_id: UUID, member_id: UUID
    ) -> tuple[bool, str, UUID | None]:
        """
        Self check-in for a member.
        Returns (success, message, attendance_id).
        """
        # Verify event exists and allows self check-in
        event = self.db.execute(
            select(Event).where(Event.id == event_id)
        ).scalar_one_or_none()

        if not event:
            return False, "Event not found", None

        if event.is_cancelled:
            return False, "Event has been cancelled", None

        if not event.allow_self_checkin:
            return False, "Self check-in is not enabled for this event", None

        # Check time window (2 hours before to event end)
        now = datetime.utcnow()
        window_start = event.start_datetime - timedelta(hours=2)
        window_end = event.end_datetime or (event.start_datetime + timedelta(hours=3))

        if now < window_start:
            return False, "Check-in is not yet available for this event", None

        if now > window_end:
            return False, "Check-in window has closed for this event", None

        # Attempt check-in
        attendance = self.check_in_member(
            event_id=event_id,
            member_id=member_id,
            check_in_method="self",
        )

        if attendance:
            return True, "Successfully checked in", attendance.id
        return False, "Failed to check in", None

    def qr_check_in(
        self, qr_token: str, member_id: UUID
    ) -> tuple[bool, str, UUID | None]:
        """
        QR code check-in for a member.
        Returns (success, message, attendance_id).
        """
        # Find event by QR token
        event = self.db.execute(
            select(Event).where(Event.qr_code_token == qr_token)
        ).scalar_one_or_none()

        if not event:
            return False, "Invalid QR code", None

        if event.is_cancelled:
            return False, "Event has been cancelled", None

        # Check time window
        now = datetime.utcnow()
        window_start = event.start_datetime - timedelta(hours=2)
        window_end = event.end_datetime or (event.start_datetime + timedelta(hours=3))

        if now < window_start:
            return False, "Check-in is not yet available for this event", None

        if now > window_end:
            return False, "Check-in window has closed for this event", None

        # Attempt check-in
        attendance = self.check_in_member(
            event_id=event.id,
            member_id=member_id,
            check_in_method="qr",
        )

        if attendance:
            return True, "Successfully checked in via QR code", attendance.id
        return False, "Failed to check in", None

    def update_attendance_notes(
        self, attendance_id: UUID, notes: str
    ) -> Attendance | None:
        """Update notes on an attendance record."""
        attendance = self.get_attendance_by_id(attendance_id)
        if not attendance:
            return None

        attendance.notes = notes
        self.db.commit()
        self.db.refresh(attendance)
        return attendance

    def get_member_attendance_history(
        self,
        member_id: UUID,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
    ) -> list[MemberAttendanceRecord]:
        """Get attendance history for a member."""
        stmt = select(Attendance).where(Attendance.member_id == member_id)

        if start_date:
            stmt = stmt.where(Attendance.checked_in_at >= start_date)
        if end_date:
            stmt = stmt.where(Attendance.checked_in_at <= end_date)

        stmt = stmt.order_by(Attendance.checked_in_at.desc())
        records = list(self.db.execute(stmt).scalars().all())

        result = []
        for record in records:
            event = self.db.execute(
                select(Event).where(Event.id == record.event_id)
            ).scalar_one_or_none()
            if event:
                result.append(
                    MemberAttendanceRecord(
                        event_id=event.id,
                        event_title=event.title,
                        event_type=event.event_type,
                        event_date=event.start_datetime,
                        checked_in_at=record.checked_in_at,
                    )
                )
        return result

    def get_attendance_summary(
        self,
        start_date: datetime,
        end_date: datetime,
        event_type: str | None = None,
    ) -> dict:
        """Get attendance summary report for a date range."""
        # Get events in date range
        stmt = select(Event).where(
            Event.start_datetime >= start_date,
            Event.start_datetime <= end_date,
            Event.is_cancelled == False,  # noqa: E712
        )
        if event_type:
            stmt = stmt.where(Event.event_type == event_type)

        events = list(self.db.execute(stmt).scalars().all())

        event_summaries = []
        total_attendance = 0

        for event in events:
            count = (
                self.db.execute(
                    select(func.count())
                    .select_from(Attendance)
                    .where(Attendance.event_id == event.id)
                ).scalar()
                or 0
            )

            total_attendance += count
            event_summaries.append(
                EventAttendanceSummary(
                    event_id=event.id,
                    event_title=event.title,
                    event_type=event.event_type,
                    event_date=event.start_datetime,
                    attendance_count=count,
                    capacity=event.capacity,
                )
            )

        avg_attendance = total_attendance / len(events) if events else 0

        return {
            "period_start": start_date,
            "period_end": end_date,
            "total_events": len(events),
            "total_attendance": total_attendance,
            "average_attendance": round(avg_attendance, 2),
            "events": event_summaries,
        }

    def get_cell_attendance_comparison(
        self,
        start_date: datetime,
        end_date: datetime,
    ) -> list[CellAttendanceComparison]:
        """Compare attendance across cell groups."""
        # Get all active cells
        cells = list(
            self.db.execute(
                select(Cell).where(Cell.is_active == True)  # noqa: E712
            )
            .scalars()
            .all()
        )

        result = []
        for cell in cells:
            # Get cell members
            member_ids = [
                cm.member_id
                for cm in self.db.execute(
                    select(CellMember).where(
                        CellMember.cell_id == cell.id,
                        CellMember.is_active == True,  # noqa: E712
                    )
                )
                .scalars()
                .all()
            ]

            if not member_ids:
                continue

            # Count attendance for cell members
            attendance_count = (
                self.db.execute(
                    select(func.count())
                    .select_from(Attendance)
                    .join(Event)
                    .where(
                        Attendance.member_id.in_(member_ids),
                        Event.start_datetime >= start_date,
                        Event.start_datetime <= end_date,
                    )
                ).scalar()
                or 0
            )

            result.append(
                CellAttendanceComparison(
                    cell_id=cell.id,
                    cell_name=cell.name,
                    total_attendance=attendance_count,
                    average_attendance=(
                        round(attendance_count / len(member_ids), 2)
                        if member_ids
                        else 0
                    ),
                    member_count=len(member_ids),
                )
            )

        return result

    def export_attendance_csv(self, event_id: UUID) -> str | None:
        """Export attendance for an event as CSV."""
        event = self.db.execute(
            select(Event).where(Event.id == event_id)
        ).scalar_one_or_none()
        if not event:
            return None

        attendance_records = self.get_event_attendance(event_id)

        output = io.StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow(
            [
                "Member Name",
                "Email",
                "Phone",
                "Checked In At",
                "Check-in Method",
                "Notes",
            ]
        )

        # Data rows
        for record in attendance_records:
            member = record["member"]
            # Get full member info
            full_member = self.db.execute(
                select(Member).where(Member.id == member["id"])
            ).scalar_one_or_none()

            writer.writerow(
                [
                    f"{member['first_name']} {member['last_name']}",
                    full_member.email if full_member else "",
                    full_member.phone if full_member else "",
                    record["checked_in_at"].strftime("%Y-%m-%d %H:%M:%S"),
                    record["check_in_method"],
                    record["notes"] or "",
                ]
            )

        return output.getvalue()


def get_attendance_service(db: Session) -> AttendanceService:
    return AttendanceService(db)
