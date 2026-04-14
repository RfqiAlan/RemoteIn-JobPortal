from pydantic import BaseModel, EmailStr, Field
from datetime import datetime
from enum import Enum

class RoleEnum(str, Enum):
    jobseeker = "jobseeker"
    employer = "employer"

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)
    role: RoleEnum = RoleEnum.jobseeker

class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=72)

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: RoleEnum
    created_at: datetime

    model_config = {"from_attributes": True}

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
