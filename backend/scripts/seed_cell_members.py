"""
Seed script to assign members to cells.
Run with: python -m scripts.seed_cell_members
"""

import os
import random
import sys
import uuid

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models import Cell, CellMember, Member

# Create engine and session
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)


def main():
    print("\n=== Assigning Members to Cells ===\n")

    db = SessionLocal()

    try:
        cells = db.query(Cell).filter(Cell.is_active.is_(True)).all()
        members = db.query(Member).filter(Member.member_status == "active").all()

        print(f"Found {len(cells)} active cells")
        print(f"Found {len(members)} active members")

        if not cells:
            print("No cells found. Run seed_phase2.py first.")
            return

        if not members:
            print("No members found. Run seed_members.py first.")
            return

        # Check existing cell memberships
        existing = db.query(CellMember).count()
        print(f"Existing cell memberships: {existing}")

        # Get members already in cells
        members_in_cells = set()
        for cm in db.query(CellMember).all():
            members_in_cells.add(cm.member_id)

        # Also skip cell leaders
        for cell in cells:
            if cell.leader_id:
                members_in_cells.add(cell.leader_id)
            if cell.assistant_leader_id:
                members_in_cells.add(cell.assistant_leader_id)

        # Filter available members
        available_members = [m for m in members if m.id not in members_in_cells]
        print(f"Members available for assignment: {len(available_members)}")

        # Assign leaders from available members (first 10)
        leader_candidates = available_members[:14]  # 7 cells * 2 (leader + assistant)
        remaining_members = available_members[14:]

        print("\nAssigning cell leaders...")
        for i, cell in enumerate(cells):
            if not cell.leader_id and i * 2 < len(leader_candidates):
                cell.leader_id = leader_candidates[i * 2].id
                print(f"  {cell.name}: Leader = {leader_candidates[i * 2].full_name}")
            if not cell.assistant_leader_id and i * 2 + 1 < len(leader_candidates):
                cell.assistant_leader_id = leader_candidates[i * 2 + 1].id
                print(
                    f"  {cell.name}: Assistant = {leader_candidates[i * 2 + 1].full_name}"
                )

        db.commit()

        # Assign remaining members to cells
        print("\nAssigning members to cells...")
        count = 0
        random.shuffle(remaining_members)

        for i, member in enumerate(remaining_members):
            cell = cells[i % len(cells)]  # Distribute evenly

            cell_member = CellMember(
                id=uuid.uuid4(),
                cell_id=cell.id,
                member_id=member.id,
                is_active=True,
            )
            db.add(cell_member)
            count += 1

        db.commit()
        print(f"  Assigned {count} members to cells")

        # Print summary
        print("\n=== Cell Summary ===\n")
        for cell in cells:
            member_count = (
                db.query(CellMember).filter(CellMember.cell_id == cell.id).count()
            )
            leader = db.query(Member).filter(Member.id == cell.leader_id).first()
            leader_name = leader.full_name if leader else "Not assigned"
            print(f"  {cell.name}: {member_count} members, Leader: {leader_name}")

        print("\n=== Complete ===\n")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
