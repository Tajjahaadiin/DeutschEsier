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
> **Catatan skema**: file di `drizzle/` adalah artefak SQLite lama dan **tidak kompatibel**
> dengan PostgreSQL (`npm run db:migrate` akan gagal). Skema Postgres sudah terpasang di Neon;
> untuk mengubahnya, perbarui `src/db/schema.ts` lalu sinkronkan ke Neon.

---

## 3. Menjaga Instance Tetap Bangun (Anti-Sleep Free Tier)

Layanan gratis Render akan masuk ke mode *sleep* setelah 15 menit tanpa traffic. Untuk menjaga server tetap responsif dan menghindari *cold start*:

1. Daftar akun gratis di [cron-job.org](https://cron-job.org/) atau [UptimeRobot](https://uptimerobot.com/).
2. Buat job/monitor baru:
   - **URL**: `https://<nama-service-render>.onrender.com/` (atau endpoint API)
   - **Interval**: Setiap 10–14 menit
   - **Method**: `GET`
3. Dengan ping berkala ini, container tidak akan tertidur dan selalu siap menerima interaksi kuis dan percakapan.
