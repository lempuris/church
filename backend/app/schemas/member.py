from datetime import datetime, date
from uuid import UUID
from typing import Literal
from pydantic import BaseModel, EmailStr, field_validator
import re


class MemberBase(BaseModel):
    first_name: str
    last_name: str
    email: EmailStr | None = None
    phone: str | None = None
    date_of_birth: date | None = None
    gender: Literal["male", "female", "other"] | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    state: str | None = None
    postal_code: str | None = None
    country: str = "Kenya"
    member_status: Literal["active", "inactive", "visitor"] = "active"
    join_date: date | None = None
    baptism_date: date | None = None
    notes: str | None = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        if v is None:
            return v
        # Basic phone validation - allows digits, spaces, dashes, parentheses, and plus
        pattern = r"^[\d\s\-\(\)\+]+$"
        if not re.match(pattern, v):
            raise ValueError("Invalid phone number format")
        return v


class MemberCreate(MemberBase):
    pass


class MemberUpdate(BaseModel):
    first_name: str | None = None
    last_name: str | None = None
    email: EmailStr | None = None
    phone: str | None = None
    date_of_birth: date | None = None
    gender: Literal["male", "female", "other"] | None = None
    address_line1: str | None = None
    address_line2: str | None = None
    city: str | None = None
    state: str | None = None
    postal_code: str | None = None
    country: str | None = None
    member_status: Literal["active", "inactive", "visitor"] | None = None
    join_date: date | None = None
    baptism_date: date | None = None
    notes: str | None = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, v: str | None) -> str | None:
        if v is None:
            return v
        pattern = r"^[\d\s\-\(\)\+]+$"
        if not re.match(pattern, v):
            raise ValueError("Invalid phone number format")
        return v


class MemberResponse(MemberBase):
    id: UUID
    user_id: UUID | None = None
    photo_url: str | None = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class MemberListResponse(BaseModel):
    items: list[MemberResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class FamilyRelationshipBase(BaseModel):
    related_member_id: UUID
    relationship_type: Literal["spouse", "child", "parent", "sibling"]


class FamilyRelationshipCreate(FamilyRelationshipBase):
    pass


class FamilyMemberResponse(BaseModel):
    id: UUID
    first_name: str
    last_name: str
    photo_url: str | None = None
    relationship_type: str

    class Config:
        from_attributes = True


class FamilyRelationshipResponse(BaseModel):
    id: UUID
    member_id: UUID
    related_member_id: UUID
    relationship_type: str
    related_member: MemberResponse
    created_at: datetime

    class Config:
        from_attributes = True


class PhotoUploadResponse(BaseModel):
    upload_url: str
    photo_url: str
