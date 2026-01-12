import uuid
from datetime import datetime, time

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, Time, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import GUID, Base


class Cell(Base):
    __tablename__ = "cells"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    leader_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("members.id", ondelete="SET NULL"), nullable=True, index=True
    )
    assistant_leader_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("members.id", ondelete="SET NULL"), nullable=True
    )

    meeting_day: Mapped[str | None] = mapped_column(String(20), nullable=True)
    meeting_time: Mapped[time | None] = mapped_column(Time, nullable=True)
    meeting_location: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    leader: Mapped["Member"] = relationship(
        "Member", foreign_keys=[leader_id], backref="led_cell"
    )
    assistant_leader: Mapped["Member"] = relationship(
        "Member", foreign_keys=[assistant_leader_id], backref="assisted_cell"
    )
    members: Mapped[list["CellMember"]] = relationship(
        "CellMember", back_populates="cell", cascade="all, delete-orphan"
    )


class CellMember(Base):
    __tablename__ = "cell_members"
    __table_args__ = (UniqueConstraint("cell_id", "member_id", name="uq_cell_member"),)

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    cell_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("cells.id", ondelete="CASCADE"), nullable=False, index=True
    )
    member_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True
    )
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Relationships
    cell: Mapped["Cell"] = relationship("Cell", back_populates="members")
    member: Mapped["Member"] = relationship("Member", backref="cell_membership")


# Import Member for type hints
from app.models.member import Member  # noqa: E402, F401
