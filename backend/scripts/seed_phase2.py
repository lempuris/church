"""
Seed script for Phase 2 demo data (Cells, Events, Attendance).
Run with: python -m scripts.seed_phase2
"""

import os
import sys
import uuid
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models import Attendance, Cell, CellMember, Event, Member

# Create engine and session
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)


def seed_cells(db, members):
    """Create sample cell groups."""
    print("Creating cell groups...")

    cells_data = [
        {
            "name": "Soweto Young Adults",
            "description": "A vibrant group for young professionals aged 18-35 seeking spiritual growth and ubuntu community.",
            "meeting_day": "saturday",
            "meeting_time": "10:00",
            "meeting_location": "Soweto Community Hall",
        },
        {
            "name": "Sandton Families",
            "description": "For married couples and families in the Sandton area to grow together in faith.",
            "meeting_day": "friday",
            "meeting_time": "19:00",
            "meeting_location": "Sandton Fellowship Center",
        },
        {
            "name": "Amadoda Okholo (Men of Faith)",
            "description": "Men's fellowship focused on discipleship, accountability, and servant leadership.",
            "meeting_day": "wednesday",
            "meeting_time": "06:00",
            "meeting_location": "Johannesburg Conference Room",
        },
        {
            "name": "Abafazi Bomusa (Women of Grace)",
            "description": "Women's ministry for encouragement, prayer, and Bible study in isiZulu and English.",
            "meeting_day": "thursday",
            "meeting_time": "10:00",
            "meeting_location": "Prayer Room - Rosebank",
        },
        {
            "name": "Intsha Evuthayo (Youth on Fire)",
            "description": "Youth cell for teenagers (13-17) with braai, games, and faith discussions.",
            "meeting_day": "sunday",
            "meeting_time": "14:00",
            "meeting_location": "Youth Center - Midrand",
        },
        {
            "name": "Pretoria East Cell",
            "description": "Community cell group serving members in the Pretoria East area.",
            "meeting_day": "tuesday",
            "meeting_time": "18:30",
            "meeting_location": "Centurion Church Annex",
        },
        {
            "name": "Cape Town Connect",
            "description": "Fellowship group for our Cape Town members connecting via video and monthly in-person.",
            "meeting_day": "thursday",
            "meeting_time": "19:00",
            "meeting_location": "Online / Cape Town Venue",
        },
    ]

    cells = []
    for i, data in enumerate(cells_data):
        # Assign a leader if we have enough members
        leader_id = members[i].id if i < len(members) else None
        assistant_id = members[i + 5].id if i + 5 < len(members) else None

        cell = Cell(
            id=uuid.uuid4(),
            name=data["name"],
            description=data["description"],
            leader_id=leader_id,
            assistant_leader_id=assistant_id,
            meeting_day=data["meeting_day"],
            meeting_time=data["meeting_time"],
            meeting_location=data["meeting_location"],
            is_active=True,
        )
        db.add(cell)
        cells.append(cell)

    db.commit()
    print(f"  Created {len(cells)} cell groups")
    return cells


def seed_cell_members(db, cells, members):
    """Assign members to cells."""
    print("Assigning members to cells...")

    count = 0
    # Distribute members across cells (skip first 10 who might be leaders)
    available_members = members[10:] if len(members) > 10 else members

    for i, member in enumerate(available_members):
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


def seed_events(db, user_id):
    """Create sample events."""
    print("Creating events...")

    now = datetime.utcnow()

    events_data = [
        # Past events
        {
            "title": "Sunday Morning Service",
            "description": "Join us for worship, praise, and the Word of God. Multilingual service in English, isiZulu, and Afrikaans.",
            "event_type": "service",
            "start_datetime": now - timedelta(days=7, hours=2),
            "end_datetime": now - timedelta(days=7),
            "location": "Main Sanctuary - Sandton",
            "capacity": 500,
            "is_public": True,
            "allow_self_checkin": True,
        },
        {
            "title": "Wednesday Bible Study",
            "description": "Deep dive into the book of Romans. Tea and rusks provided.",
            "event_type": "service",
            "start_datetime": now - timedelta(days=4, hours=2),
            "end_datetime": now - timedelta(days=4),
            "location": "Fellowship Hall - Johannesburg",
            "capacity": 100,
            "is_public": True,
            "allow_self_checkin": True,
        },
        # Upcoming events
        {
            "title": "Sunday Morning Service",
            "description": "Join us for worship, praise, and the Word of God. This week: 'Ubuntu - Walking Together in Faith'",
            "event_type": "service",
            "start_datetime": now + timedelta(days=1, hours=9),
            "end_datetime": now + timedelta(days=1, hours=11),
            "location": "Main Sanctuary - Sandton",
            "capacity": 500,
            "is_public": True,
            "allow_self_checkin": True,
        },
        {
            "title": "Intsha Youth Night",
            "description": "Braai, games, worship, and fellowship for our youth. Theme: Identity in Christ",
            "event_type": "special",
            "start_datetime": now + timedelta(days=3, hours=18),
            "end_datetime": now + timedelta(days=3, hours=21),
            "location": "Youth Center - Midrand",
            "capacity": 80,
            "is_public": True,
            "allow_self_checkin": True,
        },
        {
            "title": "Prayer & Fasting Week",
            "description": "Join the church for a week of dedicated prayer and fasting. Morning prayers at 5am daily.",
            "event_type": "special",
            "start_datetime": now + timedelta(days=7),
            "end_datetime": now + timedelta(days=14),
            "location": "Prayer Room - Rosebank",
            "is_public": True,
            "allow_self_checkin": False,
        },
        {
            "title": "Marriage Enrichment Seminar",
            "description": "Strengthen your marriage with biblical principles. Guest speaker: Pastor Thabo Mokoena",
            "event_type": "conference",
            "start_datetime": now + timedelta(days=10, hours=9),
            "end_datetime": now + timedelta(days=10, hours=16),
            "location": "Centurion Conference Center",
            "capacity": 50,
            "is_public": True,
            "allow_self_checkin": True,
        },
        {
            "title": "Alexandra Community Outreach",
            "description": "Serving our community through food parcels, blankets, and prayer in Alexandra township.",
            "event_type": "special",
            "start_datetime": now + timedelta(days=14, hours=8),
            "end_datetime": now + timedelta(days=14, hours=14),
            "location": "Alexandra Community Center",
            "capacity": 50,
            "is_public": True,
            "allow_self_checkin": False,
        },
        {
            "title": "Soweto Young Adults Cell Meeting",
            "description": "Weekly gathering of the Soweto Young Adults cell group. Potjie and fellowship!",
            "event_type": "cell_meeting",
            "start_datetime": now + timedelta(days=5, hours=10),
            "end_datetime": now + timedelta(days=5, hours=12),
            "location": "Soweto Community Hall",
            "capacity": 25,
            "is_public": False,
            "allow_self_checkin": True,
        },
        {
            "title": "Easter Celebration Service",
            "description": "A special celebration of the resurrection of our Lord Jesus Christ. Combined choir performance.",
            "event_type": "service",
            "start_datetime": now + timedelta(days=60, hours=9),
            "end_datetime": now + timedelta(days=60, hours=12),
            "location": "Main Sanctuary - Sandton",
            "capacity": 800,
            "is_public": True,
            "allow_self_checkin": True,
        },
        {
            "title": "Leadership Training Conference",
            "description": "Equipping our cell leaders and ministry heads for effective service. Lunch provided.",
            "event_type": "conference",
            "start_datetime": now + timedelta(days=21, hours=9),
            "end_datetime": now + timedelta(days=21, hours=17),
            "location": "Conference Room - Fourways",
            "capacity": 40,
            "is_public": False,
            "allow_self_checkin": True,
        },
        {
            "title": "Heritage Day Celebration",
            "description": "Celebrating our diverse South African heritage with traditional food, music, and testimonies.",
            "event_type": "special",
            "start_datetime": now + timedelta(days=30, hours=11),
            "end_datetime": now + timedelta(days=30, hours=16),
            "location": "Church Grounds - Sandton",
            "capacity": 300,
            "is_public": True,
            "allow_self_checkin": True,
        },
        {
            "title": "Couples Retreat - Drakensberg",
            "description": "A weekend getaway for married couples to reconnect and grow spiritually together.",
            "event_type": "conference",
            "start_datetime": now + timedelta(days=45, hours=14),
            "end_datetime": now + timedelta(days=47, hours=12),
            "location": "Drakensberg Resort",
            "capacity": 30,
            "is_public": False,
            "allow_self_checkin": True,
        },
    ]

    events = []
    for data in events_data:
        event = Event(
            id=uuid.uuid4(),
            title=data["title"],
            description=data["description"],
            event_type=data["event_type"],
            start_datetime=data["start_datetime"],
            end_datetime=data.get("end_datetime"),
            location=data.get("location"),
            capacity=data.get("capacity"),
            is_public=data.get("is_public", True),
            allow_self_checkin=data.get("allow_self_checkin", False),
            is_recurring=False,
            is_cancelled=False,
            created_by=user_id,
        )

        # Generate QR token if self check-in enabled
        if event.allow_self_checkin:
            event.generate_qr_token()

        db.add(event)
        events.append(event)

    db.commit()
    print(f"  Created {len(events)} events")
    return events


def seed_attendance(db, events, members, user_id):
    """Create sample attendance records for past events."""
    print("Creating attendance records...")

    import random

    count = 0
    # Only add attendance to past events
    past_events = [e for e in events if e.start_datetime < datetime.utcnow()]

    for event in past_events:
        # Random selection of members attended (60-90% attendance)
        num_attendees = random.randint(
            int(len(members) * 0.6),
            min(int(len(members) * 0.9), event.capacity or len(members)),
        )
        attendees = random.sample(members, min(num_attendees, len(members)))

        for member in attendees:
            # Random check-in time within event duration
            check_in_time = event.start_datetime + timedelta(
                minutes=random.randint(0, 30)
            )

            attendance = Attendance(
                id=uuid.uuid4(),
                event_id=event.id,
                member_id=member.id,
                checked_in_at=check_in_time,
                check_in_method=random.choice(["manual", "self", "qr"]),
                checked_in_by=user_id,
            )
            db.add(attendance)
            count += 1

    db.commit()
    print(f"  Created {count} attendance records")


def main():
    print("\n=== Seeding Phase 2 Demo Data ===\n")

    db = SessionLocal()

    try:
        # Check if we already have data
        existing_cells = db.query(Cell).count()
        existing_events = db.query(Event).count()

        if existing_cells > 0 or existing_events > 0:
            print(
                f"Found existing data: {existing_cells} cells, {existing_events} events"
            )
            response = input("Do you want to continue and add more data? (y/N): ")
            if response.lower() != "y":
                print("Aborted.")
                return

        # Get existing members
        members = db.query(Member).filter(Member.member_status == "active").all()
        print(f"Found {len(members)} active members")

        if len(members) < 5:
            print("Warning: Not enough members for full demo. Creating basic data...")

        # Get a user ID for created_by fields
        from app.models import User

        admin_user = db.query(User).filter(User.role == "admin").first()
        user_id = admin_user.id if admin_user else None

        # Seed cells if none exist
        if existing_cells == 0:
            cells = seed_cells(db, members)
            if len(members) > 5:
                seed_cell_members(db, cells, members)
        else:
            cells = db.query(Cell).all()
            print(f"  Using existing {len(cells)} cells")

        # Seed events if none exist
        if existing_events == 0:
            events = seed_events(db, user_id)
            if len(members) > 0:
                seed_attendance(db, events, members, user_id)
        else:
            print(f"  Using existing {existing_events} events")

        print("\n=== Seeding Complete ===\n")

        # Summary
        print("Summary:")
        print(f"  - Cells: {db.query(Cell).count()}")
        print(f"  - Cell Members: {db.query(CellMember).count()}")
        print(f"  - Events: {db.query(Event).count()}")
        print(f"  - Attendance Records: {db.query(Attendance).count()}")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
