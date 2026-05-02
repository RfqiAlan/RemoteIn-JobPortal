from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from database import get_db
from models.user import User
from models.job import Job
from models.application import Application
from schemas.application import ApplicationCreate, ApplicationUpdateStatus, ApplicationResponse
from auth.dependencies import get_current_user, require_jobseeker, require_employer

router = APIRouter(prefix="/applications", tags=["Applications"])

@router.post("", response_model=ApplicationResponse, status_code=status.HTTP_201_CREATED)
def apply_for_job(payload: ApplicationCreate, db: Session = Depends(get_db), current_user: User = Depends(require_jobseeker)):
    job = db.query(Job).filter(Job.id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
        
    existing = db.query(Application).filter(
        Application.job_id == payload.job_id,
        Application.user_id == current_user.id
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="You have already applied for this job")
        
    application = Application(**payload.model_dump(), user_id=current_user.id)
    db.add(application)
    db.commit()
    db.refresh(application)
    return application

@router.get("/me", response_model=List[ApplicationResponse])
def get_my_applications(db: Session = Depends(get_db), current_user: User = Depends(require_jobseeker)):
    return db.query(Application).filter(Application.user_id == current_user.id).all()

@router.get("/job/{job_id}", response_model=List[ApplicationResponse])
def get_applications_for_job(job_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_employer)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.posted_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view these applications")
        
    return db.query(Application).filter(Application.job_id == job_id).all()

@router.patch("/{app_id}/status", response_model=ApplicationResponse)
def update_application_status(app_id: int, payload: ApplicationUpdateStatus, db: Session = Depends(get_db), current_user: User = Depends(require_employer)):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    job = db.query(Job).filter(Job.id == app.job_id).first()
    if job.posted_by != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this application")
        
    app.status = payload.status
    db.commit()
    db.refresh(app)
    return app
