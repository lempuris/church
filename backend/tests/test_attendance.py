"""
Tests for attendance endpoints.
"""

from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient


class TestAttendanceEndpoints:
    """Test cases for attendance operations."""

    def _get_datetime_str(self, hours_offset: int = 0) -> str:
        """Helper to get a datetime string with offset."""
        dt = datetime.utcnow() + timedelta(hours=hours_offset)
        return dt.isoformat()

    def _create_event(
        self, client: TestClient, auth_headers: dict, hours_offset: int = 0
    ) -> str:
        """Helper to create an event and return its ID."""
        event_data = {
            "title": "Test Event",
            "event_type": "service",
            "start_datetime": self._get_datetime_str(hours_offset),
            "end_datetime": self._get_datetime_str(hours_offset + 2),
            "allow_self_checkin": True,
        }
        response = client.post("/api/v1/events", json=event_data, headers=auth_headers)
        return response.json()["id"]

    def _create_member(
        self, client: TestClient, auth_headers: dict, suffix: str = ""
    ) -> str:
        """Helper to create a member and return their ID."""
        member_data = {
            "first_name": f"Test{suffix}",
            "last_name": f"Member{suffix}",
            "email": f"test{suffix}@example.com",
            "member_status": "active",
        }
        response = client.post(
            "/api/v1/members", json=member_data, headers=auth_headers
        )
        return response.json()["id"]

    def test_check_in_member(
        self, client: TestClient, auth_headers: dict, test_member_data: dict
    ):
        """Test manual check-in of a member."""
        event_id = self._create_event(client, auth_headers, hours_offset=24)
        member_response = client.post(
            "/api/v1/members", json=test_member_data, headers=auth_headers
        )
        member_id = member_response.json()["id"]

        response = client.post(
            f"/api/v1/events/{event_id}/attendance",
            json={"member_id": member_id},
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["member_id"] == member_id
        assert data["check_in_method"] == "manual"

    def test_check_in_member_with_notes(
        self, client: TestClient, auth_headers: dict, test_member_data: dict
    ):
        """Test check-in with notes."""
        event_id = self._create_event(client, auth_headers, hours_offset=48)
        member_response = client.post(
            "/api/v1/members", json=test_member_data, headers=auth_headers
        )
        member_id = member_response.json()["id"]

        response = client.post(
            f"/api/v1/events/{event_id}/attendance",
            json={"member_id": member_id, "notes": "First time visitor"},
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["notes"] == "First time visitor"

    def test_duplicate_check_in(
        self, client: TestClient, auth_headers: dict, test_member_data: dict
    ):
        """Test that duplicate check-in returns existing record."""
        event_id = self._create_event(client, auth_headers, hours_offset=72)
        member_response = client.post(
            "/api/v1/members", json=test_member_data, headers=auth_headers
        )
        member_id = member_response.json()["id"]

        # First check-in
        response1 = client.post(
            f"/api/v1/events/{event_id}/attendance",
            json={"member_id": member_id},
            headers=auth_headers,
        )
        assert response1.status_code == 201

        # Second check-in (should return existing)
        response2 = client.post(
            f"/api/v1/events/{event_id}/attendance",
            json={"member_id": member_id},
            headers=auth_headers,
        )
        assert response2.status_code == 201
        assert response1.json()["id"] == response2.json()["id"]

    def test_bulk_check_in(self, client: TestClient, auth_headers: dict):
        """Test bulk check-in of multiple members."""
        event_id = self._create_event(client, auth_headers, hours_offset=96)
        member1_id = self._create_member(client, auth_headers, suffix="1")
        member2_id = self._create_member(client, auth_headers, suffix="2")
        member3_id = self._create_member(client, auth_headers, suffix="3")

        response = client.post(
            f"/api/v1/events/{event_id}/attendance/bulk",
            json={"member_ids": [member1_id, member2_id, member3_id]},
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert len(data) == 3

    def test_get_event_attendance(
        self, client: TestClient, auth_headers: dict, test_member_data: dict
    ):
        """Test getting attendance list for an event."""
        event_id = self._create_event(client, auth_headers, hours_offset=120)
        member_response = client.post(
            "/api/v1/members", json=test_member_data, headers=auth_headers
        )
        member_id = member_response.json()["id"]

        # Check in the member
        client.post(
            f"/api/v1/events/{event_id}/attendance",
            json={"member_id": member_id},
            headers=auth_headers,
        )

        response = client.get(
            f"/api/v1/events/{event_id}/attendance", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["event_id"] == event_id

    def test_remove_attendance(
        self, client: TestClient, auth_headers: dict, test_member_data: dict
    ):
        """Test removing an attendance record."""
        event_id = self._create_event(client, auth_headers, hours_offset=144)
        member_response = client.post(
            "/api/v1/members", json=test_member_data, headers=auth_headers
        )
        member_id = member_response.json()["id"]

        # Check in the member
        client.post(
            f"/api/v1/events/{event_id}/attendance",
            json={"member_id": member_id},
            headers=auth_headers,
        )

        # Remove attendance
        response = client.delete(
            f"/api/v1/events/{event_id}/attendance/{member_id}", headers=auth_headers
        )
        assert response.status_code == 204

        # Verify removal
        attendance_response = client.get(
            f"/api/v1/events/{event_id}/attendance", headers=auth_headers
        )
        assert attendance_response.json()["total"] == 0

    def test_export_attendance_csv(
        self, client: TestClient, auth_headers: dict, test_member_data: dict
    ):
        """Test exporting attendance as CSV."""
        event_id = self._create_event(client, auth_headers, hours_offset=168)
        member_response = client.post(
            "/api/v1/members", json=test_member_data, headers=auth_headers
        )
        member_id = member_response.json()["id"]

        # Check in the member
        client.post(
            f"/api/v1/events/{event_id}/attendance",
            json={"member_id": member_id},
            headers=auth_headers,
        )

        response = client.get(
            f"/api/v1/attendance/export/{event_id}", headers=auth_headers
        )
        assert response.status_code == 200
        assert "text/csv" in response.headers["content-type"]

    def test_member_attendance_report(
        self, client: TestClient, auth_headers: dict, test_member_data: dict
    ):
        """Test getting attendance report for a member."""
        event_id = self._create_event(client, auth_headers, hours_offset=192)
        member_response = client.post(
            "/api/v1/members", json=test_member_data, headers=auth_headers
        )
        member_id = member_response.json()["id"]

        # Check in the member
        client.post(
            f"/api/v1/events/{event_id}/attendance",
            json={"member_id": member_id},
            headers=auth_headers,
        )

        response = client.get(
            f"/api/v1/attendance/reports/member/{member_id}", headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["member_id"] == member_id
        assert data["total_events_attended"] >= 1

    def test_attendance_summary_report(self, client: TestClient, auth_headers: dict):
        """Test getting attendance summary report."""
        start_date = datetime.utcnow() - timedelta(days=30)
        end_date = datetime.utcnow() + timedelta(days=30)

        response = client.get(
            "/api/v1/attendance/reports/summary",
            params={
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
            },
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_events" in data
        assert "total_attendance" in data
        assert "average_attendance" in data

    def test_qr_verify_check_in(
        self, client: TestClient, auth_headers: dict, test_member_data: dict
    ):
        """Test QR code verification check-in."""
        # Create event with self check-in enabled (within check-in window)
        event_data = {
            "title": "QR Test Event",
            "event_type": "service",
            "start_datetime": self._get_datetime_str(1),  # 1 hour from now
            "end_datetime": self._get_datetime_str(3),
            "allow_self_checkin": True,
        }
        event_response = client.post(
            "/api/v1/events", json=event_data, headers=auth_headers
        )
        qr_token = event_response.json()["qr_code_token"]

        member_response = client.post(
            "/api/v1/members", json=test_member_data, headers=auth_headers
        )
        member_id = member_response.json()["id"]

        response = client.post(
            "/api/v1/attendance/verify-qr",
            json={"qr_token": qr_token, "member_id": member_id},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_check_in_cancelled_event_fails(
        self, client: TestClient, auth_headers: dict, test_member_data: dict
    ):
        """Test that check-in fails for cancelled events."""
        event_id = self._create_event(client, auth_headers, hours_offset=216)

        # Cancel the event
        client.post(f"/api/v1/events/{event_id}/cancel", headers=auth_headers)

        member_response = client.post(
            "/api/v1/members", json=test_member_data, headers=auth_headers
        )
        member_id = member_response.json()["id"]

        response = client.post(
            f"/api/v1/events/{event_id}/attendance",
            json={"member_id": member_id},
            headers=auth_headers,
        )
        assert response.status_code == 400

    def test_check_in_unauthenticated(self, client: TestClient, auth_headers: dict):
        """Test that manual check-in requires authentication."""
        event_id = self._create_event(client, auth_headers, hours_offset=240)
        member_id = self._create_member(client, auth_headers, suffix="unauth")

        response = client.post(
            f"/api/v1/events/{event_id}/attendance",
            json={"member_id": member_id},
        )
        assert response.status_code == 403
