"""
Seed script to add attendance records for past events.
Run with: python -m scripts.seed_attendance
"""

import os
import random
import sys
import uuid
from datetime import datetime, timedelta

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models import Attendance, Event, Member
from app.models.user import User

# Create engine and session
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)


def main():
    print("\n=== Seeding Attendance Records ===\n")

    db = SessionLocal()

    try:
        # Get events and members
        now = datetime.utcnow()
        past_events = db.query(Event).filter(Event.start_datetime < now).all()
        members = db.query(Member).filter(Member.member_status == "active").all()

        print(f"Found {len(past_events)} past events")
        print(f"Found {len(members)} active members")

        if not past_events:
            print("No past events found.")
            return

        if not members:
            print("No members found.")
            return

        # Get admin user for checked_in_by
        admin_user = db.query(User).filter(User.role == "admin").first()
        user_id = admin_user.id if admin_user else None

        # Check existing attendance
        existing = db.query(Attendance).count()
        print(f"Existing attendance records: {existing}")

        # Get already recorded attendance to avoid duplicates
        existing_records = set()
        for att in db.query(Attendance).all():
            existing_records.add((att.event_id, att.member_id))

        count = 0
        for event in past_events:
            # Determine attendance rate based on event type
            if event.event_type == "service":
                min_rate, max_rate = 0.6, 0.85
            elif event.event_type == "cell_meeting":
                min_rate, max_rate = 0.7, 0.95
            else:
                min_rate, max_rate = 0.3, 0.6

            # Calculate number of attendees
            num_attendees = random.randint(
                int(len(members) * min_rate),
                min(int(len(members) * max_rate), event.capacity or len(members)),
            )

            # Select random attendees
            attendees = random.sample(members, min(num_attendees, len(members)))

            event_count = 0
            for member in attendees:
                # Skip if already recorded
                if (event.id, member.id) in existing_records:
                    continue

                # Random check-in time within event duration
                check_in_time = event.start_datetime + timedelta(
                    minutes=random.randint(0, 30)
                )

                attendance = Attendance(
                    id=uuid.uuid4(),
                    event_id=event.id,
                    member_id=member.id,
                    checked_in_at=check_in_time,
                    check_in_method=random.choice(["manual", "manual", "self", "qr"]),
                    checked_in_by=user_id,
                )
                db.add(attendance)
                count += 1
                event_count += 1
                existing_records.add((event.id, member.id))

            print(f"  {event.title}: {event_count} attendees")

        db.commit()
        print(f"\nTotal new attendance records: {count}")
        print(f"Total attendance records in DB: {db.query(Attendance).count()}")

        print("\n=== Complete ===\n")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
