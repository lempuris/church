"""
Seed script for Phase 3 demo data (Sermons, Prayer Requests, Testimonies).
Run with: python -m scripts.seed_phase3
"""

import os
import random
import sys
import uuid
from datetime import datetime, timedelta

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
load_dotenv()

from app.core.config import settings  # noqa: E402
from app.models import Member, User  # noqa: E402
from app.models.content import (  # noqa: E402
    PrayerInteraction,
    PrayerRequest,
    Sermon,
    SermonSeries,
    Testimony,
)

# Create engine and session
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)


def seed_sermon_series(db):
    """Create sermon series."""
    print("Creating sermon series...")

    series_data = [
        {
            "title": "Ubuntu - Walking Together",
            "description": "A powerful series exploring the African philosophy of Ubuntu - 'I am because we are' - through the lens of Christian community and brotherhood.",
            "start_date": datetime.now().date() - timedelta(days=60),
            "end_date": datetime.now().date() - timedelta(days=30),
            "is_active": False,
        },
        {
            "title": "Faith Over Fear",
            "description": "In uncertain times, learn how to anchor your trust in God's promises. Practical teachings on overcoming anxiety and walking in faith.",
            "start_date": datetime.now().date() - timedelta(days=21),
            "is_active": True,
        },
        {
            "title": "The Beatitudes",
            "description": "Jesus' revolutionary teachings from the Sermon on the Mount. Discover the pathway to true blessing and kingdom living.",
            "start_date": datetime.now().date() + timedelta(days=14),
            "is_active": True,
        },
        {
            "title": "Family Foundations",
            "description": "Building strong Christian families in modern South Africa. Marriage, parenting, and generational blessing.",
            "start_date": datetime.now().date() - timedelta(days=90),
            "end_date": datetime.now().date() - timedelta(days=60),
            "is_active": False,
        },
    ]

    series_list = []
    for data in series_data:
        series = SermonSeries(
            id=uuid.uuid4(),
            title=data["title"],
            description=data["description"],
            start_date=data.get("start_date"),
            end_date=data.get("end_date"),
            is_active=data.get("is_active", True),
        )
        db.add(series)
        series_list.append(series)

    db.commit()
    print(f"  Created {len(series_list)} sermon series")
    return series_list


def seed_sermons(db, series_list, members):
    """Create sample sermons."""
    print("Creating sermons...")

    # Get some members to be speakers
    speakers = members[:5] if len(members) >= 5 else members

    sermons_data = [
        # Ubuntu series (past, published)
        {
            "title": "Ubuntu: I Am Because We Are",
            "description": "The foundational message of Ubuntu and how it reflects the body of Christ. No man is an island - we need each other.",
            "scripture_reference": "1 Corinthians 12:12-27",
            "sermon_date": datetime.now().date() - timedelta(days=56),
            "series_index": 0,
            "is_published": True,
            "view_count": 245,
        },
        {
            "title": "Ubuntu: Bearing One Another's Burdens",
            "description": "How the Ubuntu spirit calls us to carry each other through difficult seasons. Practical ways to support your church family.",
            "scripture_reference": "Galatians 6:2",
            "sermon_date": datetime.now().date() - timedelta(days=49),
            "series_index": 0,
            "is_published": True,
            "view_count": 198,
        },
        {
            "title": "Ubuntu: Forgiveness and Reconciliation",
            "description": "Learning from South Africa's journey of reconciliation. The power of forgiveness in community.",
            "scripture_reference": "Colossians 3:13",
            "sermon_date": datetime.now().date() - timedelta(days=42),
            "series_index": 0,
            "is_published": True,
            "view_count": 312,
        },
        # Faith Over Fear series (current)
        {
            "title": "Faith Over Fear: The Foundation",
            "description": "Understanding the nature of fear and how faith in God's character can transform our response to life's challenges.",
            "scripture_reference": "Isaiah 41:10",
            "sermon_date": datetime.now().date() - timedelta(days=21),
            "series_index": 1,
            "is_published": True,
            "view_count": 156,
        },
        {
            "title": "Faith Over Fear: When the Storm Rages",
            "description": "Like the disciples on the boat, we all face storms. Learn to keep your eyes on Jesus when circumstances overwhelm.",
            "scripture_reference": "Matthew 14:22-33",
            "sermon_date": datetime.now().date() - timedelta(days=14),
            "series_index": 1,
            "is_published": True,
            "view_count": 189,
        },
        {
            "title": "Faith Over Fear: Trust in Economic Uncertainty",
            "description": "South Africa faces economic challenges, but God is our provider. Practical faith for financial anxiety.",
            "scripture_reference": "Philippians 4:19",
            "sermon_date": datetime.now().date() - timedelta(days=7),
            "series_index": 1,
            "is_published": True,
            "view_count": 234,
        },
        {
            "title": "Faith Over Fear: Facing the Future",
            "description": "The final message in our series. God holds our future - step forward in confidence!",
            "scripture_reference": "Jeremiah 29:11",
            "sermon_date": datetime.now().date(),
            "series_index": 1,
            "is_published": False,  # Draft - today's sermon
            "view_count": 0,
        },
        # Standalone sermons
        {
            "title": "Christmas Message: Emmanuel - God With Us",
            "description": "A special Christmas message celebrating the incarnation of Christ and His presence with us always.",
            "scripture_reference": "Matthew 1:23",
            "sermon_date": datetime.now().date() - timedelta(days=30),
            "series_index": None,
            "is_published": True,
            "view_count": 425,
        },
        {
            "title": "New Year's Service: Fresh Start",
            "description": "Beginning the year with renewed purpose. Setting spiritual goals and pressing forward.",
            "scripture_reference": "Philippians 3:13-14",
            "sermon_date": datetime.now().date() - timedelta(days=14),
            "series_index": None,
            "is_published": True,
            "view_count": 367,
        },
        {
            "title": "Youth Sunday: Burning Bright",
            "description": "A message for our young people - don't let anyone look down on you because you are young!",
            "scripture_reference": "1 Timothy 4:12",
            "sermon_date": datetime.now().date() - timedelta(days=35),
            "series_index": None,
            "is_published": True,
            "view_count": 178,
        },
    ]

    sermons = []
    for i, data in enumerate(sermons_data):
        speaker = speakers[i % len(speakers)] if speakers else None

        sermon = Sermon(
            id=uuid.uuid4(),
            title=data["title"],
            description=data["description"],
            speaker_id=speaker.id if speaker else None,
            speaker_name=f"{speaker.first_name} {speaker.last_name}"
            if speaker
            else "Guest Speaker",
            series_id=series_list[data["series_index"]].id
            if data["series_index"] is not None
            else None,
            sermon_date=data["sermon_date"],
            scripture_reference=data["scripture_reference"],
            duration_seconds=random.randint(2400, 3600),  # 40-60 minutes
            view_count=data["view_count"],
            is_published=data["is_published"],
            published_at=datetime.utcnow() - timedelta(days=random.randint(1, 30))
            if data["is_published"]
            else None,
        )
        db.add(sermon)
        sermons.append(sermon)

    db.commit()
    print(f"  Created {len(sermons)} sermons")
    return sermons


def seed_prayer_requests(db, members):
    """Create sample prayer requests."""
    print("Creating prayer requests...")

    prayer_data = [
        # Approved public requests
        {
            "title": "Healing for my mother",
            "description": "My mother has been diagnosed with diabetes and is struggling with her health. Please pray for her healing and strength during this time. She has been a pillar of faith in our family.",
            "is_anonymous": False,
            "is_public": True,
            "status": "approved",
            "prayer_count": 45,
        },
        {
            "title": "Job opportunity",
            "description": "I have been unemployed for 8 months now. Please pray that God opens doors for employment. I have a family to support and trust in His provision.",
            "is_anonymous": True,
            "is_public": True,
            "status": "approved",
            "prayer_count": 67,
        },
        {
            "title": "Marriage restoration",
            "description": "My husband and I have been going through a difficult season. We both want to reconcile but need God's intervention. Pray for healing and restoration of our marriage.",
            "is_anonymous": True,
            "is_public": True,
            "status": "approved",
            "prayer_count": 89,
        },
        {
            "title": "Children's safety",
            "description": "With the increase in crime in our area, I ask for prayer for the safety of all our children as they travel to school and back. May God's angels guard them.",
            "is_anonymous": False,
            "is_public": True,
            "status": "approved",
            "prayer_count": 112,
        },
        {
            "title": "Spiritual growth",
            "description": "I want to go deeper in my relationship with God. Please pray that I develop a consistent prayer life and love for His Word.",
            "is_anonymous": False,
            "is_public": True,
            "status": "approved",
            "prayer_count": 34,
        },
        # Answered prayers
        {
            "title": "Successful surgery",
            "description": "My father needed heart surgery. We prayed and trusted God through the process.",
            "is_anonymous": False,
            "is_public": True,
            "status": "answered",
            "prayer_count": 78,
            "answer_testimony": "Praise God! The surgery was successful and my father is recovering well. The doctors said it went better than expected. Thank you all for your prayers!",
        },
        {
            "title": "University acceptance",
            "description": "My daughter applied to study medicine at Wits University. We prayed for favor.",
            "is_anonymous": False,
            "is_public": True,
            "status": "answered",
            "prayer_count": 56,
            "answer_testimony": "She got accepted! Not only that, but she also received a bursary. God is faithful! We are so grateful for this church family.",
        },
        # Pending requests
        {
            "title": "Strength during exams",
            "description": "Final exams are coming up. Please pray for clarity of mind and peace.",
            "is_anonymous": False,
            "is_public": True,
            "status": "pending",
            "prayer_count": 0,
        },
        {
            "title": "Business breakthrough",
            "description": "Started a small business and need God's favor for customers and growth.",
            "is_anonymous": True,
            "is_public": True,
            "status": "pending",
            "prayer_count": 0,
        },
        # Private request
        {
            "title": "Personal struggle",
            "description": "Going through a very personal struggle that I can't share publicly. Please just pray for breakthrough.",
            "is_anonymous": True,
            "is_public": False,
            "status": "approved",
            "prayer_count": 12,
        },
    ]

    prayers = []
    available_members = members[:8] if len(members) >= 8 else members

    for i, data in enumerate(prayer_data):
        member = (
            available_members[i % len(available_members)]
            if available_members and not data["is_anonymous"]
            else None
        )

        prayer = PrayerRequest(
            id=uuid.uuid4(),
            member_id=member.id if member else None,
            author_name=f"{member.first_name} {member.last_name}"
            if member and not data["is_anonymous"]
            else None,
            title=data["title"],
            description=data["description"],
            is_anonymous=data["is_anonymous"],
            is_public=data["is_public"],
            status=data["status"],
            prayer_count=data["prayer_count"],
            answered_at=datetime.utcnow() - timedelta(days=random.randint(1, 14))
            if data["status"] == "answered"
            else None,
            answer_testimony=data.get("answer_testimony"),
            created_at=datetime.utcnow() - timedelta(days=random.randint(1, 60)),
        )
        db.add(prayer)
        prayers.append(prayer)

    db.commit()
    print(f"  Created {len(prayers)} prayer requests")
    return prayers


def seed_prayer_interactions(db, prayers, members):
    """Create prayer interactions (people who prayed)."""
    print("Creating prayer interactions...")

    count = 0
    approved_prayers = [p for p in prayers if p.status in ["approved", "answered"]]

    for prayer in approved_prayers:
        # Random members who prayed
        num_prayers = min(prayer.prayer_count, len(members))
        praying_members = random.sample(members, num_prayers) if num_prayers > 0 else []

        for member in praying_members:
            interaction = PrayerInteraction(
                id=uuid.uuid4(),
                prayer_request_id=prayer.id,
                member_id=member.id,
                prayed_at=datetime.utcnow() - timedelta(days=random.randint(0, 30)),
            )
            db.add(interaction)
            count += 1

    db.commit()
    print(f"  Created {count} prayer interactions")


def seed_testimonies(db, members, admin_user_id):
    """Create sample testimonies."""
    print("Creating testimonies...")

    testimony_data = [
        # Approved and featured
        {
            "title": "God Healed My Marriage",
            "content": """After 15 years of marriage, my husband and I were on the brink of divorce. We had grown apart, stopped communicating, and lost hope.

A friend invited us to the Marriage Enrichment seminar at Thembani Church. We almost didn't go, but something pushed us. During that weekend, God broke down the walls between us. We learned to forgive past hurts and communicate again.

It's been two years now, and our marriage is stronger than ever. We lead a couples' cell group now and share our testimony to encourage others. If God can restore us, He can restore anyone!""",
            "category": "family",
            "status": "approved",
            "is_featured": True,
        },
        {
            "title": "From Addiction to Freedom",
            "content": """For 10 years, I was trapped in alcohol addiction. I lost my job, my family distanced themselves, and I was living on the streets. I had given up on life.

One cold winter night, I walked into Thembani Church for shelter. Instead of judgment, I found love. The church helped me into a rehabilitation program and walked with me through recovery.

Today, I have been sober for 3 years. I have a stable job, and my family has welcomed me back. Most importantly, I have a relationship with Jesus Christ. I am proof that no one is beyond God's reach.""",
            "category": "deliverance",
            "status": "approved",
            "is_featured": True,
        },
        {
            "title": "Miraculous Provision During Unemployment",
            "content": """When I lost my job during COVID, I didn't know how I would feed my three children. For 14 months, we survived only by God's grace.

Every time we ran out of food, something would happen - a neighbor would bring groceries, someone would send money, or the church food bank would have exactly what we needed. There were days when we had nothing in the morning, but by evening, our cupboards were full.

God used this season to teach me to trust Him completely. I now have a better job than before, and I will never doubt His faithfulness again.""",
            "category": "provision",
            "status": "approved",
            "is_featured": True,
        },
        # Approved, not featured
        {
            "title": "Healed from Chronic Pain",
            "content": """For 5 years, I suffered from chronic back pain that doctors couldn't fully explain or treat. I had tried everything - medication, physiotherapy, even considered surgery.

During a healing service, Pastor laid hands on me and prayed. I felt warmth in my back, but didn't think much of it. The next morning, I woke up without pain for the first time in years. That was 8 months ago, and the pain has never returned.

I know some may be skeptical, but I know what God did for me. He is still the same healing God!""",
            "category": "healing",
            "status": "approved",
            "is_featured": False,
        },
        {
            "title": "My Journey to Salvation",
            "content": """I grew up in church but never truly knew Jesus personally. Religion was just tradition to me. I lived my own way, chasing success and worldly pleasures.

Everything changed when I attended an Alpha course at Thembani. For the first time, I understood the Gospel - that Jesus died for ME. I surrendered my life to Him that night.

That was 2 years ago. My life has completely changed. I have purpose now. I have peace that I never had before. Jesus is real, and He saved me.""",
            "category": "salvation",
            "status": "approved",
            "is_featured": False,
        },
        {
            "title": "Dream Job Against All Odds",
            "content": """I applied for my dream job at a major company but was told I didn't have enough experience. I was devastated but kept praying.

Three months later, the same company called me. The person they hired had left, and they wanted to give me a chance. I've been in that position for a year now and just received a promotion.

Never stop praying! God's timing is perfect.""",
            "category": "career",
            "status": "approved",
            "is_featured": False,
        },
        # Pending testimonies
        {
            "title": "God Protected My Family in a Break-in",
            "content": """Last month, robbers tried to break into our home while we were sleeping. My husband heard a noise and woke up. When he shouted, the robbers fled without taking anything or harming us.

We later learned they had broken into three other houses that same night and injured people. We believe God protected us because we had been praying for safety over our home.""",
            "category": "other",
            "status": "pending",
            "is_featured": False,
        },
        {
            "title": "Successful Cancer Treatment",
            "content": """Diagnosed with breast cancer last year. After surgery, chemotherapy, and much prayer, I am now cancer-free! The doctors are amazed at how well I responded to treatment. I give all glory to God.""",
            "category": "healing",
            "status": "pending",
            "is_featured": False,
        },
    ]

    testimonies = []
    available_members = members[:8] if len(members) >= 8 else members

    for i, data in enumerate(testimony_data):
        member = (
            available_members[i % len(available_members)] if available_members else None
        )

        testimony = Testimony(
            id=uuid.uuid4(),
            member_id=member.id if member else None,
            author_name=f"{member.first_name} {member.last_name}"
            if member
            else "Anonymous",
            title=data["title"],
            content=data["content"],
            category=data["category"],
            status=data["status"],
            is_featured=data["is_featured"],
            approved_by=admin_user_id if data["status"] == "approved" else None,
            approved_at=datetime.utcnow() - timedelta(days=random.randint(1, 30))
            if data["status"] == "approved"
            else None,
            created_at=datetime.utcnow() - timedelta(days=random.randint(1, 90)),
        )
        db.add(testimony)
        testimonies.append(testimony)

    db.commit()
    print(f"  Created {len(testimonies)} testimonies")
    return testimonies


def main():
    print("\n=== Seeding Phase 3 Demo Data ===\n")

    db = SessionLocal()

    try:
        # Check if we already have data
        existing_sermons = db.query(Sermon).count()
        existing_prayers = db.query(PrayerRequest).count()
        existing_testimonies = db.query(Testimony).count()

        if existing_sermons > 0 or existing_prayers > 0 or existing_testimonies > 0:
            print(
                f"Found existing data: {existing_sermons} sermons, {existing_prayers} prayers, {existing_testimonies} testimonies"
            )
            response = input("Do you want to continue and add more data? (y/N): ")
            if response.lower() != "y":
                print("Aborted.")
                return

        # Get existing members
        members = db.query(Member).filter(Member.member_status == "active").all()
        print(f"Found {len(members)} active members")

        # Get admin user for approved_by fields
        admin_user = db.query(User).filter(User.role == "admin").first()
        admin_user_id = admin_user.id if admin_user else None

        # Seed sermon series
        series_list = seed_sermon_series(db)

        # Seed sermons
        seed_sermons(db, series_list, members)

        # Seed prayer requests
        prayers = seed_prayer_requests(db, members)

        # Seed prayer interactions
        if members:
            seed_prayer_interactions(db, prayers, members)

        # Seed testimonies
        seed_testimonies(db, members, admin_user_id)

        print("\n=== Seeding Complete ===\n")

        # Summary
        print("Summary:")
        print(f"  - Sermon Series: {db.query(SermonSeries).count()}")
        print(f"  - Sermons: {db.query(Sermon).count()}")
        print(f"  - Prayer Requests: {db.query(PrayerRequest).count()}")
        print(f"  - Prayer Interactions: {db.query(PrayerInteraction).count()}")
        print(f"  - Testimonies: {db.query(Testimony).count()}")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
