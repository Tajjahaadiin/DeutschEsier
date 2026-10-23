# Investigasi Persona TTS: Status Terverifikasi

**Diverifikasi:** 2026-10-23 pada HEAD `16de109`, dengan uji sintesis hidup ke keenam suara.
**Menggantikan:** versi sebelumnya dari dokumen ini, yang menyimpulkan backend "sering gagal 403"
dan merekomendasikan Piper sebagai "MIT/CC0". Kedua klaim itu tidak akurat dan sudah dikoreksi di §2.

Gejalanya benar: memilih persona berbeda hanya mengubah nada suara yang sama. Tetapi penyebabnya
**bukan** backend. Saat dokumen ini ditulis ulang, `/api/tts` sehat dan keenam suara neural
menghasilkan audio berbeda; yang rusak adalah jalur klien yang membuang identitas persona sebelum
permintaan dibuat.

---

## 1. Gejala

- Memilih Conrad, Killian, Florian, Katja, Amala, atau Seraphina tidak menghasilkan karakter suara
  yang berbeda; yang terdengar adalah satu suara dengan nada dinaikkan/diturunkan.
- Tidak konsisten antar mesin: di sebagian laptop suara pria terdengar wajar, di mesin lain tidak.

## 2. Status verifikasi klaim

| Klaim | Verdict | Bukti |
| :--- | :--- | :--- |
| Ada trik `pitch: 0.80` / `1.05` di fallback | **Benar** (sebelum `3251d33`) | `src/client/lib/audio.ts`, `resolveVoice` |
| Pemanggil dengan `gender` saja jatuh ke Web Speech | **Benar** (sebelum `3251d33`) | 8 call site, §3.4 |
| `msedge-tts` kena 403 karena `Sec-MS-GEC v2` | **Benar secara historis** | commit `22b39b3` |
| `/api/tts` **sekarang** sering 403 | **Tidak benar lagi** | `npm run tts:smoke`: 6/6 OK, 780–1860 ms |
| `node-edge-tts` 1.2.11 sudah menangani `Sec-MS-GEC` | **Benar** | `node_modules/node-edge-tts/dist/drm.js` |
| Killian/Florian pria, Katja/Amala/Seraphina wanita | **Benar** | daftar voice Azure; 6 voice ID valid |
| Menghapus `pitch: 0.80` saja menyelesaikan masalah | **Tidak benar** | §3.2 — persona tetap tidak sampai ke server |
| Piper bebas dipakai (MIT/CC0) | **Tidak benar untuk kode saat ini** | `rhasspy/piper` **diarsipkan**; `OHF-Voice/piper1-gpl` **GPLv3** sejak 1.3.0 |
| Kokoro German menyediakan persona `dm_bernd`/`df_eva` | **Benar, tetapi hanya 2 suara** | `r1di/kokoro-fastapi-german`; model dasar: *"still lacks training"* |
| `openai-edge-tts` melepas ketergantungan Microsoft | **Tidak benar** | ia membungkus `edge-tts` → endpoint Microsoft yang sama; GPLv3 |

## 3. Akar masalah (final)

### 3.1. Persona diciutkan enam → dua → nol

`AlphabetPage` menampilkan `<select>` berisi `TTS_PERSONAS` (enam), lalu menurunkan `voiceGender`,
lalu mengoper **hanya gender** ke tiga komponen anak. Pilihan pengguna hilang di batas komponen,
sebelum `speakGerman` dipanggil. Label UI `Audio: Katja/Conrad` adalah buktinya: sejak awal hanya dua
nama yang mungkin muncul.

### 3.2. Gerbang `shouldUseEdgeTts`

```ts
const shouldUseEdgeTts = Boolean(options.personaId || persona) || (gender === 'male' && !hasNativeMaleVoice())
```

Bila pemanggil hanya mengirim `gender`, `personaId` dipaksa `undefined`, sehingga cabang `/api/tts`
tidak pernah diambil untuk gender `female` sama sekali. Untuk `male`, hasilnya bergantung pada apakah
peramban punya voice pria Jerman — jadi kode yang sama berbunyi berbeda di Windows, macOS, dan Linux.

### 3.3. Pitch sebagai pengganti persona

`resolveVoice` mengembalikan `pitch: 0.80` (pria) atau `1.05` (wanita) pada voice default. Di mesin
tanpa voice `de-*`, `defaultVoice` bisa `null` sehingga peramban memilih voice sistem — kadang bukan
bahasa Jerman. Menggeser nada suara yang sama tidak dan tidak bisa menghasilkan persona berbeda.

### 3.4. Matriks pemanggil (kondisi sebelum `3251d33`)

| Pemanggil | Membawa `personaId`? | Akibat |
| :--- | :--- | :--- |
| `NumberPage`, `DayPage` | ya | `/api/tts` |
| `ViewPage`, `GeneratorPage` (dialog & per giliran) | ya | `/api/tts` |
| `GrammarPanel`, `ComprehensionQuiz`, `ScenarioFlashcards` | tidak (kosong) | persona tersimpan → `/api/tts` |
| **`ScenarioQuiz` (audio kuis)** | **tidak** | Web Speech |
| `AlphabetCard`, `AlphabetDetailModal` | tidak | Web Speech |
| `SpellingTrainer` (3 titik) | tidak | Web Speech |
| `WordCard` | tidak | Web Speech |
| `SubmissionAnalyticsModal` | tidak (`gender: 'female'` hardcoded) | Web Speech |

Dokumen lama hanya menyebut `AlphabetCard` dan `WordCard`, dan melewatkan audio kuis — layar yang
paling sering dipakai siswa.

## 4. Yang sudah diperbaiki

| Commit | Isi |
| :--- | :--- |
| `3251d33` | `resolveTtsRequest` murni; semua ucapan Jerman lewat `/api/tts`; fallback tanpa manipulasi pitch; 17 test baru untuk `audio.ts` yang sebelumnya nol test |
| `a20cd3d` | `personaId` menggantikan `voiceGender` di `AlphabetCard`, `SpellingTrainer`, `AlphabetDetailModal`, `WordCard`; label UI menampilkan persona sebenarnya |
| `16de109` | `npm run tts:smoke` — sintesis keenam suara, keluar kode 1 bila ada yang gagal |
| `5031e79` | `personaId` ikut ke soal diktat, sehingga kuis memakai suara pembicara aslinya, bukan persona default gender |
| ADR-0004 | Keputusan: endpoint neural sebagai satu-satunya sumber persona; self-hosting ditolak untuk sekarang |

Aturan prioritas yang berlaku sekarang, di satu tempat (`resolveTtsRequest`):

1. `personaId` eksplisit (dialog turn, pilihan persona di UI).
2. Persona tersimpan, bila gender-nya cocok dengan permintaan.
3. Persona neural default untuk gender yang diminta.

Cara memverifikasi tanpa membuka browser:

```bash
npm run tts:smoke     # 6/6 OK -> endpoint sehat
npx vitest run        # 286 test, termasuk 17 test audio
```

## 5. Risiko yang masih ada

1. **Endpoint Microsoft bisa berubah lagi.** Token `Sec-MS-GEC` diturunkan dari
   `CHROMIUM_FULL_VERSION` (`143.0.3650.75` pada `node-edge-tts@1.2.11`) dan `TRUSTED_CLIENT_TOKEN`
   yang dipatok di dalam paket. Migrasi 10 Oktober 2026 membuktikan kelas kerusakan ini berulang.
2. **Jam server.** Token bergantung waktu; clock skew menyebabkan penolakan koneksi.
3. **Tanpa SLA.** Layanan gratis tanpa jaminan. Cache `immutable` di `/api/tts` mengurangi beban,
   tetapi tidak menghilangkan ketergantungan.
4. **Fallback tetap lebih buruk dari aslinya.** Saat jaringan gagal, pengguna mendengar suara browser
   biasa (pitch 1.0) dan `console.warn`. Itu disengaja: lebih jujur daripada meniru persona.

## 6. Opsi self-hosting: fakta terverifikasi

| Opsi | Status nyata | Cocok untuk repo ini? |
| :--- | :--- | :--- |
| **Piper** | `rhasspy/piper` **diarsipkan**; pengembangan pindah ke `OHF-Voice/piper1-gpl`, **GPLv3** sejak 1.3.0, C++ dihapus. Model suara punya lisensi masing-masing (`MODEL_CARD`; Thorsten CC0) | Tidak: lisensi GPLv3, runtime Python/ONNX, 6 suara = 6 model terpisah |
| **Kokoro German** | `r1di/kokoro-fastapi-german` (Apache-2.0) menyediakan **2** suara (`dm_bernd`, `df_eva`); model dasar menyatakan *"trained on limited data and still lacks training"* | Tidak: ADR-0003 butuh 6 persona; Python + espeak-ng |
| **`travisvn/openai-edge-tts`** | Wrapper Python `edge-tts` (GPLv3); endpoint Microsoft yang sama, hanya dibungkus API ala OpenAI | Tidak: tidak mengurangi risiko sama sekali |
| **`@andresaya/edge-tts`** | Aktif (1.9.x), **GPL-3.0-only**, `wssUrl`/`secMsGecVersion` bisa di-override tanpa menunggu rilis | Cadangan bila `node-edge-tts` macet, dengan catatan lisensi |
| **`node-edge-tts`** (dipakai) | MIT, 1.2.11 memakai endpoint baru + `Sec-MS-GEC` | **Ya** |

Kesimpulan: tetap di `node-edge-tts`. Tinjau ulang bila endpoint Microsoft gagal **dua kali dalam satu
siklus rilis**, atau bila kebutuhan persona berubah (mis. cukup dua suara), karena pada titik itu
trade-off lisensi/runtime mulai masuk akal.

## 7. Yang tidak terbukti

- Uji sintesis dijalankan dari satu mesin Linux dengan Node 22; belum diukur di Vercel (cold start,
  ukuran bundle, jam server).
- Kualitas persepsi keenam persona tidak diukur secara subjektif; itu penilaian manusia.
- `audio.onerror` pada kondisi jaringan nyata hanya dianalisis dari kode dan disimulasikan di test,
  tidak dipicu di perangkat.
