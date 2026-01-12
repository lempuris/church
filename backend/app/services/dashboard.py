from datetime import datetime, timedelta

from sqlalchemy.orm import Session
from sqlalchemy import select, func

from app.models import Member


class DashboardService:
    def __init__(self, db: Session):
        self.db = db

    def get_stats(self) -> dict:
        # Total active members
        total_members = (
            self.db.execute(
                select(func.count())
                .select_from(Member)
                .where(Member.member_status == "active")
            ).scalar()
            or 0
        )

        # New members this month
        first_of_month = datetime.utcnow().replace(
            day=1, hour=0, minute=0, second=0, microsecond=0
        )
        new_members = (
            self.db.execute(
                select(func.count())
                .select_from(Member)
                .where(Member.created_at >= first_of_month)
            ).scalar()
            or 0
        )

        # Placeholder for cells and events (Phase 2)
        active_cells = 0
        upcoming_events = 0

        return {
            "total_members": total_members,
            "new_members_this_month": new_members,
            "active_cells": active_cells,
            "upcoming_events": upcoming_events,
        }

    def get_recent_members(self, limit: int = 10) -> list[Member]:
        stmt = (
            select(Member)
            .where(Member.member_status == "active")
            .order_by(Member.created_at.desc())
            .limit(limit)
        )
        return list(self.db.execute(stmt).scalars().all())


def get_dashboard_service(db: Session) -> DashboardService:
    return DashboardService(db)
