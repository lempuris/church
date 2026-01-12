"""
Pytest configuration and fixtures for tests.
"""

import os

# Set test database URL before importing anything else
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

import uuid
from collections.abc import Generator
from datetime import datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.core.security import create_access_token, get_password_hash
from app.main import app
from app.models import Member, User

# Use SQLite in-memory for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="function")
def db_engine():
    """Create a test database engine."""
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )

    # Enable foreign key support in SQLite
    @event.listens_for(engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    # Create all tables
    Base.metadata.create_all(bind=engine)

    yield engine

    # Cleanup
    Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def db_session(db_engine) -> Generator[Session, None, None]:
    """Create a test database session."""
    TestingSessionLocal = sessionmaker(
        autocommit=False, autoflush=False, bind=db_engine
    )
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="function")
def client(db_session: Session) -> Generator[TestClient, None, None]:
    """Create a test client with database session override."""

    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app) as test_client:
        yield test_client

    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def test_user(db_session: Session) -> User:
    """Create a test admin user."""
    user = User(
        id=uuid.uuid4(),
        email="admin@test.com",
        password_hash=get_password_hash("testpassword123"),
        role="admin",
        is_active=True,
        is_verified=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def auth_headers(test_user: User) -> dict:
    """Create authentication headers for the test user."""
    access_token = create_access_token(subject=str(test_user.id))
    return {"Authorization": f"Bearer {access_token}"}


@pytest.fixture(scope="function")
def test_member_data() -> dict:
    """Provide sample member data for tests."""
    # Use unique suffix to avoid conflicts between tests
    unique_id = uuid.uuid4().hex[:8]
    return {
        "first_name": "John",
        "last_name": "Doe",
        "email": f"john.doe.{unique_id}@example.com",
        "phone": "+254712345678",
        "gender": "male",
        "member_status": "active",
    }


@pytest.fixture(scope="function")
def test_user_data() -> dict:
    """Provide sample user data for tests."""
    # Use unique suffix to avoid conflicts between tests
    unique_id = uuid.uuid4().hex[:8]
    return {
        "email": f"test.user.{unique_id}@example.com",
        "password": "TestPassword123!",
        "confirm_password": "TestPassword123!",
        "first_name": "Test",
        "last_name": "User",
    }


@pytest.fixture(scope="function")
def test_member(db_session: Session) -> Member:
    """Create a test member in the database."""
    member = Member(
        id=uuid.uuid4(),
        first_name="Jane",
        last_name="Smith",
        email="jane.smith@example.com",
        phone="+254798765432",
        gender="female",
        member_status="active",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db_session.add(member)
    db_session.commit()
    db_session.refresh(member)
    return member
