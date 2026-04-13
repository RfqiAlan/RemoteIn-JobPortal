from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional
from schemas.user import UserResponse

class JobCreate(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    description: str = Field(..., min_length=10)
    company: str = Field(..., min_length=2, max_length=100)
    location: str = Field(default="Remote", max_length=100)
    salary_min: Optional[int] = Field(default=None, ge=0)
    salary_max: Optional[int] = Field(default=None, ge=0)

class JobUpdate(BaseModel):
    title: Optional[str] = Field(default=None, min_length=3, max_length=100)
    description: Optional[str] = Field(default=None, min_length=10)
    company: Optional[str] = Field(default=None, min_length=2, max_length=100)
    location: Optional[str] = Field(default=None, max_length=100)
    salary_min: Optional[int] = Field(default=None, ge=0)
    salary_max: Optional[int] = Field(default=None, ge=0)
    is_active: Optional[bool] = None

class JobResponse(BaseModel):
    id: int
    title: str
    description: str
    company: str
    location: str
    salary_min: Optional[int]
    salary_max: Optional[int]
    is_active: bool
    posted_by: int
    created_at: datetime
    owner: UserResponse

    model_config = {"from_attributes": True}
