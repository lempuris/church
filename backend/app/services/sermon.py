from datetime import date, datetime
from uuid import UUID

import boto3
from botocore.config import Config
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Member, Sermon, SermonSeries
from app.schemas.sermon import (
    SermonCreate,
    SermonSeriesCreate,
    SermonSeriesUpdate,
    SermonUpdate,
)

# Allowed media types and their content types
MEDIA_CONFIG = {
    "audio": {
        "extensions": ["mp3", "m4a", "wav"],
        "content_types": ["audio/mpeg", "audio/mp4", "audio/wav", "audio/x-wav"],
        "max_size": 200 * 1024 * 1024,  # 200MB
        "path": "sermons/audio",
    },
    "video": {
        "extensions": ["mp4", "mov", "webm"],
        "content_types": ["video/mp4", "video/quicktime", "video/webm"],
        "max_size": 2 * 1024 * 1024 * 1024,  # 2GB
        "path": "sermons/video",
    },
    "thumbnail": {
        "extensions": ["jpg", "jpeg", "png", "webp"],
        "content_types": ["image/jpeg", "image/png", "image/webp"],
        "max_size": 5 * 1024 * 1024,  # 5MB
        "path": "sermons/thumbnails",
    },
    "notes": {
        "extensions": ["pdf"],
        "content_types": ["application/pdf"],
        "max_size": 20 * 1024 * 1024,  # 20MB
        "path": "sermons/notes",
    },
}


class SermonService:
    def __init__(self, db: Session):
        self.db = db

    # ==================== SERIES ====================

    def get_series_by_id(self, series_id: UUID) -> SermonSeries | None:
        stmt = select(SermonSeries).where(SermonSeries.id == series_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_all_series(self, active_only: bool = True) -> tuple[list[dict], int]:
        stmt = select(SermonSeries)

        if active_only:
            stmt = stmt.where(SermonSeries.is_active == True)  # noqa: E712

        stmt = stmt.order_by(SermonSeries.created_at.desc())
        series_list = list(self.db.execute(stmt).scalars().all())

        result = []
        for series in series_list:
            sermon_count = self._get_series_sermon_count(series.id)
            result.append(self._series_to_dict(series, sermon_count))

        return result, len(result)

    def _get_series_sermon_count(self, series_id: UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(Sermon)
            .where(Sermon.series_id == series_id)
        )
        return self.db.execute(stmt).scalar() or 0

    def _series_to_dict(self, series: SermonSeries, sermon_count: int = 0) -> dict:
        return {
            "id": series.id,
            "title": series.title,
            "description": series.description,
            "thumbnail_url": series.thumbnail_url,
            "start_date": series.start_date,
            "end_date": series.end_date,
            "is_active": series.is_active,
            "created_at": series.created_at,
            "sermon_count": sermon_count,
        }

    def create_series(self, series_data: SermonSeriesCreate) -> SermonSeries:
        series = SermonSeries(**series_data.model_dump())
        self.db.add(series)
        self.db.commit()
        self.db.refresh(series)
        return series

    def update_series(
        self, series_id: UUID, series_data: SermonSeriesUpdate
    ) -> SermonSeries | None:
        series = self.get_series_by_id(series_id)
        if not series:
            return None

        update_dict = series_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(series, field, value)

        self.db.commit()
        self.db.refresh(series)
        return series

    def delete_series(self, series_id: UUID) -> bool:
        series = self.get_series_by_id(series_id)
        if not series:
            return False

        # Unlink sermons from this series
        stmt = select(Sermon).where(Sermon.series_id == series_id)
        sermons = self.db.execute(stmt).scalars().all()
        for sermon in sermons:
            sermon.series_id = None

        self.db.delete(series)
        self.db.commit()
        return True

    # ==================== SERMONS ====================

    def get_sermon_by_id(self, sermon_id: UUID) -> Sermon | None:
        stmt = select(Sermon).where(Sermon.id == sermon_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_sermons(
        self,
        page: int = 1,
        page_size: int = 20,
        search: str | None = None,
        series_id: UUID | None = None,
        speaker_id: UUID | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
        is_published: bool | None = None,
    ) -> tuple[list[dict], int]:
        stmt = select(Sermon)

        if search:
            search_term = f"%{search}%"
            stmt = stmt.where(
                or_(
                    Sermon.title.ilike(search_term),
                    Sermon.speaker_name.ilike(search_term),
                    Sermon.scripture_reference.ilike(search_term),
                    Sermon.description.ilike(search_term),
                )
            )

        if series_id:
            stmt = stmt.where(Sermon.series_id == series_id)

        if speaker_id:
            stmt = stmt.where(Sermon.speaker_id == speaker_id)

        if start_date:
            stmt = stmt.where(Sermon.sermon_date >= start_date)

        if end_date:
            stmt = stmt.where(Sermon.sermon_date <= end_date)

        if is_published is not None:
            stmt = stmt.where(Sermon.is_published == is_published)

        # Get total count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar() or 0

        # Order and paginate
        stmt = stmt.order_by(Sermon.sermon_date.desc())
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        sermons = list(self.db.execute(stmt).scalars().all())
        result = [self._sermon_to_dict(sermon) for sermon in sermons]

        return result, total

    def get_public_sermons(
        self,
        page: int = 1,
        page_size: int = 20,
        search: str | None = None,
        series_id: UUID | None = None,
        start_date: date | None = None,
        end_date: date | None = None,
    ) -> tuple[list[dict], int]:
        """Get published sermons for public display."""
        stmt = select(Sermon).where(Sermon.is_published == True)  # noqa: E712

        if search:
            search_term = f"%{search}%"
            stmt = stmt.where(
                or_(
                    Sermon.title.ilike(search_term),
                    Sermon.speaker_name.ilike(search_term),
                    Sermon.scripture_reference.ilike(search_term),
                )
            )

        if series_id:
            stmt = stmt.where(Sermon.series_id == series_id)

        if start_date:
            stmt = stmt.where(Sermon.sermon_date >= start_date)

        if end_date:
            stmt = stmt.where(Sermon.sermon_date <= end_date)

        # Get total count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar() or 0

        # Order and paginate
        stmt = stmt.order_by(Sermon.sermon_date.desc())
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        sermons = list(self.db.execute(stmt).scalars().all())
        result = [self._public_sermon_to_dict(sermon) for sermon in sermons]

        return result, total

    def _sermon_to_dict(self, sermon: Sermon) -> dict:
        # Get series title if exists
        series_title = None
        if sermon.series_id:
            series = self.get_series_by_id(sermon.series_id)
            if series:
                series_title = series.title

        # Get speaker info
        speaker = None
        if sermon.speaker_id:
            speaker_member = self.db.execute(
                select(Member).where(Member.id == sermon.speaker_id)
            ).scalar_one_or_none()
            if speaker_member:
                speaker = {
                    "id": speaker_member.id,
                    "first_name": speaker_member.first_name,
                    "last_name": speaker_member.last_name,
                }

        return {
            "id": sermon.id,
            "title": sermon.title,
            "description": sermon.description,
            "speaker_id": sermon.speaker_id,
            "speaker_name": sermon.speaker_name,
            "series_id": sermon.series_id,
            "sermon_date": sermon.sermon_date,
            "scripture_reference": sermon.scripture_reference,
            "duration_seconds": sermon.duration_seconds,
            "audio_url": sermon.audio_url,
            "video_url": sermon.video_url,
            "thumbnail_url": sermon.thumbnail_url,
            "notes_url": sermon.notes_url,
            "view_count": sermon.view_count,
            "is_published": sermon.is_published,
            "published_at": sermon.published_at,
            "scheduled_publish_at": sermon.scheduled_publish_at,
            "created_at": sermon.created_at,
            "updated_at": sermon.updated_at,
            "series_title": series_title,
            "speaker": speaker,
        }

    def _public_sermon_to_dict(self, sermon: Sermon) -> dict:
        series_title = None
        if sermon.series_id:
            series = self.get_series_by_id(sermon.series_id)
            if series:
                series_title = series.title

        return {
            "id": sermon.id,
            "title": sermon.title,
            "description": sermon.description,
            "speaker_name": sermon.speaker_name,
            "sermon_date": sermon.sermon_date,
            "scripture_reference": sermon.scripture_reference,
            "duration_seconds": sermon.duration_seconds,
            "audio_url": sermon.audio_url,
            "video_url": sermon.video_url,
            "thumbnail_url": sermon.thumbnail_url,
            "view_count": sermon.view_count,
            "series_id": sermon.series_id,
            "series_title": series_title,
        }

    def create_sermon(self, sermon_data: SermonCreate) -> Sermon:
        # Get speaker name from member if speaker_id provided
        speaker_name = sermon_data.speaker_name
        if sermon_data.speaker_id:
            member = self.db.execute(
                select(Member).where(Member.id == sermon_data.speaker_id)
            ).scalar_one_or_none()
            if member:
                speaker_name = f"{member.first_name} {member.last_name}"

        sermon = Sermon(
            **sermon_data.model_dump(exclude={"speaker_name"}),
            speaker_name=speaker_name,
        )
        self.db.add(sermon)
        self.db.commit()
        self.db.refresh(sermon)
        return sermon

    def update_sermon(
        self, sermon_id: UUID, sermon_data: SermonUpdate
    ) -> Sermon | None:
        sermon = self.get_sermon_by_id(sermon_id)
        if not sermon:
            return None

        update_dict = sermon_data.model_dump(exclude_unset=True)

        # Update speaker name if speaker_id changed
        if "speaker_id" in update_dict and update_dict["speaker_id"]:
            member = self.db.execute(
                select(Member).where(Member.id == update_dict["speaker_id"])
            ).scalar_one_or_none()
            if member:
                update_dict["speaker_name"] = f"{member.first_name} {member.last_name}"

        for field, value in update_dict.items():
            setattr(sermon, field, value)

        self.db.commit()
        self.db.refresh(sermon)
        return sermon

    def delete_sermon(self, sermon_id: UUID) -> bool:
        sermon = self.get_sermon_by_id(sermon_id)
        if not sermon:
            return False

        self.db.delete(sermon)
        self.db.commit()
        return True

    def publish_sermon(
        self, sermon_id: UUID, scheduled_at: datetime | None = None
    ) -> Sermon | None:
        sermon = self.get_sermon_by_id(sermon_id)
        if not sermon:
            return None

        if scheduled_at and scheduled_at > datetime.utcnow():
            # Schedule for future
            sermon.scheduled_publish_at = scheduled_at
        else:
            # Publish immediately
            sermon.is_published = True
            sermon.published_at = datetime.utcnow()
            sermon.scheduled_publish_at = None

        self.db.commit()
        self.db.refresh(sermon)
        return sermon

    def unpublish_sermon(self, sermon_id: UUID) -> Sermon | None:
        sermon = self.get_sermon_by_id(sermon_id)
        if not sermon:
            return None

        sermon.is_published = False
        sermon.scheduled_publish_at = None

        self.db.commit()
        self.db.refresh(sermon)
        return sermon

    def increment_view_count(self, sermon_id: UUID) -> Sermon | None:
        sermon = self.get_sermon_by_id(sermon_id)
        if not sermon:
            return None

        sermon.view_count += 1
        self.db.commit()
        self.db.refresh(sermon)
        return sermon

    def get_related_sermons(self, sermon_id: UUID, limit: int = 5) -> list[dict]:
        """Get related sermons (same series or same speaker)."""
        sermon = self.get_sermon_by_id(sermon_id)
        if not sermon:
            return []

        stmt = select(Sermon).where(
            Sermon.id != sermon_id,
            Sermon.is_published == True,  # noqa: E712
            or_(
                Sermon.series_id == sermon.series_id if sermon.series_id else False,
                Sermon.speaker_id == sermon.speaker_id if sermon.speaker_id else False,
            ),
        )
        stmt = stmt.order_by(Sermon.sermon_date.desc()).limit(limit)
        sermons = list(self.db.execute(stmt).scalars().all())

        return [self._public_sermon_to_dict(s) for s in sermons]

    # ==================== MEDIA UPLOAD ====================

    def get_media_upload_url(
        self,
        sermon_id: UUID,
        media_type: str,
        file_name: str,
        content_type: str,
    ) -> tuple[str, str] | None:
        sermon = self.get_sermon_by_id(sermon_id)
        if not sermon:
            return None

        if media_type not in MEDIA_CONFIG:
            return None

        config = MEDIA_CONFIG[media_type]
        if content_type not in config["content_types"]:
            return None

        # Determine file extension
        ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else ""
        if ext not in config["extensions"]:
            ext = config["extensions"][0]

        s3_client = boto3.client(
            "s3",
            region_name=settings.AWS_REGION,
            config=Config(signature_version="s3v4"),
        )

        key = f"{config['path']}/{sermon_id}/media.{ext}"
        upload_url = s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.S3_BUCKET_NAME,
                "Key": key,
                "ContentType": content_type,
            },
            ExpiresIn=3600,
        )

        return upload_url, key

    def complete_media_upload(
        self,
        sermon_id: UUID,
        media_type: str,
        file_key: str,
        duration_seconds: int | None = None,
    ) -> Sermon | None:
        sermon = self.get_sermon_by_id(sermon_id)
        if not sermon:
            return None

        media_url = f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{file_key}"

        if media_type == "audio":
            sermon.audio_url = media_url
            if duration_seconds:
                sermon.duration_seconds = duration_seconds
        elif media_type == "video":
            sermon.video_url = media_url
            if duration_seconds:
                sermon.duration_seconds = duration_seconds
        elif media_type == "thumbnail":
            sermon.thumbnail_url = media_url
        elif media_type == "notes":
            sermon.notes_url = media_url

        self.db.commit()
        self.db.refresh(sermon)
        return sermon

    def get_series_thumbnail_upload_url(
        self, series_id: UUID, file_name: str, content_type: str
    ) -> tuple[str, str] | None:
        series = self.get_series_by_id(series_id)
        if not series:
            return None

        if content_type not in ["image/jpeg", "image/png", "image/webp"]:
            return None

        ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else "jpg"

        s3_client = boto3.client(
            "s3",
            region_name=settings.AWS_REGION,
            config=Config(signature_version="s3v4"),
        )

        key = f"series/thumbnails/{series_id}/thumbnail.{ext}"
        upload_url = s3_client.generate_presigned_url(
            "put_object",
            Params={
                "Bucket": settings.S3_BUCKET_NAME,
                "Key": key,
                "ContentType": content_type,
            },
            ExpiresIn=3600,
        )

        # Update series thumbnail URL
        media_url = f"https://{settings.S3_BUCKET_NAME}.s3.{settings.AWS_REGION}.amazonaws.com/{key}"
        series.thumbnail_url = media_url
        self.db.commit()

        return upload_url, key


def get_sermon_service(db: Session) -> SermonService:
    return SermonService(db)
