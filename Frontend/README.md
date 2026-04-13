# RemoteIn Frontend

Frontend React + TypeScript untuk backend RemoteIn FastAPI.

## Menjalankan project

```bash
npm install
npm run dev
```

Default API proxy: `http://127.0.0.1:8000` (lihat `vite.config.ts`).

## Halaman utama

- `/` Home + ringkasan job internal dan external
- `/jobs` Daftar job internal (`GET /jobs`)
- `/jobs/:jobId` Detail job (`GET /jobs/{id}`)
- `/remote-jobs` Agregasi job external (`GET /external/aggregate`)
- `/remote-jobs` Tombol refresh jobseeker (`POST /external/refresh-request`, `GET /external/refresh-status/{id}`)
- `/register` Registrasi (`POST /auth/register`)
- `/login` Login (`POST /auth/login`)
- `/dashboard` Dashboard employer (`POST/PUT/DELETE /jobs`)

## Catatan auth

- Token JWT disimpan di `localStorage` (`remotein_access_token`).
- Role `employer` diperlukan untuk halaman dashboard.
