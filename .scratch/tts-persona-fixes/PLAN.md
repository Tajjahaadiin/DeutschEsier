# Sprint: Perbaikan Bug Persona TTS — DeutschEasier

> Sumber temuan: audit kode persona TTS (sesi ini). Latar historis: `docs/rootcause-tts-persona.md`,
> `docs/adr/0003-tts-persona-architecture.md`, `docs/adr/0004-tts-endpoint-as-single-source-of-persona.md`.
> Semua temuan diverifikasi dengan membaca kode pada working tree saat ini.

## Ringkasan

Arsitektur persona (6 persona → `personaId` → `/api/tts` → `node-edge-tts`) sudah sehat sesuai ADR-0004.
Yang ditemukan adalah **4 bug sisi klien** pada siklus hidup audio (play/stop/fallback) dan **1 risiko
infrastruktur** di endpoint publik. Tidak ada bug pada resolusi persona itu sendiri.

## Graf tiket (edges)

```
0001 (safeFallback abai stop)  ──blokir──▶  0004 (onEnd guarantee fallback)
0002 (GeneratorPage play-all)      ── independen
0003 (Analytics modal persona)     ── independen
0005 (hardening /api/tts)          ── independen, BUTUH KEPUTUSAN pemilik — jangan dikerjakan tanpa konfirmasi
```

Frontier awal (boleh paralel): **0001, 0002, 0003**. Satu file = satu penulis:
`src/client/lib/audio.ts` hanya boleh ditulis oleh satu agent pada satu waktu (karena itu 0004
diblokir 0001).

## Urutan eksekusi

| # | Tiket | Prioritas | File utama |
|---|---|---|---|
| 1 | [0001 safeFallback abai setelah stop](issues/0001-safefallback-abai-setelah-stop.md) | P0 | `src/client/lib/audio.ts` |
| 2 | [0002 GeneratorPage play-all tanpa safety timer](issues/0002-generator-playall-tanpa-safety-timer.md) | P1 | `src/client/pages/GeneratorPage.tsx` |
| 3 | [0003 Analytics modal membuang persona soal](issues/0003-analytics-modal-buang-persona-soal.md) | P1 | `src/client/components/analytics/SubmissionAnalyticsModal.tsx` |
| 4 | [0004 Fallback tanpa speechSynthesis menggugurkan onEnd](issues/0004-fallback-tanpa-speechsynthesis-menggugurkan-onend.md) | P2 (diblokir 0001) | `src/client/lib/audio.ts` |
| 5 | [0005 Hardening /api/tts](issues/0005-hardening-api-tts.md) | P2 — needs decision | `src/server/routes/tts.ts` |

## Aturan yang TIDAK boleh dilanggar (dari ADR-0004) — berlaku untuk semua tiket

1. `/api/tts` adalah satu-satunya sumber audio Jerman; Web Speech hanya fallback saat gagal.
2. **Dilarang memanipulasi pitch** untuk meniru persona (`pitch` fallback selalu 1.0).
3. Unit yang diseberangkan antar komponen adalah `personaId`, bukan `gender`.
4. Prioritas resolusi ada di satu fungsi murni `resolveTtsRequest` — jangan tambah jalur pemilihan suara kedua.

## Hal yang SUDAH BENAR — jangan "diperbaiki"

- `resolveTtsRequest` (persona eksplisit > stored persona yang gender-nya cocok > default gender).
- Semua pemanggil dialog sudah membawa `personaId` (GeneratorPage, ViewPage, ScenarioQuiz, DayPage,
  NumberPage, AlphabetPage → children).
- Header cache immutable di `tts.ts`; `npm run tts:smoke` sebagai deteksi kesehatan endpoint.
- Fallback "bodoh" yang jujur (suara browser, pitch 1.0, `console.warn`).

## Definisi selesai (untuk setiap tiket)

- `npm test` hijau penuh (289 test saat audit) + test regresi baru untuk bug yang diperbaiki.
- `npm run build` tidak rusak.
- Status tiket diubah menjadi `done` + dicantumkan hash commit.
- `npm run tts:smoke` hanya jika tiket menyentuh `src/server/` (butuh jaringan; opsional).

## Keputusan PARKIR (bukan untuk agent — butuh manusia)

### Kokoro German sebagai alternatif/pelengkap Edge TTS

ADR-0004 menolak self-host karena (a) persona < 6, (b) runtime Python. Fakta baru mengubah (a):

- **`dida-80b/kokoro-deutsch-hui-base`** (HuggingFace, CC0): base multi-speaker Jerman, 51 speaker
  (24 pria / 27 wanita), ~51 jam audio, resep training publik → *bisa* mengekstrak 6 voicepack
  untuk memenuhi ADR-0003.
- Voice siap pakai (semua Apache-2.0 kompatibel): `Thorsten-Voice/Kokoro` (dataset CC0),
  `kikiri-tts/kikiri-german-martin` & `-victoria`, `Tundragoon/Kokoro-German` (df_eva/dm_bernd).

Kendala yang tetap berlaku:
- Tidak ada voice German ONNX resmi → `kokoro-js` (browser/Node) **tidak viable** untuk DE hari ini;
  runtime Python + espeak-ng + fork `misaki` (semidark) → host di luar Vercel (Fly.io/HF Spaces).
- Kualitas di bawah Edge neural de-DE (model card: "still lacks training"); fonem `ʏ` perlu
  workaround; utterance pendek lemah — padahal word-audio vocab adalah utterance pendek.

**Opsi:**
- **A. Status quo** (rekomendasi sekarang): tetap Edge TTS; trigger review = endpoint Microsoft
  gagal 2× dalam satu siklus rilis (aturan ADR-0004 §5).
- **B. Kokoro sebagai fallback** saat Edge down — ditolak: persona tidak konsisten, melanggar
  semangat "fallback jujur".
- **C. Migrasi penuh**: 6 voicepack dari dida-80b + microservice Python — satu-satunya opsi yang
  memenuhi ADR-0003 tanpa Microsoft; biaya: ops baru + regresi kualitas + pipeline voicepack.
- **D. Hybrid**: Edge tetap, tambah persona ke-7 Thorsten untuk demo offline.
