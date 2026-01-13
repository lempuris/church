"""
Tests for sermon endpoints.
"""

from datetime import date

from fastapi.testclient import TestClient


class TestSermonSeriesEndpoints:
    """Test cases for sermon series CRUD operations."""

    def test_create_series(self, client: TestClient, auth_headers: dict):
        """Test creating a new sermon series."""
        series_data = {
            "title": "Faith Foundations",
            "description": "A series exploring the fundamentals of faith",
            "start_date": str(date.today()),
        }
        response = client.post(
            "/api/v1/sermons/series", json=series_data, headers=auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Faith Foundations"
        assert data["is_active"] is True

    def test_list_series(self, client: TestClient, auth_headers: dict):
        """Test listing sermon series."""
        # Create a series first
        series_data = {"title": "Test Series"}
        client.post("/api/v1/sermons/series", json=series_data, headers=auth_headers)

        response = client.get("/api/v1/sermons/series", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data

    def test_get_series(self, client: TestClient, auth_headers: dict):
        """Test getting a single series."""
        series_data = {"title": "Get Series Test"}
        create_response = client.post(
            "/api/v1/sermons/series", json=series_data, headers=auth_headers
        )
        series_id = create_response.json()["id"]

        response = client.get(
            f"/api/v1/sermons/series/{series_id}", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Get Series Test"

    def test_update_series(self, client: TestClient, auth_headers: dict):
        """Test updating a series."""
        series_data = {"title": "Original Title"}
        create_response = client.post(
            "/api/v1/sermons/series", json=series_data, headers=auth_headers
        )
        series_id = create_response.json()["id"]

        update_data = {"title": "Updated Title", "is_active": False}
        response = client.put(
            f"/api/v1/sermons/series/{series_id}",
            json=update_data,
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Updated Title"
        assert response.json()["is_active"] is False

    def test_delete_series(self, client: TestClient, auth_headers: dict):
        """Test deleting a series."""
        series_data = {"title": "To Delete"}
        create_response = client.post(
            "/api/v1/sermons/series", json=series_data, headers=auth_headers
        )
        series_id = create_response.json()["id"]

        response = client.delete(
            f"/api/v1/sermons/series/{series_id}", headers=auth_headers
        )
        assert response.status_code == 204


class TestSermonEndpoints:
    """Test cases for sermon CRUD operations."""

    def test_create_sermon(self, client: TestClient, auth_headers: dict):
        """Test creating a new sermon."""
        sermon_data = {
            "title": "Walking in Faith",
            "description": "A powerful message about faith",
            "speaker_name": "Pastor John",
            "sermon_date": str(date.today()),
            "scripture_reference": "Hebrews 11:1",
        }
        response = client.post(
            "/api/v1/sermons", json=sermon_data, headers=auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "Walking in Faith"
        assert data["is_published"] is False

    def test_create_sermon_with_series(self, client: TestClient, auth_headers: dict):
        """Test creating a sermon with a series."""
        # Create series first
        series_response = client.post(
            "/api/v1/sermons/series",
            json={"title": "Faith Series"},
            headers=auth_headers,
        )
        series_id = series_response.json()["id"]

        sermon_data = {
            "title": "Faith Part 1",
            "sermon_date": str(date.today()),
            "series_id": series_id,
        }
        response = client.post(
            "/api/v1/sermons", json=sermon_data, headers=auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["series_id"] == series_id

    def test_list_sermons(self, client: TestClient, auth_headers: dict):
        """Test listing sermons."""
        # Create a sermon
        sermon_data = {
            "title": "List Test Sermon",
            "sermon_date": str(date.today()),
        }
        client.post("/api/v1/sermons", json=sermon_data, headers=auth_headers)

        response = client.get("/api/v1/sermons", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data

    def test_list_sermons_with_search(self, client: TestClient, auth_headers: dict):
        """Test searching sermons."""
        # Create sermons
        client.post(
            "/api/v1/sermons",
            json={"title": "Hope in Christ", "sermon_date": str(date.today())},
            headers=auth_headers,
        )
        client.post(
            "/api/v1/sermons",
            json={"title": "Love Conquers All", "sermon_date": str(date.today())},
            headers=auth_headers,
        )

        response = client.get(
            "/api/v1/sermons", params={"search": "Hope"}, headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) >= 1
        assert any("Hope" in s["title"] for s in data["items"])

    def test_get_sermon(self, client: TestClient, auth_headers: dict):
        """Test getting a single sermon."""
        sermon_data = {
            "title": "Get Sermon Test",
            "sermon_date": str(date.today()),
        }
        create_response = client.post(
            "/api/v1/sermons", json=sermon_data, headers=auth_headers
        )
        sermon_id = create_response.json()["id"]

        response = client.get(f"/api/v1/sermons/{sermon_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["title"] == "Get Sermon Test"

    def test_update_sermon(self, client: TestClient, auth_headers: dict):
        """Test updating a sermon."""
        sermon_data = {
            "title": "Original Sermon",
            "sermon_date": str(date.today()),
        }
        create_response = client.post(
            "/api/v1/sermons", json=sermon_data, headers=auth_headers
        )
        sermon_id = create_response.json()["id"]

        update_data = {"title": "Updated Sermon", "scripture_reference": "John 3:16"}
        response = client.put(
            f"/api/v1/sermons/{sermon_id}", json=update_data, headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["title"] == "Updated Sermon"
        assert response.json()["scripture_reference"] == "John 3:16"

    def test_publish_sermon(self, client: TestClient, auth_headers: dict):
        """Test publishing a sermon."""
        sermon_data = {
            "title": "To Publish",
            "sermon_date": str(date.today()),
        }
        create_response = client.post(
            "/api/v1/sermons", json=sermon_data, headers=auth_headers
        )
        sermon_id = create_response.json()["id"]

        response = client.put(
            f"/api/v1/sermons/{sermon_id}/publish", json={}, headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["is_published"] is True

    def test_unpublish_sermon(self, client: TestClient, auth_headers: dict):
        """Test unpublishing a sermon."""
        sermon_data = {
            "title": "To Unpublish",
            "sermon_date": str(date.today()),
        }
        create_response = client.post(
            "/api/v1/sermons", json=sermon_data, headers=auth_headers
        )
        sermon_id = create_response.json()["id"]

        # Publish first
        client.put(
            f"/api/v1/sermons/{sermon_id}/publish", json={}, headers=auth_headers
        )

        # Then unpublish
        response = client.put(
            f"/api/v1/sermons/{sermon_id}/unpublish", headers=auth_headers
        )
        assert response.status_code == 200
        assert response.json()["is_published"] is False

    def test_delete_sermon(self, client: TestClient, auth_headers: dict):
        """Test deleting a sermon."""
        sermon_data = {
            "title": "To Delete",
            "sermon_date": str(date.today()),
        }
        create_response = client.post(
            "/api/v1/sermons", json=sermon_data, headers=auth_headers
        )
        sermon_id = create_response.json()["id"]

        response = client.delete(f"/api/v1/sermons/{sermon_id}", headers=auth_headers)
        assert response.status_code == 204

    def test_list_public_sermons(self, client: TestClient, auth_headers: dict):
        """Test listing public sermons."""
        # Create and publish a sermon
        sermon_data = {
            "title": "Public Sermon",
            "sermon_date": str(date.today()),
        }
        create_response = client.post(
            "/api/v1/sermons", json=sermon_data, headers=auth_headers
        )
        sermon_id = create_response.json()["id"]
        client.put(
            f"/api/v1/sermons/{sermon_id}/publish", json={}, headers=auth_headers
        )

        # Public endpoint - no auth required
        response = client.get("/api/v1/sermons/public")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data

    def test_get_public_sermon(self, client: TestClient, auth_headers: dict):
        """Test getting a public sermon."""
        # Create and publish a sermon
        sermon_data = {
            "title": "Public View Sermon",
            "sermon_date": str(date.today()),
        }
        create_response = client.post(
            "/api/v1/sermons", json=sermon_data, headers=auth_headers
        )
        sermon_id = create_response.json()["id"]
        client.put(
            f"/api/v1/sermons/{sermon_id}/publish", json={}, headers=auth_headers
        )

        # Public endpoint - no auth required
        response = client.get(f"/api/v1/sermons/{sermon_id}/public")
        assert response.status_code == 200
        assert response.json()["title"] == "Public View Sermon"

    def test_unpublished_sermon_not_public(
        self, client: TestClient, auth_headers: dict
    ):
        """Test that unpublished sermons are not accessible publicly."""
        sermon_data = {
            "title": "Private Sermon",
            "sermon_date": str(date.today()),
        }
        create_response = client.post(
            "/api/v1/sermons", json=sermon_data, headers=auth_headers
        )
        sermon_id = create_response.json()["id"]

        # Should return 404 for unpublished sermon
        response = client.get(f"/api/v1/sermons/{sermon_id}/public")
        assert response.status_code == 404
