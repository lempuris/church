from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from sqlalchemy import extract, func, select
from sqlalchemy.orm import Session

from app.models import Member
from app.models.finance import Donation, DonationCategory, RecurringDonation
from app.schemas.donation import (
    DonationCategoryCreate,
    DonationCategoryUpdate,
    DonationCreate,
    DonationUpdate,
    RecurringDonationCreate,
    RecurringDonationUpdate,
)


class DonationService:
    def __init__(self, db: Session):
        self.db = db

    # ==================== CATEGORIES ====================

    def get_category_by_id(self, category_id: UUID) -> DonationCategory | None:
        stmt = select(DonationCategory).where(DonationCategory.id == category_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_categories(self, active_only: bool = True) -> list[dict]:
        stmt = select(DonationCategory)
        if active_only:
            stmt = stmt.where(DonationCategory.is_active == True)  # noqa: E712
        stmt = stmt.order_by(DonationCategory.name)

        categories = list(self.db.execute(stmt).scalars().all())
        result = []
        for cat in categories:
            stats = self._get_category_stats(cat.id)
            result.append(
                {
                    "id": cat.id,
                    "name": cat.name,
                    "description": cat.description,
                    "is_active": cat.is_active,
                    "created_at": cat.created_at,
                    "donation_count": stats["count"],
                    "total_amount": stats["total"],
                }
            )
        return result

    def _get_category_stats(self, category_id: UUID) -> dict:
        stmt = select(
            func.count(Donation.id).label("count"),
            func.coalesce(func.sum(Donation.amount), 0).label("total"),
        ).where(
            Donation.category_id == category_id,
            Donation.payment_status == "completed",
        )
        result = self.db.execute(stmt).one()
        return {"count": result.count, "total": result.total}

    def create_category(self, data: DonationCategoryCreate) -> DonationCategory:
        category = DonationCategory(**data.model_dump())
        self.db.add(category)
        self.db.commit()
        self.db.refresh(category)
        return category

    def update_category(
        self, category_id: UUID, data: DonationCategoryUpdate
    ) -> DonationCategory | None:
        category = self.get_category_by_id(category_id)
        if not category:
            return None
        update_dict = data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(category, field, value)
        self.db.commit()
        self.db.refresh(category)
        return category

    def delete_category(self, category_id: UUID) -> bool:
        category = self.get_category_by_id(category_id)
        if not category:
            return False
        # Soft delete - set inactive
        category.is_active = False
        self.db.commit()
        return True

    # ==================== DONATIONS ====================

    def get_donation_by_id(self, donation_id: UUID) -> Donation | None:
        stmt = select(Donation).where(Donation.id == donation_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_donations(
        self,
        page: int = 1,
        page_size: int = 20,
        member_id: UUID | None = None,
        category_id: UUID | None = None,
        payment_method: str | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
        min_amount: Decimal | None = None,
        max_amount: Decimal | None = None,
    ) -> tuple[list[dict], int]:
        stmt = select(Donation)

        if member_id:
            stmt = stmt.where(Donation.member_id == member_id)
        if category_id:
            stmt = stmt.where(Donation.category_id == category_id)
        if payment_method:
            stmt = stmt.where(Donation.payment_method == payment_method)
        if start_date:
            stmt = stmt.where(Donation.donation_date >= start_date)
        if end_date:
            stmt = stmt.where(Donation.donation_date <= end_date)
        if min_amount:
            stmt = stmt.where(Donation.amount >= min_amount)
        if max_amount:
            stmt = stmt.where(Donation.amount <= max_amount)

        # Count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar() or 0

        # Order and paginate
        stmt = stmt.order_by(Donation.donation_date.desc(), Donation.created_at.desc())
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        donations = list(self.db.execute(stmt).scalars().all())
        return [self._donation_to_dict(d) for d in donations], total

    def _donation_to_dict(self, donation: Donation) -> dict:
        donor = None
        donor_name = donation.donor_name
        donor_email = donation.donor_email

        if donation.member_id:
            member = self.db.execute(
                select(Member).where(Member.id == donation.member_id)
            ).scalar_one_or_none()
            if member:
                donor = {
                    "id": member.id,
                    "first_name": member.first_name,
                    "last_name": member.last_name,
                    "email": member.email,
                }
                donor_name = donor_name or f"{member.first_name} {member.last_name}"
                donor_email = donor_email or member.email

        category_name = None
        if donation.category_id:
            category = self.get_category_by_id(donation.category_id)
            if category:
                category_name = category.name

        return {
            "id": donation.id,
            "member_id": donation.member_id,
            "donor_name": donor_name,
            "donor_email": donor_email,
            "category_id": donation.category_id,
            "category_name": category_name,
            "amount": donation.amount,
            "currency": donation.currency,
            "payment_method": donation.payment_method,
            "payment_status": donation.payment_status,
            "transaction_reference": donation.transaction_reference,
            "donation_date": donation.donation_date,
            "notes": donation.notes,
            "created_by": donation.created_by,
            "created_at": donation.created_at,
            "donor": donor,
        }

    def create_donation(
        self, data: DonationCreate, created_by: UUID | None = None
    ) -> Donation:
        donation = Donation(
            **data.model_dump(),
            payment_status="completed",
            created_by=created_by,
        )
        self.db.add(donation)
        self.db.commit()
        self.db.refresh(donation)
        return donation

    def update_donation(
        self, donation_id: UUID, data: DonationUpdate
    ) -> Donation | None:
        donation = self.get_donation_by_id(donation_id)
        if not donation:
            return None
        update_dict = data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(donation, field, value)
        self.db.commit()
        self.db.refresh(donation)
        return donation

    def delete_donation(self, donation_id: UUID) -> bool:
        donation = self.get_donation_by_id(donation_id)
        if not donation:
            return False
        self.db.delete(donation)
        self.db.commit()
        return True

    # ==================== DONOR HISTORY ====================

    def get_donor_history(
        self,
        member_id: UUID | None = None,
        donor_email: str | None = None,
    ) -> dict | None:
        if not member_id and not donor_email:
            return None

        stmt = select(Donation).where(Donation.payment_status == "completed")
        if member_id:
            stmt = stmt.where(Donation.member_id == member_id)
        elif donor_email:
            stmt = stmt.where(Donation.donor_email == donor_email)

        stmt = stmt.order_by(Donation.donation_date.desc())
        donations = list(self.db.execute(stmt).scalars().all())

        if not donations:
            return None

        # Get donor info
        donor_name = donations[0].donor_name
        email = donor_email or donations[0].donor_email

        if member_id:
            member = self.db.execute(
                select(Member).where(Member.id == member_id)
            ).scalar_one_or_none()
            if member:
                donor_name = f"{member.first_name} {member.last_name}"
                email = email or member.email

        total_amount = sum(d.amount for d in donations)
        donation_dates = [d.donation_date for d in donations]

        history_items = []
        for d in donations:
            category_name = None
            if d.category_id:
                category = self.get_category_by_id(d.category_id)
                if category:
                    category_name = category.name
            history_items.append(
                {
                    "id": d.id,
                    "amount": d.amount,
                    "currency": d.currency,
                    "category_name": category_name,
                    "payment_method": d.payment_method,
                    "donation_date": d.donation_date,
                    "transaction_reference": d.transaction_reference,
                }
            )

        return {
            "member_id": member_id,
            "donor_name": donor_name or "Anonymous",
            "donor_email": email,
            "total_donations": len(donations),
            "total_amount": total_amount,
            "first_donation_date": min(donation_dates) if donation_dates else None,
            "last_donation_date": max(donation_dates) if donation_dates else None,
            "donations": history_items,
        }

    # ==================== REPORTS ====================

    def get_financial_summary(
        self,
        start_date: date,
        end_date: date,
        currency: str = "ZAR",
    ) -> dict:
        # Get total and count
        total_stmt = select(
            func.count(Donation.id).label("donation_count"),
            func.coalesce(func.sum(Donation.amount), 0).label("total"),
        ).where(
            Donation.donation_date >= start_date,
            Donation.donation_date <= end_date,
            Donation.payment_status == "completed",
            Donation.currency == currency,
        )
        totals = self.db.execute(total_stmt).one()
        total_amount = totals.total or Decimal("0.00")
        total_donation_count = totals.donation_count or 0

        # By category
        category_stmt = (
            select(
                DonationCategory.id,
                DonationCategory.name,
                func.count(Donation.id).label("donation_count"),
                func.coalesce(func.sum(Donation.amount), 0).label("total"),
            )
            .outerjoin(
                Donation,
                (Donation.category_id == DonationCategory.id)
                & (Donation.donation_date >= start_date)
                & (Donation.donation_date <= end_date)
                & (Donation.payment_status == "completed")
                & (Donation.currency == currency),
            )
            .where(
                DonationCategory.is_active == True  # noqa: E712
            )
            .group_by(DonationCategory.id, DonationCategory.name)
        )

        categories = list(self.db.execute(category_stmt).all())

        by_category = []
        for c in categories:
            cat_total = c.total or Decimal("0.00")
            by_category.append(
                {
                    "category_id": c.id,
                    "category_name": c.name,
                    "total_amount": cat_total,
                    "donation_count": c.donation_count or 0,
                    "percentage": float(cat_total / total_amount * 100)
                    if total_amount > 0
                    else 0,
                }
            )

        # Uncategorized donations
        uncategorized_stmt = select(
            func.count(Donation.id).label("donation_count"),
            func.coalesce(func.sum(Donation.amount), 0).label("total"),
        ).where(
            Donation.donation_date >= start_date,
            Donation.donation_date <= end_date,
            Donation.payment_status == "completed",
            Donation.currency == currency,
            Donation.category_id.is_(None),
        )
        uncategorized = self.db.execute(uncategorized_stmt).one()
        if uncategorized.donation_count and uncategorized.donation_count > 0:
            uncat_total = uncategorized.total or Decimal("0.00")
            by_category.append(
                {
                    "category_id": None,
                    "category_name": "Uncategorized",
                    "total_amount": uncat_total,
                    "donation_count": uncategorized.donation_count,
                    "percentage": float(uncat_total / total_amount * 100)
                    if total_amount > 0
                    else 0,
                }
            )

        # By payment method
        method_stmt = (
            select(
                Donation.payment_method,
                func.coalesce(func.sum(Donation.amount), 0).label("total"),
            )
            .where(
                Donation.donation_date >= start_date,
                Donation.donation_date <= end_date,
                Donation.payment_status == "completed",
                Donation.currency == currency,
            )
            .group_by(Donation.payment_method)
        )

        methods = self.db.execute(method_stmt).all()
        by_payment_method = {m.payment_method or "unknown": m.total for m in methods}

        return {
            "period_start": start_date,
            "period_end": end_date,
            "total_donations": total_donation_count,
            "total_amount": total_amount,
            "currency": currency,
            "by_category": by_category,
            "by_payment_method": by_payment_method,
        }

    def get_monthly_trends(
        self,
        start_date: date,
        end_date: date,
        currency: str = "ZAR",
    ) -> dict:
        stmt = (
            select(
                extract("year", Donation.donation_date).label("year"),
                extract("month", Donation.donation_date).label("month"),
                func.count(Donation.id).label("count"),
                func.coalesce(func.sum(Donation.amount), 0).label("total"),
            )
            .where(
                Donation.donation_date >= start_date,
                Donation.donation_date <= end_date,
                Donation.payment_status == "completed",
                Donation.currency == currency,
            )
            .group_by(
                extract("year", Donation.donation_date),
                extract("month", Donation.donation_date),
            )
            .order_by(
                extract("year", Donation.donation_date),
                extract("month", Donation.donation_date),
            )
        )

        results = self.db.execute(stmt).all()
        trends = [
            {
                "month": f"{int(r.year)}-{int(r.month):02d}",
                "total_amount": r.total,
                "donation_count": r.count,
            }
            for r in results
        ]

        return {
            "period_start": start_date,
            "period_end": end_date,
            "trends": trends,
        }

    def get_top_donors(
        self,
        start_date: date,
        end_date: date,
        limit: int = 10,
        currency: str = "ZAR",
    ) -> dict:
        # Members with donations
        member_stmt = (
            select(
                Donation.member_id,
                func.count(Donation.id).label("count"),
                func.sum(Donation.amount).label("total"),
            )
            .where(
                Donation.donation_date >= start_date,
                Donation.donation_date <= end_date,
                Donation.payment_status == "completed",
                Donation.currency == currency,
                Donation.member_id.isnot(None),
            )
            .group_by(Donation.member_id)
            .order_by(func.sum(Donation.amount).desc())
            .limit(limit)
        )

        results = self.db.execute(member_stmt).all()
        top_donors = []

        for r in results:
            member = self.db.execute(
                select(Member).where(Member.id == r.member_id)
            ).scalar_one_or_none()
            if member:
                top_donors.append(
                    {
                        "member_id": r.member_id,
                        "donor_name": f"{member.first_name} {member.last_name}",
                        "total_amount": r.total,
                        "donation_count": r.count,
                    }
                )

        return {
            "period_start": start_date,
            "period_end": end_date,
            "top_donors": top_donors,
        }

    def generate_tax_statement(
        self,
        member_id: UUID,
        year: int,
    ) -> dict | None:
        member = self.db.execute(
            select(Member).where(Member.id == member_id)
        ).scalar_one_or_none()
        if not member:
            return None

        start_date = date(year, 1, 1)
        end_date = date(year, 12, 31)

        stmt = (
            select(Donation)
            .where(
                Donation.member_id == member_id,
                Donation.donation_date >= start_date,
                Donation.donation_date <= end_date,
                Donation.payment_status == "completed",
            )
            .order_by(Donation.donation_date)
        )

        donations = list(self.db.execute(stmt).scalars().all())

        if not donations:
            return None

        total = sum(d.amount for d in donations)

        statement_items = []
        for d in donations:
            category_name = None
            if d.category_id:
                category = self.get_category_by_id(d.category_id)
                if category:
                    category_name = category.name
            statement_items.append(
                {
                    "donation_id": d.id,
                    "amount": d.amount,
                    "currency": d.currency,
                    "category_name": category_name,
                    "donation_date": d.donation_date,
                    "transaction_reference": d.transaction_reference,
                }
            )

        return {
            "year": year,
            "donor_name": f"{member.first_name} {member.last_name}",
            "donor_email": member.email,
            "member_id": member_id,
            "total_amount": total,
            "currency": "ZAR",
            "donations": statement_items,
            "generated_at": datetime.utcnow(),
        }

    # ==================== RECURRING DONATIONS ====================

    def get_recurring_donation_by_id(
        self, recurring_id: UUID
    ) -> RecurringDonation | None:
        stmt = select(RecurringDonation).where(RecurringDonation.id == recurring_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_recurring_donations(
        self,
        page: int = 1,
        page_size: int = 20,
        member_id: UUID | None = None,
        status: Literal["active", "paused", "cancelled"] | None = None,
    ) -> tuple[list[dict], int]:
        stmt = select(RecurringDonation)

        if member_id:
            stmt = stmt.where(RecurringDonation.member_id == member_id)
        if status:
            stmt = stmt.where(RecurringDonation.status == status)

        # Count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar() or 0

        # Order and paginate
        stmt = stmt.order_by(RecurringDonation.created_at.desc())
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        recurring = list(self.db.execute(stmt).scalars().all())
        return [self._recurring_to_dict(r) for r in recurring], total

    def _recurring_to_dict(self, recurring: RecurringDonation) -> dict:
        category_name = None
        if recurring.category_id:
            category = self.get_category_by_id(recurring.category_id)
            if category:
                category_name = category.name

        return {
            "id": recurring.id,
            "member_id": recurring.member_id,
            "category_id": recurring.category_id,
            "category_name": category_name,
            "amount": recurring.amount,
            "currency": recurring.currency,
            "frequency": recurring.frequency,
            "status": recurring.status,
            "next_donation_date": recurring.next_donation_date,
            "created_at": recurring.created_at,
            "updated_at": recurring.updated_at,
        }

    def create_recurring_donation(
        self, data: RecurringDonationCreate
    ) -> RecurringDonation:
        recurring = RecurringDonation(**data.model_dump())
        self.db.add(recurring)
        self.db.commit()
        self.db.refresh(recurring)
        return recurring

    def update_recurring_donation(
        self, recurring_id: UUID, data: RecurringDonationUpdate
    ) -> RecurringDonation | None:
        recurring = self.get_recurring_donation_by_id(recurring_id)
        if not recurring:
            return None
        update_dict = data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(recurring, field, value)
        self.db.commit()
        self.db.refresh(recurring)
        return recurring

    def cancel_recurring_donation(self, recurring_id: UUID) -> bool:
        recurring = self.get_recurring_donation_by_id(recurring_id)
        if not recurring:
            return False
        recurring.status = "cancelled"
        self.db.commit()
        return True


def get_donation_service(db: Session) -> DonationService:
    return DonationService(db)
