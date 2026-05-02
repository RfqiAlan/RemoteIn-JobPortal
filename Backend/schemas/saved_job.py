from pydantic import BaseModel, model_validator
from typing import Optional
from datetime import datetime

class SavedJobCreate(BaseModel):
    job_id: Optional[int] = None
    external_job_id: Optional[int] = None

    @model_validator(mode='after')
    def check_at_least_one(self):
        if not self.job_id and not self.external_job_id:
            raise ValueError('Either job_id or external_job_id must be provided')
        if self.job_id and self.external_job_id:
            raise ValueError('Cannot save both internal and external job in a single record')
        return self

class SavedJobResponse(BaseModel):
    id: int
    user_id: int
    job_id: Optional[int]
    external_job_id: Optional[int]
    saved_at: datetime

    model_config = {"from_attributes": True}
