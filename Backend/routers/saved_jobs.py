from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.user import User
from models.saved_job import SavedJob
from schemas.saved_job import SavedJobCreate, SavedJobResponse
from auth.dependencies import get_current_user

router = APIRouter(prefix="/saved-jobs", tags=["Saved Jobs"])

@router.post("", response_model=SavedJobResponse, status_code=status.HTTP_201_CREATED)
def save_job(payload: SavedJobCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(SavedJob).filter(SavedJob.user_id == current_user.id)
    if payload.job_id:
        query = query.filter(SavedJob.job_id == payload.job_id)
    else:
        query = query.filter(SavedJob.external_job_id == payload.external_job_id)
        
    existing = query.first()
    if existing:
        raise HTTPException(status_code=400, detail="Job is already saved")
        
    saved_job = SavedJob(**payload.model_dump(), user_id=current_user.id)
    db.add(saved_job)
    db.commit()
    db.refresh(saved_job)
    return saved_job

@router.get("", response_model=List[SavedJobResponse])
def get_saved_jobs(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(SavedJob).filter(SavedJob.user_id == current_user.id).all()

@router.delete("/{saved_job_id}", status_code=status.HTTP_200_OK)
def unsave_job(saved_job_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    saved_job = db.query(SavedJob).filter(SavedJob.id == saved_job_id).first()
    if not saved_job:
        raise HTTPException(status_code=404, detail="Saved job not found")
    if saved_job.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to remove this saved job")
        
    db.delete(saved_job)
    db.commit()
    return {"message": "Job unsaved successfully"}
