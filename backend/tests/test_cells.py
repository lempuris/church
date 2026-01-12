"""
Tests for cell group endpoints.
"""

from fastapi.testclient import TestClient


class TestCellEndpoints:
    """Test cases for cell group CRUD operations."""

    def test_create_cell(self, client: TestClient, auth_headers: dict):
        """Test creating a new cell group."""
        cell_data = {
            "name": "Youth Cell",
            "description": "Cell group for young adults",
            "meeting_day": "saturday",
            "meeting_location": "Church Hall",
        }
        response = client.post("/api/v1/cells", json=cell_data, headers=auth_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Youth Cell"
        assert data["description"] == "Cell group for young adults"
        assert data["is_active"] is True

    def test_create_cell_with_leader(
        self, client: TestClient, auth_headers: dict, test_member_data: dict
    ):
        """Test creating a cell with a leader assigned."""
        # First create a member to be the leader
        member_response = client.post(
            "/api/v1/members", json=test_member_data, headers=auth_headers
        )
        assert member_response.status_code == 201
        member_id = member_response.json()["id"]

        cell_data = {
            "name": "Family Cell",
            "description": "Cell for families",
            "leader_id": member_id,
            "meeting_day": "wednesday",
        }
        response = client.post("/api/v1/cells", json=cell_data, headers=auth_headers)
        assert response.status_code == 201
        data = response.json()
        assert data["leader_id"] == member_id
        assert data["leader"]["id"] == member_id

    def test_list_cells(self, client: TestClient, auth_headers: dict):
        """Test listing all cells."""
        # Create a cell first
        cell_data = {"name": "Test Cell"}
        client.post("/api/v1/cells", json=cell_data, headers=auth_headers)

        response = client.get("/api/v1/cells", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "page" in data

    def test_list_cells_with_search(self, client: TestClient, auth_headers: dict):
        """Test searching cells by name."""
        # Create cells
        client.post("/api/v1/cells", json={"name": "Alpha Cell"}, headers=auth_headers)
        client.post("/api/v1/cells", json={"name": "Beta Cell"}, headers=auth_headers)

        response = client.get(
            "/api/v1/cells", params={"search": "Alpha"}, headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) >= 1
        assert "Alpha" in data["items"][0]["name"]

    def test_get_cell(self, client: TestClient, auth_headers: dict):
        """Test getting a single cell by ID."""
        # Create a cell
        cell_data = {"name": "Detail Cell", "description": "Test description"}
        create_response = client.post(
            "/api/v1/cells", json=cell_data, headers=auth_headers
        )
        cell_id = create_response.json()["id"]

        response = client.get(f"/api/v1/cells/{cell_id}", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Detail Cell"
        assert data["description"] == "Test description"
        assert "members" in data

    def test_get_cell_not_found(self, client: TestClient, auth_headers: dict):
        """Test getting a non-existent cell."""
        fake_id = "00000000-0000-0000-0000-000000000000"
        response = client.get(f"/api/v1/cells/{fake_id}", headers=auth_headers)
        assert response.status_code == 404

    def test_update_cell(self, client: TestClient, auth_headers: dict):
        """Test updating a cell."""
        # Create a cell
        cell_data = {"name": "Original Name"}
        create_response = client.post(
            "/api/v1/cells", json=cell_data, headers=auth_headers
        )
        cell_id = create_response.json()["id"]

        # Update the cell
        update_data = {"name": "Updated Name", "description": "New description"}
        response = client.put(
            f"/api/v1/cells/{cell_id}", json=update_data, headers=auth_headers
        )
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["description"] == "New description"

    def test_delete_cell(self, client: TestClient, auth_headers: dict):
        """Test soft-deleting a cell."""
        # Create a cell
        cell_data = {"name": "To Delete"}
        create_response = client.post(
            "/api/v1/cells", json=cell_data, headers=auth_headers
        )
        cell_id = create_response.json()["id"]

        # Delete the cell
        response = client.delete(f"/api/v1/cells/{cell_id}", headers=auth_headers)
        assert response.status_code == 204

        # Cell should not appear in active list
        list_response = client.get("/api/v1/cells", headers=auth_headers)
        cells = list_response.json()["items"]
        assert not any(c["id"] == cell_id for c in cells)

    def test_add_member_to_cell(
        self, client: TestClient, auth_headers: dict, test_member_data: dict
    ):
        """Test adding a member to a cell."""
        # Create a cell
        cell_response = client.post(
            "/api/v1/cells", json={"name": "Member Test Cell"}, headers=auth_headers
        )
        cell_id = cell_response.json()["id"]

        # Create a member
        member_response = client.post(
            "/api/v1/members", json=test_member_data, headers=auth_headers
        )
        member_id = member_response.json()["id"]

        # Add member to cell
        response = client.post(
            f"/api/v1/cells/{cell_id}/members",
            json={"member_id": member_id},
            headers=auth_headers,
        )
        assert response.status_code == 201
        data = response.json()
        assert data["id"] == member_id

    def test_get_cell_members(
        self, client: TestClient, auth_headers: dict, test_member_data: dict
    ):
        """Test getting members of a cell."""
        # Create a cell
        cell_response = client.post(
            "/api/v1/cells", json={"name": "Members List Cell"}, headers=auth_headers
        )
        cell_id = cell_response.json()["id"]

        # Create and add a member
        member_response = client.post(
            "/api/v1/members", json=test_member_data, headers=auth_headers
        )
        member_id = member_response.json()["id"]
        client.post(
            f"/api/v1/cells/{cell_id}/members",
            json={"member_id": member_id},
            headers=auth_headers,
        )

        # Get cell members
        response = client.get(f"/api/v1/cells/{cell_id}/members", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["id"] == member_id

    def test_remove_member_from_cell(
        self, client: TestClient, auth_headers: dict, test_member_data: dict
    ):
        """Test removing a member from a cell."""
        # Create a cell
        cell_response = client.post(
            "/api/v1/cells", json={"name": "Remove Test Cell"}, headers=auth_headers
        )
        cell_id = cell_response.json()["id"]

        # Create and add a member
        member_response = client.post(
            "/api/v1/members", json=test_member_data, headers=auth_headers
        )
        member_id = member_response.json()["id"]
        client.post(
            f"/api/v1/cells/{cell_id}/members",
            json={"member_id": member_id},
            headers=auth_headers,
        )

        # Remove member from cell
        response = client.delete(
            f"/api/v1/cells/{cell_id}/members/{member_id}", headers=auth_headers
        )
        assert response.status_code == 204

        # Verify member is removed
        members_response = client.get(
            f"/api/v1/cells/{cell_id}/members", headers=auth_headers
        )
        assert len(members_response.json()) == 0

    def test_member_can_only_be_in_one_cell(
        self, client: TestClient, auth_headers: dict, test_member_data: dict
    ):
        """Test that a member can only be in one cell at a time."""
        # Create two cells
        cell1_response = client.post(
            "/api/v1/cells", json={"name": "Cell One"}, headers=auth_headers
        )
        cell1_id = cell1_response.json()["id"]

        cell2_response = client.post(
            "/api/v1/cells", json={"name": "Cell Two"}, headers=auth_headers
        )
        cell2_id = cell2_response.json()["id"]

        # Create a member
        member_response = client.post(
            "/api/v1/members", json=test_member_data, headers=auth_headers
        )
        member_id = member_response.json()["id"]

        # Add to first cell
        client.post(
            f"/api/v1/cells/{cell1_id}/members",
            json={"member_id": member_id},
            headers=auth_headers,
        )

        # Add to second cell (should move from first)
        client.post(
            f"/api/v1/cells/{cell2_id}/members",
            json={"member_id": member_id},
            headers=auth_headers,
        )

        # Verify member is only in second cell
        cell1_members = client.get(
            f"/api/v1/cells/{cell1_id}/members", headers=auth_headers
        ).json()
        cell2_members = client.get(
            f"/api/v1/cells/{cell2_id}/members", headers=auth_headers
        ).json()

        assert len(cell1_members) == 0
        assert len(cell2_members) == 1
        assert cell2_members[0]["id"] == member_id

    def test_create_cell_unauthenticated(self, client: TestClient):
        """Test that creating a cell requires authentication."""
        cell_data = {"name": "Unauthorized Cell"}
        response = client.post("/api/v1/cells", json=cell_data)
        assert response.status_code == 403
