# Panduan Deployment DeutschEasier ke Render.com

Panduan ringkas untuk mendeploy aplikasi **DeutschEasier** ke [Render.com](https://render.com).

---

## 1. Persiapan Environment Variables

Di dashboard Render (bagian **Environment**), atur variabel lingkungan berikut:

| Key | Tipe | Keterangan | Contoh Nilai |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | **Wajib** | API Key Google Gemini dari [Google AI Studio](https://aistudio.google.com/) | `AIzaSy...` |
| `GEMINI_MODEL` | Opsional | Model AI yang digunakan (default: `gemini-3.6-flash`) | `gemini-3.6-flash` |
| `DATABASE_URL` | **Wajib** | Connection string PostgreSQL/Neon (bukan file SQLite) | `postgresql://user:pass@ep-xxx-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` |
| `TEACHER_PASSWORD`| **Wajib** | Password login guru; juga dipakai sebagai secret HMAC token sesi | `rahasia_guru_123` |
| `PORT` | Otomatis | Port diatur otomatis oleh Render (default fallback `3001`) | `10000` |
| `NODE_ENV` | Opsional | Mode environment | `production` |
| `REQUIRE_ACCESS_KEY` | Opsional | Wajibkan kunci akses untuk membaca sesi dan mengirim submission. **Default `false`.** Lihat §1a sebelum menyalakan. | `true` |

---

## 1a. Kunci akses di level API (`REQUIRE_ACCESS_KEY`)

Secara default (`false`) endpoint sesi dapat dibaca tanpa kunci. Ini
mempertahankan **link lama** yang sudah beredar tanpa `?key=` agar tidak mati.

Bila dinyalakan (`true`), dua endpoint menjadi wajib kunci:

| Endpoint | Aturan |
| :--- | :--- |
| `GET /api/sessions/:id` | Guru (token) **atau** `?key=` yang valid untuk sesi itu |
| `POST /api/sessions/:id/submissions` | Guru **atau** kunci valid (body `{{sec:accesskey}}` atau `?key=`) |

`GET /api/sessions` (daftar) **selalu** khusus guru, tidak terpengaruh flag ini.
Kunci selalu terikat ke `sessionId`-nya: kunci milik sesi lain ditolak.

### Sebelum menyalakan — verifikasi link yang sudah beredar

1. Kumpulkan semua link yang pernah dibagikan ke siswa.
2. Pastikan masing-masing berbentuk `/view/<id>?key=DE-XXXXX` (ada `key=`).
   Link tanpa `key=` akan berhenti berfungsi setelah flag dinyalakan.
3. Cek satu per satu di browser: buka link, pastikan dialog tampil (bukan layar kunci).
4. Baru set `REQUIRE_ACCESS_KEY=true` lalu redeploy.

### Akibat menyalakannya

- Link **tanpa** `?key=` → `403` dengan `reason: "missing_key"`.
- Kunci kedaluwarsa → `403` `reason: "expired"`.
- Kunci milik sesi lain / salah → `403` `reason: "not_found"`.
- Guru yang login tetap bisa membuka sesi mana pun tanpa kunci.

Untuk mematikan lagi, set `false` (atau hapus variabelnya) dan redeploy —
tidak ada perubahan data, jadi aman bolak-balik.

---

## 2. Metode Deployment

### Opsi A: Render Web Service (Native Node)
1. Buat **New Web Service** di Render dan hubungkan ke repositori Git Anda.
2. Konfigurasi runtime:
   - **Environment**: `Node`
   - **Build Command**:
     ```bash
     npm ci && npm run build
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
3. Tambahkan environment variables seperti tabel di atas.
4. Klik **Deploy Web Service**.

---

---

> **Catatan Database**: Aplikasi memakai PostgreSQL (Neon) via `drizzle-orm/neon-http`.
> Data bersifat persisten di sisi Neon, sehingga tidak memerlukan Persistent Disk di Render.
> Jalankan `npm run db:seed` untuk mengisi data awal bank kata.
>
> **Catatan skema**: migrasi di `drizzle/` kini berupa baseline **PostgreSQL** (`0000_baseline.sql`).
> Riwayat migrasi Drizzle tidak dipakai di Neon (tabel `drizzle.__drizzle_migrations` kosong),
> jadi `npm run db:migrate` **tidak** menjadi alur yang dipakai. Untuk mengubah skema, perbarui
> `src/db/schema.ts` lalu sinkronkan dengan `npx drizzle-kit push`.
>
> **PostgreSQL 18**: gunakan `drizzle-kit@0.31.7` atau lebih baru. Versi lama memiliki bug yang
> membuat `push` tanpa perubahan schema tetap menghasilkan `DROP CONSTRAINT ..._not_null` dan gagal.

---

## 3. Menjaga Instance Tetap Bangun (Anti-Sleep Free Tier)

Layanan gratis Render akan masuk ke mode *sleep* setelah 15 menit tanpa traffic. Untuk menjaga server tetap responsif dan menghindari *cold start*:

1. Daftar akun gratis di [cron-job.org](https://cron-job.org/) atau [UptimeRobot](https://uptimerobot.com/).
2. Buat job/monitor baru:
   - **URL**: `https://<nama-service-render>.onrender.com/` (atau endpoint API)
   - **Interval**: Setiap 10–14 menit
   - **Method**: `GET`
3. Dengan ping berkala ini, container tidak akan tertidur dan selalu siap menerima interaksi kuis dan percakapan.
