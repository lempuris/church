"""
Tests for event endpoints.
"""

from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient


class TestEventEndpoints:
    """Test cases for event CRUD operations."""

    def _get_future_datetime(self, days: int = 7) -> str:
        """Helper to get a future datetime string."""
        dt = datetime.utcnow() + timedelta(days=days)
        return dt.isoformat()

    def test_create_event(self, client: TestClient, auth_headers: dict):
        """Test creating a new event."""
        event_data = {
            "title": "Sunday Service",
            "description": "Weekly Sunday worship service",
            "event_type": "service",
            "start_datetime": self._get_future_datetime(7),
            "end_datetime": self._get_future_datetime(7),
            "location": "Main Sanctuary",
            "is_public": True,
        }
        response = client.post("/api/v1/events", json=event_data, headers=auth_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Sunday Service"
        assert data["event_type"] == "service"
        assert data["is_public"] is True

    def test_create_recurring_event(self, client: TestClient, auth_headers: dict):
        """Test creating a recurring event."""
        event_data = {
            "title": "Weekly Prayer Meeting",
            "event_type": "service",
            "start_datetime": self._get_future_datetime(1),
            "is_recurring": True,
            "recurrence_rule": "weekly",
        }
        response = client.post("/api/v1/events", json=event_data, headers=auth_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["is_recurring"] is True
        assert data["recurrence_rule"] == "weekly"

    def test_create_event_with_self_checkin(
        self, client: TestClient, auth_headers: dict
    ):
        """Test creating an event with self check-in enabled."""
        event_data = {
            "title": "Youth Night",
            "event_type": "special",
            "start_datetime": self._get_future_datetime(3),
            "allow_self_checkin": True,
        }
        response = client.post("/api/v1/events", json=event_data, headers=auth_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["allow_self_checkin"] is True
        assert data["qr_code_token"] is not None

    def test_list_events(self, client: TestClient, auth_headers: dict):
        """Test listing all events."""
        # Create an event first
        event_data = {
            "title": "Test Event",
            "event_type": "other",
            "start_datetime": self._get_future_datetime(5),
        }
        client.post("/api/v1/events", json=event_data, headers=auth_headers)

        response = client.get("/api/v1/events", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data

    def test_list_events_by_type(self, client: TestClient, auth_headers: dict):
        """Test filtering events by type."""
        # Create events of different types
        client.post(
            "/api/v1/events",
            json={
                "title": "Service Event",
                "event_type": "service",
                "start_datetime": self._get_future_datetime(2),
            },
            headers=auth_headers,
        )
        client.post(
            "/api/v1/events",
            json={
                "title": "Conference Event",
                "event_type": "conference",
                "start_datetime": self._get_future_datetime(3),
            },
            headers=auth_headers,
        )

        response = client.get(
            "/api/v1/events", params={"event_type": "service"}, headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        for event in data["items"]:
            assert event["event_type"] == "service"

    def test_get_event(self, client: TestClient, auth_headers: dict):
        """Test getting a single event by ID."""
        event_data = {
            "title": "Detail Event",
            "event_type": "special",
            "start_datetime": self._get_future_datetime(4),
        }
        create_response = client.post(
            "/api/v1/events", json=event_data, headers=auth_headers
        )
        event_id = create_response.json()["id"]

        response = client.get(f"/api/v1/events/{event_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Detail Event"

    def test_get_event_not_found(self, client: TestClient, auth_headers: dict):
        """Test getting a non-existent event."""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = client.get(f"/api/v1/events/{fake_id}", headers=auth_headers)
        assert response.status_code == 404

    def test_update_event(self, client: TestClient, auth_headers: dict):
        """Test updating an event."""
        event_data = {
            "title": "Original Event",
            "event_type": "other",
            "start_datetime": self._get_future_datetime(6),
        }
        create_response = client.post(
            "/api/v1/events", json=event_data, headers=auth_headers
        )
        event_id = create_response.json()["id"]

        update_data = {"title": "Updated Event", "location": "New Location"}
        response = client.put(
            f"/api/v1/events/{event_id}", json=update_data, headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == "Updated Event"
        assert data["location"] == "New Location"

    def test_cancel_event(self, client: TestClient, auth_headers: dict):
        """Test cancelling an event."""
        event_data = {
            "title": "To Cancel",
            "event_type": "other",
            "start_datetime": self._get_future_datetime(8),
        }
        create_response = client.post(
            "/api/v1/events", json=event_data, headers=auth_headers
        )
        event_id = create_response.json()["id"]

        response = client.post(
            f"/api/v1/events/{event_id}/cancel", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["is_cancelled"] is True

    def test_delete_event(self, client: TestClient, auth_headers: dict):
        """Test deleting an event."""
        event_data = {
            "title": "To Delete",
            "event_type": "other",
            "start_datetime": self._get_future_datetime(9),
        }
        create_response = client.post(
            "/api/v1/events", json=event_data, headers=auth_headers
        )
        event_id = create_response.json()["id"]

        response = client.delete(f"/api/v1/events/{event_id}", headers=auth_headers)
        assert response.status_code == 204

        # Verify event is deleted
        get_response = client.get(f"/api/v1/events/{event_id}", headers=auth_headers)
        assert get_response.status_code == 404

    def test_get_upcoming_events(self, client: TestClient, auth_headers: dict):
        """Test getting upcoming events (public endpoint)."""
        # Create a future event
        event_data = {
            "title": "Upcoming Event",
            "event_type": "service",
            "start_datetime": self._get_future_datetime(10),
            "is_public": True,
        }
        client.post("/api/v1/events", json=event_data, headers=auth_headers)

        # This endpoint doesn't require auth
        response = client.get("/api/v1/events/upcoming")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_calendar_events(self, client: TestClient, auth_headers: dict):
        """Test getting events for calendar view."""
        start = datetime.utcnow()
        end = start + timedelta(days=30)

        response = client.get(
            "/api/v1/events/calendar",
            params={
                "start_date": start.isoformat(),
                "end_date": end.isoformat(),
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_event_qr_code(self, client: TestClient, auth_headers: dict):
        """Test getting QR code for an event."""
        event_data = {
            "title": "QR Event",
            "event_type": "service",
            "start_datetime": self._get_future_datetime(5),
            "allow_self_checkin": True,
        }
        create_response = client.post(
            "/api/v1/events", json=event_data, headers=auth_headers
        )
        event_id = create_response.json()["id"]

        response = client.get(
            f"/api/v1/events/{event_id}/qr-code", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert "qr_code_token" in data
        assert data["event_id"] == event_id

    def test_create_event_unauthenticated(self, client: TestClient):
        """Test that creating an event requires authentication."""
        event_data = {
            "title": "Unauthorized Event",
            "event_type": "other",
            "start_datetime": (datetime.utcnow() + timedelta(days=5)).isoformat(),
        }
        response = client.post("/api/v1/events", json=event_data)
        assert response.status_code == 403
