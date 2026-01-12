import re
from datetime import datetime
from typing import Annotated
from urllib.parse import quote
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user, require_leader_or_above
from app.core.database import get_db
from app.models import Member, User
from app.schemas import (
    AttendanceBulkCreate,
    AttendanceCreate,
    AttendanceListResponse,
    AttendanceResponse,
    AttendanceSummaryReport,
    CellAttendanceComparison,
    MemberAttendanceReport,
    MemberInfo,
    QRVerifyRequest,
    QRVerifyResponse,
    SelfCheckInResponse,
)
from app.services import get_attendance_service, get_event_service

router = APIRouter(tags=["attendance"])


# Event attendance endpoints
@router.post(
    "/events/{event_id}/attendance",
    response_model=AttendanceResponse,
    status_code=status.HTTP_201_CREATED,
)
def check_in_member(
    event_id: UUID,
    attendance_data: AttendanceCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Manual check-in of a member to an event."""
    attendance_service = get_attendance_service(db)

    attendance = attendance_service.check_in_member(
        event_id=event_id,
        member_id=attendance_data.member_id,
        checked_in_by=current_user.id,
        check_in_method="manual",
        notes=attendance_data.notes,
    )

    if not attendance:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Could not record attendance. Event may be cancelled or member doesn't exist.",
        )

    # Get member info
    member = db.query(Member).filter(Member.id == attendance.member_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )
    return AttendanceResponse(
        id=attendance.id,
        event_id=attendance.event_id,
        member_id=attendance.member_id,
        checked_in_at=attendance.checked_in_at,
        check_in_method=attendance.check_in_method,
        checked_in_by=attendance.checked_in_by,
        notes=attendance.notes,
        member=MemberInfo(
            id=member.id,
            first_name=member.first_name,
            last_name=member.last_name,
            photo_url=member.photo_url,
        ),
    )


@router.post(
    "/events/{event_id}/attendance/bulk",
    response_model=list[AttendanceResponse],
    status_code=status.HTTP_201_CREATED,
)
def bulk_check_in(
    event_id: UUID,
    bulk_data: AttendanceBulkCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Bulk check-in multiple members to an event."""
    attendance_service = get_attendance_service(db)

    records = attendance_service.bulk_check_in(
        event_id=event_id,
        member_ids=bulk_data.member_ids,
        checked_in_by=current_user.id,
        notes=bulk_data.notes,
    )

    result = []
    for attendance in records:
        member = db.query(Member).filter(Member.id == attendance.member_id).first()
        if member:
            result.append(
                AttendanceResponse(
                    id=attendance.id,
                    event_id=attendance.event_id,
                    member_id=attendance.member_id,
                    checked_in_at=attendance.checked_in_at,
                    check_in_method=attendance.check_in_method,
                    checked_in_by=attendance.checked_in_by,
                    notes=attendance.notes,
                    member=MemberInfo(
                        id=member.id,
                        first_name=member.first_name,
                        last_name=member.last_name,
                        photo_url=member.photo_url,
                    ),
                )
            )

    return result


@router.get("/events/{event_id}/attendance", response_model=AttendanceListResponse)
def get_event_attendance(
    event_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get all attendance records for an event."""
    event_service = get_event_service(db)
    attendance_service = get_attendance_service(db)

    event = event_service.get_event_by_id(event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    records = attendance_service.get_event_attendance(event_id)
    return AttendanceListResponse(
        items=[AttendanceResponse(**r) for r in records],
        total=len(records),
        event_id=event_id,
        event_title=event.title,
    )


@router.delete(
    "/events/{event_id}/attendance/{member_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_attendance(
    event_id: UUID,
    member_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Remove an attendance record."""
    attendance_service = get_attendance_service(db)
    success = attendance_service.remove_attendance(event_id, member_id)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attendance record not found",
        )

    return None


@router.post("/events/{event_id}/self-checkin", response_model=SelfCheckInResponse)
def self_check_in(
    event_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Self check-in for the current user."""
    # Get the member record for the current user
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No member profile found for this user",
        )

    attendance_service = get_attendance_service(db)
    success, message, attendance_id = attendance_service.self_check_in(
        event_id=event_id, member_id=member.id
    )

    return SelfCheckInResponse(
        success=success,
        message=message,
        attendance_id=attendance_id,
    )


# QR Code verification
@router.post("/attendance/verify-qr", response_model=QRVerifyResponse)
def verify_qr_check_in(
    verify_data: QRVerifyRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Verify QR code and check in the authenticated user.

    The member is derived from the authenticated user to prevent
    impersonation attacks where someone could check in on behalf
    of others using a stolen QR token.
    """
    # Get the member record for the current user - prevents impersonation
    member = db.query(Member).filter(Member.user_id == current_user.id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No member profile found for this user",
        )

    attendance_service = get_attendance_service(db)
    success, message, attendance_id = attendance_service.qr_check_in(
        qr_token=verify_data.qr_token,
        member_id=member.id,  # Use authenticated user's member ID, not from request
    )

    return QRVerifyResponse(
        success=success,
        message=message,
        attendance_id=attendance_id,
    )


# Export
@router.get("/attendance/export/{event_id}")
def export_attendance(
    event_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Export attendance for an event as CSV."""
    event_service = get_event_service(db)
    attendance_service = get_attendance_service(db)

    event = event_service.get_event_by_id(event_id)
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    csv_content = attendance_service.export_attendance_csv(event_id)
    if csv_content is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    # Sanitize filename: remove any characters that could cause header injection
    # or malformed downloads (keep only alphanumeric, underscore, hyphen)
    safe_title = re.sub(r"[^a-zA-Z0-9_\-]", "_", event.title)
    # Collapse multiple underscores and trim
    safe_title = re.sub(r"_+", "_", safe_title).strip("_")
    filename = f"attendance_{safe_title}_{event.start_datetime.strftime('%Y%m%d')}.csv"
    # Use RFC 6266 compliant encoding for the filename
    encoded_filename = quote(filename)

    return StreamingResponse(
        iter([csv_content]),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=\"{filename}\"; filename*=UTF-8''{encoded_filename}"
        },
    )


# Reports
@router.get(
    "/attendance/reports/member/{member_id}", response_model=MemberAttendanceReport
)
def get_member_attendance_report(
    member_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    start_date: datetime | None = None,
    end_date: datetime | None = None,
):
    """Get attendance report for a specific member."""
    member = db.query(Member).filter(Member.id == member_id).first()
    if not member:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found",
        )

    attendance_service = get_attendance_service(db)
    records = attendance_service.get_member_attendance_history(
        member_id=member_id,
        start_date=start_date,
        end_date=end_date,
    )

    return MemberAttendanceReport(
        member_id=member_id,
        member_name=f"{member.first_name} {member.last_name}",
        total_events_attended=len(records),
        attendance_records=records,
    )


@router.get("/attendance/reports/summary", response_model=AttendanceSummaryReport)
def get_attendance_summary(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
    start_date: datetime = Query(..., description="Start of date range"),
    end_date: datetime = Query(..., description="End of date range"),
    event_type: str | None = None,
):
    """Get attendance summary report for a date range."""
    attendance_service = get_attendance_service(db)
    summary = attendance_service.get_attendance_summary(
        start_date=start_date,
        end_date=end_date,
        event_type=event_type,
    )

    return AttendanceSummaryReport(**summary)


@router.get("/attendance/reports/cells", response_model=list[CellAttendanceComparison])
def get_cell_attendance_comparison(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
    start_date: datetime = Query(..., description="Start of date range"),
    end_date: datetime = Query(..., description="End of date range"),
):
    """Compare attendance across cell groups."""
    attendance_service = get_attendance_service(db)
    comparison = attendance_service.get_cell_attendance_comparison(
        start_date=start_date,
        end_date=end_date,
    )

    return comparison
