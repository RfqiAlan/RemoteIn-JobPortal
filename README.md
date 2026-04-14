# RemoteIn — Job Portal

Platform lowongan kerja remote full-stack yang dibangun dengan **FastAPI** (Backend) dan **React + Vite** (Frontend). Mendukung CRUD job internal, autentikasi JWT, dan agregasi job eksternal dari Remotive, Arbeitnow, dan Jobicy.

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Backend | FastAPI, SQLAlchemy, PyMySQL, python-jose (JWT), passlib (bcrypt) |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7 |
| Database | MySQL 8.0 (Docker) / SQLite (lokal dev) |
| Infrastructure | Docker, Docker Compose |

---

## 🚀 Cara Menjalankan

### Opsi A — Menggunakan Docker (Direkomendasikan)

> **Prasyarat:** Docker Desktop sudah terinstall dan berjalan.

**1. Clone repository**
```bash
git clone https://github.com/RfqiAlan/RemoteIn-JobPortal.git
cd RemoteIn-JobPortal
```

**2. Buat file `.env` di root project**
```bash
# .env
SECRET_KEY="ganti-dengan-secret-key-yang-kuat"
```
> Jika tidak dibuat, backend akan menggunakan dev key bawaan secara otomatis.

**3. Jalankan semua service**
```bash
docker compose up --build
```

Docker akan menyalakan 3 service sekaligus:

| Service | URL |
|---------|-----|
| Frontend (React) | http://localhost:5173 |
| Backend (FastAPI) | http://localhost:8000 |
| MySQL | `localhost:3307` (bisa diakses via TablePlus / DBeaver) |

**4. (Opsional) Isi data awal**
```bash
docker exec -it remotein-backend python seed.py
```

**5. Hentikan semua service**
```bash
docker compose down

# Hapus data MySQL juga (volume):
docker compose down -v
```

---

### Opsi B — Tanpa Docker (Manual / Local Dev)

> **Prasyarat:** Python 3.11+, Node.js 18+, MySQL (opsional — bisa pakai SQLite).

#### Setup Backend

**1. Masuk ke folder Backend**
```bash
cd Backend
```

**2. Buat virtual environment dan install dependencies**
```bash
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

**3. Konfigurasi environment variable**

Buat file `.env` di folder `Backend/`:
```env
# Untuk MySQL:
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_NAME=remotein
SECRET_KEY=ganti-dengan-secret-key-yang-kuat
```
> Jika variabel `DB_*` tidak ditemukan, backend otomatis **fallback ke SQLite** (file lokal tanpa setup tambahan).

**4. Jalankan server Backend**
```bash
uvicorn main:app --reload
```

- Backend berjalan di → http://localhost:8000  
- Swagger UI tersedia di → http://localhost:8000/docs

**5. (Opsional) Isi data awal**
```bash
python seed.py
```

---

#### Setup Frontend

**1. Buka terminal baru, masuk ke folder Frontend**
```bash
cd Frontend
```

**2. Install dependencies**
```bash
npm install
```

**3. Jalankan dev server**
```bash
npm run dev
```

Frontend berjalan di → http://localhost:5173

> **Catatan:** Frontend otomatis mem-proxy semua request `/api/*` ke `http://127.0.0.1:8000` saat lokal. Pastikan Backend sudah berjalan terlebih dahulu.

**4. Build untuk produksi**
```bash
npm run build
```

---

## 📋 API Reference

### Auth
| Method | Endpoint | Auth | Keterangan |
|--------|----------|------|------------|
| `POST` | `/auth/register` | ❌ | Registrasi user baru (`role`: `jobseeker` / `employer`) |
| `POST` | `/auth/login` | ❌ | Login, return JWT `access_token` |
| `GET` | `/auth/me` | ✅ JWT | Profil user yang sedang login |

### Internal Jobs
| Method | Endpoint | Auth | Keterangan |
|--------|----------|------|------------|
| `GET` | `/jobs` | ❌ | List semua job aktif |
| `GET` | `/jobs/{id}` | ❌ | Detail job berdasarkan ID |
| `POST` | `/jobs` | ✅ employer | Buat job baru |
| `PUT` | `/jobs/{id}` | ✅ employer | Update job milik sendiri |
| `DELETE` | `/jobs/{id}` | ✅ employer | Hapus job milik sendiri |

### External Jobs (database-backed)
| Method | Endpoint | Auth | Keterangan |
|--------|----------|------|------------|
| `GET` | `/external/aggregate` | ❌ | Semua external jobs (filter: `keyword`, `limit`) |
| `GET` | `/external/jobs/{id}` | ❌ | Detail satu external job |
| `GET` | `/external/remotive` | ❌ | List khusus sumber Remotive |
| `GET` | `/external/arbeitnow` | ❌ | List khusus sumber Arbeitnow |
| `GET` | `/external/jobicy` | ❌ | List khusus sumber Jobicy |
| `POST` | `/external/refresh-request` | ✅ jobseeker | Minta sinkronisasi data (cooldown 10 menit) |
| `GET` | `/external/refresh-status/{id}` | ✅ jobseeker | Cek status sinkronisasi |

> **Catatan sinkronisasi:** Fetch data maksimum per sumber — Remotive ≤500, Arbeitnow ≤1000 (via pagination), Jobicy ≤50 (sesuai batas API).

---

## 🔑 Contoh Alur Testing (Postman / Swagger)

```
Employer flow:
1. POST /auth/register     → daftar akun role "employer"
2. POST /auth/login        → login, salin nilai access_token
3. Set header: Authorization: Bearer <access_token>
4. POST /jobs              → buat lowongan baru
5. GET  /jobs              → lihat semua lowongan (tanpa token)
6. PUT  /jobs/{id}         → update lowongan
7. DELETE /jobs/{id}       → hapus lowongan

Jobseeker & External Jobs flow:
8. POST /auth/register     → daftar akun role "jobseeker"
9. POST /auth/login        → login sebagai jobseeker
10. POST /external/refresh-request  → minta sync data eksternal
11. GET  /external/refresh-status/1 → cek status sync (polling)
12. GET  /external/aggregate        → lihat hasil job yang tersinkronisasi
13. GET  /external/jobs/{id}        → lihat detail satu external job
```

---

## 🗂️ Struktur Project

```
RemoteIn-JobPortal/
├── Backend/
│   ├── auth/             # JWT & dependency guards
│   ├── models/           # SQLAlchemy models (User, Job, ExternalJob)
│   ├── routers/          # FastAPI routers (auth, jobs, external)
│   ├── schemas/          # Pydantic schemas
│   ├── services/         # Logika fetch API eksternal
│   ├── main.py           # Entry point FastAPI
│   ├── seed.py           # Script populate data awal
│   └── requirements.txt
├── Frontend/
│   ├── src/
│   │   ├── components/   # Navbar, Footer
│   │   ├── pages/        # Home, Jobs, ExternalJobs, JobDetail, ExternalJobDetail, dll.
│   │   ├── lib/          # API client (api.ts)
│   │   └── types/        # TypeScript interfaces
│   └── vite.config.ts
├── docker-compose.yml
└── .env
```
