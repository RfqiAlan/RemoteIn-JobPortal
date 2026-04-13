import asyncio
from datetime import datetime, timedelta
from typing import List, Optional

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from auth.dependencies import require_jobseeker
from database import SessionLocal, get_db
from models.external import ExternalJob as ExternalJobRecord
from models.external import ExternalSyncRequest, SyncRequestStatus
from models.user import User
from schemas.external import (
    AggregatedJobList,
    ExternalJob,
    ExternalJobList,
    SyncRequestResponse,
    SyncStatusResponse,
)
from services.external_api import fetch_arbeitnow, fetch_jobicy, fetch_remotive

router = APIRouter(prefix="/external", tags=["External Jobs"])

COOLDOWN_SECONDS = 600
SYNC_SOURCES = ("remotive", "arbeitnow", "jobicy")


def map_external_job(record: ExternalJobRecord) -> ExternalJob:
    return ExternalJob(
        id=f"{record.source}_{record.source_job_id}",
        title=record.title,
        company=record.company,
        location=record.location,
        tags=record.tags or [],
        salary=record.salary,
        url=record.url,
        source=record.source,
        published_at=record.published_at,
    )


def extract_source_job_id(external_id: str, source: str) -> str:
    prefix = f"{source}_"
    if external_id.startswith(prefix):
        return external_id[len(prefix):]
    return external_id


async def run_external_sync(sync_request_id: int) -> None:
    db = SessionLocal()
    sync_request = db.query(ExternalSyncRequest).filter(ExternalSyncRequest.id == sync_request_id).first()
    if sync_request is None:
        db.close()
        return

    try:
        sync_request.status = SyncRequestStatus.running
        sync_request.started_at = datetime.utcnow()
        sync_request.message = "Sinkronisasi sedang berjalan"
        db.commit()

        remotive_jobs, arbeitnow_jobs, jobicy_jobs = await asyncio.gather(
            fetch_remotive(limit=20),
            fetch_arbeitnow(limit=20),
            fetch_jobicy(count=20),
        )
        fetched_jobs = remotive_jobs + arbeitnow_jobs + jobicy_jobs
        seen_pairs = set()
        synced_at = datetime.utcnow()

        for external_job in fetched_jobs:
            source_job_id = extract_source_job_id(external_job.id, external_job.source)
            seen_pairs.add((external_job.source, source_job_id))

            existing = db.query(ExternalJobRecord).filter(
                ExternalJobRecord.source == external_job.source,
                ExternalJobRecord.source_job_id == source_job_id,
            ).first()

            if existing is None:
                existing = ExternalJobRecord(
                    source=external_job.source,
                    source_job_id=source_job_id,
                )
                db.add(existing)

            existing.title = external_job.title
            existing.company = external_job.company
            existing.location = external_job.location
            existing.tags = external_job.tags
            existing.salary = external_job.salary
            existing.url = external_job.url
            existing.published_at = external_job.published_at
            existing.is_active = True
            existing.last_synced_at = synced_at

        if seen_pairs:
            fetched_sources = {source for source, _ in seen_pairs}
            active_records = db.query(ExternalJobRecord).filter(
                ExternalJobRecord.source.in_(fetched_sources),
                ExternalJobRecord.is_active == True,  # noqa: E712
            ).all()

            for record in active_records:
                if (record.source, record.source_job_id) not in seen_pairs:
                    record.is_active = False
                    record.last_synced_at = synced_at

        sync_request.status = SyncRequestStatus.success
        sync_request.finished_at = datetime.utcnow()
        sync_request.total_jobs_processed = len(fetched_jobs)
        sync_request.message = f"Sinkronisasi selesai: {len(fetched_jobs)} job diproses."
        db.commit()

    except Exception as error:
        db.rollback()
        failed_request = db.query(ExternalSyncRequest).filter(ExternalSyncRequest.id == sync_request_id).first()
        if failed_request is not None:
            failed_request.status = SyncRequestStatus.failed
            failed_request.finished_at = datetime.utcnow()
            failed_request.message = f"Gagal sinkronisasi: {str(error)[:250]}"
            db.commit()

    finally:
        db.close()


@router.post(
    "/refresh-request",
    response_model=SyncRequestResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Jobseeker meminta refresh data external jobs (pakai cooldown)",
)
def create_refresh_request(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_jobseeker),
):
    latest_request = db.query(ExternalSyncRequest).filter(
        ExternalSyncRequest.requested_by == current_user.id
    ).order_by(ExternalSyncRequest.created_at.desc()).first()

    now = datetime.utcnow()
    if latest_request is not None:
        elapsed_seconds = int((now - latest_request.created_at).total_seconds())
        if elapsed_seconds < COOLDOWN_SECONDS:
            remaining_seconds = COOLDOWN_SECONDS - elapsed_seconds
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Cooldown aktif. Coba lagi dalam {remaining_seconds} detik.",
            )

    request_record = ExternalSyncRequest(
        requested_by=current_user.id,
        status=SyncRequestStatus.pending,
        message="Permintaan refresh diterima.",
    )
    db.add(request_record)
    db.commit()
    db.refresh(request_record)

    background_tasks.add_task(run_external_sync, request_record.id)

    return SyncRequestResponse(
        request_id=request_record.id,
        status=request_record.status.value,
        message=request_record.message or "Permintaan diterima.",
        cooldown_seconds=COOLDOWN_SECONDS,
        next_available_at=now + timedelta(seconds=COOLDOWN_SECONDS),
    )


@router.get(
    "/refresh-status/{request_id}",
    response_model=SyncStatusResponse,
    summary="Cek status refresh external jobs",
)
def get_refresh_status(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_jobseeker),
):
    request_record = db.query(ExternalSyncRequest).filter(
        ExternalSyncRequest.id == request_id
    ).first()
    if request_record is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Request refresh dengan ID {request_id} tidak ditemukan",
        )
    if request_record.requested_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kamu tidak punya akses ke request refresh ini",
        )

    return SyncStatusResponse(
        request_id=request_record.id,
        status=request_record.status.value,
        message=request_record.message,
        total_jobs_processed=request_record.total_jobs_processed,
        created_at=request_record.created_at,
        started_at=request_record.started_at,
        finished_at=request_record.finished_at,
    )


@router.get(
    "/aggregate",
    response_model=AggregatedJobList,
    summary="Ambil external jobs dari database hasil sinkronisasi",
)
def get_aggregated_jobs(
    limit: int = Query(default=10, ge=1, le=50, description="Jumlah job per sumber"),
    keyword: Optional[str] = Query(default=None, description="Filter keyword di judul atau company"),
    db: Session = Depends(get_db),
):
    all_jobs: List[ExternalJob] = []
    active_sources: List[str] = []

    for source in SYNC_SOURCES:
        query = db.query(ExternalJobRecord).filter(
            ExternalJobRecord.source == source,
            ExternalJobRecord.is_active == True,  # noqa: E712
        )

        if keyword:
            keyword_like = f"%{keyword}%"
            query = query.filter(
                or_(
                    ExternalJobRecord.title.ilike(keyword_like),
                    ExternalJobRecord.company.ilike(keyword_like),
                )
            )

        source_records = query.order_by(ExternalJobRecord.updated_at.desc()).limit(limit).all()
        if source_records:
            active_sources.append(source)
            all_jobs.extend(map_external_job(record) for record in source_records)

    return AggregatedJobList(
        total=len(all_jobs),
        sources=active_sources,
        jobs=all_jobs,
    )


@router.get(
    "/remotive",
    response_model=ExternalJobList,
    summary="Ambil loker remotive dari database hasil sinkronisasi",
)
def get_remotive_jobs(limit: int = Query(default=20, ge=1, le=100), db: Session = Depends(get_db)):
    records = db.query(ExternalJobRecord).filter(
        ExternalJobRecord.source == "remotive",
        ExternalJobRecord.is_active == True,  # noqa: E712
    ).order_by(ExternalJobRecord.updated_at.desc()).limit(limit).all()
    jobs = [map_external_job(record) for record in records]
    return ExternalJobList(source="remotive", total=len(jobs), jobs=jobs)


@router.get(
    "/arbeitnow",
    response_model=ExternalJobList,
    summary="Ambil loker arbeitnow dari database hasil sinkronisasi",
)
def get_arbeitnow_jobs(limit: int = Query(default=20, ge=1, le=100), db: Session = Depends(get_db)):
    records = db.query(ExternalJobRecord).filter(
        ExternalJobRecord.source == "arbeitnow",
        ExternalJobRecord.is_active == True,  # noqa: E712
    ).order_by(ExternalJobRecord.updated_at.desc()).limit(limit).all()
    jobs = [map_external_job(record) for record in records]
    return ExternalJobList(source="arbeitnow", total=len(jobs), jobs=jobs)


@router.get(
    "/jobicy",
    response_model=ExternalJobList,
    summary="Ambil loker jobicy dari database hasil sinkronisasi",
)
def get_jobicy_jobs(limit: int = Query(default=20, ge=1, le=100), db: Session = Depends(get_db)):
    records = db.query(ExternalJobRecord).filter(
        ExternalJobRecord.source == "jobicy",
        ExternalJobRecord.is_active == True,  # noqa: E712
    ).order_by(ExternalJobRecord.updated_at.desc()).limit(limit).all()
    jobs = [map_external_job(record) for record in records]
    return ExternalJobList(source="jobicy", total=len(jobs), jobs=jobs)
