from datetime import datetime
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user, require_leader_or_above
from app.core.database import get_db
from app.models import User
from app.schemas import (
    CalendarEventResponse,
    EventCreate,
    EventDetailResponse,
    EventListResponse,
    EventResponse,
    EventUpdate,
    QRCodeResponse,
)
from app.services import get_event_service

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=EventListResponse)
def list_events(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    event_type: Literal["service", "cell_meeting", "conference", "special", "other"]
    | None = None,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    include_cancelled: bool = False,
):
    """List all events with pagination and filtering."""
    event_service = get_event_service(db)
    events, total = event_service.get_events(
        page=page,
        page_size=page_size,
        event_type=event_type,
        start_date=start_date,
        end_date=end_date,
        include_cancelled=include_cancelled,
    )

    total_pages = (total + page_size - 1) // page_size if total > 0 else 1

    return EventListResponse(
        items=[EventResponse(**e) for e in events],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("", response_model=EventResponse, status_code=status.HTTP_201_CREATED)
def create_event(
    event_data: EventCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Create a new event."""
    event_service = get_event_service(db)
    event = event_service.create_event(event_data, current_user.id)

    event_dict = event_service._event_to_dict(
        event, event_service._get_attendance_count(event.id)
    )
    return EventResponse(**event_dict)


@router.get("/upcoming", response_model=list[EventResponse])
def get_upcoming_events(
    db: Annotated[Session, Depends(get_db)],
    limit: int = Query(10, ge=1, le=50),
    public_only: bool = True,
):
    """Get upcoming events (public endpoint)."""
    event_service = get_event_service(db)
    events = event_service.get_upcoming_events(limit=limit, public_only=public_only)
    return [EventResponse(**e) for e in events]


@router.get("/calendar", response_model=list[CalendarEventResponse])
def get_calendar_events(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    start_date: datetime = Query(..., description="Start of date range"),
    end_date: datetime = Query(..., description="End of date range"),
    event_type: Literal["service", "cell_meeting", "conference", "special", "other"]
    | None = None,
):
    """Get events for calendar view within a date range."""
    event_service = get_event_service(db)
    events = event_service.get_calendar_events(
        start_date=start_date,
        end_date=end_date,
        event_type=event_type,
    )
    return [CalendarEventResponse(**e) for e in events]


@router.get("/{event_id}", response_model=EventDetailResponse)
def get_event(
    event_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get an event by ID."""
    event_service = get_event_service(db)
    event = event_service.get_event_by_id(event_id)

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    event_dict = event_service._event_to_dict(
        event, event_service._get_attendance_count(event.id)
    )
    return EventDetailResponse(**event_dict)


@router.put("/{event_id}", response_model=EventResponse)
def update_event(
    event_id: UUID,
    event_data: EventUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
    update_all: bool = Query(
        False, description="Update all future instances for recurring events"
    ),
):
    """Update an event."""
    event_service = get_event_service(db)
    event = event_service.update_event(event_id, event_data, update_all=update_all)

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    event_dict = event_service._event_to_dict(
        event, event_service._get_attendance_count(event.id)
    )
    return EventResponse(**event_dict)


@router.post("/{event_id}/cancel", response_model=EventResponse)
def cancel_event(
    event_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
    cancel_all: bool = Query(
        False, description="Cancel all future instances for recurring events"
    ),
):
    """Cancel an event."""
    event_service = get_event_service(db)
    event = event_service.cancel_event(event_id, cancel_all=cancel_all)

    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    event_dict = event_service._event_to_dict(
        event, event_service._get_attendance_count(event.id)
    )
    return EventResponse(**event_dict)


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_event(
    event_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
    delete_all: bool = Query(
        False, description="Delete all instances for recurring events"
    ),
):
    """Delete an event."""
    event_service = get_event_service(db)
    success = event_service.delete_event(event_id, delete_all=delete_all)

    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    return None


@router.get("/{event_id}/qr-code", response_model=QRCodeResponse)
def get_event_qr_code(
    event_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get or generate QR code for an event."""
    event_service = get_event_service(db)
    result = event_service.get_event_qr_code(event_id)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    return QRCodeResponse(**result)
