import uuid
from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import GUID, Base


class SermonSeries(Base):
    __tablename__ = "sermon_series"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    start_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    end_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    sermons: Mapped[list["Sermon"]] = relationship(
        "Sermon", back_populates="series", cascade="all, delete-orphan"
    )


class Sermon(Base):
    __tablename__ = "sermons"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    speaker_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("members.id", ondelete="SET NULL"), nullable=True, index=True
    )
    speaker_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    series_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(),
        ForeignKey("sermon_series.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    sermon_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    scripture_reference: Mapped[str | None] = mapped_column(String(255), nullable=True)
    duration_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    audio_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    video_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    thumbnail_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    notes_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    view_count: Mapped[int] = mapped_column(Integer, default=0)
    is_published: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    published_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    scheduled_publish_at: Mapped[datetime | None] = mapped_column(
        DateTime, nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    speaker: Mapped["Member"] = relationship("Member", backref="sermons_as_speaker")
    series: Mapped["SermonSeries"] = relationship(
        "SermonSeries", back_populates="sermons"
    )


class PrayerRequest(Base):
    __tablename__ = "prayer_requests"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    member_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("members.id", ondelete="SET NULL"), nullable=True, index=True
    )
    author_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    author_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False)
    is_public: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    prayer_count: Mapped[int] = mapped_column(Integer, default=0)
    answered_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    answer_testimony: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    member: Mapped["Member"] = relationship("Member", backref="prayer_requests")
    interactions: Mapped[list["PrayerInteraction"]] = relationship(
        "PrayerInteraction",
        back_populates="prayer_request",
        cascade="all, delete-orphan",
    )


class PrayerInteraction(Base):
    __tablename__ = "prayer_interactions"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    prayer_request_id: Mapped[uuid.UUID] = mapped_column(
        GUID(),
        ForeignKey("prayer_requests.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    member_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("members.id", ondelete="SET NULL"), nullable=True, index=True
    )
    prayed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    prayer_request: Mapped["PrayerRequest"] = relationship(
        "PrayerRequest", back_populates="interactions"
    )
    member: Mapped["Member"] = relationship("Member", backref="prayer_interactions")


class Testimony(Base):
    __tablename__ = "testimonies"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    member_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("members.id", ondelete="SET NULL"), nullable=True, index=True
    )
    author_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    media_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    rejection_reason: Mapped[str | None] = mapped_column(Text, nullable=True)
    approved_by: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    approved_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    member: Mapped["Member"] = relationship("Member", backref="testimonies")
    approver: Mapped["User"] = relationship("User", backref="approved_testimonies")


# Import for type hints
from app.models.member import Member  # noqa: E402, F401
from app.models.user import User  # noqa: E402, F401
