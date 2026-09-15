"""
Netra AI - Database Seeding Script
Initializes test users, verified ophthalmologist records across India,
and baseline longitudinal patient history.
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from app.core.database import db
from app.services.doctor_recommender import DOCTORS_DATABASE

def seed_database():
    print("Seeding Netra AI Database...")
    db.seed_defaults()
    print(f"Users seeded: {len(db.data['users'])}")
    print(f"Verified Doctors available: {len(DOCTORS_DATABASE)}")
    print(f"Initial Screenings: {len(db.data['screenings'])}")
    print(f"Initial Appointments: {len(db.data['appointments'])}")
    print("Database seeding completed successfully!")

if __name__ == "__main__":
    seed_database()
