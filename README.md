# RemoteIn: Job Portal

Platform lowongan kerja remote full-stack berbasis **FastAPI** (Backend) + **React/Vite** (Frontend), dengan fitur otentikasi JWT (Role-Based Access Control), manajemen pekerjaan internal, dan sistem agregasi pekerjaan dari pihak ketiga (Remotive, Arbeitnow, Jobicy) yang diamankan.

## 🌟 Fitur Utama Terbaru
1. **Multi-Role User (RBAC)**: Terdapat 3 role spesifik:
   - **Jobseeker**: Bisa mencari pekerjaan, mengelola profil dan resume, melamar pekerjaan (lewat Modal Apply), serta menyimpan pekerjaan favorit (Bookmark).
   - **Employer**: Bisa membuat (post), mengubah, dan menghapus lowongan pekerjaan milik sendiri.
   - **Admin**: Memiliki Dashboard khusus untuk memantau sistem dan secara manual menarik data pekerjaan (Sync) dari API pihak ketiga secara aman.
2. **External API Aggregation**: Sinkronisasi pekerjaan *remote* dari situs luar yang disimpan ke dalam database internal. Endpoint untuk sinkronisasi ini telah diproteksi sepenuhnya dan hanya bisa dilakukan oleh **Admin**.
3. **Advanced Frontend UI**: Antarmuka modern, interaktif (dengan *Modal Popup*, *Dynamic Dropdowns*), dan bergaya *Glassmorphism* menggunakan **Tailwind CSS v4** dan **Lucide React**.

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
│   ├── auth/                   # JWT handler + auth dependencies (RBAC)
│   ├── models/                 # SQLAlchemy models (user, job, profile, application, saved_job, external)
│   ├── routers/                # Router FastAPI (auth, jobs, external, profiles, applications, saved_jobs)
│   ├── schemas/                # Pydantic schemas untuk validasi
│   ├── services/               # Script integrasi & parser API eksternal
│   ├── database.py             # Koneksi DB
│   ├── main.py                 # Entry point FastAPI (+ auto migration script & seed data)
│   ├── seed.py                 # Seed data dummy (termasuk pembuatan user Admin awal)
│   └── migrate_role_enum.py    # Script migrasi manual untuk struktur ENUM role di MySQL
├── Frontend/
│   ├── src/
│   │   ├── components/         # Hero, Navbar (Dynamic Dropdown), Footer, dll.
│   │   ├── lib/                # Konfigurasi Fetcher API Client
│   │   ├── pages/              # Home, Jobs, JobDetail, ExternalJobs, Profile, MyApplications, SavedJobs, AdminDashboard
│   │   └── types/              # Type Definition (TypeScript) untuk keamanan tipe
│   ├── vite.config.ts
│   └── package.json
└── docker-compose.yml
```

## 🚀 Menjalankan Project

### Opsi A Docker (Direkomendasikan)
> Prasyarat: Docker Desktop aktif.

1. Clone repo
```bash
git clone https://github.com/RfqiAlan/RemoteIn-JobPortal.git
cd RemoteIn-JobPortal
```

2. Buat `.env` di root untuk JWT secret (Opsional)
```env
SECRET_KEY=ganti-dengan-secret-yang-kuat
```

3. Jalankan semua service
```bash
docker compose up --build
```
*Frontend akan berjalan di `http://localhost:5173` dan Backend di `http://localhost:8000`.*

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
*Saat pertama kali dijalankan, sistem akan memicu `seed.py` secara otomatis untuk mengisi database (termasuk akun **Admin** dengan email `admin@remotein.com` & password `admin123`).*

#### Frontend
```bash
cd Frontend
npm install
npm run dev
```

## 📋 API Reference

### Auth & Profiles
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| `POST` | `/auth/register` | ❌ | Registrasi user (`jobseeker` / `employer`) |
| `POST` | `/auth/login` | ❌ | Login dan dapatkan `access_token` |
| `GET` | `/auth/me` | ✅ JWT | Cek info & role user yang sedang login |
| `GET/PUT`| `/profiles/me` | ✅ jobseeker | Mendapatkan dan mengubah informasi Profil & Skill pelamar |

### Internal Jobs & Applications
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| `GET` | `/jobs` | ❌ | List semua job aktif |
| `POST` | `/jobs` | ✅ employer | Buat lowongan baru |
| `POST` | `/applications` | ✅ jobseeker | Melamar pekerjaan (dengan Cover Letter) |
| `GET` | `/applications/my` | ✅ jobseeker | Melihat riwayat dan status lamaran sendiri |

### Saved Jobs (Bookmarks)
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| `GET` | `/saved-jobs` | ✅ jobseeker | Melihat daftar lowongan yang disimpan |
| `POST` | `/saved-jobs` | ✅ jobseeker | Menyimpan lowongan (Mendukung ID internal dan Eksternal) |
| `DELETE` | `/saved-jobs/{id}` | ✅ jobseeker | Menghapus lowongan tersimpan |

### External Jobs (Database-Backed)
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| `GET` | `/external/aggregate` | ❌ | Ambil semua external jobs (Remotive, Jobicy, Arbeitnow) dari database internal |
| `POST` | `/external/refresh-request` | ✅ **admin** | *Trigger* sistem untuk menarik dan menyinkronkan data lowongan API eksternal baru |
| `GET` | `/external/refresh-status/{id}`| ✅ **admin** | Mengecek status berjalannya proses sinkronisasi |

*(Batas sinkronisasi per sumber saat ditarik oleh Admin: Remotive ≤ 500, Arbeitnow ≤ 1000, Jobicy ≤ 50).*
