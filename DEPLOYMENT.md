# Panduan Deployment DeutschEasier ke Render.com

Panduan ringkas untuk mendeploy aplikasi **DeutschEasier** ke [Render.com](https://render.com).

---

## 1. Persiapan Environment Variables

Di dashboard Render (bagian **Environment**), atur variabel lingkungan berikut:

| Key | Tipe | Keterangan | Contoh Nilai |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | **Wajib** | API Key Google Gemini dari [Google AI Studio](https://aistudio.google.com/) | `AIzaSy...` |
| `GEMINI_MODEL` | Opsional | Model AI yang digunakan (default: `gemini-3.6-flash`) | `gemini-3.6-flash` |
| `DATABASE_URL` | Opsional | Path database SQLite (default: `./sqlite.db`) | `./sqlite.db` |
| `TEACHER_SECRET_KEY`| Opsional | Kunci rahasia untuk proteksi endpoint guru | `rahasia_guru_123` |
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

### Opsi B: Render Web Service (Docker)
1. Buat **New Web Service** di Render dan pilih repositori Anda.
2. Render akan secara otomatis mendeteksi berkas `Dockerfile`.
3. Konfigurasi:
   - **Environment**: `Docker`
   - **Docker Command**: Kosongkan (akan menggunakan `CMD` bawaan Dockerfile)
4. Tambahkan environment variables di tab **Environment**.
5. Klik **Deploy Web Service**.

> **Catatan Persistent Storage (SQLite)**:  
> Pada free tier Render, filesystem bersifat ephemeral (data reset saat restart). Untuk penyimpanan data sesi permanen, pasang **Persistent Disk** di Render mount path (misal `/data`), lalu atur `DATABASE_URL=/data/sqlite.db`.

---

## 3. Menjaga Instance Tetap Bangun (Anti-Sleep Free Tier)

Layanan gratis Render akan masuk ke mode *sleep* setelah 15 menit tanpa traffic. Untuk menjaga server tetap responsif dan menghindari *cold start*:

1. Daftar akun gratis di [cron-job.org](https://cron-job.org/) atau [UptimeRobot](https://uptimerobot.com/).
2. Buat job/monitor baru:
   - **URL**: `https://<nama-service-render>.onrender.com/` (atau endpoint API)
   - **Interval**: Setiap 10–14 menit
   - **Method**: `GET`
3. Dengan ping berkala ini, container tidak akan tertidur dan selalu siap menerima interaksi kuis dan percakapan.
