from datetime import date
from decimal import Decimal
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.v1.deps import get_current_user, require_admin, require_leader_or_above
from app.core.database import get_db
from app.models import User
from app.schemas.donation import (
    DonationCategoryCreate,
    DonationCategoryListResponse,
    DonationCategoryResponse,
    DonationCategoryUpdate,
    DonationCreate,
    DonationListResponse,
    DonationResponse,
    DonationUpdate,
    DonorHistoryResponse,
    FinancialSummaryReport,
    FinancialTrendReport,
    OnlinePaymentRequest,
    OnlinePaymentResponse,
    PaymentProviderStatus,
    TaxStatementResponse,
    TopDonorsReport,
)
from app.services.donation import get_donation_service
from app.services.payment_provider import (
    PaymentNotConfiguredError,
    get_payment_provider,
)

router = APIRouter(prefix="/donations", tags=["donations"])


# ==================== CATEGORIES ====================


@router.get("/categories", response_model=DonationCategoryListResponse)
def list_categories(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    active_only: bool = True,
):
    """List all donation categories."""
    service = get_donation_service(db)
    categories = service.get_categories(active_only=active_only)
    return DonationCategoryListResponse(items=categories, total=len(categories))


@router.post(
    "/categories",
    response_model=DonationCategoryResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_category(
    data: DonationCategoryCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_admin)],
):
    """Create a new donation category (admin only)."""
    service = get_donation_service(db)
    category = service.create_category(data)
    # Get stats for response
    categories = service.get_categories(active_only=False)
    for cat in categories:
        if cat["id"] == category.id:
            return cat
    return category


@router.put("/categories/{category_id}", response_model=DonationCategoryResponse)
def update_category(
    category_id: UUID,
    data: DonationCategoryUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_admin)],
):
    """Update a donation category (admin only)."""
    service = get_donation_service(db)
    category = service.update_category(category_id, data)
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )
    # Get stats for response
    categories = service.get_categories(active_only=False)
    for cat in categories:
        if cat["id"] == category.id:
            return cat
    return category


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(
    category_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_admin)],
):
    """Delete (deactivate) a donation category (admin only)."""
    service = get_donation_service(db)
    if not service.delete_category(category_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Category not found",
        )
    return None


# ==================== DONATIONS ====================


@router.get("", response_model=DonationListResponse)
def list_donations(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    member_id: UUID | None = None,
    category_id: UUID | None = None,
    payment_method: Literal["cash", "eft", "bank_transfer", "card", "snapscan"]
    | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    min_amount: Decimal | None = None,
    max_amount: Decimal | None = None,
):
    """List donations with filtering and pagination."""
    service = get_donation_service(db)
    donations, total = service.get_donations(
        page=page,
        page_size=page_size,
        member_id=member_id,
        category_id=category_id,
        payment_method=payment_method,
        start_date=start_date,
        end_date=end_date,
        min_amount=min_amount,
        max_amount=max_amount,
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return DonationListResponse(
        items=donations,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.post("", response_model=DonationResponse, status_code=status.HTTP_201_CREATED)
def create_donation(
    data: DonationCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Record a new donation (manual entry)."""
    service = get_donation_service(db)
    donation = service.create_donation(data, created_by=current_user.id)
    return service._donation_to_dict(donation)


@router.get("/{donation_id}", response_model=DonationResponse)
def get_donation(
    donation_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Get a donation by ID."""
    service = get_donation_service(db)
    donation = service.get_donation_by_id(donation_id)
    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found",
        )
    return service._donation_to_dict(donation)


@router.put("/{donation_id}", response_model=DonationResponse)
def update_donation(
    donation_id: UUID,
    data: DonationUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Update a donation."""
    service = get_donation_service(db)
    donation = service.update_donation(donation_id, data)
    if not donation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found",
        )
    return service._donation_to_dict(donation)


@router.delete("/{donation_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_donation(
    donation_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_admin)],
):
    """Delete a donation (admin only)."""
    service = get_donation_service(db)
    if not service.delete_donation(donation_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Donation not found",
        )
    return None


# ==================== DONOR HISTORY ====================


@router.get("/members/{member_id}/history", response_model=DonorHistoryResponse)
def get_member_donation_history(
    member_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
):
    """Get donation history for a member."""
    service = get_donation_service(db)
    history = service.get_donor_history(member_id=member_id)
    if not history:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No donation history found for this member",
        )
    return history


# ==================== REPORTS ====================


@router.get("/reports/summary", response_model=FinancialSummaryReport)
def get_financial_summary(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
    start_date: date = Query(...),
    end_date: date = Query(...),
    currency: str = "ZAR",
):
    """Get financial summary report for a date range."""
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date must be before end_date",
        )
    service = get_donation_service(db)
    return service.get_financial_summary(start_date, end_date, currency)


@router.get("/reports/trends", response_model=FinancialTrendReport)
def get_financial_trends(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
    start_date: date = Query(...),
    end_date: date = Query(...),
    currency: str = "ZAR",
):
    """Get monthly donation trends for a date range."""
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date must be before end_date",
        )
    service = get_donation_service(db)
    return service.get_monthly_trends(start_date, end_date, currency)


@router.get("/reports/top-donors", response_model=TopDonorsReport)
def get_top_donors(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_admin)],
    start_date: date = Query(...),
    end_date: date = Query(...),
    limit: int = Query(10, ge=1, le=50),
    currency: str = "ZAR",
):
    """Get top donors report (admin only for privacy)."""
    if start_date > end_date:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_date must be before end_date",
        )
    service = get_donation_service(db)
    return service.get_top_donors(start_date, end_date, limit, currency)


@router.get("/reports/tax-statement/{member_id}", response_model=TaxStatementResponse)
def generate_tax_statement(
    member_id: UUID,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(require_leader_or_above)],
    year: int = Query(..., ge=2000, le=2100),
):
    """Generate annual tax statement for a member."""
    service = get_donation_service(db)
    statement = service.generate_tax_statement(member_id, year)
    if not statement:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found or no donations for this year",
        )
    return statement


# ==================== PAYMENT PROVIDER ====================


@router.get("/payment/status", response_model=PaymentProviderStatus)
def get_payment_status(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get online payment provider status."""
    provider = get_payment_provider()
    return provider.get_status()


@router.post("/payment/create-intent", response_model=OnlinePaymentResponse)
def create_payment_intent(
    data: OnlinePaymentRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Create a payment intent for online donation.

    Currently stubbed - returns not configured message until Stripe is set up.
    """
    provider = get_payment_provider()
    try:
        result = provider.create_payment_intent(
            amount=data.amount,
            currency=data.currency,
            metadata={
                "category_id": str(data.category_id) if data.category_id else None,
                "member_id": str(data.member_id) if data.member_id else None,
                "donor_name": data.donor_name,
                "donor_email": data.donor_email,
            },
        )
        return OnlinePaymentResponse(
            success=True,
            message="Payment intent created",
            payment_intent_id=result.get("id"),
            client_secret=result.get("client_secret"),
        )
    except PaymentNotConfiguredError as e:
        return OnlinePaymentResponse(
            success=False,
            message=str(e),
            payment_intent_id=None,
            client_secret=None,
        )
