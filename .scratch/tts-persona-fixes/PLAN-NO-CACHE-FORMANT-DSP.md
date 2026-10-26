# Plan: No-Cache Fallback Policy & Biometric Formant Reshaping untuk Pria

Dokumen rencana kerja ini dibuat sebagai panduan sebelum sesi di-compact.

---

## 1. Konteks & Latar Belakang
- Karakter pria (`männlich-1` dan `männlich-2`) di-sintesis via HuggingFace Space Kokoro Martin.
- Jika HuggingFace timeout/antre, sistem jatuh ke Google Translate TTS.
- **Masalah 1**: Saat ini audio fallback darurat Google TTS (suara wanita) ikut di-cache 1 tahun oleh Vercel CDN, sehingga saat Space kembali aktif, murid tetap terjebak mendengar suara wanita.
- **Masalah 2**: Suara fallback Google untuk pria terdengar flat wanita sama persis dengan karakter wanita (`weiblich`), sehingga kontras vokal hilang.

---

## 2. Rencana Implementasi Terperinci

### Task 1: Backend Dynamic Cache Headers (`src/server/routes/tts.ts`)
- **Jika Sukses dari Kokoro Martin**:
  - `Content-Type: audio/wav`
  - `Cache-Control: public, max-age=31536000, s-maxage=31536000, immutable`
  - `Vercel-CDN-Cache-Control: public, s-maxage=31536000`
- **Jika Fallback Google untuk Pria (`isMale = true`)**:
  - `Content-Type: audio/mpeg`
  - `Cache-Control: no-cache, no-store, must-revalidate`
  - `Vercel-CDN-Cache-Control: no-store`
  - `x-tts-fallback: google-male` (penanda untuk client DSP)
- **Jika Karakter Wanita (`weiblich`)**:
  - `Content-Type: audio/mpeg`
  - Tetap di-cache 1 tahun seperti biasa.

---

### Task 2: Client Web Audio Formant DSP Filter (`src/client/lib/audio.ts`)
Membuat audio processing graph menggunakan Web Audio API native:
```text
[ AudioElement (Google MP3) ] 
       │
       ▼ (MediaElementSourceNode)
[ Low-Shelf Biquad Filter: 180 Hz, +6 dB ] (Mempertebal Resonansi Dada Bariton)
       │
       ▼
[ High-Shelf Biquad Filter: 3200 Hz, -8 dB ] (Meredam Sibilance Melengking Wanita)
       │
       ▼
[ AudioContext.destination (Speaker Murid) ]
```
- Modulasi `playbackRate = 0.92x` untuk menurunkan F0 fundamental frequency secara halus tanpa mengubah ritme bicara secara drastis.

---

### Task 3: Verifikasi & Test Suite
- Unit test `tts.test.ts` untuk memverifikasi pemisahan header cache (`immutable` vs `no-store`).
- Unit test `audio.test.ts` untuk memastikan node filter terpasang dengan benar tanpa memory leak.
- Verifikasi `npx tsc --noEmit` & `npm test`.
- Rebuild Vercel API bundle (`npm run build:api`).

---

## 3. Checklist Todo
Todo tersimpan di sistem dengan ID: `TODO-9df0e7dc`.
Silakan lakukan manual compact pada sesi. Setelah compact selesai, instruksikan saya untuk langsung mengeksekusi rencana ini!
