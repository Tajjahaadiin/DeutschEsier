# 0004 — fallbackSpeechSynthesis menggugurkan onEnd bila speechSynthesis tidak tersedia

- **Status:** done (commit pending)
- **Prioritas:** P2
- **Blokir:** **0001** (file yang sama `src/client/lib/audio.ts` — kerjakan setelah 0001 selesai;
  satu penulis per file).
- **File:** `src/client/lib/audio.ts` (`fallbackSpeechSynthesis` ±142–151)

## Konteks

Fallback Web Speech dipanggil dari `safeFallback` dengan `{ ...options, gender: request.gender }`.
Bila `window.speechSynthesis` tidak ada (browser tanpa Web Speech, environment test tertentu),
fungsi ini `return` lebih awal **tanpa pernah memanggil `options.onEnd`**:

```ts
function fallbackSpeechSynthesis(text: string, options: SpeakOptions) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return   // ← onEnd hilang
  ...
}
```

Semua pemanggil memakai `onEnd` untuk keluar dari state "playing": `setPlayingIndex(null)`,
`setActiveAudio(null)`, `setPlaying(null)`, `done()` di loop play-all. Tanpa onEnd, UI terjebak
menampilkan status memutar sampai interaksi berikutnya. (Di jalur normal, `utterance.onend` dan
`utterance.onerror` keduanya memanggil `onEnd`; jalur "tidak ada speechSynthesis" adalah satu-satunya
celahnya.)

## Perubahan yang diminta

```ts
if (typeof window === 'undefined' || !window.speechSynthesis) {
  options.onEnd?.()   // ucapan "selesai" secara trivial — lepaskan pemanggil dari state playing
  return
}
```

Jangan mengubah perilaku lain dari fungsi ini (pitch 1.0, rate, penugasan `currentUtterance`).

## Test regresi (di `src/client/lib/audio.test.ts`)

- Skenario: stub `window.speechSynthesis` sebagai `undefined` (hati-hati restore setelah test —
  ikuti pola setup/teardown harness yang ada), panggil `speakGerman('Hallo', { onEnd })`, picu
  `audio.onerror?.()` → fallback terpanggil → `onEnd` terpanggil **tepat satu kali**, dan tidak ada
  `SpeechSynthesisUtterance` yang dibuat.
- Test "fallback tetap ada saat jaringan gagal" yang lama wajib tetap hijau.

## Kriteria selesai

- Test regresi hijau; seluruh `npm test` hijau; `npm run build` sukses.

## Larangan

- Jangan mengubah `safeFallback`/`stopSpeech` (sudah ditangani 0001 / sudah benar).
- Jangan menambah pitch, rate default berbeda, atau pemilihan voice baru.
