# 0005 — Hardening endpoint publik `/api/tts` (BUTUH KEPUTUSAN PEMILIK — jangan eksekusi mandiri)

- **Status:** done (commit pending)
- **Prioritas:** P2
- **Blokir:** menunggu keputusan pemilik proyek (pilih varian di bawah).
- **File:** `src/server/routes/tts.ts`

## Konteks

`/api/tts` adalah endpoint publik tanpa autentikasi, tanpa batas panjang teks, tanpa rate limit.
Siapa pun bisa memakai deployment Vercel sebagai **relay sintesis TTS gratis** (teks apa pun,
suara mana pun dari daftar persona). Header `Cache-Control: immutable` hanya menguntungkan URL
persis sama; permintaan unik tetap memicu panggilan ke Microsoft dan memakan durasi function.

Catatan agar proporsional: teks dipaksa ke voice de-DE lewat `resolveEdgeVoiceId` (suara di luar
6 persona jatuh ke default), dan biaya per permintaan kecil — risikonya penyalahgunaan volume,
bukan kebocoran data.

## Opsi (pilih satu; rekomendasi: 1 + 3)

1. **Cap panjang teks** (varian termurah, tanpa dependensi): tolak `text` > ~500–1000 karakter
   dengan `400`. Dialog turn skenario nyata jauh di bawah angka ini; cek dulu data produksi
   (kolom `germanText` di skenario tersimpan) sebelum mematok angka.
2. **Rate limit per-IP in-memory**: efektivitas terbatas di Vercel serverless (instance ephemeral,
   Map per-instance). Hanya masuk akal jika juga dijalankan di Node server (`dist/server.js`).
   Bila serius, pakai store eksternal (mis. Upstash Redis) — menambah dependensi + kredensial.
3. **Logging ringan** permintaan panjang/gagal agar pola penyalahgunaan terlihat di dashboard.

## Kriteria selesai (setelah varian disetujui)

- Permintaan > cap → `400` dengan pesan JSON jelas; test di `src/server/routes/tts.test.ts`
  (harness memock `ttsPromise` — tambahkan kasus cap tanpa menyentuh jaringan).
- Skenario normal (dialog, vocab, alphabet) tidak terpengaruh; `npm test` hijau;
  `npm run tts:smoke` masih 6/6 OK (butuh jaringan).
- Bila keputusan akhirnya "tidak sekarang": catat keputusan itu sebagai pembaruan singkat di
  ADR-0004 bagian konsekuensi, dan tutup tiket ini sebagai `closed`.

## Larangan

- Jangan menambah autentikasi untuk murid — akses kunci (`DE-XXXXX`) tidak melewati endpoint ini
  dan menambahnya bukan lingkup tiket ini.
- Jangan mengubah format cache atau pemilihan voice.
