import hashlib
from datetime import datetime, timedelta, timezone
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import (
    create_access_token,
    create_password_reset_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
    verify_password_reset_token,
)
from app.models import Member, RefreshToken, User
from app.schemas import UserCreate, UserUpdate


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    def get_user_by_email(self, email: str) -> User | None:
        stmt = select(User).where(User.email == email)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_user_by_id(self, user_id: str) -> User | None:
        stmt = select(User).where(User.id == user_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def create_user(self, user_data: UserCreate) -> User:
        # Check if this is the first user (will be admin)
        first_user = self.db.execute(select(User).limit(1)).scalar_one_or_none() is None
        role = "admin" if first_user else "member"

        user = User(
            email=user_data.email,
            password_hash=get_password_hash(user_data.password),
            role=role,
        )
        self.db.add(user)
        self.db.flush()

        # Create associated member profile
        member = Member(
            user_id=user.id,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            email=user_data.email,
        )
        self.db.add(member)
        self.db.commit()
        self.db.refresh(user)
        return user

    def authenticate_user(self, email: str, password: str) -> User | None:
        user = self.get_user_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user

    def create_tokens(self, user: User) -> tuple[str, str]:
        access_token = create_access_token(subject=str(user.id))
        refresh_token, token_hash = create_refresh_token(subject=str(user.id))

        # Store refresh token hash
        expires_at = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
        db_token = RefreshToken(
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expires_at,
        )
        self.db.add(db_token)

        # Update last login
        user.last_login_at = datetime.now(timezone.utc)
        self.db.commit()

        return access_token, refresh_token

    def refresh_tokens(self, refresh_token: str) -> tuple[str, str] | None:
        payload = decode_token(refresh_token)
        if not payload or payload.get("type") != "refresh":
            return None

        user_id = payload.get("sub")
        if not user_id:
            return None

        # Verify token exists in database
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        stmt = select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.expires_at > datetime.now(timezone.utc),
        )
        db_token = self.db.execute(stmt).scalar_one_or_none()
        if not db_token:
            return None

        # Delete old token (rotation)
        self.db.delete(db_token)

        user = self.get_user_by_id(user_id)
        if not user or not user.is_active:
            return None

        return self.create_tokens(user)

    def logout(self, refresh_token: str) -> bool:
        token_hash = hashlib.sha256(refresh_token.encode()).hexdigest()
        stmt = select(RefreshToken).where(RefreshToken.token_hash == token_hash)
        db_token = self.db.execute(stmt).scalar_one_or_none()
        if db_token:
            self.db.delete(db_token)
            self.db.commit()
            return True
        return False

    def create_password_reset_token(self, email: str) -> str | None:
        user = self.get_user_by_email(email)
        if not user:
            return None
        return create_password_reset_token(email)

    def reset_password(self, token: str, new_password: str) -> bool:
        email = verify_password_reset_token(token)
        if not email:
            return False

        user = self.get_user_by_email(email)
        if not user:
            return False

        user.password_hash = get_password_hash(new_password)
        self.db.commit()
        return True

    # Admin user management methods
    def get_users(
        self,
        page: int = 1,
        page_size: int = 20,
        role: str | None = None,
        is_active: bool | None = None,
        search: str | None = None,
    ) -> tuple[list[User], int]:
        """Get paginated list of users with optional filters."""
        stmt = select(User)

        if role:
            stmt = stmt.where(User.role == role)

        if is_active is not None:
            stmt = stmt.where(User.is_active == is_active)

        if search:
            search_pattern = f"%{search}%"
            stmt = stmt.where(User.email.ilike(search_pattern))

        # Get total count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar() or 0

        # Order and paginate
        stmt = stmt.order_by(User.created_at.desc())
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        users = list(self.db.execute(stmt).scalars().all())
        return users, total

    def update_user(self, user_id: UUID, user_data: UserUpdate) -> User | None:
        """Update user details (role, active status, etc.)."""
        stmt = select(User).where(User.id == user_id)
        user = self.db.execute(stmt).scalar_one_or_none()

        if not user:
            return None

        update_dict = user_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(user, field, value)

        self.db.commit()
        self.db.refresh(user)
        return user

    def delete_user(self, user_id: UUID) -> bool:
        """Delete a user and their associated data."""
        stmt = select(User).where(User.id == user_id)
        user = self.db.execute(stmt).scalar_one_or_none()

        if not user:
            return False

        # Delete associated member profile if exists
        if user.member:
            self.db.delete(user.member)

        self.db.delete(user)
        self.db.commit()
        return True

    def get_user_count_by_role(self) -> dict[str, int]:
        """Get count of users by role for dashboard stats."""
        stmt = select(User.role, func.count(User.id)).group_by(User.role)
        results = self.db.execute(stmt).all()
        return dict(results)


def get_auth_service(db: Session) -> AuthService:
    return AuthService(db)
