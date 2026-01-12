from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.v1.deps import get_current_user
from app.models import User
from app.schemas import (
    UserCreate,
    UserLogin,
    UserResponse,
    Token,
    TokenRefresh,
    PasswordResetRequest,
    PasswordReset,
)
from app.services import get_auth_service


router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register(
    user_data: UserCreate,
    db: Annotated[Session, Depends(get_db)],
):
    """Register a new user account."""
    auth_service = get_auth_service(db)

    # Check if email already exists
    existing_user = auth_service.get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    user = auth_service.create_user(user_data)
    # TODO: Send welcome email via SES
    return user


@router.post("/login", response_model=Token)
def login(
    credentials: UserLogin,
    db: Annotated[Session, Depends(get_db)],
    response: Response,
):
    """Login and receive access and refresh tokens."""
    auth_service = get_auth_service(db)

    user = auth_service.authenticate_user(credentials.email, credentials.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    access_token, refresh_token = auth_service.create_tokens(user)

    # Set refresh token in httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,  # 7 days
    )

    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/refresh", response_model=Token)
def refresh_token(
    token_data: TokenRefresh,
    db: Annotated[Session, Depends(get_db)],
    response: Response,
):
    """Refresh access token using refresh token."""
    auth_service = get_auth_service(db)

    tokens = auth_service.refresh_tokens(token_data.refresh_token)
    if not tokens:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token, refresh_token = tokens

    # Update refresh token cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
    )

    return Token(access_token=access_token, refresh_token=refresh_token)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    token_data: TokenRefresh,
    db: Annotated[Session, Depends(get_db)],
    response: Response,
):
    """Logout and invalidate refresh token."""
    auth_service = get_auth_service(db)
    auth_service.logout(token_data.refresh_token)

    # Clear cookie
    response.delete_cookie(key="refresh_token")
    return None


@router.post("/forgot-password", status_code=status.HTTP_200_OK)
def forgot_password(
    request_data: PasswordResetRequest,
    db: Annotated[Session, Depends(get_db)],
):
    """Request a password reset email."""
    auth_service = get_auth_service(db)
    token = auth_service.create_password_reset_token(request_data.email)

    # Always return success to prevent email enumeration
    # TODO: Send password reset email via SES
    if token:
        # In production, send email with reset link
        pass

    return {"message": "If the email exists, a password reset link has been sent"}


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(
    reset_data: PasswordReset,
    db: Annotated[Session, Depends(get_db)],
):
    """Reset password using the token from email."""
    auth_service = get_auth_service(db)

    success = auth_service.reset_password(reset_data.token, reset_data.new_password)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token",
        )

    return {"message": "Password has been reset successfully"}


@router.get("/me", response_model=UserResponse)
def get_current_user_profile(
    current_user: Annotated[User, Depends(get_current_user)],
):
    """Get the current authenticated user's profile."""
    return current_user
