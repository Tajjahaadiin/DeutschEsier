# 0001 — safeFallback tetap membacakan teks setelah pengguna menekan Stop

- **Status:** done (commit pending)
- **Prioritas:** P0
- **Blokir:** tidak ada. **Memblokir:** 0004 (file yang sama, satu penulis).
- **File:** `src/client/lib/audio.ts` (`speakGerman` ±baris 153–195, `stopSpeech` ±118–140)

## Konteks

Setiap ucapan Jerman lewat `speakGerman`: buat `new Audio('/api/tts?...')`, dan bila permintaan
gagal (`audio.onerror` atau `audio.play().catch`) jalankan `safeFallback` → Web Speech. Masalahnya,
`safeFallback` tidak mengecek apakah audio itu **masih yang aktif**. `stopSpeech()` (dipanggil
pengguna atau oleh `speakGerman` berikutnya) meng-null-kan `currentHtmlAudio` dan melepas handler,
tetapi promise `play()` yang tertunda atau event `onerror` yang datang terlambat tetap menembak
`safeFallback` → teks yang baru **dibatalkan pengguna** justru dibacakan suara browser.

Repro: jalankan "Putar Semua" dialog, tekan Stop di tengah giliran → giliran yang dibatalkan
bisa tetap bersuara lewat Web Speech. Pada play-all, `cancelledRef` hanya dicek antar giliran,
bukan di dalam `safeFallback`.

## Temuan (cuplikan kode saat ini)

```ts
const safeFallback = () => {
  if (fallbackExecuted) return
  fallbackExecuted = true
  if (currentHtmlAudio === audio) currentHtmlAudio = null   // hanya membersihkan, TIDAK membatalkan
  console.warn('[tts] /api/tts gagal, memakai suara browser tanpa perubahan nada')
  fallbackSpeechSynthesis(text, { ...options, gender: request.gender })  // tetap dijalankan
}
audio.onended = () => { ... }
audio.onerror = () => safeFallback()
audio.play().catch(() => safeFallback())
```

## Perilaku yang diharapkan

Jika `currentHtmlAudio !== audio` saat `safeFallback` tereksekusi, audio tersebut sudah di-stop
atau diganti — fallback **tidak boleh** dijalankan (pengguna sudah membatalkan atau sudah pindah
ke audio lain). Fallback hanya sah saat audio itu masih yang aktif dan memang gagal.

## Sketsa perubahan

```ts
const safeFallback = () => {
  if (fallbackExecuted) return
  // BARU: audio sudah di-stop (stopSpeech) atau diganti pemanggilan speakGerman berikutnya.
  if (currentHtmlAudio !== audio) return
  fallbackExecuted = true
  currentHtmlAudio = null
  console.warn('[tts] /api/tts gagal, memakai suara browser tanpa perubahan nada')
  fallbackSpeechSynthesis(text, { ...options, gender: request.gender })
}
```

Jangan menyentuh `fallbackSpeechSynthesis`, `stopSpeech`, atau `resolveTtsRequest` — itu lingkup
tiket lain / sudah benar.

## Test regresi (tambahkan di `src/client/lib/audio.test.ts`, pakai harness `FakeAudio` + `spoken` yang ada)

1. `speakGerman(...)` → `stopSpeech()` → `audio.onerror?.()` → `expect(spoken).toHaveLength(0)`.
2. Dua `speakGerman` beruntun (A lalu B) → error pada audio A → `spoken` tetap 0; audio B tidak
   terganggu (masih `played === true`).
3. **Test lama wajib tetap hijau:** "fallback tetap ada saat jaringan gagal…" (error saat audio
   masih aktif → fallback jalan, pitch 1.0). Inilah pembeda perilaku benar vs salah.

## Kriteria selesai

- Ketiga test di atas hijau; seluruh `npx vitest run src/client/lib/audio.test.ts` hijau.
- `npm test` penuh hijau; `npm run build` sukses.
