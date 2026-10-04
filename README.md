# 🇩🇪 DeutschEasier — Platform Interaktif Belajar Bahasa Jerman

Aplikasi pembelajaran bahasa Jerman modern berbasis web yang dirancang khusus untuk siswa Indonesia:
- **Pelafalan Alfabet Interaktif (Das Alphabet)**: 30 karakter lengkap dengan panduan fonetik komparatif bahasa Indonesia dan Buchstabier-Trainer.
- **Generator Skenario Pembelajaran Berbasis AI**: Menghasilkan percakapan Jerman alami level CEFR A1-B1 menggunakan Google Gemini.
- **Dua Suara Jerman Sejati (Pria & Wanita)**: Integrasi Microsoft Edge Neural TTS (de-DE-ConradNeural & de-DE-KatjaNeural).
- **Mesin Kuis Komprehensif**: Diktat audio dan Lückentext (fill-in-the-blank) dengan evaluasi otomatis.
- **Sistem Kunci Akses Berbatas Waktu & Analitik Guru**: Pembagian akses skenario dengan kontrol kedaluwarsa dan grafik distribusi nilai.

## 🚀 Menjalankan Secara Lokal

```bash
# 1. Install dependensi
npm install

# 2. Siapkan environment
cp .env.example .env   # lalu isi GEMINI_API_KEY, DATABASE_URL, TEACHER_PASSWORD

# 3. Isi data awal bank kata (idempoten, aman dijalankan berulang)
npm run db:seed

# 4. Build aplikasi
npm run build

# 5. Jalankan server
npm start
```

> **Konvensi impor `src/shared/`**: taksonomi bersama (mis. topik tata bahasa B1) ada di
> `src/shared/`. Kode klien boleh memakai alias `@/shared/...`, tetapi kode server dan test
> **wajib** memakai jalur relatif (`../../shared/...`) karena esbuild (`build:server` /
> `build:api`) tidak membaca `paths` dari tsconfig.

> **Catatan skema database**: migrasi di `drizzle/` kini berupa baseline **PostgreSQL**
> (`0000_baseline.sql`, hasil `drizzle-kit generate`). Riwayat migrasi Drizzle **tidak** dipakai
> di database Neon (tabel `drizzle.__drizzle_migrations` kosong), jadi `npm run db:migrate`
> **tidak** menjadi alur yang dipakai. Untuk mengubah skema: perbarui `src/db/schema.ts`,
> lalu sinkronkan ke Neon dengan `npx drizzle-kit push`.
>
> **Penting — PostgreSQL 18**: Neon berjalan di PG 18, dan `drizzle-kit` **< 0.31.7** memiliki bug
> yang membuat `push` tanpa perubahan schema tetap menghasilkan `DROP CONSTRAINT ..._not_null`
> (gagal dengan `column "id" is in a primary key`). Versi **0.31.7+** sudah memperbaikinya; repo ini
> memakai `drizzle-kit@0.31.11`. Jangan turunkan versinya di bawah 0.31.7.

## ☁️ Deployment

Production berjalan di **Vercel** (serverless) + **Neon PostgreSQL**:

- **Frontend**: static `dist/` disajikan Vercel CDN.
- **API**: `vercel.json` me-rewrite `/api/*` ke serverless function `api/index.js` (hasil `npm run build:api`, di-bundle dari `src/server/vercel.ts`).
- **Database**: PostgreSQL via `drizzle-orm/neon-http`.
- **Environment variables**: `GEMINI_API_KEY`, `DATABASE_URL`, `TEACHER_PASSWORD` (wajib di production).

Alternatif self-host Node (Render/VPS) didokumentasikan di [`DEPLOYMENT.md`](./DEPLOYMENT.md).
