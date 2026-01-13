"""
Tests for prayer request endpoints.
"""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Member


class TestPrayerRequestEndpoints:
    """Test cases for prayer request operations."""

    def test_submit_prayer_request_as_guest(self, client: TestClient):
        """Test submitting a prayer request as a guest."""
        request_data = {
            "title": "Prayer for healing",
            "description": "Please pray for my grandmother's healing from illness.",
            "author_name": "John Guest",
            "author_email": "john@guest.com",
            "is_public": True,
        }
        response = client.post("/api/v1/prayer-requests", json=request_data)
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Prayer for healing"
        assert data["status"] == "pending"

    def test_submit_prayer_request_guest_requires_name(self, client: TestClient):
        """Test that guest submissions require author_name."""
        request_data = {
            "title": "Anonymous prayer",
            "description": "Please pray for my situation.",
        }
        response = client.post("/api/v1/prayer-requests", json=request_data)
        assert response.status_code == 400
        assert "author_name" in response.json()["detail"]

    def test_submit_anonymous_prayer_request(self, client: TestClient):
        """Test submitting an anonymous prayer request."""
        request_data = {
            "title": "Anonymous prayer",
            "description": "Please pray for my personal struggles.",
            "author_name": "Someone",
            "is_anonymous": True,
            "is_public": True,
        }
        response = client.post("/api/v1/prayer-requests", json=request_data)
        assert response.status_code == 201
        data = response.json()
        assert data["is_anonymous"] is True

    def test_list_prayer_requests_admin(self, client: TestClient, auth_headers: dict):
        """Test listing all prayer requests as admin."""
        # Create a request first
        request_data = {
            "title": "Admin view prayer",
            "description": "This is for testing admin view.",
            "author_name": "Test User",
        }
        client.post("/api/v1/prayer-requests", json=request_data)

        response = client.get("/api/v1/prayer-requests", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data

    def test_get_pending_requests(self, client: TestClient, auth_headers: dict):
        """Test getting pending requests for moderation."""
        # Create a pending request
        request_data = {
            "title": "Pending prayer",
            "description": "This needs moderation.",
            "author_name": "Pending User",
        }
        client.post("/api/v1/prayer-requests", json=request_data)

        response = client.get("/api/v1/prayer-requests/pending", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(r["status"] == "pending" for r in data["items"])

    def test_approve_prayer_request(self, client: TestClient, auth_headers: dict):
        """Test approving a prayer request."""
        # Create a request
        request_data = {
            "title": "To approve",
            "description": "This will be approved.",
            "author_name": "Approver",
        }
        create_response = client.post("/api/v1/prayer-requests", json=request_data)
        request_id = create_response.json()["id"]

        # Approve it
        response = client.put(
            f"/api/v1/prayer-requests/{request_id}/moderate",
            json={"action": "approve"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["status"] == "approved"

    def test_reject_prayer_request(self, client: TestClient, auth_headers: dict):
        """Test rejecting a prayer request."""
        # Create a request
        request_data = {
            "title": "To reject",
            "description": "This will be rejected.",
            "author_name": "Rejector",
        }
        create_response = client.post("/api/v1/prayer-requests", json=request_data)
        request_id = create_response.json()["id"]

        # Reject it
        response = client.put(
            f"/api/v1/prayer-requests/{request_id}/moderate",
            json={"action": "reject", "rejection_reason": "Inappropriate content"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["status"] == "rejected"

    def test_prayer_wall(self, client: TestClient, auth_headers: dict):
        """Test getting the public prayer wall."""
        # Create and approve a request
        request_data = {
            "title": "Wall prayer",
            "description": "This should appear on the wall.",
            "author_name": "Wall User",
            "is_public": True,
        }
        create_response = client.post("/api/v1/prayer-requests", json=request_data)
        request_id = create_response.json()["id"]

        # Approve it
        client.put(
            f"/api/v1/prayer-requests/{request_id}/moderate",
            json={"action": "approve"},
            headers=auth_headers,
        )

        # Get the wall (public endpoint)
        response = client.get("/api/v1/prayer-requests/wall")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data

    def test_delete_prayer_request(self, client: TestClient, auth_headers: dict):
        """Test deleting a prayer request as admin."""
        # Create a request
        request_data = {
            "title": "To delete",
            "description": "This will be deleted.",
            "author_name": "Deleter",
        }
        create_response = client.post("/api/v1/prayer-requests", json=request_data)
        request_id = create_response.json()["id"]

        response = client.delete(
            f"/api/v1/prayer-requests/{request_id}", headers=auth_headers
        )
        assert response.status_code == 204


class TestPrayerInteractions:
    """Test cases for prayer interactions."""

    def test_pray_for_request(
        self, client: TestClient, auth_headers: dict, db_session: Session, test_user
    ):
        """Test recording a prayer for a request."""
        # Create member linked to test_user
        member = Member(
            first_name="Prayer",
            last_name="Member",
            email="prayer.member@test.com",
            user_id=test_user.id,
        )
        db_session.add(member)
        db_session.commit()

        # Create and approve a request
        request_data = {
            "title": "Pray for me",
            "description": "Please pray for my situation.",
            "author_name": "Needy Person",
            "is_public": True,
        }
        create_response = client.post("/api/v1/prayer-requests", json=request_data)
        request_id = create_response.json()["id"]

        # Approve it
        client.put(
            f"/api/v1/prayer-requests/{request_id}/moderate",
            json={"action": "approve"},
            headers=auth_headers,
        )

        # Pray for it
        response = client.post(
            f"/api/v1/prayer-requests/{request_id}/pray", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["prayer_count"] >= 1

    def test_mark_request_answered(
        self, client: TestClient, auth_headers: dict, db_session: Session, test_user
    ):
        """Test marking a prayer request as answered."""
        # Create member linked to test_user
        member = Member(
            first_name="Answer",
            last_name="Member",
            email="answer.member@test.com",
            user_id=test_user.id,
        )
        db_session.add(member)
        db_session.commit()

        # Create a request
        request_data = {
            "title": "Answered prayer",
            "description": "God answered this prayer.",
            "author_name": "Blessed Person",
        }
        create_response = client.post("/api/v1/prayer-requests", json=request_data)
        request_id = create_response.json()["id"]

        # Approve it first
        client.put(
            f"/api/v1/prayer-requests/{request_id}/moderate",
            json={"action": "approve"},
            headers=auth_headers,
        )

        # Mark as answered (admin can do this)
        response = client.put(
            f"/api/v1/prayer-requests/{request_id}/answered",
            json={"answer_testimony": "God provided healing!"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["success"] is True
