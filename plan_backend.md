# RemoteIn — Execution Plan for AI
> Baca dan eksekusi file ini secara berurutan. Jangan skip langkah apapun.
> Stack: FastAPI + SQLAlchemy + SQLite + JWT + Bcrypt
> Python 3.9+

---

## STEP 0 — Project Initialization

Buat folder root bernama `remotein` lalu masuk ke dalamnya. Buat struktur folder berikut secara lengkap:

```
remotein/
├── main.py
├── database.py
├── requirements.txt
├── README.md
├── models/
│   ├── __init__.py
│   ├── user.py
│   └── job.py
├── schemas/
│   ├── __init__.py
│   ├── user.py
│   └── job.py
├── routers/
│   ├── __init__.py
│   ├── auth.py
│   └── jobs.py
└── auth/
    ├── __init__.py
    ├── jwt_handler.py
    └── dependencies.py
```

Semua file `__init__.py` dibiarkan kosong kecuali disebutkan isinya.

---

## STEP 1 — requirements.txt

Buat file `requirements.txt` dengan isi berikut:

```
fastapi==0.111.0
uvicorn[standard]==0.29.0
sqlalchemy==2.0.30
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
pydantic[email]==2.7.1
python-multipart==0.0.9
```

---

## STEP 2 — database.py

Buat file `database.py` dengan isi berikut:

```python
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

DATABASE_URL = "sqlite:///./remotein.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

---

## STEP 3 — models/user.py

Buat file `models/user.py` dengan isi berikut:

```python
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
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(RoleEnum), default=RoleEnum.jobseeker, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relasi One-to-Many: satu User bisa punya banyak Job
    jobs = relationship("Job", back_populates="owner")
```

---

## STEP 4 — models/job.py

Buat file `models/job.py` dengan isi berikut:

```python
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(String, nullable=False)
    company = Column(String, nullable=False)
    location = Column(String, default="Remote")
    salary_min = Column(Integer, nullable=True)
    salary_max = Column(Integer, nullable=True)
    is_active = Column(Boolean, default=True)
    posted_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relasi Many-to-One: banyak Job dimiliki satu User
    owner = relationship("User", back_populates="jobs")
```

---

## STEP 5 — schemas/user.py

Buat file `schemas/user.py` dengan isi berikut:

```python
from pydantic import BaseModel, EmailStr
from datetime import datetime
from enum import Enum

class RoleEnum(str, Enum):
    jobseeker = "jobseeker"
    employer = "employer"

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: RoleEnum = RoleEnum.jobseeker

class UserLogin(BaseModel):
    email: EmailStr
    password: str

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
```

---

## STEP 6 — schemas/job.py

Buat file `schemas/job.py` dengan isi berikut:

```python
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
```

---

## STEP 7 — auth/jwt_handler.py

Buat file `auth/jwt_handler.py` dengan isi berikut:

```python
from datetime import datetime, timedelta
from jose import JWTError, jwt

SECRET_KEY = "remotein-secret-key-ganti-di-production"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 1 hari

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None
```

---

## STEP 8 — auth/dependencies.py

Buat file `auth/dependencies.py` dengan isi berikut:

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from auth.jwt_handler import decode_access_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token tidak valid atau sudah expired",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id: int = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception

    return user

def require_employer(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != "employer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hanya employer yang dapat mengakses endpoint ini"
        )
    return current_user
```

---

## STEP 9 — routers/auth.py

Buat file `routers/auth.py` dengan isi berikut:

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from passlib.context import CryptContext
from database import get_db
from models.user import User
from schemas.user import UserCreate, UserLogin, UserResponse, TokenResponse
from auth.jwt_handler import create_access_token
from auth.dependencies import get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Registrasi user baru"
)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email sudah terdaftar"
        )
    new_user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        role=payload.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post(
    "/login",
    response_model=TokenResponse,
    summary="Login dan dapatkan JWT token"
)
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email atau password salah"
        )
    token = create_access_token(data={"sub": str(user.id), "role": user.role})
    return {"access_token": token, "token_type": "bearer"}


@router.get(
    "/me",
    response_model=UserResponse,
    summary="Lihat profil user yang sedang login"
)
def get_me(current_user: User = Depends(get_current_user)):
    # Endpoint ini terproteksi JWT — wajib ada Bearer token di header
    return current_user
```

---

## STEP 10 — routers/jobs.py

Buat file `routers/jobs.py` dengan isi berikut:

```python
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
```

---

## STEP 11 — main.py

Buat file `main.py` dengan isi berikut:

```python
from fastapi import FastAPI
from database import engine, Base

# Import models sebelum create_all agar relasi terbaca dengan benar
from models import user, job

# Import routers
from routers import auth, jobs

# Buat semua tabel di database SQLite
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RemoteIn API",
    description="Platform lowongan kerja remote — RESTful API berbasis FastAPI",
    version="1.0.0"
)

# Daftarkan semua router
app.include_router(auth.router)
app.include_router(jobs.router)

@app.get("/", tags=["Root"])
def root():
    return {
        "app": "RemoteIn API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running"
    }
```

---

## STEP 12 — README.md

Buat file `README.md` dengan isi berikut:

```markdown
# RemoteIn API

Platform lowongan kerja remote dibangun dengan FastAPI.

## Tech Stack
- FastAPI
- SQLAlchemy + SQLite
- JWT Authentication (python-jose)
- Bcrypt Password Hashing (passlib)

## Cara Menjalankan

### 1. Install dependencies
pip install -r requirements.txt

### 2. Jalankan server
uvicorn main:app --reload

### 3. Buka Swagger UI
http://localhost:8000/docs

## Endpoint

### Auth
| Method | URL | Auth | Keterangan |
|--------|-----|------|------------|
| POST | /auth/register | Tidak | Registrasi user baru |
| POST | /auth/login | Tidak | Login, return JWT token |
| GET | /auth/me | JWT | Profil user yang login |

### Jobs
| Method | URL | Auth | Keterangan |
|--------|-----|------|------------|
| GET | /jobs | Tidak | List semua job aktif |
| GET | /jobs/{id} | Tidak | Detail job by ID |
| POST | /jobs | JWT employer | Buat job baru |
| PUT | /jobs/{id} | JWT employer | Update job |
| DELETE | /jobs/{id} | JWT employer | Hapus job |

## Contoh Alur Testing (Postman)
1. POST /auth/register — daftar akun dengan role "employer"
2. POST /auth/login — login, copy nilai access_token
3. Set header: Authorization: Bearer <access_token>
4. POST /jobs — buat lowongan baru
5. GET /jobs — lihat semua lowongan (tanpa token)
6. PUT /jobs/1 — update lowongan
7. DELETE /jobs/1 — hapus lowongan
```

---

## STEP 13 — Verifikasi Akhir

Setelah semua file dibuat, jalankan:

```bash
cd remotein
pip install -r requirements.txt
uvicorn main:app --reload
```

Buka `http://localhost:8000/docs` dan pastikan semua endpoint tampil di Swagger UI.

### Checklist verifikasi:
- [ ] `GET /` → 200, JSON status running
- [ ] `POST /auth/register` → 201, user terbuat
- [ ] `POST /auth/register` email duplikat → 400
- [ ] `POST /auth/login` kredensial benar → 200, ada access_token
- [ ] `POST /auth/login` kredensial salah → 401
- [ ] `GET /auth/me` dengan token → 200, data user
- [ ] `GET /auth/me` tanpa token → 401
- [ ] `GET /jobs` → 200, list job (boleh kosong)
- [ ] `GET /jobs/999` → 404
- [ ] `POST /jobs` dengan token employer → 201
- [ ] `POST /jobs` dengan token jobseeker → 403
- [ ] `POST /jobs` tanpa token → 401
- [ ] `PUT /jobs/{id}` oleh pemilik → 200
- [ ] `PUT /jobs/{id}` oleh bukan pemilik → 403
- [ ] `DELETE /jobs/{id}` oleh pemilik → 200
- [ ] `DELETE /jobs/{id}` oleh bukan pemilik → 403

---

## Catatan untuk AI

- Eksekusi STEP 0 sampai STEP 13 **secara berurutan tanpa skip**
- Jangan ubah nama field, nama fungsi, atau nama file kecuali ada konflik
- Pastikan semua import path sudah benar sebelum lanjut ke step berikutnya
- Jika error saat install: `pip install -r requirements.txt --break-system-packages`
- File `remotein.db` akan otomatis terbuat saat server pertama kali dijalankan
- Jangan modifikasi kode kecuali ada error eksplisit yang perlu diperbaiki
