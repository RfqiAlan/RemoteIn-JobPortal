from sqlalchemy import Column, Integer, String, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base

class RoleEnum(str, enum.Enum):
    jobseeker = "jobseeker"
    employer = "employer"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.jobseeker, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relasi One-to-Many: satu User bisa punya banyak Job
    jobs = relationship("Job", back_populates="owner")
