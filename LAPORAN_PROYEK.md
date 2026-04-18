# Laporan Pengembangan Proyek: RemoteIn

---

## Deskripsi Proyek

**RemoteIn** adalah platform portal lowongan kerja *remote* terpusat yang berfungsi sebagai hub digital bagi pencari kerja dan perusahaan dengan menggabungkan dua sumber utama peluang karir: sistem publikasi lowongan internal bagi perusahaan lokal dan agregator otomatis yang menarik ribuan data pekerjaan secara *real-time* dari berbagai situs loker remote global seperti Remotive, Arbeitnow, dan Jobicy. Melalui satu antarmuka yang efisien, platform ini menyederhanakan proses pencarian kerja dengan menghilangkan kebutuhan pengguna untuk mengunjungi banyak situs secara manual, sambil memberikan fleksibilitas bagi pemberi kerja untuk mengelola siklus hidup lowongan mereka secara mandiri dalam satu ekosistem yang responsif, terintegrasi, dan mudah digunakan.

---

## 1. Konsep Microservices      

### A. Desain Arsitektur 
Proyek RemoteIn mengadopsi pola **Service Separation** yang merupakan fondasi dari arsitektur microservices. Sistem dipisahkan menjadi tiga komponen utama yang berjalan di container terpisah:
1.  **Frontend Service**: Berbasis React 19 + Vite.
2.  **Backend Service**: Berbasis FastAPI (Python).
3.  **Database Service**: Berbasis MySQL 8.0.


### B. Pemisahan Domain Layanan 
Kode backend dirancang secara modular dengan memisahkan domain bisnis ke dalam folder `routers/`. Setiap modul mengelola logika bisnis yang spesifik:
-   **Auth Domain**: Mengelola pendaftaran dan login ([Backend/routers/auth.py](file:///Users/rifqialanmaulana/Repo%20Github/RemoteIn-JobPortal/Backend/routers/auth.py)).
-   **Jobs Domain**: Mengelola siklus hidup lowongan internal ([Backend/routers/jobs.py](file:///Users/rifqialanmaulana/Repo%20Github/RemoteIn-JobPortal/Backend/routers/jobs.py)).
-   **External Domain**: Mengelola agregasi data dari pihak ketiga ([Backend/routers/external.py](file:///Users/rifqialanmaulana/Repo%20Github/RemoteIn-JobPortal/Backend/routers/external.py)).

---

## 2. Implementasi RESTful API & ORM        

### A. Fungsionalitas CRUD 
Seluruh endpoint CRUD untuk manajemen pekerjaan internal telah diimplementasikan dengan standar RESTful menggunakan HTTP verb dan status code yang tepat:
-   `GET /jobs`: Menampilkan semua daftar pekerjaan (**200 OK**).
-   `POST /jobs`: Membuat pekerjaan baru (**201 Created**).
-   `PUT /jobs/{id}`: Memperbarui data pekerjaan (**200 OK** atau **404 Not Found** jika ID salah).
-   `DELETE /jobs/{id}`: Menghapus data pekerjaan (**200 OK**).
-   **Validasi**: Error ditangani dengan **422 Unprocessable Entity** (via Pydantic) dan **403 Forbidden** (otorisasi).

### B. Relasi Database (ORM)
Implementasi menggunakan **SQLAlchemy** untuk mendefinisikan relasi antar entitas.
-   **Relasi One-to-Many**: Diterapkan antara model `User` dan `Job`. Satu pengguna (Employer) dapat memiliki banyak postingan pekerjaan.
-   **Definisi Kode**:
    -   Pada [models/job.py](file:///Users/rifqialanmaulana/Repo%20Github/RemoteIn-JobPortal/Backend/models/job.py): `owner = relationship("User", back_populates="jobs")`
    -   Pada [models/user.py](file:///Users/rifqialanmaulana/Repo%20Github/RemoteIn-JobPortal/Backend/models/user.py): `jobs = relationship("Job", back_populates="owner")`

### C. Autentikasi & Otorisasi JWT 
Sistem keamanan backend menggunakan standar industry **JWT (JSON Web Token)**:
1.  **Registrasi & Login**: Berhasil menghasilkan token akses yang mengandung payload identitas user.
2.  **Dependency Guards**: Menggunakan fungsi pembatas akses di FastAPI.
    -   `get_current_user`: Memastikan user terautentikasi.
    -   `require_employer`: Memastikan hanya user dengan role `employer` yang bisa membuat/mengubah pekerjaan.

---

## 3. Deployment & Pengujian

### A. Deployment Berhasil 
Aplikasi dikonfigurasi menggunakan **Docker Compose** untuk memudahkan deployment di mana saja.
-   **Cara Menjalankan**: `docker compose up --build`
-   **Swagger UI**: Dokumentasi API interaktif tersedia dan aktif secara otomatis di `http://localhost:8000/docs`.

### B. Dokumentasi Pengujian 
Pengujian dilakukan untuk memastikan keandalan tiap endpoint. Alur testing utama meliputi:
1.  Registrasi akun sebagai `employer`.
2.  Login untuk mendapatkan JWT token.
3.  Memasukkan token ke dalam header Authorization: `Bearer <token>`.
4.  Menjalankan operasi CRUD pada endpoint `/jobs`.
-   *Catatan: Koleksi Postman mendukung pengujian skenario sukses dan gagal (404, 401, 403).*

---

## 4. Kualitas Kode
Proyek ini menjunjung tinggi kualitas kode melalui:
-   **Modularitas**: Struktur folder yang bersih dan fungsional.
-   **Type Hinting**: Menggunakan typing Python untuk mengurangi bug.
-   **Schemas**: Pemisahan model database (SQLAlchemy) dengan skema validasi data keluar-masuk (Pydantic).
-   **Komentar**: Penjelasan terdokumentasi pada bagian kritis seperti *dependency security* dan *external fetcher*.

---
**RemoteIn: Solusi Terpusat Lowongan Kerja Remote.**
