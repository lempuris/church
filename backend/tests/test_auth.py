"""
Unit tests for authentication service and endpoints.
"""


from app.core.security import (
    create_access_token,
    create_password_reset_token,
    decode_token,
    get_password_hash,
    verify_password,
    verify_password_reset_token,
)
from app.services.auth import AuthService


class TestPasswordHashing:
    """Tests for password hashing utilities."""

    def test_password_hash_is_different_from_plain(self):
        """Password hash should not equal plain password."""
        plain = "mypassword123"
        hashed = get_password_hash(plain)
        assert hashed != plain

    def test_verify_password_correct(self):
        """Should verify correct password."""
        plain = "mypassword123"
        hashed = get_password_hash(plain)
        assert verify_password(plain, hashed) is True

    def test_verify_password_incorrect(self):
        """Should reject incorrect password."""
        hashed = get_password_hash("correctpassword")
        assert verify_password("wrongpassword", hashed) is False

    def test_same_password_different_hashes(self):
        """Same password should produce different hashes (salted)."""
        plain = "mypassword123"
        hash1 = get_password_hash(plain)
        hash2 = get_password_hash(plain)
        assert hash1 != hash2


class TestJWTTokens:
    """Tests for JWT token creation and validation."""

    def test_create_access_token(self):
        """Should create valid access token."""
        token = create_access_token(subject="user123")
        assert token is not None
        assert isinstance(token, str)

    def test_decode_valid_token(self):
        """Should decode valid access token."""
        token = create_access_token(subject="user123")
        payload = decode_token(token)
        assert payload is not None
        assert payload["sub"] == "user123"
        assert payload["type"] == "access"

    def test_decode_invalid_token(self):
        """Should return None for invalid token."""
        payload = decode_token("invalid.token.here")
        assert payload is None

    def test_decode_tampered_token(self):
        """Should reject tampered token."""
        token = create_access_token(subject="user123")
        tampered = token[:-5] + "xxxxx"
        payload = decode_token(tampered)
        assert payload is None


class TestPasswordResetTokens:
    """Tests for password reset token functionality."""

    def test_create_password_reset_token(self):
        """Should create password reset token."""
        token = create_password_reset_token("user@example.com")
        assert token is not None

    def test_verify_valid_reset_token(self):
        """Should verify valid reset token."""
        email = "user@example.com"
        token = create_password_reset_token(email)
        result = verify_password_reset_token(token)
        assert result == email

    def test_verify_invalid_reset_token(self):
        """Should reject invalid reset token."""
        result = verify_password_reset_token("invalid.token")
        assert result is None

    def test_access_token_not_valid_as_reset_token(self):
        """Access token should not work as reset token."""
        access_token = create_access_token(subject="user@example.com")
        result = verify_password_reset_token(access_token)
        assert result is None


class TestAuthServiceUserCreation:
    """Tests for AuthService user management."""

    def test_create_first_user_is_admin(self, db_session, test_user_data):
        """First registered user should be admin."""
        from app.schemas import UserCreate

        service = AuthService(db_session)
        user_create = UserCreate(**test_user_data)
        user = service.create_user(user_create)

        assert user is not None
        assert user.email == test_user_data["email"]
        assert user.role == "admin"

    def test_create_second_user_is_member(self, db_session, test_user_data):
        """Second registered user should be member."""
        from app.schemas import UserCreate

        service = AuthService(db_session)

        # Create first user (admin)
        user1_data = UserCreate(**test_user_data)
        service.create_user(user1_data)

        # Create second user (member)
        user2_data = UserCreate(
            email="second@example.com",
            password="Password123!",
            confirm_password="Password123!",
            first_name="Second",
            last_name="User",
        )
        user2 = service.create_user(user2_data)

        assert user2.role == "member"

    def test_get_user_by_email(self, db_session, test_user_data):
        """Should retrieve user by email."""
        from app.schemas import UserCreate

        service = AuthService(db_session)
        user_create = UserCreate(**test_user_data)
        created = service.create_user(user_create)

        found = service.get_user_by_email(test_user_data["email"])
        assert found is not None
        assert found.id == created.id

    def test_get_nonexistent_user(self, db_session):
        """Should return None for nonexistent user."""
        service = AuthService(db_session)
        found = service.get_user_by_email("notfound@example.com")
        assert found is None


class TestAuthServiceAuthentication:
    """Tests for AuthService authentication."""

    def test_authenticate_valid_credentials(self, db_session, test_user_data):
        """Should authenticate user with valid credentials."""
        from app.schemas import UserCreate

        service = AuthService(db_session)
        user_create = UserCreate(**test_user_data)
        service.create_user(user_create)

        user = service.authenticate_user(
            test_user_data["email"], test_user_data["password"]
        )
        assert user is not None
        assert user.email == test_user_data["email"]

    def test_authenticate_invalid_email(self, db_session, test_user_data):
        """Should reject invalid email."""
        from app.schemas import UserCreate

        service = AuthService(db_session)
        user_create = UserCreate(**test_user_data)
        service.create_user(user_create)

        user = service.authenticate_user(
            "wrong@example.com", test_user_data["password"]
        )
        assert user is None

    def test_authenticate_invalid_password(self, db_session, test_user_data):
        """Should reject invalid password."""
        from app.schemas import UserCreate

        service = AuthService(db_session)
        user_create = UserCreate(**test_user_data)
        service.create_user(user_create)

        user = service.authenticate_user(test_user_data["email"], "wrongpassword")
        assert user is None


class TestAuthEndpoints:
    """Tests for authentication API endpoints."""

    def test_register_success(self, client, test_user_data):
        """Should register new user successfully."""
        response = client.post("/api/v1/auth/register", json=test_user_data)
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == test_user_data["email"]
        assert "id" in data
        assert data["role"] in ["admin", "member"]

    def test_register_duplicate_email(self, client, test_user_data):
        """Should reject duplicate email registration."""
        client.post("/api/v1/auth/register", json=test_user_data)
        response = client.post("/api/v1/auth/register", json=test_user_data)
        assert response.status_code == 400

    def test_login_success(self, client, test_user_data):
        """Should login with valid credentials."""
        # Register first
        client.post("/api/v1/auth/register", json=test_user_data)

        # Login - using JSON body, not form data
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user_data["email"],
                "password": test_user_data["password"],
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data

    def test_login_invalid_credentials(self, client, test_user_data):
        """Should reject invalid login credentials."""
        client.post("/api/v1/auth/register", json=test_user_data)

        response = client.post(
            "/api/v1/auth/login",
            json={"email": test_user_data["email"], "password": "wrongpassword"},
        )
        assert response.status_code == 401

    def test_get_current_user(self, client, test_user_data):
        """Should get current user profile."""
        # Register user
        client.post("/api/v1/auth/register", json=test_user_data)
        # Login to get token
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user_data["email"],
                "password": test_user_data["password"],
            },
        )
        access_token = login_response.json()["access_token"]

        response = client.get(
            "/api/v1/auth/me", headers={"Authorization": f"Bearer {access_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user_data["email"]

    def test_get_current_user_unauthorized(self, client):
        """Should reject request without token."""
        response = client.get("/api/v1/auth/me")
        assert response.status_code in [401, 403]  # Either unauthorized or forbidden

    def test_refresh_token(self, client, test_user_data):
        """Should refresh tokens with valid refresh token."""
        # Register and login
        client.post("/api/v1/auth/register", json=test_user_data)
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user_data["email"],
                "password": test_user_data["password"],
            },
        )
        refresh_token = login_response.json()["refresh_token"]

        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "refresh_token" in data

    def test_refresh_token_invalid(self, client):
        """Should reject invalid refresh token."""
        response = client.post(
            "/api/v1/auth/refresh", json={"refresh_token": "invalid.token"}
        )
        assert response.status_code == 401

    def test_logout(self, client, test_user_data):
        """Should logout and invalidate refresh token."""
        # Register and login
        client.post("/api/v1/auth/register", json=test_user_data)
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": test_user_data["email"],
                "password": test_user_data["password"],
            },
        )
        refresh_token = login_response.json()["refresh_token"]

        response = client.post(
            "/api/v1/auth/logout",
            json={"refresh_token": refresh_token},
        )
        assert response.status_code == 204

        # Token should no longer work
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        assert response.status_code == 401
