from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field

MediaType = Literal["audio", "video", "thumbnail", "notes"]


# Sermon Series Schemas
class SermonSeriesBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None


class SermonSeriesCreate(SermonSeriesBase):
    pass


class SermonSeriesUpdate(BaseModel):
    title: str | None = Field(None, max_length=200)
    description: str | None = None
    start_date: date | None = None
    end_date: date | None = None
    is_active: bool | None = None


class SermonSeriesResponse(SermonSeriesBase):
    id: UUID
    thumbnail_url: str | None = None
    is_active: bool
    created_at: datetime
    sermon_count: int = 0

    class Config:
        from_attributes = True


class SermonSeriesListResponse(BaseModel):
    items: list[SermonSeriesResponse]
    total: int


# Sermon Schemas
class SermonBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: str | None = None
    speaker_id: UUID | None = None
    speaker_name: str | None = Field(None, max_length=200)
    series_id: UUID | None = None
    sermon_date: date
    scripture_reference: str | None = Field(None, max_length=255)


class SermonCreate(SermonBase):
    pass


class SermonUpdate(BaseModel):
    title: str | None = Field(None, max_length=200)
    description: str | None = None
    speaker_id: UUID | None = None
    speaker_name: str | None = Field(None, max_length=200)
    series_id: UUID | None = None
    sermon_date: date | None = None
    scripture_reference: str | None = Field(None, max_length=255)
    duration_seconds: int | None = None


class SermonSpeakerResponse(BaseModel):
    id: UUID
    first_name: str
    last_name: str

    class Config:
        from_attributes = True


class SermonResponse(SermonBase):
    id: UUID
    duration_seconds: int | None = None
    audio_url: str | None = None
    video_url: str | None = None
    thumbnail_url: str | None = None
    notes_url: str | None = None
    view_count: int
    is_published: bool
    published_at: datetime | None = None
    scheduled_publish_at: datetime | None = None
    created_at: datetime
    updated_at: datetime
    series_title: str | None = None
    speaker: SermonSpeakerResponse | None = None

    class Config:
        from_attributes = True


class SermonListResponse(BaseModel):
    items: list[SermonResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class SermonDetailResponse(SermonResponse):
    related_sermons: list["SermonResponse"] = []


class SermonPublishRequest(BaseModel):
    scheduled_publish_at: datetime | None = None


# Media Upload Schemas
class MediaUploadRequest(BaseModel):
    media_type: MediaType
    file_name: str
    content_type: str


class MediaUploadResponse(BaseModel):
    upload_url: str
    file_key: str
    media_type: MediaType


class MediaUploadComplete(BaseModel):
    media_type: MediaType
    file_key: str
    duration_seconds: int | None = None


# Public Sermon Schemas
class PublicSermonResponse(BaseModel):
    id: UUID
    title: str
    description: str | None = None
    speaker_name: str | None = None
    sermon_date: date
    scripture_reference: str | None = None
    duration_seconds: int | None = None
    audio_url: str | None = None
    video_url: str | None = None
    thumbnail_url: str | None = None
    view_count: int
    series_id: UUID | None = None
    series_title: str | None = None

    class Config:
        from_attributes = True


class PublicSermonListResponse(BaseModel):
    items: list[PublicSermonResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
