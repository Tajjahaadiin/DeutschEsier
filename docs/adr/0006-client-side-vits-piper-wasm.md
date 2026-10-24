# ADR-0006: Client-Side VITS/Piper WebAssembly untuk Sintesis Suara Lokal Tanpa Batas Kuota

**Status:** Accepted  
**Tanggal:** 2026-10-24  
**Memperbarui:** ADR-0005 (Curated Personas & Deterministic Dialogue)

---

## Konteks

Implementasi TTS sebelumnya bergantung pada API Google Gemini (`gemini-2.5-flash-preview-tts`) yang memiliki batas *Rate Limit* (RPM/RPD) ketat pada Free Tier. Saat guru atau murid menekan tombol "Putar Semua Dialog" (8–12 kalimat beruntun), server sering menabrak limit `429 Too Many Requests`.

---

## Keputusan

1. **Integrasi Client-Side VITS WASM (`@diffusionstudio/vits-web`):**
   - Menambahkan mesin inferensi suara saraf lokal berbasis ONNX Runtime Web + WebAssembly (`espeak-ng.wasm`).
   - Seluruh pemrosesan sintesis teks Jerman menjadi gelombang suara `.wav` diprioritaskan dieksekusi **100% di dalam browser murid**.
2. **Penyimpanan Model di OPFS (Origin Private File System):**
   - File model `.onnx` disimpan secara permanen di harddisk/browser perangkat murid melalui OPFS. Murid hanya mengunduh model satu kali seumur hidup.
3. **Efisiensi Bandwidth (3 Persona dari 2 Base Model):**
   - **Model Wanita (`de_DE-kerstin-low`, ~16 MB):** Digunakan untuk Katja (`female-1`).
   - **Model Pria (`de_DE-thorsten-medium`, ~18 MB):** Digunakan untuk Conrad (`male-1`) dan di-reuse untuk Killian (`male-2`) dengan modifikasi nada Web Audio API (`detune: +160 cents`, `rate: 1.05`).
   - Total ukuran unduhan yang disimpan murid terpangkas menjadi hanya **~34 MB**.
4. **Resilient Multi-Tier Fallback:**
   - **Tier 1 (Utama):** Client-Side VITS WASM (0 kuota server, offline-capable).
   - **Tier 2 (Cadangan Server):** `/api/tts` (Gemini 2.5 Flash + Vercel CDN Cache).
   - **Tier 3 (Jaring Pengaman Terakhir):** Web Speech API native browser dengan modulasi pitch/rate.

---

## Konsekuensi

- **Positif:**
  - Kuota Gemini AI Studio 100% aman (hanya dipakai untuk generate teks skenario JSON, bukan audio).
  - Dialog panjang (12 kalimat) dapat diputar tanpa batas dan tanpa jeda kuota server.
- **Negatif / Batasan:**
  - Terdapat unduhan pertama kali (~34 MB) saat modul audio pertama kali digunakan pada browser baru.
