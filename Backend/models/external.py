from datetime import datetime
import enum

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from database import Base


class SyncRequestStatus(str, enum.Enum):
    pending = "pending"
    running = "running"
    success = "success"
    failed = "failed"


class ExternalJob(Base):
    __tablename__ = "external_jobs"

    id = Column(Integer, primary_key=True, index=True)
    source = Column(String(50), nullable=False, index=True)
    source_job_id = Column(String(255), nullable=False)
    title = Column(String(255), nullable=False)
    company = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    tags = Column(JSON, default=list, nullable=False)
    salary = Column(String(255), nullable=True)
    url = Column(String(1000), nullable=False)
    published_at = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    last_synced_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint("source", "source_job_id", name="uq_external_source_job"),
    )


class ExternalSyncRequest(Base):
    __tablename__ = "external_sync_requests"

    id = Column(Integer, primary_key=True, index=True)
    requested_by = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    client_identifier = Column(String(255), nullable=True, index=True)  # IP or anonymous identifier
    status = Column(Enum(SyncRequestStatus), default=SyncRequestStatus.pending, nullable=False, index=True)
    message = Column(String(500), nullable=True)
    total_jobs_processed = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
