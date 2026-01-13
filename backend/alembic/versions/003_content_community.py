"""Create sermon, prayer request, and testimony tables

Revision ID: 003
Revises: 002
Create Date: 2026-01-13

"""

from collections.abc import Sequence

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

# revision identifiers, used by Alembic.
revision: str = "003"
down_revision: str = "002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Create sermon_series table
    op.create_table(
        "sermon_series",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("thumbnail_url", sa.String(500), nullable=True),
        sa.Column("start_date", sa.Date(), nullable=True),
        sa.Column("end_date", sa.Date(), nullable=True),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("true")),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")
        ),
    )
    op.create_index("ix_sermon_series_title", "sermon_series", ["title"])
    op.create_index("ix_sermon_series_active", "sermon_series", ["is_active"])

    # Create sermons table
    op.create_table(
        "sermons",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column(
            "speaker_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("members.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("speaker_name", sa.String(200), nullable=True),
        sa.Column(
            "series_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("sermon_series.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("sermon_date", sa.Date(), nullable=False),
        sa.Column("scripture_reference", sa.String(255), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("audio_url", sa.String(500), nullable=True),
        sa.Column("video_url", sa.String(500), nullable=True),
        sa.Column("thumbnail_url", sa.String(500), nullable=True),
        sa.Column("notes_url", sa.String(500), nullable=True),
        sa.Column("view_count", sa.Integer(), server_default=sa.text("0")),
        sa.Column("is_published", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("published_at", sa.DateTime(), nullable=True),
        sa.Column("scheduled_publish_at", sa.DateTime(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")
        ),
        sa.Column(
            "updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")
        ),
    )
    op.create_index("ix_sermons_date", "sermons", ["sermon_date"])
    op.create_index("ix_sermons_published", "sermons", ["is_published"])
    op.create_index("ix_sermons_series", "sermons", ["series_id"])
    op.create_index("ix_sermons_speaker", "sermons", ["speaker_id"])

    # Create prayer_requests table
    op.create_table(
        "prayer_requests",
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
        sa.Column("author_name", sa.String(200), nullable=True),
        sa.Column("author_email", sa.String(255), nullable=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("is_anonymous", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("is_public", sa.Boolean(), server_default=sa.text("true")),
        sa.Column("status", sa.String(20), server_default="pending"),
        sa.Column("prayer_count", sa.Integer(), server_default=sa.text("0")),
        sa.Column("answered_at", sa.DateTime(), nullable=True),
        sa.Column("answer_testimony", sa.Text(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")
        ),
        sa.Column(
            "updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")
        ),
    )
    op.create_index("ix_prayer_requests_status", "prayer_requests", ["status"])
    op.create_index("ix_prayer_requests_member", "prayer_requests", ["member_id"])
    op.create_index("ix_prayer_requests_public", "prayer_requests", ["is_public"])

    # Create prayer_interactions table
    op.create_table(
        "prayer_interactions",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            primary_key=True,
            server_default=sa.text("gen_random_uuid()"),
        ),
        sa.Column(
            "prayer_request_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("prayer_requests.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "member_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("members.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "prayed_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")
        ),
        sa.UniqueConstraint(
            "prayer_request_id", "member_id", name="uq_prayer_request_member"
        ),
    )
    op.create_index(
        "ix_prayer_interactions_request", "prayer_interactions", ["prayer_request_id"]
    )
    op.create_index(
        "ix_prayer_interactions_member", "prayer_interactions", ["member_id"]
    )

    # Create testimonies table
    op.create_table(
        "testimonies",
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
        sa.Column("author_name", sa.String(200), nullable=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("category", sa.String(50), nullable=True),
        sa.Column("media_url", sa.String(500), nullable=True),
        sa.Column("status", sa.String(20), server_default="pending"),
        sa.Column("is_featured", sa.Boolean(), server_default=sa.text("false")),
        sa.Column("rejection_reason", sa.Text(), nullable=True),
        sa.Column(
            "approved_by",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("approved_at", sa.DateTime(), nullable=True),
        sa.Column(
            "created_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")
        ),
        sa.Column(
            "updated_at", sa.DateTime(), server_default=sa.text("CURRENT_TIMESTAMP")
        ),
    )
    op.create_index("ix_testimonies_status", "testimonies", ["status"])
    op.create_index("ix_testimonies_featured", "testimonies", ["is_featured"])
    op.create_index("ix_testimonies_category", "testimonies", ["category"])
    op.create_index("ix_testimonies_member", "testimonies", ["member_id"])


def downgrade() -> None:
    op.drop_index("ix_testimonies_member")
    op.drop_index("ix_testimonies_category")
    op.drop_index("ix_testimonies_featured")
    op.drop_index("ix_testimonies_status")
    op.drop_table("testimonies")

    op.drop_index("ix_prayer_interactions_member")
    op.drop_index("ix_prayer_interactions_request")
    op.drop_table("prayer_interactions")

    op.drop_index("ix_prayer_requests_public")
    op.drop_index("ix_prayer_requests_member")
    op.drop_index("ix_prayer_requests_status")
    op.drop_table("prayer_requests")

    op.drop_index("ix_sermons_speaker")
    op.drop_index("ix_sermons_series")
    op.drop_index("ix_sermons_published")
    op.drop_index("ix_sermons_date")
    op.drop_table("sermons")

    op.drop_index("ix_sermon_series_active")
    op.drop_index("ix_sermon_series_title")
    op.drop_table("sermon_series")
