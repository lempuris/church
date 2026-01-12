from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Cell, CellMember, Member
from app.schemas.cell import CellCreate, CellMemberInfo, CellUpdate


class CellService:
    def __init__(self, db: Session):
        self.db = db

    def get_cell_by_id(self, cell_id: UUID) -> Cell | None:
        stmt = select(Cell).where(Cell.id == cell_id)
        return self.db.execute(stmt).scalar_one_or_none()

    def get_cells(
        self,
        page: int = 1,
        page_size: int = 20,
        search: str | None = None,
        active_only: bool = True,
    ) -> tuple[list[dict], int]:
        stmt = select(Cell)

        if active_only:
            stmt = stmt.where(Cell.is_active == True)  # noqa: E712

        if search:
            search_term = f"%{search}%"
            stmt = stmt.where(Cell.name.ilike(search_term))

        # Get total count
        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = self.db.execute(count_stmt).scalar() or 0

        # Order and paginate
        stmt = stmt.order_by(Cell.name)
        offset = (page - 1) * page_size
        stmt = stmt.offset(offset).limit(page_size)

        cells = list(self.db.execute(stmt).scalars().all())

        # Enrich with member count
        result = []
        for cell in cells:
            member_count = self._get_member_count(cell.id)
            cell_dict = {
                "id": cell.id,
                "name": cell.name,
                "description": cell.description,
                "leader_id": cell.leader_id,
                "assistant_leader_id": cell.assistant_leader_id,
                "meeting_day": cell.meeting_day,
                "meeting_time": cell.meeting_time,
                "meeting_location": cell.meeting_location,
                "is_active": cell.is_active,
                "created_at": cell.created_at,
                "updated_at": cell.updated_at,
                "member_count": member_count,
                "leader": self._get_leader_info(cell.leader_id),
                "assistant_leader": self._get_leader_info(cell.assistant_leader_id),
            }
            result.append(cell_dict)

        return result, total

    def _get_member_count(self, cell_id: UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(CellMember)
            .where(
                CellMember.cell_id == cell_id,
                CellMember.is_active == True,  # noqa: E712
            )
        )
        return self.db.execute(stmt).scalar() or 0

    def _get_leader_info(self, member_id: UUID | None) -> dict | None:
        if not member_id:
            return None
        stmt = select(Member).where(Member.id == member_id)
        member = self.db.execute(stmt).scalar_one_or_none()
        if not member:
            return None
        return {
            "id": member.id,
            "first_name": member.first_name,
            "last_name": member.last_name,
            "photo_url": member.photo_url,
        }

    def create_cell(self, cell_data: CellCreate) -> Cell:
        cell = Cell(**cell_data.model_dump())
        self.db.add(cell)
        self.db.commit()
        self.db.refresh(cell)
        return cell

    def update_cell(self, cell_id: UUID, cell_data: CellUpdate) -> Cell | None:
        cell = self.get_cell_by_id(cell_id)
        if not cell:
            return None

        update_data = cell_data.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(cell, field, value)

        self.db.commit()
        self.db.refresh(cell)
        return cell

    def delete_cell(self, cell_id: UUID) -> bool:
        cell = self.get_cell_by_id(cell_id)
        if not cell:
            return False

        # Soft delete - set is_active to false
        cell.is_active = False

        # Deactivate all cell memberships
        stmt = select(CellMember).where(CellMember.cell_id == cell_id)
        memberships = self.db.execute(stmt).scalars().all()
        for membership in memberships:
            membership.is_active = False

        self.db.commit()
        return True

    def get_cell_members(self, cell_id: UUID) -> list[CellMemberInfo]:
        cell = self.get_cell_by_id(cell_id)
        if not cell:
            return []

        stmt = (
            select(CellMember)
            .where(
                CellMember.cell_id == cell_id,
                CellMember.is_active == True,  # noqa: E712
            )
            .order_by(CellMember.joined_at)
        )
        memberships = self.db.execute(stmt).scalars().all()

        members = []
        for membership in memberships:
            member = self.db.execute(
                select(Member).where(Member.id == membership.member_id)
            ).scalar_one_or_none()
            if member:
                members.append(
                    CellMemberInfo(
                        id=member.id,
                        first_name=member.first_name,
                        last_name=member.last_name,
                        photo_url=member.photo_url,
                        email=member.email,
                        phone=member.phone,
                    )
                )
        return members

    def add_member_to_cell(self, cell_id: UUID, member_id: UUID) -> CellMember | None:
        # Check cell exists
        cell = self.get_cell_by_id(cell_id)
        if not cell or not cell.is_active:
            return None

        # Check member exists
        member = self.db.execute(
            select(Member).where(Member.id == member_id)
        ).scalar_one_or_none()
        if not member:
            return None

        # Check if member is already in another cell
        existing_membership = self.db.execute(
            select(CellMember).where(
                CellMember.member_id == member_id,
                CellMember.is_active == True,  # noqa: E712
            )
        ).scalar_one_or_none()

        if existing_membership:
            if existing_membership.cell_id == cell_id:
                # Already in this cell
                return existing_membership
            # Remove from other cell first
            existing_membership.is_active = False

        # Check if there's an inactive membership in this cell
        inactive_membership = self.db.execute(
            select(CellMember).where(
                CellMember.cell_id == cell_id,
                CellMember.member_id == member_id,
            )
        ).scalar_one_or_none()

        if inactive_membership:
            # Reactivate
            inactive_membership.is_active = True
            self.db.commit()
            self.db.refresh(inactive_membership)
            return inactive_membership

        # Create new membership
        cell_member = CellMember(cell_id=cell_id, member_id=member_id)
        self.db.add(cell_member)
        self.db.commit()
        self.db.refresh(cell_member)
        return cell_member

    def remove_member_from_cell(self, cell_id: UUID, member_id: UUID) -> bool:
        stmt = select(CellMember).where(
            CellMember.cell_id == cell_id,
            CellMember.member_id == member_id,
            CellMember.is_active == True,  # noqa: E712
        )
        membership = self.db.execute(stmt).scalar_one_or_none()
        if not membership:
            return False

        membership.is_active = False
        self.db.commit()
        return True

    def get_cell_by_leader(self, member_id: UUID) -> Cell | None:
        """Get a cell where the member is a leader or assistant leader.

        Note: A member may lead multiple cells. This returns the first one found.
        If you need all cells led by a member, use a different method.
        """
        stmt = select(Cell).where(
            Cell.is_active == True,  # noqa: E712
            (Cell.leader_id == member_id) | (Cell.assistant_leader_id == member_id),
        )
        return self.db.execute(stmt).scalars().first()

    def get_cell_by_user_id(self, user_id: UUID) -> Cell | None:
        """Get the cell for a user (through their member record)."""
        # First get the member for this user
        member = self.db.execute(
            select(Member).where(Member.user_id == user_id)
        ).scalar_one_or_none()
        if not member:
            return None

        # Check if they're a leader
        led_cell = self.get_cell_by_leader(member.id)
        if led_cell:
            return led_cell

        # Otherwise, get their cell membership
        stmt = select(CellMember).where(
            CellMember.member_id == member.id,
            CellMember.is_active == True,  # noqa: E712
        )
        membership = self.db.execute(stmt).scalar_one_or_none()
        if membership:
            return self.get_cell_by_id(membership.cell_id)

        return None

    def get_cell_detail(self, cell_id: UUID) -> dict | None:
        """Get cell with full member list."""
        cell = self.get_cell_by_id(cell_id)
        if not cell:
            return None

        members = self.get_cell_members(cell_id)
        return {
            "id": cell.id,
            "name": cell.name,
            "description": cell.description,
            "leader_id": cell.leader_id,
            "assistant_leader_id": cell.assistant_leader_id,
            "meeting_day": cell.meeting_day,
            "meeting_time": cell.meeting_time,
            "meeting_location": cell.meeting_location,
            "is_active": cell.is_active,
            "created_at": cell.created_at,
            "updated_at": cell.updated_at,
            "member_count": len(members),
            "leader": self._get_leader_info(cell.leader_id),
            "assistant_leader": self._get_leader_info(cell.assistant_leader_id),
            "members": members,
        }


def get_cell_service(db: Session) -> CellService:
    return CellService(db)
