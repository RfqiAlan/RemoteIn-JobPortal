from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.job import Job
from schemas.job import JobCreate, JobUpdate, JobResponse
from auth.dependencies import get_current_user, require_employer
from models.user import User

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get(
    "",
    response_model=List[JobResponse],
    summary="List semua job aktif (publik, tanpa auth)"
)
def get_jobs(db: Session = Depends(get_db)):
    jobs = db.query(Job).filter(Job.is_active == True).order_by(Job.created_at.desc()).all()
    return jobs


@router.get(
    "/{job_id}",
    response_model=JobResponse,
    summary="Detail job berdasarkan ID (publik, tanpa auth)"
)
def get_job(job_id: int, db: Session = Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job dengan ID {job_id} tidak ditemukan"
        )
    return job


@router.post(
    "",
    response_model=JobResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Buat job baru (hanya employer, butuh token)"
)
def create_job(
    payload: JobCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_employer)
):
    if payload.salary_min and payload.salary_max:
        if payload.salary_min > payload.salary_max:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="salary_min tidak boleh lebih besar dari salary_max"
            )
    new_job = Job(
        **payload.model_dump(),
        posted_by=current_user.id
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job


@router.put(
    "/{job_id}",
    response_model=JobResponse,
    summary="Update job (hanya employer pemilik job, butuh token)"
)
def update_job(
    job_id: int,
    payload: JobUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_employer)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job dengan ID {job_id} tidak ditemukan"
        )
    if job.posted_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kamu tidak punya akses untuk mengubah job ini"
        )
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(job, key, value)
    db.commit()
    db.refresh(job)
    return job


@router.delete(
    "/{job_id}",
    status_code=status.HTTP_200_OK,
    summary="Hapus job (hanya employer pemilik job, butuh token)"
)
def delete_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_employer)
):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Job dengan ID {job_id} tidak ditemukan"
        )
    if job.posted_by != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Kamu tidak punya akses untuk menghapus job ini"
        )
    db.delete(job)
    db.commit()
    return {"message": f"Job '{job.title}' berhasil dihapus"}
