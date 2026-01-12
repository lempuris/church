"""
Unit tests for member service and endpoints.
"""

from uuid import uuid4

from app.schemas.member import MemberCreate, MemberUpdate
from app.services.member import RECIPROCAL_RELATIONSHIPS, MemberService


class TestMemberServiceCRUD:
    """Tests for MemberService CRUD operations."""

    def test_create_member(self, db_session, test_member_data):
        """Should create a new member."""
        service = MemberService(db_session)
        member_create = MemberCreate(**test_member_data)
        member = service.create_member(member_create)

        assert member is not None
        assert member.first_name == test_member_data["first_name"]
        assert member.last_name == test_member_data["last_name"]
        assert member.email == test_member_data["email"]

    def test_get_member_by_id(self, db_session, test_member_data):
        """Should retrieve member by ID."""
        service = MemberService(db_session)
        member_create = MemberCreate(**test_member_data)
        created = service.create_member(member_create)

        found = service.get_member_by_id(created.id)
        assert found is not None
        assert found.id == created.id

    def test_get_nonexistent_member(self, db_session):
        """Should return None for nonexistent member."""
        service = MemberService(db_session)
        found = service.get_member_by_id(uuid4())
        assert found is None

    def test_update_member(self, db_session, test_member_data):
        """Should update member details."""
        service = MemberService(db_session)
        member_create = MemberCreate(**test_member_data)
        created = service.create_member(member_create)

        update_data = MemberUpdate(first_name="Jane", phone="+9876543210")
        updated = service.update_member(created.id, update_data)

        assert updated is not None
        assert updated.first_name == "Jane"
        assert updated.phone == "+9876543210"
        assert updated.last_name == test_member_data["last_name"]  # Unchanged

    def test_update_nonexistent_member(self, db_session):
        """Should return None when updating nonexistent member."""
        service = MemberService(db_session)
        update_data = MemberUpdate(first_name="Jane")
        result = service.update_member(uuid4(), update_data)
        assert result is None

    def test_delete_member_soft_delete(self, db_session, test_member_data):
        """Should soft delete member (set status to inactive)."""
        service = MemberService(db_session)
        member_create = MemberCreate(**test_member_data)
        created = service.create_member(member_create)

        result = service.delete_member(created.id)
        assert result is True

        # Member should still exist but be inactive
        member = service.get_member_by_id(created.id)
        assert member is not None
        assert member.member_status == "inactive"

    def test_delete_nonexistent_member(self, db_session):
        """Should return False when deleting nonexistent member."""
        service = MemberService(db_session)
        result = service.delete_member(uuid4())
        assert result is False

    def test_reactivate_member(self, db_session, test_member_data):
        """Should reactivate inactive member."""
        service = MemberService(db_session)
        member_create = MemberCreate(**test_member_data)
        created = service.create_member(member_create)

        service.delete_member(created.id)
        reactivated = service.reactivate_member(created.id)

        assert reactivated is not None
        assert reactivated.member_status == "active"


class TestMemberServiceListing:
    """Tests for MemberService list operations."""

    def test_get_members_empty(self, db_session):
        """Should return empty list when no members."""
        service = MemberService(db_session)
        members, total = service.get_members()
        assert members == []
        assert total == 0

    def test_get_members_pagination(self, db_session):
        """Should paginate member results."""
        service = MemberService(db_session)

        # Create 5 members
        for i in range(5):
            member_data = MemberCreate(
                first_name=f"Member{i}",
                last_name=f"Test{i}",
                email=f"member{i}@example.com",
            )
            service.create_member(member_data)

        # Get first page
        members, total = service.get_members(page=1, page_size=2)
        assert len(members) == 2
        assert total == 5

        # Get second page
        members, total = service.get_members(page=2, page_size=2)
        assert len(members) == 2

    def test_get_members_search(self, db_session):
        """Should search members by name."""
        service = MemberService(db_session)

        service.create_member(
            MemberCreate(first_name="John", last_name="Smith", email="john@example.com")
        )
        service.create_member(
            MemberCreate(first_name="Jane", last_name="Doe", email="jane@example.com")
        )
        service.create_member(
            MemberCreate(
                first_name="Johnny", last_name="Walker", email="johnny@example.com"
            )
        )

        # Search for "John" should return John and Johnny
        members, total = service.get_members(search="John")
        assert total == 2

        # Search for "Doe" should return Jane
        members, total = service.get_members(search="Doe")
        assert total == 1
        assert members[0].first_name == "Jane"

    def test_get_members_filter_by_status(self, db_session):
        """Should filter members by status."""
        service = MemberService(db_session)

        active = service.create_member(
            MemberCreate(
                first_name="Active",
                last_name="User",
                email="active@example.com",
                member_status="active",
            )
        )
        visitor = service.create_member(
            MemberCreate(
                first_name="Visitor",
                last_name="User",
                email="visitor@example.com",
                member_status="visitor",
            )
        )

        # Filter active only
        members, total = service.get_members(status="active")
        assert total == 1
        assert members[0].id == active.id

        # Filter visitors only
        members, total = service.get_members(status="visitor")
        assert total == 1
        assert members[0].id == visitor.id

    def test_get_members_excludes_inactive_by_default(self, db_session):
        """Should exclude inactive members by default."""
        service = MemberService(db_session)

        active = service.create_member(
            MemberCreate(
                first_name="Active", last_name="User", email="active@example.com"
            )
        )
        inactive = service.create_member(
            MemberCreate(
                first_name="Inactive", last_name="User", email="inactive@example.com"
            )
        )
        service.delete_member(inactive.id)

        members, total = service.get_members()
        assert total == 1
        assert members[0].id == active.id


class TestFamilyRelationships:
    """Tests for family relationship functionality."""

    def test_reciprocal_relationships_mapping(self):
        """Verify reciprocal relationship mappings."""
        assert RECIPROCAL_RELATIONSHIPS["spouse"] == "spouse"
        assert RECIPROCAL_RELATIONSHIPS["child"] == "parent"
        assert RECIPROCAL_RELATIONSHIPS["parent"] == "child"
        assert RECIPROCAL_RELATIONSHIPS["sibling"] == "sibling"

    def test_add_family_relationship(self, db_session):
        """Should add bidirectional family relationship."""
        service = MemberService(db_session)

        parent = service.create_member(
            MemberCreate(
                first_name="Parent", last_name="User", email="parent@example.com"
            )
        )
        child = service.create_member(
            MemberCreate(
                first_name="Child", last_name="User", email="child@example.com"
            )
        )

        relationship = service.add_family_relationship(
            member_id=parent.id,
            related_member_id=child.id,
            relationship_type="child",
        )

        assert relationship is not None

        # Parent should see child
        parent_family = service.get_family_relationships(parent.id)
        assert len(parent_family) == 1
        assert parent_family[0]["relationship_type"] == "child"
        assert parent_family[0]["member_id"] == child.id

        # Child should see parent (reciprocal)
        child_family = service.get_family_relationships(child.id)
        assert len(child_family) == 1
        assert child_family[0]["relationship_type"] == "parent"
        assert child_family[0]["member_id"] == parent.id

    def test_add_spouse_relationship(self, db_session):
        """Should add spouse relationship (same type both ways)."""
        service = MemberService(db_session)

        spouse1 = service.create_member(
            MemberCreate(
                first_name="Spouse1", last_name="User", email="spouse1@example.com"
            )
        )
        spouse2 = service.create_member(
            MemberCreate(
                first_name="Spouse2", last_name="User", email="spouse2@example.com"
            )
        )

        service.add_family_relationship(
            member_id=spouse1.id,
            related_member_id=spouse2.id,
            relationship_type="spouse",
        )

        spouse1_family = service.get_family_relationships(spouse1.id)
        spouse2_family = service.get_family_relationships(spouse2.id)

        assert spouse1_family[0]["relationship_type"] == "spouse"
        assert spouse2_family[0]["relationship_type"] == "spouse"

    def test_remove_family_relationship(self, db_session):
        """Should remove bidirectional family relationship."""
        service = MemberService(db_session)

        member1 = service.create_member(
            MemberCreate(
                first_name="Member1", last_name="User", email="member1@example.com"
            )
        )
        member2 = service.create_member(
            MemberCreate(
                first_name="Member2", last_name="User", email="member2@example.com"
            )
        )

        relationship = service.add_family_relationship(
            member_id=member1.id,
            related_member_id=member2.id,
            relationship_type="sibling",
        )

        # Remove the relationship
        result = service.remove_family_relationship(member1.id, relationship.id)
        assert result is True

        # Both sides should be empty
        assert service.get_family_relationships(member1.id) == []
        assert service.get_family_relationships(member2.id) == []

    def test_get_empty_family_relationships(self, db_session):
        """Should return empty list for member with no relationships."""
        service = MemberService(db_session)

        member = service.create_member(
            MemberCreate(
                first_name="Lonely", last_name="User", email="lonely@example.com"
            )
        )

        family = service.get_family_relationships(member.id)
        assert family == []


class TestMemberEndpoints:
    """Tests for member API endpoints."""

    def test_list_members_unauthorized(self, client):
        """Should require authentication for listing members."""
        response = client.get("/api/v1/members")
        assert response.status_code in [401, 403]  # Either unauthorized or forbidden

    def test_list_members_authorized(self, client, auth_headers):
        """Should list members when authenticated."""
        response = client.get("/api/v1/members", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
        assert "total" in data

    def test_create_member(self, client, auth_headers, test_member_data):
        """Should create new member."""
        response = client.post(
            "/api/v1/members", json=test_member_data, headers=auth_headers
        )
        assert response.status_code == 201
        data = response.json()
        assert data["first_name"] == test_member_data["first_name"]

    def test_get_member_detail(self, client, auth_headers, test_member_data):
        """Should get member details."""
        # Create member
        create_response = client.post(
            "/api/v1/members", json=test_member_data, headers=auth_headers
        )
        member_id = create_response.json()["id"]

        # Get details
        response = client.get(f"/api/v1/members/{member_id}", headers=auth_headers)
        assert response.status_code == 200
        assert response.json()["id"] == member_id

    def test_update_member(self, client, auth_headers, test_member_data):
        """Should update member."""
        # Create member
        create_response = client.post(
            "/api/v1/members", json=test_member_data, headers=auth_headers
        )
        member_id = create_response.json()["id"]

        # Update
        response = client.put(
            f"/api/v1/members/{member_id}",
            json={"first_name": "Updated"},
            headers=auth_headers,
        )
        assert response.status_code == 200
        assert response.json()["first_name"] == "Updated"

    def test_delete_member(self, client, auth_headers, test_member_data):
        """Should soft delete member."""
        # Create member
        create_response = client.post(
            "/api/v1/members", json=test_member_data, headers=auth_headers
        )
        member_id = create_response.json()["id"]

        # Delete
        response = client.delete(f"/api/v1/members/{member_id}", headers=auth_headers)
        assert response.status_code in [200, 204]  # Either OK or No Content

        # Verify soft deleted
        get_response = client.get(f"/api/v1/members/{member_id}", headers=auth_headers)
        assert get_response.json()["member_status"] == "inactive"

    def test_search_members(self, client, auth_headers):
        """Should search members by name."""
        # Create members
        client.post(
            "/api/v1/members",
            json={"first_name": "John", "last_name": "Smith", "email": "john@test.com"},
            headers=auth_headers,
        )
        client.post(
            "/api/v1/members",
            json={"first_name": "Jane", "last_name": "Doe", "email": "jane@test.com"},
            headers=auth_headers,
        )

        # Search
        response = client.get("/api/v1/members?search=John", headers=auth_headers)
        assert response.status_code == 200
        data = response.json()
        assert data["total"] >= 1
