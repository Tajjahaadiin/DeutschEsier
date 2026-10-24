# 0002 — GeneratorPage play-all tanpa safety timer: loop bisa menggantung selamanya

- **Status:** done (commit pending)
- **Prioritas:** P1
- **Blokir:** tidak ada (independen).
- **File:** `src/client/pages/GeneratorPage.tsx` (`handleStopAll` ±267–273, `handlePlayAll` ±275–326)

## Konteks

`ViewPage.handlePlayAll` sudah punya **safety timer**: bila event `onend` tidak pernah datang
(stall jaringan tanpa error, engine Web Speech gagal diam-diam), `done()` ditembak otomatis dan
loop lanjut ke giliran berikutnya. `GeneratorPage.handlePlayAll` **tidak punya** mekanisme itu:

- `done` hanya terpanggil dari `onEnd` speakGerman.
- `stopSpeech()` (dipanggil `handleStopAll`) me-null-kan handler audio → `done` tidak pernah
  datang → `await new Promise` di dalam loop **tidak pernah resolve** untuk sisa hidup halaman:
  promise menggantung permanen (closure `editedDialogue` bocor), dan bila `onended` tidak fire
  karena alasan lain, spinner `playingIndex` mentok tanpa auto-advance.

`handleStopAll` me-reset UI (`setIsPlayingAll(false)` dst.), jadi gejalanya tersembunyi — tapi
loop asinkronnya tetap tergantung. ViewPage sudah membuktikan pola yang benar; GeneratorPage hanya
belum mengikutinya.

## Referensi pola yang benar (ViewPage ±295–328)

```ts
await new Promise<void>((resolve) => {
  let finished = false
  let safetyTimer: any = null
  const done = () => {
    if (!finished) {
      finished = true
      if (safetyTimer) clearTimeout(safetyTimer)
      if (!cancelledRef.current) {
        timeoutRef.current = setTimeout(resolve, 650)
      } else {
        resolve()
      }
    }
  }
  // Safety timeout fallback jika browser engine men-drop event onend
  const estimatedDurationMs = Math.max(5000, Math.round((turn.germanText.length / 10) * 1000) + 4000)
  safetyTimer = setTimeout(() => {
    console.warn('Speech onEnd event timed out, auto-advancing turn...')
    done()
  }, estimatedDurationMs)

  speakGerman(turn.germanText, { gender: turnGender, personaId: turnPersonaId, rate: playbackRateRef.current, onEnd: done })
})
```

## Perubahan yang diminta

Terapkan pola yang sama persis pada `handlePlayAll` GeneratorPage: deklarasikan `safetyTimer` di
dalam promise executor, clear di `done`, setel sebelum `speakGerman` dengan formula durasi yang
sama. **Jangan** mengubah `handleStopAll`, `cancelledRef`, atau jeda 650 ms yang sudah ada.

## Kriteria selesai

- Perilaku GeneratorPage setara ViewPage: `onend` hilang → auto-advance setelah estimasi durasi;
  Stop di tengah → loop tetap ter-resolve (oleh safetyTimer) tanpa promise menggantung.
- `npx vitest run` penuh hijau; `npm run build` sukses.
- Verifikasi manual: `npm run dev`, buat/buka skenario di Generator, "Putar Semua", tekan Stop di
  tengah giliran, lalu "Putar Semua" lagi → berjalan normal tanpa spinner nyangkut.

## Larangan

- Jangan menambah manipulasi pitch / jalur audio kedua (ADR-0004).
- Jangan refactor struktur play-all menjadi helper baru — hemat diff, tiru pola ViewPage.
