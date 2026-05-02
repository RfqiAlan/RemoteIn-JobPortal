from database import SessionLocal
from models.user import User, RoleEnum
from models.job import Job
from routers.auth import hash_password
from models.external import ExternalSyncRequest
from models.profile import UserProfile
from models.application import Application
from models.saved_job import SavedJob

def seed_data():
    db = SessionLocal()
    
    admin_exists = db.query(User).filter(User.email == "admin@remotein.com").first()
    if not admin_exists:
        print("Seeding admin user...")
        admin = User(
            name="Super Admin",
            email="admin@remotein.com",
            hashed_password=hash_password("admin123"),
            role=RoleEnum.admin
        )
        db.add(admin)
        db.commit()

    if db.query(User).count() > 1:
        print("Data seem to already exist in 'users' table. Skipping seeding other dummy data.")
        db.close()
        return

    print("Seeding dummy users...")
    user1 = User(
        name="Steve Jobs",
        email="employer@example.com",
        hashed_password=hash_password("password123"),
        role=RoleEnum.employer
    )
    user2 = User(
        name="Mark Zuck",
        email="employer2@example.com",
        hashed_password=hash_password("password123"),
        role=RoleEnum.employer
    )
    user3 = User(
        name="John Jobseeker",
        email="john@example.com",
        hashed_password=hash_password("password123"),
        role=RoleEnum.jobseeker
    )
    
    db.add(user1)
    db.add(user2)
    db.add(user3)
    db.commit()
    db.refresh(user1)
    db.refresh(user2)
    
    print("Seeding dummy jobs...")
    jobs = [
        Job(
            title="Senior Python Backend Developer",
            description="We are looking for an experienced Python developer to build scalable backend systems using FastAPI and SQLAlchemy.",
            company="Apple Tech Integrations",
            location="Remote",
            salary_min=7000,
            salary_max=12000,
            posted_by=user1.id
        ),
        Job(
            title="Frontend React Engineer",
            description="Join our team to build dynamic un-opinionated frontend applications using React and Next.js.",
            company="Apple Tech Integrations",
            location="Remote (US / Europe Only)",
            salary_min=6000,
            salary_max=9000,
            posted_by=user1.id
        ),
        Job(
            title="UI/UX Designer",
            description="You have an eye for pixel perfection and experience using Figma, please apply!",
            company="Meta Global",
            location="Remote Worldwide",
            salary_min=4000,
            salary_max=7000,
            posted_by=user2.id
        ),
        Job(
            title="DevOps / Site Reliability Engineer",
            description="Looking for an experienced SRE to manage AWS infrastructure and CI/CD pipelines.",
            company="Meta Global",
            location="USA / Remote",
            salary_min=8000,
            salary_max=14000,
            posted_by=user2.id
        )
    ]
    
    for job in jobs:
        db.add(job)
        
    db.commit()
    
    print("Dummy data successfully seeded!")
    db.close()

if __name__ == "__main__":
    seed_data()
