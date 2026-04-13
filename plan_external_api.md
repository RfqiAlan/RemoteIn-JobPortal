# RemoteIn — External API Integration Plan
> Eksekusi file ini SETELAH plan.md selesai dieksekusi.
> Tambahkan integrasi ke 3 API publik gratis: Remotive, Arbeitnow, Jobicy
> Semua API ini gratis, tanpa API key, tanpa registrasi.

---

## Tujuan

Menambahkan router baru `/external` ke FastAPI RemoteIn yang berfungsi sebagai **proxy/aggregator** — fetch data loker dari API publik luar, normalisasi formatnya, lalu kembalikan ke client dalam format yang konsisten.

---

## Sumber API Publik yang Digunakan

| Sumber | Base URL | Auth | Keterangan |
|---|---|---|---|
| Remotive | `https://remotive.com/api/remote-jobs` | Tidak perlu | Remote jobs global |
| Arbeitnow | `https://www.arbeitnow.com/api/job-board-api` | Tidak perlu | Remote jobs Eropa |
| Jobicy | `https://jobicy.com/api/v2/remote-jobs` | Tidak perlu | Remote jobs global |

---

## STEP 1 — Tambah dependency baru

Buka `requirements.txt` dan tambahkan baris berikut di bagian paling bawah:

```
httpx==0.27.0
```

`httpx` adalah HTTP client async untuk Python, digunakan untuk fetch data dari API eksternal di dalam FastAPI.

Jalankan:
```bash
pip install httpx==0.27.0
```

---

## STEP 2 — Buat schemas/external.py

Buat file baru `schemas/external.py` dengan isi berikut:

```python
from pydantic import BaseModel
from typing import Optional, List

class ExternalJob(BaseModel):
    """
    Schema normalisasi — format seragam untuk semua job dari sumber eksternal.
    Tidak semua field tersedia di semua sumber, jadi semuanya Optional.
    """
    id: str                          # ID unik: "{source}_{id_asli}"
    title: str                       # Judul posisi
    company: str                     # Nama perusahaan
    location: str                    # Lokasi / "Worldwide" / "Remote"
    tags: List[str] = []             # Tag / kategori / skill
    salary: Optional[str] = None     # Range gaji jika tersedia
    url: str                         # Link apply langsung
    source: str                      # "remotive" / "arbeitnow" / "jobicy"
    published_at: Optional[str] = None  # Tanggal posting

class ExternalJobList(BaseModel):
    source: str
    total: int
    jobs: List[ExternalJob]

class AggregatedJobList(BaseModel):
    total: int
    sources: List[str]
    jobs: List[ExternalJob]
```

---

## STEP 3 — Buat services/external_api.py

Buat folder `services/` di dalam folder `remotein/`, lalu buat file `services/__init__.py` (kosong) dan `services/external_api.py` dengan isi berikut:

```python
import httpx
from typing import List, Optional
from schemas.external import ExternalJob

TIMEOUT = 10  # detik


async def fetch_remotive(category: Optional[str] = None, limit: int = 20) -> List[ExternalJob]:
    """
    Fetch dari Remotive API.
    Docs: https://remotive.com/api/remote-jobs
    Query params: category, limit
    """
    params = {"limit": limit}
    if category:
        params["category"] = category

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.get(
                "https://remotive.com/api/remote-jobs",
                params=params
            )
            response.raise_for_status()
            data = response.json()

        jobs = []
        for item in data.get("jobs", []):
            jobs.append(ExternalJob(
                id=f"remotive_{item.get('id', '')}",
                title=item.get("title", ""),
                company=item.get("company_name", ""),
                location=item.get("candidate_required_location") or "Worldwide",
                tags=item.get("tags", []),
                salary=item.get("salary") or None,
                url=item.get("url", ""),
                source="remotive",
                published_at=item.get("publication_date")
            ))
        return jobs

    except (httpx.RequestError, httpx.HTTPStatusError):
        # Jika gagal fetch, return list kosong agar aggregator tetap berjalan
        return []


async def fetch_arbeitnow(limit: int = 20) -> List[ExternalJob]:
    """
    Fetch dari Arbeitnow API.
    Docs: https://www.arbeitnow.com/api/job-board-api
    Tidak ada filter kategori, ambil semua lalu slice.
    """
    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.get(
                "https://www.arbeitnow.com/api/job-board-api"
            )
            response.raise_for_status()
            data = response.json()

        jobs = []
        for item in data.get("data", [])[:limit]:
            jobs.append(ExternalJob(
                id=f"arbeitnow_{item.get('slug', '')}",
                title=item.get("title", ""),
                company=item.get("company_name", ""),
                location=item.get("location") or "Remote",
                tags=item.get("tags", []),
                salary=None,  # Arbeitnow tidak expose salary di API publik
                url=item.get("url", ""),
                source="arbeitnow",
                published_at=str(item.get("created_at", ""))
            ))
        return jobs

    except (httpx.RequestError, httpx.HTTPStatusError):
        return []


async def fetch_jobicy(
    count: int = 20,
    geo: Optional[str] = None,
    industry: Optional[str] = None,
    tag: Optional[str] = None
) -> List[ExternalJob]:
    """
    Fetch dari Jobicy API.
    Docs: https://jobicy.com/api/v2/remote-jobs
    Query params: count (max 50), geo, industry, tag
    """
    params = {"count": min(count, 50)}
    if geo:
        params["geo"] = geo
    if industry:
        params["industry"] = industry
    if tag:
        params["tag"] = tag

    try:
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            response = await client.get(
                "https://jobicy.com/api/v2/remote-jobs",
                params=params
            )
            response.raise_for_status()
            data = response.json()

        jobs = []
        for item in data.get("jobs", []):
            # Bangun salary string dari salary_min dan salary_max jika tersedia
            salary = None
            s_min = item.get("annualSalaryMin")
            s_max = item.get("annualSalaryMax")
            if s_min and s_max:
                salary = f"${int(s_min):,} - ${int(s_max):,}"
            elif s_min:
                salary = f"${int(s_min):,}+"

            jobs.append(ExternalJob(
                id=f"jobicy_{item.get('id', '')}",
                title=item.get("jobTitle", ""),
                company=item.get("companyName", ""),
                location=item.get("jobGeo") or "Worldwide",
                tags=item.get("jobType", []) if isinstance(item.get("jobType"), list) else [],
                salary=salary,
                url=item.get("url", ""),
                source="jobicy",
                published_at=item.get("pubDate")
            ))
        return jobs

    except (httpx.RequestError, httpx.HTTPStatusError):
        return []
```

---

## STEP 4 — Buat routers/external.py

Buat file baru `routers/external.py` dengan isi berikut:

```python
import asyncio
from fastapi import APIRouter, Query, HTTPException, status
from typing import Optional, List
from schemas.external import ExternalJob, ExternalJobList, AggregatedJobList
from services.external_api import fetch_remotive, fetch_arbeitnow, fetch_jobicy

router = APIRouter(prefix="/external", tags=["External Jobs"])


@router.get(
    "/remotive",
    response_model=ExternalJobList,
    summary="Ambil loker remote dari Remotive (tanpa auth)"
)
async def get_remotive_jobs(
    category: Optional[str] = Query(default=None, description="Kategori job, contoh: software-dev, devops, design"),
    limit: int = Query(default=20, ge=1, le=100, description="Jumlah job yang diambil")
):
    """
    Fetch loker remote dari Remotive.com.
    Sumber: https://remotive.com/api/remote-jobs
    Gratis, tanpa API key.
    """
    jobs = await fetch_remotive(category=category, limit=limit)
    return ExternalJobList(source="remotive", total=len(jobs), jobs=jobs)


@router.get(
    "/arbeitnow",
    response_model=ExternalJobList,
    summary="Ambil loker remote dari Arbeitnow (tanpa auth)"
)
async def get_arbeitnow_jobs(
    limit: int = Query(default=20, ge=1, le=100, description="Jumlah job yang diambil")
):
    """
    Fetch loker remote dari Arbeitnow.com.
    Sumber: https://www.arbeitnow.com/api/job-board-api
    Gratis, tanpa API key. Fokus loker Eropa.
    """
    jobs = await fetch_arbeitnow(limit=limit)
    return ExternalJobList(source="arbeitnow", total=len(jobs), jobs=jobs)


@router.get(
    "/jobicy",
    response_model=ExternalJobList,
    summary="Ambil loker remote dari Jobicy (tanpa auth)"
)
async def get_jobicy_jobs(
    count: int = Query(default=20, ge=1, le=50, description="Jumlah job (max 50)"),
    geo: Optional[str] = Query(default=None, description="Filter region, contoh: usa, uk, worldwide"),
    industry: Optional[str] = Query(default=None, description="Filter industri, contoh: engineering, marketing"),
    tag: Optional[str] = Query(default=None, description="Search by keyword di judul/deskripsi")
):
    """
    Fetch loker remote dari Jobicy.com.
    Sumber: https://jobicy.com/api/v2/remote-jobs
    Gratis, tanpa API key. Support filter geo dan industri.
    """
    jobs = await fetch_jobicy(count=count, geo=geo, industry=industry, tag=tag)
    return ExternalJobList(source="jobicy", total=len(jobs), jobs=jobs)


@router.get(
    "/aggregate",
    response_model=AggregatedJobList,
    summary="Ambil loker dari semua sumber sekaligus (tanpa auth)"
)
async def get_aggregated_jobs(
    limit: int = Query(default=10, ge=1, le=50, description="Jumlah job per sumber"),
    keyword: Optional[str] = Query(default=None, description="Filter keyword di judul atau company")
):
    """
    Fetch loker dari Remotive, Arbeitnow, dan Jobicy secara paralel,
    gabungkan hasilnya, lalu filter berdasarkan keyword jika ada.
    Gratis, tanpa API key, tanpa auth.
    """
    # Fetch semua sumber secara paralel menggunakan asyncio.gather
    remotive_jobs, arbeitnow_jobs, jobicy_jobs = await asyncio.gather(
        fetch_remotive(limit=limit),
        fetch_arbeitnow(limit=limit),
        fetch_jobicy(count=limit)
    )

    all_jobs: List[ExternalJob] = remotive_jobs + arbeitnow_jobs + jobicy_jobs

    # Filter berdasarkan keyword jika ada
    if keyword:
        kw = keyword.lower()
        all_jobs = [
            j for j in all_jobs
            if kw in j.title.lower() or kw in j.company.lower()
        ]

    # Tentukan sumber mana yang berhasil di-fetch
    active_sources = []
    if remotive_jobs:
        active_sources.append("remotive")
    if arbeitnow_jobs:
        active_sources.append("arbeitnow")
    if jobicy_jobs:
        active_sources.append("jobicy")

    return AggregatedJobList(
        total=len(all_jobs),
        sources=active_sources,
        jobs=all_jobs
    )
```

---

## STEP 5 — Update main.py

Buka file `main.py` yang sudah ada, tambahkan import router external dan daftarkan ke app. Ubah `main.py` menjadi seperti berikut:

```python
from fastapi import FastAPI
from database import engine, Base

# Import models sebelum create_all
from models import user, job

# Import routers
from routers import auth, jobs
from routers import external  # TAMBAHAN BARU

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
app.include_router(external.router)  # TAMBAHAN BARU

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

## STEP 6 — Verifikasi Endpoint External

Restart server lalu buka `http://localhost:8000/docs`. Pastikan grup **External Jobs** muncul dengan 4 endpoint berikut:

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/external/remotive` | Loker dari Remotive |
| GET | `/external/arbeitnow` | Loker dari Arbeitnow |
| GET | `/external/jobicy` | Loker dari Jobicy |
| GET | `/external/aggregate` | Gabungan semua sumber |

### Checklist verifikasi:

- [ ] `GET /external/remotive` → 200, ada field `jobs`, `total`, `source`
- [ ] `GET /external/remotive?limit=5` → 200, jobs max 5
- [ ] `GET /external/remotive?category=software-dev` → 200, filter kategori bekerja
- [ ] `GET /external/arbeitnow` → 200, ada data jobs dari Eropa
- [ ] `GET /external/jobicy` → 200, ada data jobs
- [ ] `GET /external/jobicy?geo=usa&industry=engineering` → 200, filter bekerja
- [ ] `GET /external/aggregate` → 200, `sources` berisi minimal 1 sumber
- [ ] `GET /external/aggregate?keyword=python` → 200, hasil difilter by keyword
- [ ] Jika salah satu sumber timeout → endpoint lain tetap return data (tidak crash)

---

## Struktur Folder Akhir Setelah Integrasi

```
remotein/
├── main.py                    # Updated: tambah external router
├── database.py
├── requirements.txt           # Updated: tambah httpx
├── README.md
├── remotein.db                # Auto-generated saat server jalan
├── models/
│   ├── __init__.py
│   ├── user.py
│   └── job.py
├── schemas/
│   ├── __init__.py
│   ├── user.py
│   ├── job.py
│   └── external.py            # BARU
├── routers/
│   ├── __init__.py
│   ├── auth.py
│   ├── jobs.py
│   └── external.py            # BARU
├── services/
│   ├── __init__.py            # BARU
│   └── external_api.py        # BARU
└── auth/
    ├── __init__.py
    ├── jwt_handler.py
    └── dependencies.py
```

---

## Contoh Response `/external/aggregate`

```json
{
  "total": 45,
  "sources": ["remotive", "arbeitnow", "jobicy"],
  "jobs": [
    {
      "id": "remotive_123456",
      "title": "Senior Python Developer",
      "company": "Acme Corp",
      "location": "Worldwide",
      "tags": ["python", "django", "remote"],
      "salary": "$80,000 - $120,000",
      "url": "https://remotive.com/jobs/...",
      "source": "remotive",
      "published_at": "2026-04-10T08:00:00"
    },
    {
      "id": "arbeitnow_senior-frontend-dev-xyz",
      "title": "Senior Frontend Developer",
      "company": "TechGmbH",
      "location": "Remote",
      "tags": ["react", "typescript"],
      "salary": null,
      "url": "https://www.arbeitnow.com/jobs/...",
      "source": "arbeitnow",
      "published_at": "1712750400"
    }
  ]
}
```

---

## Catatan untuk AI

- Eksekusi STEP 1 sampai STEP 6 secara berurutan
- Pastikan folder `services/` dibuat sebelum membuat `services/external_api.py`
- Semua fungsi fetch di `services/external_api.py` menggunakan `async def` — wajib dipanggil dengan `await`
- Endpoint di `routers/external.py` menggunakan `async def` agar bisa menggunakan `await` dan `asyncio.gather`
- Jika salah satu API eksternal down atau timeout, fungsi return `[]` sehingga aggregator tidak crash
- Jangan tambahkan autentikasi JWT pada endpoint `/external/*` — semua endpoint ini publik sesuai desain
