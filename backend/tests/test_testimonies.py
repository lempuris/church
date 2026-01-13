"""
Tests for testimony endpoints.
"""

from fastapi.testclient import TestClient


class TestTestimonyEndpoints:
    """Test cases for testimony CRUD operations."""

    def test_submit_testimony_as_guest(self, client: TestClient):
        """Test submitting a testimony as a guest."""
        testimony_data = {
            "title": "God healed me",
            "content": "I was sick for many years and God completely healed me. " * 5,
            "author_name": "John Healed",
            "category": "healing",
        }
        response = client.post("/api/v1/testimonies", json=testimony_data)
        assert response.status_code == 201
        data = response.json()
        assert data["title"] == "God healed me"
        assert data["status"] == "pending"
        assert data["category"] == "healing"

    def test_submit_testimony_guest_requires_name(self, client: TestClient):
        """Test that guest submissions require author_name."""
        testimony_data = {
            "title": "Anonymous testimony",
            "content": "This is my testimony about God's provision in my life. " * 5,
        }
        response = client.post("/api/v1/testimonies", json=testimony_data)
        assert response.status_code == 400
        assert "author_name" in response.json()["detail"]

    def test_submit_testimony_requires_min_content(self, client: TestClient):
        """Test that testimonies require minimum content length."""
        testimony_data = {
            "title": "Short testimony",
            "content": "Too short",
            "author_name": "Test User",
        }
        response = client.post("/api/v1/testimonies", json=testimony_data)
        assert response.status_code == 422  # Validation error

    def test_list_testimonies_admin(self, client: TestClient, auth_headers: dict):
        """Test listing all testimonies as admin."""
        # Create a testimony
        testimony_data = {
            "title": "Admin view testimony",
            "content": "This is for testing admin view of testimonies in the system. "
            * 3,
            "author_name": "Test User",
        }
        client.post("/api/v1/testimonies", json=testimony_data)

        response = client.get("/api/v1/testimonies", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data

    def test_list_testimonies_by_category(self, client: TestClient, auth_headers: dict):
        """Test filtering testimonies by category."""
        # Create testimonies with different categories
        client.post(
            "/api/v1/testimonies",
            json={
                "title": "Healing testimony",
                "content": "God healed me from a serious illness that doctors said was incurable. "
                * 3,
                "author_name": "Healed Person",
                "category": "healing",
            },
        )
        client.post(
            "/api/v1/testimonies",
            json={
                "title": "Provision testimony",
                "content": "God provided for all my financial needs when I had nothing left. "
                * 3,
                "author_name": "Provided Person",
                "category": "provision",
            },
        )

        response = client.get(
            "/api/v1/testimonies",
            params={"category": "healing"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        data = response.json()
        assert all(t["category"] == "healing" for t in data["items"])

    def test_get_pending_testimonies(self, client: TestClient, auth_headers: dict):
        """Test getting pending testimonies for moderation."""
        # Create a pending testimony
        testimony_data = {
            "title": "Pending testimony",
            "content": "This testimony is waiting for moderation and approval. " * 3,
            "author_name": "Pending User",
        }
        client.post("/api/v1/testimonies", json=testimony_data)

        response = client.get("/api/v1/testimonies/pending", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert all(t["status"] == "pending" for t in data["items"])

    def test_approve_testimony(self, client: TestClient, auth_headers: dict):
        """Test approving a testimony."""
        # Create a testimony
        testimony_data = {
            "title": "To approve",
            "content": "This wonderful testimony will be approved by our team. " * 3,
            "author_name": "Approver",
        }
        create_response = client.post("/api/v1/testimonies", json=testimony_data)
        testimony_id = create_response.json()["id"]

        # Approve it
        response = client.put(
            f"/api/v1/testimonies/{testimony_id}/approve",
            json={"action": "approve"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["status"] == "approved"

    def test_reject_testimony(self, client: TestClient, auth_headers: dict):
        """Test rejecting a testimony."""
        # Create a testimony
        testimony_data = {
            "title": "To reject",
            "content": "This testimony unfortunately does not meet our guidelines. "
            * 3,
            "author_name": "Rejector",
        }
        create_response = client.post("/api/v1/testimonies", json=testimony_data)
        testimony_id = create_response.json()["id"]

        # Reject it
        response = client.put(
            f"/api/v1/testimonies/{testimony_id}/approve",
            json={"action": "reject", "rejection_reason": "Does not meet guidelines"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["status"] == "rejected"

    def test_feature_testimony(self, client: TestClient, auth_headers: dict):
        """Test featuring an approved testimony."""
        # Create and approve a testimony
        testimony_data = {
            "title": "Feature me",
            "content": "This amazing testimony deserves to be featured on the homepage. "
            * 3,
            "author_name": "Featured Person",
        }
        create_response = client.post("/api/v1/testimonies", json=testimony_data)
        testimony_id = create_response.json()["id"]

        # Approve first
        client.put(
            f"/api/v1/testimonies/{testimony_id}/approve",
            json={"action": "approve"},
            headers=auth_headers,
        )

        # Feature it
        response = client.put(
            f"/api/v1/testimonies/{testimony_id}/feature",
            json={"is_featured": True},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["is_featured"] is True

    def test_cannot_feature_unapproved_testimony(
        self, client: TestClient, auth_headers: dict
    ):
        """Test that unapproved testimonies cannot be featured."""
        # Create a testimony (pending status)
        testimony_data = {
            "title": "Cannot feature",
            "content": "This testimony is still pending and cannot be featured yet. "
            * 3,
            "author_name": "Pending Person",
        }
        create_response = client.post("/api/v1/testimonies", json=testimony_data)
        testimony_id = create_response.json()["id"]

        # Try to feature without approving
        response = client.put(
            f"/api/v1/testimonies/{testimony_id}/feature",
            json={"is_featured": True},
            headers=auth_headers,
        )
        assert response.status_code == 400

    def test_list_public_testimonies(self, client: TestClient, auth_headers: dict):
        """Test listing public testimonies."""
        # Create and approve a testimony
        testimony_data = {
            "title": "Public testimony",
            "content": "This testimony will be visible to the public after approval. "
            * 3,
            "author_name": "Public Person",
        }
        create_response = client.post("/api/v1/testimonies", json=testimony_data)
        testimony_id = create_response.json()["id"]

        client.put(
            f"/api/v1/testimonies/{testimony_id}/approve",
            json={"action": "approve"},
            headers=auth_headers,
        )

        # Public endpoint - no auth required
        response = client.get("/api/v1/testimonies/public")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data

    def test_get_featured_testimonies(self, client: TestClient, auth_headers: dict):
        """Test getting featured testimonies for homepage."""
        # Create, approve, and feature a testimony
        testimony_data = {
            "title": "Featured homepage testimony",
            "content": "This testimony will be displayed on the homepage for all to see. "
            * 3,
            "author_name": "Featured Person",
        }
        create_response = client.post("/api/v1/testimonies", json=testimony_data)
        testimony_id = create_response.json()["id"]

        client.put(
            f"/api/v1/testimonies/{testimony_id}/approve",
            json={"action": "approve"},
            headers=auth_headers,
        )
        client.put(
            f"/api/v1/testimonies/{testimony_id}/feature",
            json={"is_featured": True},
            headers=auth_headers,
        )

        # Public endpoint - no auth required
        response = client.get("/api/v1/testimonies/featured")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_get_public_testimony(self, client: TestClient, auth_headers: dict):
        """Test getting a public testimony by ID."""
        # Create and approve a testimony
        testimony_data = {
            "title": "Public view testimony",
            "content": "This testimony can be viewed publicly after it is approved. "
            * 3,
            "author_name": "Viewable Person",
        }
        create_response = client.post("/api/v1/testimonies", json=testimony_data)
        testimony_id = create_response.json()["id"]

        client.put(
            f"/api/v1/testimonies/{testimony_id}/approve",
            json={"action": "approve"},
            headers=auth_headers,
        )

        # Public endpoint
        response = client.get(f"/api/v1/testimonies/{testimony_id}/public")
        assert response.status_code == 200
        assert response.json()["title"] == "Public view testimony"

    def test_unapproved_testimony_not_public(
        self, client: TestClient, auth_headers: dict
    ):
        """Test that unapproved testimonies are not accessible publicly."""
        testimony_data = {
            "title": "Private testimony",
            "content": "This testimony is still pending and should not be publicly visible. "
            * 3,
            "author_name": "Private Person",
        }
        create_response = client.post("/api/v1/testimonies", json=testimony_data)
        testimony_id = create_response.json()["id"]

        # Should return 404 for unapproved testimony
        response = client.get(f"/api/v1/testimonies/{testimony_id}/public")
        assert response.status_code == 404

    def test_delete_testimony(self, client: TestClient, auth_headers: dict):
        """Test deleting a testimony as admin."""
        # Create a testimony
        testimony_data = {
            "title": "To delete",
            "content": "This testimony will be permanently deleted from the system. "
            * 3,
            "author_name": "Deleter",
        }
        create_response = client.post("/api/v1/testimonies", json=testimony_data)
        testimony_id = create_response.json()["id"]

        response = client.delete(
            f"/api/v1/testimonies/{testimony_id}", headers=auth_headers
        )
        assert response.status_code == 204
