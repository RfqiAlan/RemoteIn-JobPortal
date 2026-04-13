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
