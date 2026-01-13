import uuid
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import Boolean, Date, DateTime, ForeignKey, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import GUID, Base


class DonationCategory(Base):
    """Donation categories like tithe, offering, missions, etc."""

    __tablename__ = "donation_categories"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    donations: Mapped[list["Donation"]] = relationship(
        "Donation", back_populates="category"
    )
    recurring_donations: Mapped[list["RecurringDonation"]] = relationship(
        "RecurringDonation", back_populates="category"
    )


class Donation(Base):
    """Individual donation records."""

    __tablename__ = "donations"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    member_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("members.id", ondelete="SET NULL"), nullable=True, index=True
    )
    donor_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    donor_email: Mapped[str | None] = mapped_column(String(255), nullable=True)
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(),
        ForeignKey("donation_categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="ZAR")
    payment_method: Mapped[str | None] = mapped_column(String(50), nullable=True)
    payment_status: Mapped[str] = mapped_column(
        String(20), default="completed", index=True
    )
    transaction_reference: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    donation_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    member: Mapped["Member | None"] = relationship("Member", backref="donations")
    category: Mapped["DonationCategory | None"] = relationship(
        "DonationCategory", back_populates="donations"
    )
    created_by_user: Mapped["User | None"] = relationship(
        "User", foreign_keys=[created_by], backref="recorded_donations"
    )


class RecurringDonation(Base):
    """Recurring donation subscriptions for future Stripe integration."""

    __tablename__ = "recurring_donations"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    member_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("members.id", ondelete="SET NULL"), nullable=True, index=True
    )
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID(), ForeignKey("donation_categories.id", ondelete="SET NULL"), nullable=True
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="ZAR")
    frequency: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # weekly, monthly, quarterly, annually
    stripe_subscription_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    status: Mapped[str] = mapped_column(String(20), default="active", index=True)
    next_donation_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    member: Mapped["Member | None"] = relationship(
        "Member", backref="recurring_donations"
    )
    category: Mapped["DonationCategory | None"] = relationship(
        "DonationCategory", back_populates="recurring_donations"
    )


class PaymentMethod(Base):
    """Saved payment methods for future Stripe integration."""

    __tablename__ = "payment_methods"

    id: Mapped[uuid.UUID] = mapped_column(GUID(), primary_key=True, default=uuid.uuid4)
    member_id: Mapped[uuid.UUID] = mapped_column(
        GUID(), ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True
    )
    stripe_payment_method_id: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # card, eft, bank_transfer, snapscan
    last_four: Mapped[str | None] = mapped_column(String(4), nullable=True)
    brand: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )  # visa, mastercard, etc.
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    # Relationships
    member: Mapped["Member"] = relationship("Member", backref="payment_methods")


# Import for type hints
from app.models.member import Member  # noqa: E402, F401
from app.models.user import User  # noqa: E402, F401
