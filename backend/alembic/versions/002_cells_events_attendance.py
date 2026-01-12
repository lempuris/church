"""Create cells, events, and attendance tables

Revision ID: 002
Revises: 001
Create Date: 2026-01-12

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "002"
down_revision: str = "001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Create cells table
    op.create_table(
        "cells",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "leader_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("members.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "assistant_leader_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("members.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("meeting_day", sa.String(20), nullable=True),
        sa.Column("meeting_time", sa.Time(), nullable=True),
        sa.Column("meeting_location", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")
        ),
        sa.Column(
            "updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")
        ),
    )
    op.create_index("ix_cells_name", "cells", ["name"])
    op.create_index("ix_cells_leader", "cells", ["leader_id"])

    # Create cell_members table
    op.create_table(
        "cell_members",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "cell_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("cells.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "member_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("members.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "joined_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")
        ),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.UniqueConstraint("cell_id", "member_id", name="uq_cell_member"),
    )
    op.create_index("ix_cell_members_cell", "cell_members", ["cell_id"])
    op.create_index("ix_cell_members_member", "cell_members", ["member_id"])

    # Create events table
    op.create_table(
        "events",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("event_type", sa.String(50), nullable=False),
        sa.Column("start_datetime", sa.DateTime(), nullable=False),
        sa.Column("end_datetime", sa.DateTime(), nullable=True),
        sa.Column("location", sa.String(255), nullable=True),
        sa.Column("capacity", sa.Integer(), nullable=True),
        sa.Column("is_recurring", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("recurrence_rule", sa.String(100), nullable=True),
        sa.Column(
            "parent_event_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("events.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column("is_public", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("allow_self_checkin", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("qr_code_token", sa.String(100), nullable=True, unique=True),
        sa.Column("is_cancelled", sa.Boolean(), server_default=sa.text("false")),
        sa.Column(
            "created_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")
        ),
        sa.Column(
            "updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")
        ),
    )
    op.create_index("ix_events_datetime", "events", ["start_datetime"])
    op.create_index("ix_events_type", "events", ["event_type"])
    op.create_index("ix_events_parent", "events", ["parent_event_id"])
    op.create_index("ix_events_qr_token", "events", ["qr_code_token"])

    # Create attendance table
    op.create_table(
        "attendance",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "event_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("events.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "member_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("members.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "checked_in_at",
            sa.DateTime(),
            server_default=sa.text("CURRENT_TIMESTAMP"),
        ),
        sa.Column("check_in_method", sa.String(20), server_default="manual"),
        sa.Column(
            "checked_in_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("notes", sa.Text(), nullable=True),
        sa.UniqueConstraint("event_id", "member_id", name="uq_event_member"),
    )
    op.create_index("ix_attendance_event", "attendance", ["event_id"])
    op.create_index("ix_attendance_member", "attendance", ["member_id"])


def downgrade() -> None:
    op.drop_index("ix_attendance_member")
    op.drop_index("ix_attendance_event")
    op.drop_table("attendance")

    op.drop_index("ix_events_qr_token")
    op.drop_index("ix_events_parent")
    op.drop_index("ix_events_type")
    op.drop_index("ix_events_datetime")
    op.drop_table("events")

    op.drop_index("ix_cell_members_member")
    op.drop_index("ix_cell_members_cell")
    op.drop_table("cell_members")

    op.drop_index("ix_cells_leader")
    op.drop_index("ix_cells_name")
    op.drop_table("cells")
