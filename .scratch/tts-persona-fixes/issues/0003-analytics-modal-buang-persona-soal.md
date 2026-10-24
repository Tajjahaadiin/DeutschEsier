# 0003 — Modal analitik membuang persona soal saat memutar ulang audio jawaban

- **Status:** done (commit pending)
- **Prioritas:** P1
- **Blokir:** tidak ada (independen).
- **File:** `src/client/components/analytics/SubmissionAnalyticsModal.tsx` (±baris 384–389)

## Konteks

Soal kuis membawa identitas pembicara (`q.personaId`, `q.gender`) dan data itu **sudah** mengalir
sampai ke modal analitik: `ScenarioQuiz` menyalinnya ke setiap `gradedAnswers` (lihat
`ScenarioQuiz.tsx` ±360–380, khususnya `personaId: q.personaId`), dan `gradedAnswers` dikirim balik
ke modal sebagai `result.gradedAnswers`. Tetapi tombol Audio di modal memanggil:

```tsx
onClick={() => {
  const textToSpeak = ans.audioText || ans.correctAnswer
  if (textToSpeak && typeof textToSpeak === 'string') {
    speakGerman(textToSpeak)          // ← persona soal dibuang
  }
}}
```

Akibatnya soal yang direkam dengan suara persona tertentu (mis. Killian, `male-2`) diputar ulang
dengan persona tersimpan milik pengguna — guru yang meninjau jawaban siswa mendengar suara yang
berbeda dari audio kuis aslinya. Ini inkonsisten dengan aturan ADR-0004 §3 ("personaId adalah unit
yang diseberangkan") pada titik terakhir rantai.

## Perubahan yang diminta

```tsx
speakGerman(textToSpeak, { personaId: ans.personaId, gender: ans.gender })
```

`SpeakOptions` menerima `personaId?: string`, jadi tanpa perubahan tipe. Bila `ans.personaId`
kosong (data lama), `resolveTtsRequest` sudah punya fallback yang benar (stored persona yang
gender-nya cocok → default gender) — jadi tidak perlu logika tambahan apa pun di modal.

## Kriteria selesai

- Audio jawaban di modal analitik memakai persona soal; soal tanpa `personaId` berperilaku seperti
  semula (tidak ada regresi).
- `npx vitest run` penuh hijau; `npm run build` sukses.
- Verifikasi manual: buka skenario dengan kuis ber-persona, isi jawaban, submit, buka analitik,
  tekan Audio pada baris jawaban → suara sesuai persona soal (bandingkan dengan audio soal di kuis).

## Larangan

- Jangan hardcode gender/female kembali (perilaku lama sebelum `3251d33`).
- Jangan menambah jalur pemilihan suara baru — `resolveTtsRequest` adalah satu-satunya pemilih.
