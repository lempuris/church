"""
Test fixtures and configuration for pytest.
"""

import os

# Set test database URL BEFORE importing app modules
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app

# Use SQLite in-memory database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """Create a test client with overridden database dependency."""

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user_data():
    """Sample user data for registration."""
    return {
        "email": "test@example.com",
        "password": "TestPassword123!",
        "confirm_password": "TestPassword123!",
        "first_name": "Test",
        "last_name": "User",
    }


@pytest.fixture
def test_member_data():
    """Sample member data for creation."""
    return {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "phone": "+1234567890",
        "member_status": "active",
    }


@pytest.fixture
def registered_user(client, test_user_data):
    """Create and return a registered user with tokens."""
    # Register user
    reg_response = client.post("/api/v1/auth/register", json=test_user_data)
    assert reg_response.status_code == 201
    user_data = reg_response.json()

    # Login to get tokens
    login_response = client.post(
        "/api/v1/auth/login",
        json={"email": test_user_data["email"], "password": test_user_data["password"]},
    )
    assert login_response.status_code == 200
    tokens = login_response.json()

    return {**user_data, **tokens}


@pytest.fixture
def auth_headers(registered_user):
    """Return authorization headers for authenticated requests."""
    return {"Authorization": f"Bearer {registered_user['access_token']}"}
