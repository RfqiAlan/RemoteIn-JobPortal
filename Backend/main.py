import logging
from fastapi import FastAPI
from database import engine, Base

# Import models sebelum create_all agar relasi terbaca dengan benar
from models import user, job, external

# Import routers
from routers import auth, jobs, external

logger = logging.getLogger(__name__)

# Buat semua tabel di database (MySQL)
# Wrapped in try-except so the app can start even if the database is not yet
# available — tables will be created on the next successful connection.
try:
    Base.metadata.create_all(bind=engine)
except Exception as e:
    logger.warning(
        "Could not create database tables on startup (database may not be "
        "available yet): %s", e
    )

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
