# RemoteIn: Job Portal

Platform lowongan kerja remote full-stack berbasis **FastAPI** (Backend) + **React/Vite** (Frontend), dengan fitur auth JWT, manajemen job internal, dan agregasi job eksternal (Remotive, Arbeitnow, Jobicy).

## 🛠️ Tech Stack

| Layer | Teknologi |
|---|---|
| Backend | FastAPI, SQLAlchemy, PyMySQL, python-jose (JWT), passlib (bcrypt) |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7 |
| Database | MySQL 8.0 |
| Infra | Docker, Docker Compose |

## 🗂️ Struktur Folder (Aktual)

```text
RemoteIn-JobPortal/
├── Backend/
│   ├── auth/                   # JWT handler + auth dependencies
│   ├── models/                 # SQLAlchemy models (user, job, external)
│   ├── routers/                # Router FastAPI (auth, jobs, external)
│   ├── schemas/                # Pydantic schemas
│   ├── services/               # Integrasi API eksternal
│   ├── database.py             # Koneksi DB
│   ├── main.py                 # Entry point FastAPI (+ auto migration + auto seed)
│   ├── seed.py                 # Seed data dummy awal
│   ├── migrate_anonymous_refresh.py
│   └── requirements.txt
├── Frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/         # Hero, Navbar, Footer, dll.
│   │   ├── lib/                # API client
│   │   ├── pages/              # Home, Jobs, Detail, Login/Register, Dashboard
│   │   └── types/
│   ├── vite.config.ts
│   ├── package.json
│   └── README.md               # Dokumentasi frontend ringkas
├── docker-compose.yml
├── requirements.txt
├── LAPORAN_PROYEK.md
└── README.md
```

## 🚀 Menjalankan Project

### Opsi A Docker (Direkomendasikan)

> Prasyarat: Docker Desktop aktif.

1. Clone repo
```bash
git clone https://github.com/RfqiAlan/RemoteIn-JobPortal.git
cd RemoteIn-JobPortal
```

2. (Opsional) buat `.env` di root untuk JWT secret
```env
SECRET_KEY=ganti-dengan-secret-yang-kuat
```

3. Jalankan semua service
```bash
docker compose up --build
```

Service yang aktif:

| Service | URL / Port |
|---|---|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8000 |
| MySQL | localhost:3307 |

4. Hentikan service
```bash
docker compose down
# atau termasuk hapus volume DB:
docker compose down -v
```

### Opsi B Manual (Local Dev)

> Prasyarat: Python 3.11+, Node.js 18+, MySQL 8.

#### Backend

```bash
cd Backend
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Buat `.env` di folder `Backend/`:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=remotein
SECRET_KEY=ganti-dengan-secret-yang-kuat
```

Load env ke shell lalu jalankan backend:

```bash
set -a && source .env && set +a
uvicorn main:app --reload
```

Backend: http://localhost:8000  
Swagger: http://localhost:8000/docs

#### Frontend

```bash
cd Frontend
npm install
npm run dev
```

Frontend: http://localhost:5173  
Proxy API default: `/api/*` → `http://127.0.0.1:8000` (lihat `vite.config.ts`).

## 📋 API Reference

### Auth
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| `POST` | `/auth/register` | ❌ | Registrasi user (`jobseeker` / `employer`) |
| `POST` | `/auth/login` | ❌ | Login dan dapatkan `access_token` |
| `GET` | `/auth/me` | ✅ JWT | Profil user login |

### Internal Jobs
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| `GET` | `/jobs` | ❌ | List semua job aktif |
| `GET` | `/jobs/{id}` | ❌ | Detail job |
| `POST` | `/jobs` | ✅ employer | Buat job |
| `PUT` | `/jobs/{id}` | ✅ employer | Update job milik sendiri |
| `DELETE` | `/jobs/{id}` | ✅ employer | Hapus job milik sendiri |

### External Jobs (database-backed)
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| `GET` | `/external/aggregate` | ❌ | Ambil job eksternal teragregasi |
| `GET` | `/external/jobs/{id}` | ❌ | Detail 1 external job (`{source}_{source_job_id}`) |
| `GET` | `/external/remotive` | ❌ | Job dari Remotive |
| `GET` | `/external/arbeitnow` | ❌ | Job dari Arbeitnow |
| `GET` | `/external/jobicy` | ❌ | Job dari Jobicy |
| `POST` | `/external/refresh-request` | ❌ | Trigger sinkronisasi (cooldown global 10 menit) |
| `GET` | `/external/refresh-status/{id}` | ❌ | Cek status sinkronisasi |

> Batas sinkronisasi per sumber saat refresh: Remotive ≤ 500, Arbeitnow ≤ 1000, Jobicy ≤ 50.
