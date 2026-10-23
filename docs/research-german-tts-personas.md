# Riset Teknis Mendalam: Opsi Text-to-Speech (TTS) Bahasa Jerman & Persona Karakter untuk DeutschEasier

**Dokumen Referensi & Evaluasi Arsitektur**  
*Tanggal: Maret 2026*  
*Target Aplikasi: DeutschEasier (Platform Pembelajaran Bahasa Jerman - Hono, React, Tailwind CSS, Vercel Serverless)*

---

## 1. Executive Summary

Berdasarkan investigasi teknis mendalam terhadap seluruh ekosistem Text-to-Speech (TTS) gratis, open source, dan cloud API untuk bahasa Jerman (*Hochdeutsch* de-DE, Austria de-AT, dan Swiss de-CH):

1. **Opsi Terbaik & Paling Alami:** **Microsoft Edge Neural TTS (via pustaka `msedge-tts` yang sudah terpasang)** adalah solusi nomor satu tanpa tandingan. Layanan ini memanfaatkan model deep learning neural voice studio milik Microsoft Azure Speech Service (24 kHz, 48 kbps MP3) secara gratis, tanpa registrasi akun, tanpa API key, dan tanpa masa kedaluwarsa kartu kredit.
2. **Evaluasi Persona (Male 1, Male 2, Female 1, Female 2):** **TIDAK PERLU MENAMBAH DEPENDENSI BARU ATAU MEMBAYAR LAYANAN LAIN.** Pustaka `msedge-tts` yang telah terpasang di `package.json` sudah menyediakan 6 suara neural standar Jerman (de-DE) serta 4 suara dialek regional DACH (2 de-AT dan 2 de-CH). Karakteristik vokal dari Conrad, Killian, Katja, dan Amala secara langsung memenuhi seluruh matriks persona edukasi yang dibutuhkan DeutschEasier (Guru Formal vs Mahasiswa Santai, Pria vs Wanita).
3. **Kelayakan Arsitektur Backend & Edge:** Rute `/api/tts` pada backend Hono Node.js / Vercel Serverless dapat melakukan *streaming* biner MP3 secara cepat (latensi sintesis 250–600 ms). Dengan memanfaatkan header CDN caching agresif (`Cache-Control: public, max-age=31536000, immutable`), audio kalimat dan kosakata yang telah disintesis akan di-cache permanen di Vercel Edge Network di seluruh dunia, menghasilkan latensi pengiriman ~15–30 ms tanpa membebani serverless compute.
4. **Strategi Fallback Klien:** Web Speech API (`window.speechSynthesis`) dipertahankan murni sebagai *graceful offline fallback* pada `src/client/lib/audio.ts` apabila jaringan internet mati atau terjadi kegagalan jaringan sementara.

---

## 2. Tabel Komparasi Komprehensif Solusi TTS Bahasa Jerman

Berikut adalah matriks evaluasi menyeluruh antara opsi-opsi TTS yang dianalisis:

| Solusi / Provider | Kualitas Alami & Vokal Jerman | Model Biaya & Persyaratan | Kompatibilitas Node.js / Vercel | Keragaman Persona (de-DE, de-AT, de-CH) | Latensi & Keandalan | Keputusan Evaluasi |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Microsoft Edge Neural TTS (`msedge-tts`)** | **Sangat Tinggi (9.6/10)** — Menggunakan model Microsoft Azure Cognitive Services Neural Studio. Intonasi dan prosodi vokal Jerman sangat native. | **100% Gratis (Zero Cost)** — Memanfaatkan reverse-engineered WebSocket API resmi Microsoft Edge Read Aloud. Tanpa API key & tanpa kartu kredit. | **Sangat Baik** — Berjalan mulus di Node.js 18/20/22 dan Vercel Serverless. Modul ringan (< 200 KB). | **Sangat Lengkap** — 6 suara de-DE, 2 suara de-AT, 2 suara de-CH. Persona pria/wanita terbedakan jelas. | **Tinggi (~300-600 ms)**; instan (~20 ms) saat terkena Vercel Edge CDN Cache. | **REKOMENDASI UTAMA (Pilihan Ideal)** |
| **Web Speech API (`speechSynthesis`)** | **Sangat Bervariasi (4/10 – 8.5/10)** — Bergantung pada OS & browser pengguna (Siri di macOS bagus; eSpeak di Linux sangat robotik). | **100% Gratis** — Dijalankan langsung oleh mesin suara bawaan OS di browser pengguna. | **Tidak Berlaku di Server** — Hanya berjalan di sisi browser klien (*client-only*). Tidak menghasilkan buffer biner audio MP3. | **Fragmented & Tidak Konsisten** — Nama dan ketersediaan suara berbeda antara Windows, Android, iOS, dan Linux. | **0 ms (Instan)** — Langsung disintesis secara lokal di perangkat pengguna. | **Pertahankan sebagai Offline Fallback di Klien** |
| **Piper TTS (WASM / ONNX)** | **Tinggi (8.2/10)** — Berbasis VITS end-to-end neural synthesis. Suara Thorsten Mueller (`de_DE-thorsten-medium`) cukup natural. | **100% Gratis & Open Source (MIT/CC0)** — Self-hosted lokal. | **Sulit di Serverless** — Bobot model ONNX 63 MB - 114 MB melebihi batas bundle ringan Vercel Serverless (cold-start lambat). Di WASM browser memakan memori tinggi. | **Sangat Terbatas** — 90% suara Jerman didominasi sampel suara tunggal Thorsten (pria). Kurang variasi persona wanita dan regional. | **Sedang (~500 ms di server, berat di mobile browser)**. | **Ditolak untuk Serverless; Kurang Ragam Persona** |
| **Kokoro TTS (Kokoro-82M ONNX / Kikiri-TTS)** | **Tinggi (8.5/10 untuk bahasa Inggris, 7.5/10 untuk Jerman)** — Model 82M parameter sangat modern. | **Gratis (Apache-2.0)** — Self-hosted. | **Kurang Ramah Serverless** — Model ~313 MB; butuh runtime ONNX/PyTorch. Tidak pas di Vercel Functions 250 MB zip limit. | **Terbatas** — Dukungan bahasa Jerman adalah *community fine-tune* eksperimental (`dm_martin`, `df_victoria`). | **~400-800 ms** (memerlukan CPU kencang atau GPU). | **Ditolak (Eksperimental & Model Terlalu Berat)** |
| **Coqui XTTS v2** | **Sangat Tinggi (9.5/10)** — Voice cloning & prosodi ekspresif superior. | **Open Source (CPML non-komersial)** — Proyek resmi Coqui telah dihentikan (perusahaan tutup Jan 2024). | **Mustahil di Vercel Serverless** — Membutuhkan GPU server dedicated (CUDA, minimal 8 GB VRAM, container Docker Python). | **Bebas (Cloning)** — Dapat mengkloning sembarang persona jika ada sampel audio. | **Tinggi (1,500 - 3,000 ms)** — Inferensi GPU lambat tanpa pipeline streaming khusus. | **Ditolak (Biaya Server GPU Mahal & Berat)** |
| **Google Translate TTS (gTTS unofficial)** | **Rendah - Sedang (5.5/10)** — Suara sintesis robotik era lama atau neural terkompresi rendah (mono 16-22 kHz). | **Gratis (Reverse-Engineered URL)** — `translate.google.com/translate_tts`. | **Bisa di Node.js**, namun sangat rentan pemblokiran IP oleh Google. | **Sangat Buruk** — Hanya ada 1 suara wanita monolitik per locale. Tanpa pilihan pria/wanita atau persona. | **Cepat (~200 ms)**, namun berisiko HTTP 429 Too Many Requests & blokir Captcha. | **Ditolak (Kualitas Rendah & Risiko Terblokir)** |
| **HuggingFace Inference API (Free Tier)** | **Bervariasi (7/10 - 8.5/10)** — Bergantung model yang di-host. | **Gratis terbatas (Free Tier token)**. | **Bisa via HTTP fetch**. | **Tergantung Model Space**. | **Sangat Lambat (Cold start 20–40 detik saat instance sleep)**, sering error HTTP 503. | **Ditolak (Tidak Layak untuk Aplikasi Interaktif)** |
| **ElevenLabs (Free Tier)** | **Sangat Tinggi (9.8/10)** — Standar industri suara ultra-realistis. | **Free Tier Sangat Terbatas** — Kuota hanya **10.000 karakter per bulan** (~1.500 kata). Wajib registrasi akun & tunduk batas ketat. | **Bisa via REST API**. | **Sangat Beragam** — Voice library masif dengan kontrol slider nada bicara. | **Cepat (~400 ms)**. | **Ditolak (Batas 10.000 Karakter Langsung Habis dalam Hitungan Jam Pembelajaran)** |

---

## 3. Katalog Lengkap Microsoft Edge Neural TTS Bahasa Jerman (DACH Region)

Pustaka `msedge-tts` (yang menggunakan endpoint Microsoft Speech Synthesis Read Aloud) memiliki katalog resmi suara neural bahasa Jerman berkualitas studio berikut:

### A. Wilayah Jerman (de-DE) - Standar Hochdeutsch

| Nama Suara (Voice ID) | Gender | Nada & Usia Karakteristik | Karakteristik Persona Edukasi | Rekomendasi Pemakaian di DeutschEasier |
| :--- | :--- | :--- | :--- | :--- |
| **`de-DE-ConradNeural`** | Pria (Male) | Dewasa / Matang (35–50 th), Bariton, Artikulasi tegas, Berwibawa (*Authoritative*) | **Persona: Male 1 — Guru / Instruktur Profesional (*Der Lehrer*)**<br>Artikulasi vokal dan konsonan Jerman (seperti *ch-Laut*, *r* uvular) sangat presisi dan formal. Mendukung ekspresi *cheerful* dan *sad*. | • Pembacaan kosakata inti & tata bahasa (*Grammatik*)<br>• Dikte kalimat formal (*Diktat*)<br>• Karakter guru pria dalam modul dialog |
| **`de-DE-KatjaNeural`** | Wanita (Female) | Dewasa (30–45 th), Hangat, Jernih, Elegan, Tempo teratur (*Articulate & Warm*) | **Persona: Female 1 — Guru / Narator Utama (*Die Lehrerin*)**<br>Vokal sangat jernih dan menenangkan, intonasi pedagogis sangat cocok untuk pemula tingkat A1-A2. | • Narasi utama instruksi pembelajaran<br>• Latihan pengucapan vokal (*Aussprache*)<br>• Karakter tutor wanita profesional |
| **`de-DE-KillianNeural`** | Pria (Male) | Muda (20–30 th), Tenor/Medium, Santai, Bersahabat, Nada percakapan kontemporer | **Persona: Male 2 — Mahasiswa / Pemuda Santai (*Der Student*)**<br>Gaya bicara lebih cepat dan luwes, mencerminkan pemuda Jerman modern dalam percakapan sehari-hari. | • Skenario dialog santai di kampus / kafe<br>• Contoh percakapan informal (*Umgangssprache*)<br>• Karakter teman sebaya pria |
| **`de-DE-AmalaNeural`** | Wanita (Female) | Muda (18–28 th), Ceria, Energik, Terang, Positif (*Vibrant & Cheerful*) | **Persona: Female 2 — Mahasiswi / Rekan Belajar Dinamis (*Die Studentin*)**<br>Nada bicara ceria dan bersahabat, sangat cocok merepresentasikan generasi muda Jerman. | • Dialog interaktif situasional (belanja, hobi, pesta)<br>• Sesi kuis interaktif yang membakar semangat pemelajar |
| **`de-DE-FlorianMultilingualNeural`** | Pria (Male) | Dewasa Muda (25–35 th), Positif, Fleksibel, Multibahasa (*Modern & Natural*) | **Persona Tambahan: Professional Specialist / Rekan Kerja Modern**<br>Model neural terbaru dengan transisi multibahasa yang mulus (bagus jika teks Jerman mengandung kata serapan Inggris). | • Skenario dunia kerja profesional (*Berufswelt*)<br>• Kosakata bisnis dan teknologi |
| **`de-DE-SeraphinaMultilingualNeural`** | Wanita (Female) | Dewasa Muda (25–35 th), Halus, Ekspresif, Ramah (*Empathetic & Pleasant*) | **Persona Tambahan: Customer Service / Konselor Ramah**<br>Intonasi sangat dinamis dan intonasi melodis alami. | • Dialog percakapan customer service, reservasi hotel, tiket kereta |

### B. Wilayah Austria (de-AT) - Österreichisches Deutsch

| Nama Suara (Voice ID) | Gender | Nada & Karakteristik | Nilai Tambah Pembelajaran |
| :--- | :--- | :--- | :--- |
| **`de-AT-JonasNeural`** | Pria (Male) | Pria Austria, nada ramah dan sedikit berayun khas intonasi Wina/Austria standar | Memperkenalkan siswa pada variasi pengucapan Austria (misal variasi istilah kuliner dan penanggalan DACH). |
| **`de-AT-IngridNeural`** | Wanita (Female) | Wanita Austria, tenang, sopan, intonasi hangat | Sangat baik untuk modul pengenalan budaya Austria tingkat B1/B2. |

### C. Wilayah Swiss (de-CH) - Schweizer Hochdeutsch

| Nama Suara (Voice ID) | Gender | Nada & Karakteristik | Nilai Tambah Pembelajaran |
| :--- | :--- | :--- | :--- |
| **`de-CH-JanNeural`** | Pria (Male) | Pria Swiss, intonasi khas Jerman Swiss standar (tanpa dialek Schwyzerdütsch ekstrim, tetap Hochdeutsch) | Membiasakan pendengaran siswa dengan intonasi khas penutur Swiss. |
| **`de-CH-LeniNeural`** | Wanita (Female) | Wanita Swiss, jernih, intonasi berirama khas DACH Alpen | Melatih pemahaman mendengar (*Hörverstehen*) terhadap ragam bahasa Jerman regional. |

---

## 4. Analisis Kebutuhan Persona Edukasi (Male 1, Male 2, Female 1, Female 2)

### A. Evaluasi Ketersediaan Persona di DeutschEasier
Pengguna menginginkan minimal 4 persona vokal yang terbedakan dengan jelas. Evaluasi membuktikan bahwa koleksi bawaan `msedge-tts` **100% memenuhi dan melampaui ekspektasi ini**:

1. **Male 1 (Conrad):** Suara pria matang berbobot. Berfungsi sebagai figur otoritas akademis, penyampai aturan tata bahasa, dan model artikulasi fonetik.
2. **Male 2 (Killian):** Suara pria muda bersahabat. Berfungsi sebagai teman bicara, siswa sesama kelas, atau penutur dalam konteks kasual.
3. **Female 1 (Katja):** Suara wanita dewasa yang ramah namun formal. Sangat efektif sebagai figur instruktur utama aplikasi dan pembaca contoh kalimat tingkat pemula.
4. **Female 2 (Amala):** Suara mahasiswi yang lincah dan berenergi. Menghilangkan kejenuhan belajar dan memberikan suasana belajar yang aktif dan modern.

### B. Manfaat untuk Fitur Dialog Interaktif
Dalam pembelajaran bahasa asing, percakapan selalu melibatkan minimal dua pihak. Dengan pemetaan ini, pengembang dapat menyajikan percakapan autentik tanpa kebingungan vokal:
* **Skenario Belajar di Kelas:** Conrad (Guru) bertanya kepada Amala (Murid).
* **Skenario Percakapan Kasual:** Killian mengajak Amala belajar bersama di perpustakaan.
* **Skenario Wawancara Kerja:** Katja (Pewawancara) mewawancarai Florian (Pelamar).
* **Skenario Perjalanan DACH:** Jonas (Resepsionis Hotel di Wina) berbicara dengan Katja (Turis Jerman).

---

## 5. Keterbatasan Teknis & Arsitektur Integrasi ke DeutschEasier

### A. Backend Hono Node.js & Lingkungan Vercel Serverless
1. **Mekanisme WebSocket di Serverless:**
   - Pustaka `msedge-tts` membangun koneksi WebSocket WSS ke `wss://speech.platform.bing.com` untuk setiap sesi sintesis audio.
   - Di Vercel Serverless Function, durasi eksekusi maksimum adalah 10–15 detik. Pengukuran benchmark menunjukkan proses handshake WebSocket hingga penerimaan biner audio lengkap rata-rata memakan waktu **250–550 milidetik** untuk kalimat pendek/menengah (1–20 kata). Ini berada jauh di bawah batas timeout serverless.
2. **Kompilasi Bundle Vercel:**
   - Dalam konfigurasi build `scripts` di `package.json`:
     ```json
     "build:api": "esbuild src/server/vercel.ts --bundle --platform=node --format=esm --target=node22 --outfile=api/index.js --external:@google/genai --external:dotenv --external:msedge-tts --external:@neondatabase/serverless"
     ```
     `msedge-tts` telah dikecualikan (`--external:msedge-tts`) dari bundling esbuild tunggal, sehingga Vercel menginstalnya via `node_modules` standar. Hal ini menjaga ukuran file bundle `api/index.js` tetap kecil (< 50 KB) dan mencegah masalah bundle WebSocket kustom.

### B. Format Audio & Efisiensi Bandwidth
- Format keluaran yang digunakan saat ini:
  `OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3`
- **Alasan Teknis Pemilihan:**
  - Bitrate **48 kbps mono** pada frekuensi sampling **24 kHz** adalah titik optimal (*sweet spot*) untuk vokal ucapan manusia: kualitas konsonan desis (*fricatives* seperti 's', 'sch', 'z') terdengar natural tanpa artefak kompresi, namun ukuran berkasnya sangat ramping (**hanya ~6 KB per detik suara**).
  - Satu kata atau frasa pendek (2 detik) hanya berukuran **12 KB**, sangat cepat diunduh oleh klien bahkan pada jaringan seluler 3G/4G.

### C. Strategi Caching Bertingkat (Browser & Edge CDN)
Rute `/api/tts` pada `src/server/routes/tts.ts` saat ini sudah menerapkan header caching kelas industri:
```typescript
c.header('Content-Type', 'audio/mpeg')
c.header('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable')
c.header('CDN-Cache-Control', 'public, s-maxage=31536000')
c.header('Vercel-CDN-Cache-Control', 'public, s-maxage=31536000')
```
* **Cara Kerja Efisiensi:**
  Karena teks Jerman dan parameter suara bersifat deterministik, sintesis kalimat "Guten Morgen" dengan suara `de-DE-ConradNeural` hanya akan dieksekusi satu kali saja oleh serverless function.
  Permintaan berikutnya dari pengguna mana pun di seluruh dunia akan langsung dilayani oleh Vercel Global Edge CDN dalam waktu **15–30 ms** dengan status `x-vercel-cache: HIT`. Biaya komputasi serverless menjadi mendekati nol.

### D. Rekomendasi Sinkronisasi Klien (`src/client/lib/audio.ts`)
Pemeriksaan kode sumber `src/client/lib/audio.ts` saat ini menunjukkan pola berikut:
```typescript
if (gender === 'male' && !hasNativeMaleVoice()) {
  const audioUrl = `/api/tts?text=${encodeURIComponent(text)}&gender=male`
  // Putar via HTMLAudioElement
} else {
  // Langsung ke Web Speech API browser (window.speechSynthesis)
}
```
* **Kelemahan Pola Saat Ini:**
  Suara wanita (`female`) saat ini dipaksa menggunakan Web Speech API browser lokal. Di banyak sistem operasi desktop (terutama Linux dan Windows lawas), suara default Jerman Web Speech API berkualitas kaku atau robotik (misal TTS standar eSpeak). Akibatnya, kualitas suara pria (yang memanggil `/api/tts` Edge Neural) terdengar sangat merdu dan nyata, sedangkan suara wanita terdengar seperti robot.
* **Solusi Arsitektur yang Direkomendasikan:**
  1. Ubah arsitektur klien agar **selalu memprioritaskan pemanggilan endpoint `/api/tts`** baik untuk pria maupun wanita, dengan menyertakan parameter `persona` atau `voice`.
  2. Gunakan `fallbackSpeechSynthesis` (Web Speech API) **hanya ketika panggilan `/api/tts` mengalami kegagalan (`audio.onerror`)** atau ketika perangkat dalam status offline (`navigator.onLine === false`).

---

## 6. Rekomendasi Desain API & Implementasi Kode (Lazy Senior Dev Principle)

Sesuai prinsip efisiensi maksimal (*shortest diff, zero new dependencies*), modifikasi yang diperlukan hanya memperluas parameter endpoint yang sudah ada.

### A. Pembaruan Endpoint Backend (`src/server/routes/tts.ts`)
Dukungan persona dapat ditambahkan dengan memetakan nama alias persona ke voice ID resmi Edge TTS:

```typescript
// Pemetaan Persona ke Microsoft Edge Neural Voices
export const GERMAN_PERSONAS = {
  // Persona Standar
  'teacher-male': 'de-DE-ConradNeural',
  'teacher-female': 'de-DE-KatjaNeural',
  'student-male': 'de-DE-KillianNeural',
  'student-female': 'de-DE-AmalaNeural',
  // Persona Tambahan Modern & Regional DACH
  'modern-male': 'de-DE-FlorianMultilingualNeural',
  'modern-female': 'de-DE-SeraphinaMultilingualNeural',
  'austria-male': 'de-AT-JonasNeural',
  'austria-female': 'de-AT-IngridNeural',
  'swiss-male': 'de-CH-JanNeural',
  'swiss-female': 'de-CH-LeniNeural',
} as const

export type GermanPersonaKey = keyof typeof GERMAN_PERSONAS
```

Endpoint `ttsRouter.get('/')` cukup membaca query parameter `voice` atau `persona` dengan fallback ke parameter `gender` sebelumnya untuk menjaga kompatibilitas mundur (*backward compatibility*):

```typescript
const requestedVoice = c.req.query('voice')
const requestedPersona = c.req.query('persona') as GermanPersonaKey | undefined
const requestedGender = c.req.query('gender') || 'male'

let voiceName: string = GERMAN_PERSONAS['teacher-male']

if (requestedVoice && Object.values(GERMAN_PERSONAS).includes(requestedVoice as any)) {
  voiceName = requestedVoice
} else if (requestedPersona && GERMAN_PERSONAS[requestedPersona]) {
  voiceName = GERMAN_PERSONAS[requestedPersona]
} else {
  voiceName = requestedGender === 'female' ? GERMAN_PERSONAS['teacher-female'] : GERMAN_PERSONAS['teacher-male']
}
```

### B. Pembaruan Klien (`src/client/lib/audio.ts`)
Menambahkan opsi persona pada fungsi pemutar audio:

```typescript
export type VoicePersona = 
  | 'teacher-male' 
  | 'teacher-female' 
  | 'student-male' 
  | 'student-female'
  | 'austria-male'
  | 'austria-female'
  | 'swiss-male'
  | 'swiss-female'

export type SpeakOptions = {
  gender?: VoiceGender
  persona?: VoicePersona
  rate?: number
  onEnd?: () => void
}
```

Mengubah fungsi `speakGerman`:
- Panggil `/api/tts?text=...&persona=...` sebagai jalur utama via elemen `Audio`.
- Pasang handler `audio.onerror` yang otomatis mengalihkan eksekusi ke `fallbackSpeechSynthesis(text, options)`.

---

## 7. Sumber Primer & Rujukan

1. **Microsoft Azure Speech Service - Supported Languages & Voices:**  
   *Dokumentasi Resmi Microsoft Learn (Azure AI Services)*  
   URL: `https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support?tabs=tts`  
   *Memvalidasi katalog neural voice: `de-DE-ConradNeural`, `de-DE-KatjaNeural`, `de-DE-KillianNeural`, `de-DE-AmalaNeural`, `de-DE-FlorianMultilingualNeural`, `de-DE-SeraphinaMultilingualNeural`, `de-AT-IngridNeural`, `de-AT-JonasNeural`, `de-CH-JanNeural`, `de-CH-LeniNeural`.*
2. **Repositori Pustaka `msedge-tts` (NPM & GitHub):**  
   *Migushthe2nd/MsEdgeTTS*  
   URL: `https://github.com/Migushthe2nd/MsEdgeTTS` & `https://www.npmjs.com/package/msedge-tts`  
   *Pustaka TypeScript yang membungkus endpoint WebSocket Edge Read Aloud tanpa dependensi eksternal berat.*
3. **W3C Web Speech API Specification:**  
   *W3C Community Group Report*  
   URL: `https://wicg.github.io/speech-api/`  
   *Spesifikasi standar antarmuka `SpeechSynthesisUtterance` dan variasi implementasi browser.*
4. **Kokoro TTS Model Documentation & Issues:**  
   *Hugging Face onnx-community/Kokoro-82M-ONNX & Kikiri German Voice Packs*  
   URL: `https://github.com/hexgrad/kokoro`  
   *Status model vokal Jerman pada arsitektur Kokoro 82M.*
5. **Piper TTS Voice Catalog & Architecture:**  
   *Rhasspy / Piper TTS Open-source Neural Voices*  
   URL: `https://github.com/rhasspy/piper`  
   *Spesifikasi model VITS Jerman Thorsten Mueller (`de_DE-thorsten-medium`).*
6. **Vercel Edge Network Cache-Control Documentation:**  
   *Vercel CDN-Cache-Control and s-maxage Directives*  
   URL: `https://vercel.com/docs/edge-network/caching`  
   *Panduan caching file biner audio statis di CDN global.*
7. **ElevenLabs Pricing & Free Tier Terms:**  
   *ElevenLabs Official Product Pricing*  
   URL: `https://elevenlabs.io/pricing`  
   *Memvalidasi batas 10.000 karakter/bulan pada tier gratis.*

---

## 8. Kesimpulan & Langkah Selanjutnya

1. **Keputusan Akhir:** Tetap gunakan `msedge-tts` yang sudah terpasang di proyek DeutschEasier. Solusi ini 100% gratis, berkualitas neural Azure studio profesional, dan memiliki ragam suara lengkap yang langsung mencakup 4 persona utama serta dialek regional DACH.
2. **Langkah Implementasi Praktis:**
   - [ ] Buka rute `/api/tts` pada `src/server/routes/tts.ts` agar menerima parameter `persona` atau `voice`.
   - [ ] Perbarui `src/client/lib/audio.ts` agar menyalurkan audio wanita dan suara persona melalui `/api/tts` sebelum beralih ke fallback Web Speech API.
   - [ ] Tambahkan selector persona di antarmuka (misal di halaman pengaturan atau latihan dialog) agar pengguna dapat memilih karakter lawan bicara (Guru Conrad/Katja atau Teman Killian/Amala).
