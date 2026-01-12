import secrets
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import GUID, Base


class Event(Base):
    __tablename__ = "events"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    event_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    start_datetime: Mapped[datetime] = mapped_column(
        DateTime, nullable=False, index=True
    )
    end_datetime: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    capacity: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Recurrence
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    recurrence_rule: Mapped[str | None] = mapped_column(String(100), nullable=True)
    parent_event_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("events.id", ondelete="CASCADE"), nullable=True, index=True
    )

    # Visibility and check-in
    is_public: Mapped[bool] = mapped_column(Boolean, default=True)
    allow_self_checkin: Mapped[bool] = mapped_column(Boolean, default=False)
    qr_code_token: Mapped[str | None] = mapped_column(
        String(100), nullable=True, unique=True, index=True
    )
    is_cancelled: Mapped[bool] = mapped_column(Boolean, default=False)

    # Metadata
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    creator: Mapped["User"] = relationship("User", backref="created_events")
    parent_event: Mapped["Event"] = relationship(
        "Event", remote_side=[id], backref="child_events"
    )
    attendance_records: Mapped[list["Attendance"]] = relationship(
        "Attendance", back_populates="event", cascade="all, delete-orphan"
    )

    def generate_qr_token(self) -> str:
        """Generate a unique QR code token for this event."""
        self.qr_code_token = secrets.token_urlsafe(32)
        return self.qr_code_token


class Attendance(Base):
    __tablename__ = "attendance"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    event_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("events.id", ondelete="CASCADE"), nullable=False, index=True
    )
    member_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True
    )
    checked_in_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    check_in_method: Mapped[str] = mapped_column(String(20), default="manual")
    checked_in_by: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    # Relationships
    event: Mapped["Event"] = relationship("Event", back_populates="attendance_records")
    member: Mapped["Member"] = relationship("Member", backref="attendance_records")
    checked_in_by_user: Mapped["User"] = relationship(
        "User", foreign_keys=[checked_in_by], backref="attendance_checked_in"
    )


# Import for type hints
from app.models.member import Member  # noqa: E402, F401
from app.models.user import User  # noqa: E402, F401
