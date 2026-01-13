"""Seed script for donation demo data with South African context.

Run from backend directory:
    python scripts/seed_donations.py
"""

import random
import sys
from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import select

from app.core.database import SessionLocal
from app.models import Member
from app.models.finance import Donation, DonationCategory


def get_random_date(days_back: int = 180) -> date:
    """Get a random date within the past N days."""
    return date.today() - timedelta(days=random.randint(0, days_back))


def seed_donations():
    """Create demo donations with South African context."""
    db = SessionLocal()

    try:
        # Get existing categories
        categories = list(db.execute(select(DonationCategory)).scalars().all())
        if not categories:
            print("No donation categories found. Please run migration 004 first.")
            return

        category_map = {cat.name: cat.id for cat in categories}
        print(f"Found {len(categories)} donation categories")

        # Get existing members
        members = list(db.execute(select(Member)).scalars().all())
        if not members:
            print("No members found. Please run seed_members.py first.")
            return

        print(f"Found {len(members)} members")

        # Check if donations already exist
        existing = db.execute(select(Donation)).scalars().first()
        if existing:
            print("Donations already seeded. Skipping...")
            return

        # South African guest donor names
        sa_guest_donors = [
            ("Thabo Mbeki", "thabo.mbeki@gmail.com"),
            ("Precious Moloi", "precious.moloi@yahoo.com"),
            ("Sipho Dlamini", "sipho.dlamini@outlook.com"),
            ("Nomvula Mokonyane", "nomvula.m@gmail.com"),
            ("Kagiso Rabada", "kagiso.r@hotmail.com"),
            ("Zanele Mthembu", "zanele.mthembu@gmail.com"),
            ("Bongani Khumalo", "bongani.k@yahoo.com"),
            ("Lindiwe Sisulu", "lindiwe.s@outlook.com"),
            ("Mandla Nkosi", "mandla.nkosi@gmail.com"),
            ("Nokuthula Zulu", "nokuthula.z@icloud.com"),
        ]

        # Payment methods with weights
        payment_methods = [
            ("cash", 30),
            ("eft", 35),  # EFT very popular in SA
            ("bank_transfer", 20),
            ("card", 10),
            ("snapscan", 5),  # SnapScan QR payments
        ]

        # Donation amount ranges by category (in ZAR)
        amount_ranges = {
            "Tithe": (500, 15000),
            "Offering": (50, 2000),
            "Missions": (100, 5000),
            "Building Fund": (200, 10000),
            "Benevolence": (100, 3000),
            "Special Project": (500, 20000),
        }

        donations_data = []

        # Create member donations (tithes and offerings are recurring)
        for member in members:
            # Some members tithe regularly
            if random.random() < 0.7:  # 70% tithe
                num_tithes = random.randint(3, 6)
                for _ in range(num_tithes):
                    min_amt, max_amt = amount_ranges.get("Tithe", (500, 10000))
                    donations_data.append(
                        {
                            "member_id": member.id,
                            "donor_name": f"{member.first_name} {member.last_name}",
                            "donor_email": member.email,
                            "category_id": category_map.get("Tithe"),
                            "amount": Decimal(str(random.randint(min_amt, max_amt))),
                            "currency": "ZAR",
                            "payment_method": random.choices(
                                [p[0] for p in payment_methods],
                                weights=[p[1] for p in payment_methods],
                            )[0],
                            "donation_date": get_random_date(180),
                            "notes": None,
                        }
                    )

            # Most members give offerings
            if random.random() < 0.85:  # 85% give offerings
                num_offerings = random.randint(2, 8)
                for _ in range(num_offerings):
                    min_amt, max_amt = amount_ranges.get("Offering", (50, 2000))
                    donations_data.append(
                        {
                            "member_id": member.id,
                            "donor_name": f"{member.first_name} {member.last_name}",
                            "donor_email": member.email,
                            "category_id": category_map.get("Offering"),
                            "amount": Decimal(str(random.randint(min_amt, max_amt))),
                            "currency": "ZAR",
                            "payment_method": random.choices(
                                [p[0] for p in payment_methods],
                                weights=[p[1] for p in payment_methods],
                            )[0],
                            "donation_date": get_random_date(180),
                            "notes": None,
                        }
                    )

            # Some give to missions
            if random.random() < 0.3:
                min_amt, max_amt = amount_ranges.get("Missions", (100, 5000))
                donations_data.append(
                    {
                        "member_id": member.id,
                        "donor_name": f"{member.first_name} {member.last_name}",
                        "donor_email": member.email,
                        "category_id": category_map.get("Missions"),
                        "amount": Decimal(str(random.randint(min_amt, max_amt))),
                        "currency": "ZAR",
                        "payment_method": random.choices(
                            [p[0] for p in payment_methods],
                            weights=[p[1] for p in payment_methods],
                        )[0],
                        "donation_date": get_random_date(120),
                        "notes": "Support for Cape Town outreach",
                    }
                )

            # Some give to building fund
            if random.random() < 0.25:
                min_amt, max_amt = amount_ranges.get("Building Fund", (200, 10000))
                donations_data.append(
                    {
                        "member_id": member.id,
                        "donor_name": f"{member.first_name} {member.last_name}",
                        "donor_email": member.email,
                        "category_id": category_map.get("Building Fund"),
                        "amount": Decimal(str(random.randint(min_amt, max_amt))),
                        "currency": "ZAR",
                        "payment_method": "bank_transfer",
                        "donation_date": get_random_date(90),
                        "notes": "New sanctuary fund",
                    }
                )

        # Add guest donations
        for donor_name, donor_email in sa_guest_donors:
            category_name = random.choice(["Offering", "Missions", "Benevolence"])
            min_amt, max_amt = amount_ranges.get(category_name, (100, 2000))
            donations_data.append(
                {
                    "member_id": None,
                    "donor_name": donor_name,
                    "donor_email": donor_email,
                    "category_id": category_map.get(category_name),
                    "amount": Decimal(str(random.randint(min_amt, max_amt))),
                    "currency": "ZAR",
                    "payment_method": random.choice(["cash", "eft", "card"]),
                    "donation_date": get_random_date(90),
                    "notes": "Guest donation - Sunday service",
                }
            )

        # Add some special project donations (Heritage Day, Youth Camp, etc.)
        special_projects = [
            ("Heritage Day Celebration", 5),
            ("Youth Camp 2026", 8),
            ("Community Feeding Scheme", 10),
            ("Church Band Equipment", 4),
        ]

        for project_name, num_donors in special_projects:
            donors = random.sample(members, min(num_donors, len(members)))
            for member in donors:
                min_amt, max_amt = amount_ranges.get("Special Project", (500, 20000))
                donations_data.append(
                    {
                        "member_id": member.id,
                        "donor_name": f"{member.first_name} {member.last_name}",
                        "donor_email": member.email,
                        "category_id": category_map.get("Special Project"),
                        "amount": Decimal(str(random.randint(min_amt, max_amt))),
                        "currency": "ZAR",
                        "payment_method": random.choice(
                            ["bank_transfer", "eft", "snapscan"]
                        ),
                        "donation_date": get_random_date(60),
                        "notes": project_name,
                    }
                )

        # Create donation records
        for data in donations_data:
            donation = Donation(**data, payment_status="completed")
            db.add(donation)

        db.commit()
        print(f"[OK] Created {len(donations_data)} donation records")

        # Print summary
        total_amount = sum(d["amount"] for d in donations_data)
        print("\nDonation Summary:")
        print(f"  Total Donations: {len(donations_data)}")
        print(f"  Total Amount: R{total_amount:,.2f}")
        print(f"  Average Donation: R{total_amount / len(donations_data):,.2f}")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed_donations()
