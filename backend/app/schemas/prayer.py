from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

PrayerStatus = Literal["pending", "approved", "rejected", "answered"]


class PrayerRequestBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: str = Field(..., min_length=10)
    is_anonymous: bool = False
    is_public: bool = True


class PrayerRequestCreate(PrayerRequestBase):
    author_name: str | None = Field(None, max_length=200)
    author_email: EmailStr | None = None


class PrayerRequestUpdate(BaseModel):
    title: str | None = Field(None, max_length=200)
    description: str | None = Field(None, min_length=10)
    is_anonymous: bool | None = None
    is_public: bool | None = None


class PrayerRequestAuthorResponse(BaseModel):
    id: UUID
    first_name: str
    last_name: str

    class Config:
        from_attributes = True


class PrayerRequestResponse(PrayerRequestBase):
    id: UUID
    member_id: UUID | None = None
    author_name: str | None = None
    status: PrayerStatus
    prayer_count: int
    answered_at: datetime | None = None
    answer_testimony: str | None = None
    created_at: datetime
    updated_at: datetime
    author: PrayerRequestAuthorResponse | None = None

    class Config:
        from_attributes = True


class PrayerRequestListResponse(BaseModel):
    items: list[PrayerRequestResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class PrayerRequestDetailResponse(PrayerRequestResponse):
    author_email: str | None = None


# Public prayer wall response (hides sensitive data)
class PublicPrayerResponse(BaseModel):
    id: UUID
    title: str
    description: str
    author_name: str | None = None
    is_anonymous: bool
    status: PrayerStatus
    prayer_count: int
    answered_at: datetime | None = None
    answer_testimony: str | None = None
    created_at: datetime
    has_prayed: bool = False

    class Config:
        from_attributes = True


class PublicPrayerListResponse(BaseModel):
    items: list[PublicPrayerResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# Prayer interaction
class PrayResponse(BaseModel):
    success: bool
    prayer_count: int
    message: str


class MarkAnsweredRequest(BaseModel):
    answer_testimony: str | None = None


class MarkAnsweredResponse(BaseModel):
    success: bool
    message: str


# Admin moderation
class PrayerModerationRequest(BaseModel):
    action: Literal["approve", "reject"]
    rejection_reason: str | None = None


class PrayerModerationResponse(BaseModel):
    success: bool
    message: str
    status: PrayerStatus
