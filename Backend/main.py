from fastapi import FastAPI
from sqlalchemy import text
from database import engine, Base, DB_NAME

# Import models sebelum create_all agar relasi terbaca dengan benar
from models import user, job, external

# Import routers
from routers import auth, jobs, external

# Buat semua tabel di database SQLite
Base.metadata.create_all(bind=engine)

# ── Auto-migration: jalankan sekali, aman diulang ──────────────────────────
def run_migrations():
    with engine.connect() as conn:
        # 1. Buat requested_by nullable jika belum
        try:
            conn.execute(text(
                "ALTER TABLE external_sync_requests MODIFY COLUMN requested_by INT NULL"
            ))
            conn.commit()
            print("✅ Migration: requested_by is now nullable")
        except Exception:
            pass  # Sudah nullable atau tabel belum ada, skip

        # 2. Tambah kolom client_identifier jika belum ada
        result = conn.execute(text(
            "SELECT COUNT(*) FROM information_schema.COLUMNS "
            "WHERE TABLE_SCHEMA = :schema "
            "AND TABLE_NAME = 'external_sync_requests' "
            "AND COLUMN_NAME = 'client_identifier'"
        ), {"schema": DB_NAME})
        (col_exists,) = result.fetchone()

        if col_exists == 0:
            conn.execute(text(
                "ALTER TABLE external_sync_requests "
                "ADD COLUMN client_identifier VARCHAR(255) NULL"
            ))
            conn.commit()
            print("✅ Migration: client_identifier column added")
        else:
            print("ℹ️  Migration: client_identifier already exists, skipped")

run_migrations()

# ── Auto-seed: isi data awal jika tabel kosong ─────────────────────────────
from seed import seed_data
seed_data()
# ──────────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="RemoteIn API",
    description="Platform lowongan kerja remote: RESTful API berbasis FastAPI",
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
