from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

TestimonyCategory = Literal[
    "healing", "provision", "salvation", "deliverance", "family", "career", "other"
]
TestimonyStatus = Literal["pending", "approved", "rejected"]


class TestimonyBase(BaseModel):
    title: str = Field(..., max_length=200)
    content: str = Field(..., min_length=50)
    category: TestimonyCategory | None = None


class TestimonyCreate(TestimonyBase):
    author_name: str | None = Field(None, max_length=200)


class TestimonyUpdate(BaseModel):
    title: str | None = Field(None, max_length=200)
    content: str | None = Field(None, min_length=50)
    category: TestimonyCategory | None = None


class TestimonyAuthorResponse(BaseModel):
    id: UUID
    first_name: str
    last_name: str

    class Config:
        from_attributes = True


class TestimonyResponse(TestimonyBase):
    id: UUID
    member_id: UUID | None = None
    author_name: str | None = None
    media_url: str | None = None
    status: TestimonyStatus
    is_featured: bool
    rejection_reason: str | None = None
    approved_by: UUID | None = None
    approved_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    author: TestimonyAuthorResponse | None = None

    class Config:
        from_attributes = True


class TestimonyListResponse(BaseModel):
    items: list[TestimonyResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class TestimonyDetailResponse(TestimonyResponse):
    pass


# Public testimony response
class PublicTestimonyResponse(BaseModel):
    id: UUID
    title: str
    content: str
    category: TestimonyCategory | None = None
    author_name: str | None = None
    media_url: str | None = None
    is_featured: bool
    created_at: datetime

    class Config:
        from_attributes = True


class PublicTestimonyListResponse(BaseModel):
    items: list[PublicTestimonyResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


# Media upload for testimonies
class TestimonyMediaUploadRequest(BaseModel):
    file_name: str
    content_type: str


class TestimonyMediaUploadResponse(BaseModel):
    upload_url: str
    file_key: str


class TestimonyMediaComplete(BaseModel):
    file_key: str


# Admin moderation
class TestimonyModerationRequest(BaseModel):
    action: Literal["approve", "reject"]
    rejection_reason: str | None = None


class TestimonyModerationResponse(BaseModel):
    success: bool
    message: str
    status: TestimonyStatus


class TestimonyFeatureRequest(BaseModel):
    is_featured: bool


class TestimonyFeatureResponse(BaseModel):
    success: bool
    message: str
    is_featured: bool
