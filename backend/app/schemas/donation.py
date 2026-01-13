from datetime import date, datetime
from decimal import Decimal
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator

PaymentMethodType = Literal["cash", "eft", "bank_transfer", "card", "snapscan"]
PaymentStatus = Literal["pending", "completed", "failed", "refunded"]
DonationFrequency = Literal["weekly", "monthly", "quarterly", "annually"]


# ==================== DONATION CATEGORY SCHEMAS ====================


class DonationCategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: str | None = None


class DonationCategoryCreate(DonationCategoryBase):
    pass


class DonationCategoryUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = None
    is_active: bool | None = None


class DonationCategoryResponse(DonationCategoryBase):
    id: UUID
    is_active: bool
    created_at: datetime
    donation_count: int = 0
    total_amount: Decimal = Decimal("0.00")

    class Config:
        from_attributes = True


class DonationCategoryListResponse(BaseModel):
    items: list[DonationCategoryResponse]
    total: int


# ==================== DONOR INFO SCHEMA ====================


class DonorInfo(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    email: str | None = None

    class Config:
        from_attributes = True


# ==================== DONATION SCHEMAS ====================


class DonationBase(BaseModel):
    member_id: UUID | None = None
    donor_name: str | None = Field(None, max_length=200)
    donor_email: EmailStr | None = None
    category_id: UUID | None = None
    amount: Decimal = Field(..., gt=0)
    currency: str = Field(default="ZAR", max_length=3)
    payment_method: PaymentMethodType | None = None
    transaction_reference: str | None = Field(None, max_length=255)
    donation_date: date
    notes: str | None = None

    @field_validator("amount")
    @classmethod
    def validate_amount(cls, v: Decimal) -> Decimal:
        if v <= 0:
            raise ValueError("Amount must be greater than zero")
        return round(v, 2)


class DonationCreate(DonationBase):
    pass


class DonationUpdate(BaseModel):
    member_id: UUID | None = None
    donor_name: str | None = Field(None, max_length=200)
    donor_email: EmailStr | None = None
    category_id: UUID | None = None
    amount: Decimal | None = Field(None, gt=0)
    currency: str | None = Field(None, max_length=3)
    payment_method: PaymentMethodType | None = None
    transaction_reference: str | None = Field(None, max_length=255)
    donation_date: date | None = None
    notes: str | None = None


class DonationResponse(BaseModel):
    id: UUID
    member_id: UUID | None = None
    donor_name: str | None = None
    donor_email: str | None = None
    category_id: UUID | None = None
    category_name: str | None = None
    amount: Decimal
    currency: str
    payment_method: str | None = None
    payment_status: str
    transaction_reference: str | None = None
    donation_date: date
    notes: str | None = None
    created_by: UUID | None = None
    created_at: datetime
    donor: DonorInfo | None = None

    class Config:
        from_attributes = True


class DonationListResponse(BaseModel):
    items: list[DonationResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ==================== DONOR HISTORY SCHEMAS ====================


class DonorHistoryItem(BaseModel):
    id: UUID
    amount: Decimal
    currency: str
    category_name: str | None = None
    payment_method: str | None = None
    donation_date: date
    transaction_reference: str | None = None


class DonorHistoryResponse(BaseModel):
    member_id: UUID | None = None
    donor_name: str
    donor_email: str | None = None
    total_donations: int
    total_amount: Decimal
    first_donation_date: date | None = None
    last_donation_date: date | None = None
    donations: list[DonorHistoryItem]


# ==================== FINANCIAL REPORT SCHEMAS ====================


class CategorySummary(BaseModel):
    category_id: UUID | None = None
    category_name: str
    total_amount: Decimal
    donation_count: int
    percentage: float


class FinancialSummaryReport(BaseModel):
    period_start: date
    period_end: date
    total_donations: int
    total_amount: Decimal
    currency: str
    by_category: list[CategorySummary]
    by_payment_method: dict[str, Decimal]


class MonthlyTrendItem(BaseModel):
    month: str  # YYYY-MM format
    total_amount: Decimal
    donation_count: int


class FinancialTrendReport(BaseModel):
    period_start: date
    period_end: date
    trends: list[MonthlyTrendItem]


class TopDonorItem(BaseModel):
    member_id: UUID | None = None
    donor_name: str
    total_amount: Decimal
    donation_count: int


class TopDonorsReport(BaseModel):
    period_start: date
    period_end: date
    top_donors: list[TopDonorItem]


class TaxStatementItem(BaseModel):
    donation_id: UUID
    amount: Decimal
    currency: str
    category_name: str | None = None
    donation_date: date
    transaction_reference: str | None = None


class TaxStatementResponse(BaseModel):
    year: int
    donor_name: str
    donor_email: str | None = None
    member_id: UUID | None = None
    total_amount: Decimal
    currency: str
    donations: list[TaxStatementItem]
    generated_at: datetime


# ==================== RECURRING DONATION SCHEMAS ====================


class RecurringDonationBase(BaseModel):
    category_id: UUID | None = None
    amount: Decimal = Field(..., gt=0)
    currency: str = "ZAR"
    frequency: DonationFrequency


class RecurringDonationCreate(RecurringDonationBase):
    member_id: UUID


class RecurringDonationUpdate(BaseModel):
    category_id: UUID | None = None
    amount: Decimal | None = Field(None, gt=0)
    currency: str | None = None
    frequency: DonationFrequency | None = None
    status: Literal["active", "paused", "cancelled"] | None = None


class RecurringDonationResponse(BaseModel):
    id: UUID
    member_id: UUID | None = None
    category_id: UUID | None = None
    category_name: str | None = None
    amount: Decimal
    currency: str
    frequency: str
    status: str
    next_donation_date: date | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class RecurringDonationListResponse(BaseModel):
    items: list[RecurringDonationResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# ==================== PAYMENT PROVIDER SCHEMAS ====================


class PaymentProviderStatus(BaseModel):
    provider: str
    is_configured: bool
    is_enabled: bool
    supported_methods: list[str]
    message: str | None = None


class OnlinePaymentRequest(BaseModel):
    amount: Decimal = Field(..., gt=0)
    currency: str = "ZAR"
    category_id: UUID | None = None
    member_id: UUID | None = None
    donor_name: str | None = None
    donor_email: EmailStr | None = None


class OnlinePaymentResponse(BaseModel):
    success: bool
    message: str
    payment_intent_id: str | None = None
    client_secret: str | None = None
    donation_id: UUID | None = None
