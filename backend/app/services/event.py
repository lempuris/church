from datetime import datetime, timedelta
from uuid import UUID

from dateutil.relativedelta import relativedelta  # type: ignore[import-untyped]
from sqlalchemy import and_, func, or_, select
from sqlalchemy.orm import Session

from app.models import Attendance, Event
from app.schemas.event import EventCreate, EventUpdate


class EventService:
    def __init__(self, db: Session):
        self.db = db

    def get_event_by_id(self, event_id: UUID) -> Event | None:
        stmt = select(Event).where(Event.id == event_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_events(
        self,
        page: int = 1,
        page_size: int = 20,
        event_type: str | None = None,
        start_date: datetime | None = None,
        end_date: datetime | None = None,
        is_public: bool | None = None,
        include_cancelled: bool = False,
    ) -> tuple[list[dict], int]:
        stmt = select(Event)

        # Filters
        if not include_cancelled:
            stmt = stmt.where(Event.is_cancelled == False)  # noqa: E712

        if event_type:
            stmt = stmt.where(Event.event_type == event_type)

        if start_date:
            stmt = stmt.where(Event.start_datetime >= start_date)

        if end_date:
            stmt = stmt.where(Event.start_datetime <= end_date)

        if is_public is not None:
            stmt = stmt.where(Event.is_public == is_public)

        # Get total count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar() or 0

        # Order and paginate
        stmt = stmt.order_by(Event.start_datetime.desc())
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        events = list(self.db.execute(stmt).scalars().all())

        # Enrich with attendance count
        result = []
        for event in events:
            attendance_count = self._get_attendance_count(event.id)
            result.append(self._event_to_dict(event, attendance_count))

        return result, total

    def _get_attendance_count(self, event_id: UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(Attendance)
            .where(Attendance.event_id == event_id)
        )
        return self.db.execute(stmt).scalar() or 0

    def _event_to_dict(self, event: Event, attendance_count: int = 0) -> dict:
        return {
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "event_type": event.event_type,
            "start_datetime": event.start_datetime,
            "end_datetime": event.end_datetime,
            "location": event.location,
            "capacity": event.capacity,
            "is_recurring": event.is_recurring,
            "recurrence_rule": event.recurrence_rule,
            "parent_event_id": event.parent_event_id,
            "is_public": event.is_public,
            "allow_self_checkin": event.allow_self_checkin,
            "qr_code_token": event.qr_code_token,
            "is_cancelled": event.is_cancelled,
            "created_by": event.created_by,
            "created_at": event.created_at,
            "updated_at": event.updated_at,
            "attendance_count": attendance_count,
        }

    def create_event(self, event_data: EventCreate, created_by: UUID) -> Event:
        event = Event(
            **event_data.model_dump(exclude={"is_recurring", "recurrence_rule"}),
            is_recurring=event_data.is_recurring,
            recurrence_rule=event_data.recurrence_rule,
            created_by=created_by,
        )

        # Generate QR code token if self check-in is enabled
        if event_data.allow_self_checkin:
            event.generate_qr_token()

        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)

        # If recurring, generate child events
        if event_data.is_recurring and event_data.recurrence_rule:
            self._generate_recurring_instances(event)

        return event

    def _generate_recurring_instances(
        self, parent_event: Event, num_instances: int = 12
    ) -> list[Event]:
        """Generate recurring event instances for the next N occurrences."""
        if not parent_event.recurrence_rule:
            return []

        instances = []
        current_date = parent_event.start_datetime

        for i in range(1, num_instances + 1):
            # Calculate next date based on recurrence rule using proper calendar math
            if parent_event.recurrence_rule == "weekly":
                next_date = current_date + timedelta(weeks=i)
            elif parent_event.recurrence_rule == "biweekly":
                next_date = current_date + timedelta(weeks=2 * i)
            elif parent_event.recurrence_rule == "monthly":
                # Use relativedelta to properly handle month boundaries
                next_date = current_date + relativedelta(months=i)
            else:
                return []

            # Calculate end datetime if exists
            end_datetime = None
            if parent_event.end_datetime:
                duration = parent_event.end_datetime - parent_event.start_datetime
                end_datetime = next_date + duration

            instance = Event(
                title=parent_event.title,
                description=parent_event.description,
                event_type=parent_event.event_type,
                start_datetime=next_date,
                end_datetime=end_datetime,
                location=parent_event.location,
                capacity=parent_event.capacity,
                is_recurring=False,
                parent_event_id=parent_event.id,
                is_public=parent_event.is_public,
                allow_self_checkin=parent_event.allow_self_checkin,
                created_by=parent_event.created_by,
            )

            if parent_event.allow_self_checkin:
                instance.generate_qr_token()

            self.db.add(instance)
            instances.append(instance)

        self.db.commit()
        return instances

    def update_event(
        self,
        event_id: UUID,
        event_data: EventUpdate,
        update_all: bool = False,
    ) -> Event | None:
        event = self.get_event_by_id(event_id)
        if not event:
            return None

        update_dict = event_data.model_dump(exclude_unset=True)

        # Update this event
        for field, value in update_dict.items():
            setattr(event, field, value)

        # Generate QR token if self check-in is newly enabled
        if event_data.allow_self_checkin and not event.qr_code_token:
            event.generate_qr_token()

        # If update_all and this is a parent event, update all future child events
        if update_all and event.is_recurring:
            stmt = select(Event).where(
                Event.parent_event_id == event.id,
                Event.start_datetime >= datetime.utcnow(),
                Event.is_cancelled == False,  # noqa: E712
            )
            children = self.db.execute(stmt).scalars().all()
            for child in children:
                for field, value in update_dict.items():
                    if field not in ["start_datetime", "end_datetime"]:
                        setattr(child, field, value)
                if event_data.allow_self_checkin and not child.qr_code_token:
                    child.generate_qr_token()

        self.db.commit()
        self.db.refresh(event)
        return event

    def cancel_event(self, event_id: UUID, cancel_all: bool = False) -> Event | None:
        event = self.get_event_by_id(event_id)
        if not event:
            return None

        event.is_cancelled = True

        # If cancel_all and this is a parent event, cancel all future child events
        if cancel_all and event.is_recurring:
            stmt = select(Event).where(
                Event.parent_event_id == event.id,
                Event.start_datetime >= datetime.utcnow(),
            )
            children = self.db.execute(stmt).scalars().all()
            for child in children:
                child.is_cancelled = True

        self.db.commit()
        self.db.refresh(event)
        return event

    def delete_event(self, event_id: UUID, delete_all: bool = False) -> bool:
        event = self.get_event_by_id(event_id)
        if not event:
            return False

        if delete_all and event.is_recurring:
            # Delete all child events first
            stmt = select(Event).where(Event.parent_event_id == event.id)
            children = self.db.execute(stmt).scalars().all()
            for child in children:
                self.db.delete(child)

        self.db.delete(event)
        self.db.commit()
        return True

    def get_upcoming_events(
        self, limit: int = 10, public_only: bool = True
    ) -> list[dict]:
        """Get upcoming events for public display."""
        stmt = select(Event).where(
            Event.start_datetime >= datetime.utcnow(),
            Event.is_cancelled == False,  # noqa: E712
        )

        if public_only:
            stmt = stmt.where(Event.is_public == True)  # noqa: E712

        stmt = stmt.order_by(Event.start_datetime).limit(limit)
        events = list(self.db.execute(stmt).scalars().all())

        return [
            self._event_to_dict(e, self._get_attendance_count(e.id)) for e in events
        ]

    def get_calendar_events(
        self,
        start_date: datetime,
        end_date: datetime,
        event_type: str | None = None,
    ) -> list[dict]:
        """Get events for calendar view within a date range.

        Uses proper interval overlap logic to catch all events:
        - Events starting within the range
        - Events ending within the range
        - Events spanning the entire range
        """
        stmt = select(Event).where(
            Event.is_cancelled == False,  # noqa: E712
            # Proper interval overlap: event.start <= query.end AND event.end >= query.start
            Event.start_datetime <= end_date,
            or_(
                Event.end_datetime >= start_date,
                # Handle events without end_datetime (single-point events)
                and_(
                    Event.end_datetime.is_(None),
                    Event.start_datetime >= start_date,
                ),
            ),
        )

        if event_type:
            stmt = stmt.where(Event.event_type == event_type)

        stmt = stmt.order_by(Event.start_datetime)
        events = list(self.db.execute(stmt).scalars().all())

        return [
            {
                "id": e.id,
                "title": e.title,
                "event_type": e.event_type,
                "start_datetime": e.start_datetime,
                "end_datetime": e.end_datetime,
                "is_cancelled": e.is_cancelled,
                "is_recurring": e.is_recurring,
            }
            for e in events
        ]

    def get_event_qr_code(self, event_id: UUID) -> dict | None:
        """Get or generate QR code token for an event."""
        event = self.get_event_by_id(event_id)
        if not event:
            return None

        if not event.qr_code_token:
            event.generate_qr_token()
            self.db.commit()
            self.db.refresh(event)

        return {
            "event_id": event.id,
            "qr_code_token": event.qr_code_token,
            "event_title": event.title,
        }

    def verify_qr_token(self, qr_token: str) -> Event | None:
        """Verify a QR code token and return the event."""
        stmt = select(Event).where(
            Event.qr_code_token == qr_token,
            Event.is_cancelled == False,  # noqa: E712
        )
        return self.db.execute(stmt).scalar_one_or_none()


def get_event_service(db: Session) -> EventService:
    return EventService(db)
