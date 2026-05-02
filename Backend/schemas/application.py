from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from models.application import ApplicationStatus

# Using ForwardRefs or string annotations if circular imports happen, but let's just return basic info first
# and add specific detailed schemas if needed.

class ApplicationBase(BaseModel):
    cover_letter: Optional[str] = None

class ApplicationCreate(ApplicationBase):
    job_id: int

class ApplicationUpdateStatus(BaseModel):
    status: ApplicationStatus

class ApplicationResponse(ApplicationBase):
    id: int
    job_id: int
    user_id: int
    status: ApplicationStatus
    applied_at: datetime

    model_config = {"from_attributes": True}
