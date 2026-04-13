from fastapi import FastAPI
from database import engine, Base

# Import models sebelum create_all agar relasi terbaca dengan benar
from models import user, job

# Import routers
from routers import auth, jobs, external

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
app.include_router(external.router)

@app.get("/", tags=["Root"])
def root():
    return {
        "app": "RemoteIn API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "running"
    }
