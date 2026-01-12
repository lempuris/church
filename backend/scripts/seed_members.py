"""
Seed script for demo members with South African names.
Run with: python -m scripts.seed_members
"""

import os
import random
import sys
import uuid
from datetime import date, timedelta

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models import Member

# Create engine and session
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)

# South African names
FIRST_NAMES_MALE = [
    "Thabo",
    "Sipho",
    "Mandla",
    "Bongani",
    "Kagiso",
    "Tshepo",
    "Lerato",
    "Mpho",
    "Johannes",
    "Pieter",
    "Willem",
    "Hendrik",
    "Francois",
    "Johan",
    "Andre",
    "Gerhard",
    "Sibusiso",
    "Siyabonga",
    "Themba",
    "Lungile",
    "Mthunzi",
    "Sandile",
    "Vusi",
    "Zweli",
    "David",
    "Michael",
    "James",
    "Peter",
    "John",
    "Daniel",
    "Samuel",
    "Joseph",
    "Tshegofatso",
    "Kabelo",
    "Kgosi",
    "Omphile",
    "Refilwe",
    "Tumelo",
    "Motheo",
    "Phenyo",
]

FIRST_NAMES_FEMALE = [
    "Nomvula",
    "Thandiwe",
    "Precious",
    "Lindiwe",
    "Nompumelelo",
    "Ayanda",
    "Nosipho",
    "Zanele",
    "Annette",
    "Marie",
    "Elsa",
    "Heidi",
    "Marietjie",
    "Sanette",
    "Lizette",
    "Chantal",
    "Naledi",
    "Palesa",
    "Dineo",
    "Kelebogile",
    "Boitumelo",
    "Mpho",
    "Lesedi",
    "Karabo",
    "Grace",
    "Faith",
    "Hope",
    "Joy",
    "Mercy",
    "Blessing",
    "Patience",
    "Prudence",
    "Bontle",
    "Keitumetse",
    "Refiloe",
    "Tshepiso",
    "Onthatile",
    "Kamogelo",
    "Oratile",
    "Neo",
]

LAST_NAMES = [
    "Molefe",
    "Dlamini",
    "Nkosi",
    "Ndlovu",
    "Mthembu",
    "Zulu",
    "Sithole",
    "Mahlangu",
    "van der Merwe",
    "Botha",
    "du Plessis",
    "Pretorius",
    "van Wyk",
    "Joubert",
    "Steyn",
    "Venter",
    "Mokoena",
    "Khumalo",
    "Ngwenya",
    "Maseko",
    "Cele",
    "Zwane",
    "Sibiya",
    "Radebe",
    "Williams",
    "Johnson",
    "Smith",
    "Brown",
    "Jacobs",
    "Petersen",
    "Adams",
    "Daniels",
    "Motsepe",
    "Ramaphosa",
    "Modise",
    "Tau",
    "Mogale",
    "Letsoalo",
    "Mabena",
    "Sekoto",
    "Mbeki",
    "Mandela",
    "Sisulu",
    "Tambo",
    "Biko",
    "Hani",
    "Sobukwe",
    "Luthuli",
]

LOCATIONS = [
    "Johannesburg",
    "Cape Town",
    "Pretoria",
    "Durban",
    "Soweto",
    "Sandton",
    "Centurion",
    "Midrand",
    "Randburg",
    "Rosebank",
    "Braamfontein",
    "Melville",
    "Parktown",
    "Fourways",
    "Kempton Park",
]

OCCUPATIONS = [
    "Teacher",
    "Nurse",
    "Engineer",
    "Accountant",
    "Doctor",
    "Software Developer",
    "Business Owner",
    "Pastor",
    "Social Worker",
    "Lawyer",
    "Pharmacist",
    "Architect",
    "Sales Manager",
    "Marketing Executive",
    "HR Manager",
    "Student",
    "Retired",
    "Homemaker",
    "Entrepreneur",
    "Civil Servant",
]


def generate_phone():
    """Generate a South African mobile number."""
    prefixes = [
        "071",
        "072",
        "073",
        "074",
        "076",
        "078",
        "079",
        "081",
        "082",
        "083",
        "084",
    ]
    return f"+27{random.choice(prefixes)[1:]}{random.randint(1000000, 9999999)}"


def generate_email(first_name, last_name):
    """Generate an email address."""
    domains = ["gmail.com", "yahoo.com", "outlook.com", "icloud.com", "mail.co.za"]
    clean_last = (
        last_name.lower().replace(" ", "").replace("van der ", "vd").replace("du ", "d")
    )
    return f"{first_name.lower()}.{clean_last}@{random.choice(domains)}"


def generate_dob(min_age=18, max_age=75):
    """Generate a date of birth."""
    today = date.today()
    age = random.randint(min_age, max_age)
    year = today.year - age
    month = random.randint(1, 12)
    day = random.randint(1, 28)
    return date(year, month, day)


def seed_members(db, count=50):
    """Create sample members."""
    print(f"Creating {count} members...")

    members = []
    used_emails = set()

    for i in range(count):
        # Alternate genders
        is_male = i % 2 == 0
        first_name = random.choice(FIRST_NAMES_MALE if is_male else FIRST_NAMES_FEMALE)
        last_name = random.choice(LAST_NAMES)

        # Generate unique email
        email = generate_email(first_name, last_name)
        while email in used_emails:
            email = generate_email(first_name, last_name)
            email = email.replace("@", f"{random.randint(1, 99)}@")
        used_emails.add(email)

        # Random join date in the past 5 years
        days_ago = random.randint(30, 5 * 365)
        join_date = date.today() - timedelta(days=days_ago)

        # Random baptism (75% are baptized)
        is_baptized = random.random() > 0.25
        baptism_date = (
            join_date - timedelta(days=random.randint(0, 365)) if is_baptized else None
        )

        member = Member(
            id=uuid.uuid4(),
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone=generate_phone(),
            date_of_birth=generate_dob(),
            gender="male" if is_male else "female",
            address_line1=f"{random.randint(1, 999)} {random.choice(['Main', 'Church', 'Park', 'Oak', 'Mandela'])} Street",
            city=random.choice(LOCATIONS),
            state="Gauteng",
            postal_code=str(random.randint(1000, 9999)),
            country="South Africa",
            join_date=join_date,
            member_status="active",
            baptism_date=baptism_date,
            notes=random.choice(
                [
                    "Active in worship ministry",
                    "Faithful tither",
                    "Youth group volunteer",
                    "New convert - needs discipleship",
                    "Choir member",
                    "Sunday school teacher",
                    "Usher",
                    "Prayer team member",
                    None,
                    None,
                    None,  # Some without notes
                ]
            ),
        )

        db.add(member)
        members.append(member)

        if (i + 1) % 10 == 0:
            print(f"  Created {i + 1} members...")

    db.commit()
    print(f"  Total: {len(members)} members created")
    return members


def main():
    print("\n=== Seeding South African Members ===\n")

    db = SessionLocal()

    try:
        # Check existing members
        existing = db.query(Member).count()
        print(f"Found {existing} existing members")

        # Create new members
        seed_members(db, count=50)

        print("\n=== Seeding Complete ===\n")
        print(f"Total members in database: {db.query(Member).count()}")

    except Exception as e:
        print(f"Error: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
