"""Finance - donation_categories, donations, recurring_donations, payment_methods

Revision ID: 004
Revises: 003
Create Date: 2026-01-13

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "004"
down_revision: str = "003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Create donation_categories table
    op.create_table(
        "donation_categories",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("name", sa.String(100), nullable=False, unique=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")
        ),
    )
    op.create_index(
        "ix_donation_categories_is_active", "donation_categories", ["is_active"]
    )

    # Create donations table
    op.create_table(
        "donations",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "member_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("members.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("donor_name", sa.String(200), nullable=True),
        sa.Column("donor_email", sa.String(255), nullable=True),
        sa.Column(
            "category_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("donation_categories.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(3), server_default="ZAR"),
        sa.Column("payment_method", sa.String(50), nullable=True),
        sa.Column("payment_status", sa.String(20), server_default="completed"),
        sa.Column("transaction_reference", sa.String(255), nullable=True),
        sa.Column("donation_date", sa.Date(), nullable=False),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.Column(
            "created_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")
        ),
    )
    op.create_index("ix_donations_member_id", "donations", ["member_id"])
    op.create_index("ix_donations_category_id", "donations", ["category_id"])
    op.create_index("ix_donations_donation_date", "donations", ["donation_date"])
    op.create_index("ix_donations_payment_status", "donations", ["payment_status"])

    # Create recurring_donations table
    op.create_table(
        "recurring_donations",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "member_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("members.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "category_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("donation_categories.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("currency", sa.String(3), server_default="ZAR"),
        sa.Column("frequency", sa.String(20), nullable=False),
        sa.Column("stripe_subscription_id", sa.String(255), nullable=True),
        sa.Column("status", sa.String(20), server_default="active"),
        sa.Column("next_donation_date", sa.Date(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")
        ),
        sa.Column(
            "updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")
        ),
    )
    op.create_index(
        "ix_recurring_donations_member_id", "recurring_donations", ["member_id"]
    )
    op.create_index("ix_recurring_donations_status", "recurring_donations", ["status"])

    # Create payment_methods table
    op.create_table(
        "payment_methods",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "member_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("members.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("stripe_payment_method_id", sa.String(255), nullable=True),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("last_four", sa.String(4), nullable=True),
        sa.Column("brand", sa.String(50), nullable=True),
        sa.Column("is_default", sa.Boolean(), server_default=sa.text("false")),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")
        ),
    )
    op.create_index("ix_payment_methods_member_id", "payment_methods", ["member_id"])

    # Insert default donation categories
    op.execute("""
        INSERT INTO donation_categories (id, name, description, is_active)
        VALUES
            (gen_random_uuid(), 'Tithe', 'Regular tithe - 10% of income', true),
            (gen_random_uuid(), 'Offering', 'General church offering', true),
            (gen_random_uuid(), 'Missions', 'Support for missionary work', true),
            (gen_random_uuid(), 'Building Fund', 'Church building and maintenance', true),
            (gen_random_uuid(), 'Benevolence', 'Support for those in need', true),
            (gen_random_uuid(), 'Special Project', 'Special church projects', true)
    """)


def downgrade() -> None:
    op.drop_index("ix_payment_methods_member_id")
    op.drop_table("payment_methods")
    op.drop_index("ix_recurring_donations_status")
    op.drop_index("ix_recurring_donations_member_id")
    op.drop_table("recurring_donations")
    op.drop_index("ix_donations_payment_status")
    op.drop_index("ix_donations_donation_date")
    op.drop_index("ix_donations_category_id")
    op.drop_index("ix_donations_member_id")
    op.drop_table("donations")
    op.drop_index("ix_donation_categories_is_active")
    op.drop_table("donation_categories")
