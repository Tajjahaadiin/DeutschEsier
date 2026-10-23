# Checklist UI Mobile — DeutschEasier

**Tanggal:** Oktober 2026
**Sumber aturan:** [`emilkowalski/skills`](https://github.com/emilkowalski/skills) → `skills/mobile-native/SKILL.md`, tabel *"Never Ship"* (MIT).
**Status:** sebagian temuan **belum diverifikasi di perangkat nyata**.

---

## Cara pakai

Checklist ini **bukan** daftar tugas yang harus dikerjakan sekaligus. Isinya aturan yang sudah
diuji terhadap kode repo ini, dengan status jujur per baris:

- ✅ **Bersih** — repo sudah benar. Jangan diubah, jadikan penjaga regresi.
- ❌ **Melanggar** — ada pelanggaran terukur, lokasi disebutkan.
- ⚠️ **Perlu dicek** — secara statis terlihat berisiko, tapi belum terbukti rusak.

Jalankan bagian **Perintah verifikasi** sebelum merge untuk area yang Anda sentuh.
Kalau sebuah baris berstatus ❌ dan Anda memperbaikinya, ubah statusnya jadi ✅ di commit yang sama.

**Penting:** aturan di sini berlaku *kalau alasannya berlaku*. `user-select: none` di teks body
adalah cacat; di tombol justru benar. Jangan terapkan membabi buta.

---

## 1. Status repo saat ini

| Aturan | Status | Bukti |
| :--- | :--- | :--- |
| Jangan `user-scalable=no` / `maximum-scale=1` | ✅ | `index.html:5` hanya `width=device-width, initial-scale=1.0` |
| Jangan `:hover` tanpa gate | ✅ | Tailwind v4 menggating otomatis — output build memuat `@media(hover:hover)` |
| Input minimal 16px | ✅ **0 pelanggaran** (selesai di b9aa940 & ceee182) | seluruh input/textarea/select minimal `text-base` |
| Hormati `prefers-reduced-motion` | ✅ (selesai di c677479) | `index.css:57` meredam transform animasi |
| `100vh` untuk app shell → `100dvh` | ✅ (selesai di 32d0907) | semua app shell memakai `min-h-dvh` |
| `env(safe-area-inset-*)` butuh `viewport-fit=cover` | ✅ (selesai di 61427c5) | `index.html:5` & bottom pinned padding |
| Jangan `touchmove` + `preventDefault()` untuk overscroll | ✅ | tidak dipakai |
| Jangan `user-select: none` di body | ✅ | tidak dipakai |
| Jangan `touch-action: none` pada area yang harus bisa di-scroll | ✅ | tidak dipakai |
| Jangan satu `theme-color` untuk dua skema | ✅ | tidak memakai `theme-color` |
| Jangan sniffing user-agent untuk deteksi sentuh | ✅ | tidak ada |
| Jangan menyatakan "selesai" dari emulator | ⚠️ | semua temuan di dokumen ini **analisis statis** |
| Jangan gradient indigo/violet sebagai aksen | ✅ **0 kemunculan** (selesai di ec2ca5c & ceee182) | aksen solid `primary` biru |
| Jangan gradient pada tombol | ✅ **0 tombol** (selesai di ceee182) | tombol solid fill atau outline datar |
| Radius harus punya hierarki | ✅ (selesai di 6d55b22 & ceee182) | 4 tingkat: `sm: 6px`, `md: 8px`, `lg: 12px`, `full` |
| Jangan micro-type di bawah 12px | ✅ **0 kemunculan** (selesai di 4535837) | lantai tipografi 12px (`text-xs` / `text-label`) |
| Jangan emoji sebagai ikonografi | ✅ **0 emoji kontrol UI** (selesai di 26d4422 & ceee182) | diganti ikon Lucide React |
| Jangan `uppercase` + `tracking` sebagai label universal | ✅ (selesai di 790bfcc) | dibatasi hanya untuk label kategori sejati |
| Jangan glassmorphism / frosted panel | ✅ | hanya latar gelap modal `slate-900/60` |
| Teks bahasa Jerman ditandai `lang="de"` | ✅ | pelafalan akurat screen reader |
| Form error diumumkan ke screen reader | ✅ | `role="alert"` & `aria-live="assertive"` |
| Kontras warna semantik gender `der/die/das` | ✅ | terkalibrasi rasio kontras WCAG AA > 11:1 |

---

## 2. Pelanggaran & tindakan

### 2.1. Input di bawah 16px — iOS akan zoom

**Aturan:** input di bawah 16px membuat iOS Safari memperbesar halaman saat fokus. Perbaikannya
**bukan** mematikan zoom (`user-scalable=no` = kegagalan aksesibilitas), melainkan menaikkan
ukuran font input.

**Kenapa penting di sini:** siswa membuka skenario di HP dan mengisi nama sebelum mengirim
jawaban. Zoom mendadak di tengah latihan merusak alur.

**18 lokasi:**

| Berkas |
| :--- |
| `src/client/components/access/KeyManagerModal.tsx:259` |
| `src/client/components/access/KeyManagerModal.tsx:277` |
| `src/client/components/alphabet/SpellingTrainer.tsx:570` |
| `src/client/components/analytics/SubmissionAnalyticsModal.tsx:577` |
| `src/client/components/grammar/GrammarPanel.tsx:458` |
| `src/client/components/quiz/ComprehensionQuiz.tsx:222` |
| `src/client/components/quiz/ScenarioQuiz.tsx:727` |
| `src/client/components/quiz/ScenarioQuiz.tsx:826` |
| `src/client/pages/AlphabetPage.tsx:200` |
| `src/client/pages/GeneratorPage.tsx:377, 428, 571, 578, 646, 653, 660` |
| `src/client/pages/HomePage.tsx:175` |
| `src/client/pages/LoginPage.tsx:73` |

**Perbaikan:** ganti `text-xs` (12px) / `text-sm` (14px) menjadi `text-base` (16px) pada `<input>`,
`<textarea>`, `<select>`. Boleh tetap kecil di desktop dengan `md:text-sm` bila ruang sempit.

**Catatan:** `text-base` = 16px, sudah cukup. Jangan pakai `text-[15px]`.

---

### 2.2. `prefers-reduced-motion` tidak dihormati

**Aturan:** animasi bisa memicu motion sickness. *Reduced motion* berarti animasi lebih sedikit
dan lebih lembut — **bukan nol**. Pertahankan transisi opacity/warna yang membantu pemahaman;
hilangkan animasi gerak dan posisi.

**Kondisi repo:** `src/client/index.css:30-56` punya dua animasi:

```css
@keyframes modalIn {
  from { opacity: 0; transform: scale(0.95); }   /* transform = gerak */
  to   { opacity: 1; transform: scale(1); }
}
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }   /* opacity saja = aman */
```

`animate-modal` memakai `transform: scale`, `animate-backdrop` hanya opacity.
Tidak ada satu pun media query `prefers-reduced-motion` di seluruh repo.

**Perbaikan:** redam `transform` pada `modalIn`, biarkan `fadeIn` apa adanya.

```css
@media (prefers-reduced-motion: reduce) {
  .animate-modal { animation: fadeIn 150ms ease-out forwards; }
}
```

**Kenapa bukan `animation: none`:** mematikan total membuat modal muncul tanpa transisi sama
sekali — lebih mengejutkan, bukan lebih tenang.

---

### 2.3. `100vh` pada app shell — 8 tempat

**Aturan:** `100vh` di mobile menghitung tinggi *viewport terbesar* (saat address bar
tersembunyi), sehingga konten terpotong saat address bar terlihat. Untuk app shell pakai `100dvh`.

**Catatan penting:** skill membedakan konteks —
`100dvh` untuk app shell / UI yang dipin ke bawah, `100svh` untuk hero marketing (agar tidak ada
layout shift saat scroll). Repo ini semuanya app shell, jadi `dvh` yang tepat.

**8 lokasi:**

| Berkas | Catatan |
| :--- | :--- |
| `src/client/pages/HomePage.tsx:78` | app shell + `SelectionBasket` dipin bawah → **paling berisiko** |
| `src/client/pages/ViewPage.tsx:377` | app shell utama siswa → berisiko |
| `src/client/pages/AlphabetPage.tsx:81` | app shell |
| `src/client/pages/DayPage.tsx:47` | app shell |
| `src/client/pages/NumberPage.tsx:56` | app shell |
| `src/client/pages/LoginPage.tsx:32` | layar penuh terpusat — `dvh` lebih tepat |
| `src/client/pages/ViewPage.tsx:345` | state loading, layar penuh |
| `src/client/pages/ViewPage.tsx:358` | state error, layar penuh |

**Perbaikan:** `min-h-screen` → `min-h-dvh`. Sudah diverifikasi tersedia: output build
menghasilkan `min-height:100dvh`.

**Status ⚠️:** belum dibuktikan rusak. `HomePage` memakai `pb-32` (128px) yang mungkin sudah
cukup menutupi. Perlu cek di iPhone dengan address bar dinamis.

---

### 2.4. Safe area tanpa `viewport-fit=cover`

**Aturan:** `env(safe-area-inset-*)` bernilai `0` kecuali `viewport-fit=cover` ada di meta
viewport. Jadi menambahkan `env()` tanpa meta tag = tidak ada efek.

**Kondisi repo:** keduanya absen.
- `index.html:5` → `content="width=device-width, initial-scale=1.0"` (tanpa `viewport-fit`)
- `src/client/components/word-bank/SelectionBasket.tsx:7` → `fixed bottom-0 left-0 right-0`

**Risiko:** di iPhone ber-notch, tombol di `SelectionBasket` bisa tertutup home indicator.
`SelectionBasket` adalah UI yang dipin ke bawah — persis kasus yang diperingatkan skill.

**Perbaikan (dua langkah, keduanya wajib):**

1. `index.html`: tambahkan `viewport-fit=cover`
   ```html
   <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
   ```
2. `SelectionBasket.tsx`: tambahkan padding safe-area
   ```tsx
   className="fixed bottom-0 left-0 right-0 ... pb-[env(safe-area-inset-bottom)]"
   ```

Sudah diverifikasi: `pb-[env(safe-area-inset-bottom)]` menghasilkan CSS yang benar di build.

**Peringatan:** menambahkan `viewport-fit=cover` **tanpa** langkah 2 akan membuat masalahnya
lebih terlihat (konten masuk ke area notch). Kerjakan keduanya dalam satu commit.

---

## 3. Perintah verifikasi

Jalankan dari root repo. Semua harus menghasilkan **0** kecuali yang ditandai.

```bash
# 1. Zoom tidak boleh dimatikan (harus 0)
grep -rn "user-scalable\|maximum-scale" index.html src/ | wc -l

# 2. Input di bawah 16px (target: turun dari 18 ke 0)
grep -rn "<input" -A8 src/client --include=*.tsx | grep -c "text-sm\|text-xs"

# 3. Reduced motion wajib ada bila ada animasi transform (harus >= 1)
grep -rc "prefers-reduced-motion" src/client/index.css

# 4. Safe area: keduanya harus ada bersamaan
grep -c "viewport-fit" index.html
grep -rc "env(safe-area-inset" src/client | grep -v ":0" | wc -l

# 5. 100vh pada app shell (target: 0)
grep -rn "min-h-screen\|h-screen" src/client --include=*.tsx | wc -l

# ---- ANTI-SLOP (§4) ----

# 6. Gradient indigo/violet (target: 0) — bukan semua pemakaian indigo
#    (indigo sebagai warna solid juga dilaporkan, tapi gradien yang paling parah)
grep -rn "bg-gradient[^\"]*indigo-\|bg-gradient[^\"]*violet-\|from-indigo-\|from-violet-\|via-indigo-\|via-violet-" src/client --include=*.tsx | wc -l

# 7. Gradient pada tombol (target: 0)
grep -rn "bg-gradient-to-r" src/client --include=*.tsx | wc -l

# 8. Micro-type di bawah 12px (target: 0)
grep -rho "text-\[9px\]\|text-\[10px\]\|text-\[11px\]" src/client --include=*.tsx | wc -l

# 9. Radius: hitung tingkat unik (target: <= 4 termasuk 'full')
grep -rho "rounded-\(sm\|md\|lg\|xl\|2xl\|3xl\|full\)" src/client --include=*.tsx | sort -u | wc -l

# 11. Deteksi pemakaian transition-all yang dilarang (target: 0)
grep -rn "transition-all" src/client --include=*.tsx | wc -l

# 12. Deteksi pemakaian warna red-* di luar semantik danger/rose (target: 0)
grep -rn "text-red-\|bg-red-\|border-red-" src/client --include=*.tsx | wc -l

# 13. Verifikasi ketersediaan token artikel der/die/das terkalibrasi di index.css
grep -c "color-article-" src/client/index.css

# 14. Deteksi kelengkapan role="alert" pada pesan error form (harus >= 5)
grep -rc "role=\"alert\"" src/client --include=*.tsx | grep -v ":0" | wc -l
```

**Baseline saat dokumen ini ditulis:** 15 / 12 / 78 / 6 / 7.
Simpan angka ini. Tanpa baseline, "sudah membaik" tidak bisa dibuktikan.

Catatan: perintah 6 sengaja menghitung **gradien** indigo/violet, bukan setiap pemakaian
`indigo-*` (57 kemunculan). Indigo sebagai warna solid belum tentu slop; gradien-nya yang jadi tell.

**Verifikasi bahwa utility Tailwind v4 tersedia** (bukan tebakan):

```bash
# min-h-dvh dan safe-area harus muncul di output CSS
npx vite build
grep -o "min-height:100dvh" dist/assets/*.css | head -1
grep -o "safe-area-inset-bottom" dist/assets/*.css | head -1
```

---

## 4. Anti-slop — jangan seperti UI buatan AI

Bagian ini menjawab pertanyaan: **apakah antarmuka ini kelihatan dibuat AI?**

"Slop" adalah kumpulan default statistik yang dipilih model karena paling sering muncul di data
latihannya — bukan karena cocok untuk produk ini. Ia bisa dikenali, dihitung, dan dihindari.

**Sumber aturan:**

| Sumber | Bentuk | Lisensi |
| :--- | :--- | :--- |
| [`LeoStehlik/no-slop-ui`](https://github.com/LeoStehlik/no-slop-ui) → `references/banned-patterns.md` | tabel banned/use-instead | MIT |
| [`Ad-Astra-Computing/ahd`](https://github.com/Ad-Astra-Computing/ahd) → `docs/SLOP_TAXONOMY.md` | 39 tell bernomor | — |
| [`ai-design-tells`](https://pypi.org/project/ai-design-tells/) | 27 tell berbobot + detector | — |
| [`claudiusararu/unslop-ui-skill`](https://github.com/claudiusararu/unslop-ui-skill) → `TELLS.md` | ~100 tell, 9 kategori | MIT |

**Tes tunggal yang paling berguna** (dari `no-slop-ui`):

> *"If it feels like the AI default — it is. Pick the harder, cleaner option."*

Dan pertanyaan uji dari BSWEN:

> *"Kalau kamu menunjukkan antarmuka ini ke seseorang dan bilang 'AI yang bikin', apakah mereka
> langsung percaya?"* — kalau ya, desainnya gagal keluar dari data latihan.

### 4.1. Ringkasan status

| Tell | Tingkat | Kondisi repo |
| :--- | :--- | :--- |
| **A1** House Indigo — indigo/violet sebagai aksen | tell (bobot 9) | ❌ 15 gradien, 8 berkas |
| **A2** Gradient biru→ungu | tell (bobot 7) | ❌ termasuk di atas |
| **B1** Inter/Roboto/system default | tell (bobot 9) | ❌ `index.css:27` |
| **B4** Micro-type di bawah 12px | smell (bobot 3) | ❌ 78 kemunculan |
| **C3** Satu radius untuk semua | tell (bobot 4) | ⚠️ 6 tingkat, tanpa aturan |
| **C4** Emoji sebagai ikonografi | smell (bobot 3) | ❌ 31 emoji unik |
| **D1** Padding seragam | tell (bobot 5) | ⚠️ perlu dicek |
| **E1** `shadow-lg` generik | tell (bobot 5) | ⚠️ 9× `shadow-lg`, 3× `shadow-2xl` |
| **E3** Tidak ada hairline / `:focus-visible` | tell (bobot 6) | ⚠️ 1 `focus-visible`, 24 `focus:ring` |
| **F1** Fade-in di semua tempat | smell (bobot 4) | ⚠️ 2 animasi |

**Catatan penting:** banyak tell ini berasal dari konteks *landing page SaaS*. DeutschEasier adalah
aplikasi latihan bahasa, bukan landing page. Sebagian tell (hero, testimonial, pricing, "Trusted by")
**tidak berlaku** dan sengaja tidak dimasukkan. Yang dipertahankan hanya yang menyentuh aplikasi.

---

### 4.2. Gradient indigo/violet sebagai aksen — 15 tempat di 8 berkas

**Aturan:** aksen tidak boleh berada di band hue indigo/violet (OKLCH H ~250–320) kecuali brief
memang memintanya. Ini tell nomor satu yang paling dikenali.

**Kenapa di sini:** indigo/violet dipakai sebagai warna aksi utama di kartu, tombol, dan header.
Tidak ada alasan produk — DeutschEasier tidak punya brand indigo.

| Lokasi | Pemakaian |
| :--- | :--- |
| `components/flashcard/ScenarioFlashcards.tsx:154` | `from-blue-500 to-indigo-*` |
| `components/flashcard/ScenarioFlashcards.tsx:228` | `from-indigo-900 via-blue-900 to-slate-900` |
| `components/grammar/GrammarPanel.tsx:222` | `from-indigo-600 to-violet-700` (header) |
| `components/grammar/GrammarPanel.tsx:653` | `from-indigo-600 to-violet-600` (tombol utama) |
| `components/quiz/ComprehensionQuiz.tsx:198` | `from-violet-600 to-indigo-700` (header) |
| `components/quiz/ComprehensionQuiz.tsx:303` | `from-violet-* to-indigo-*` (tombol) |
| `components/quiz/ScenarioQuiz.tsx:475` | `from-blue-600 via-indigo-600 to-indigo-700` |
| `components/quiz/ScenarioQuiz.tsx:706` | `from-blue-600 to-indigo-700` (header) |
| `components/quiz/ScenarioQuiz.tsx:864` | `from-indigo-* to-violet-*` (tombol) |
| `pages/DayPage.tsx:107` | `from-indigo-600 to-violet-700` (header) |
| `pages/LoginPage.tsx:32` | `from-slate-50 via-blue-50 to-indigo-*` (latar penuh) |
| `pages/LoginPage.tsx:37` | `from-blue-600 to-indigo-600` |
| `pages/NumberPage.tsx:221` | `from-indigo-*` (tombol) |
| `pages/NumberPage.tsx:237` | `from-blue-50 to-indigo-50` |
| `pages/ViewPage.tsx:383` | `from-blue-600 to-indigo-700` (header) |

**Perbaikan:** pilih **satu** aksen solid dari palet yang dipilih sadar. Untuk aplikasi belajar,
hijau atau biru tua lebih masuk akal daripada indigo. Hapus gradien; pakai warna solid.

---

### 4.3. Gradient pada tombol — 12 tombol

**Aturan:** gradient button backgrounds dilarang. Pakai solid fill atau outlined.

**Kondisi:** `bg-gradient-to-r` muncul **12×**, sebagian besar pada tombol aksi utama
(`from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700`).

**Kenapa buruk:** gradien pada tombol membuatnya terlihat seperti CTA landing page, bukan kontrol
aplikasi. Juga menciptakan dua nilai hover tambahan yang harus dijaga konsisten.

**Perbaikan:** `bg-indigo-600 hover:bg-indigo-700` → atau lebih baik, ganti hue-nya sekalian (§4.2).

---

### 4.4. Radius tanpa hierarki — 6 tingkat

**Aturan:** radius harus diskalakan dengan ukuran elemen; radius bersarang harus berbeda. Satu
radius untuk semua adalah kebiasaan, bukan keputusan.

**Kondisi:**

| Nilai | Jumlah |
| :--- | ---: |
| `rounded-xl` (12px) | 103 |
| `rounded-full` | 72 |
| `rounded-lg` (8px) | 68 |
| `rounded-2xl` (16px) | 59 |
| `rounded-3xl` (24px) | 12 |
| `rounded-md` (6px) | 6 |

Enam tingkat, dan tidak ada aturan mana dipakai kapan. `rounded-full` 72× (pill) juga termasuk
tell tersendiri — pill button di mana-mana.

**Perbaikan:** tetapkan maksimal 3 tingkat + `full` sesuai `DESIGN.md`:
- `sm` (6px): chip, badge, penanda kecil
- `md` (8px): kontrol (tombol, input)
- `lg` (12px): kartu, panel, modal
- `full`: avatar dan status bulat, bukan tombol

**Dilarang:** `rounded-2xl` (16px) dan `rounded-3xl` (24px). Radius sebesar itu membuat kontrol terlihat seperti kartu dan tombol terlihat seperti pil buatan mesin.

---

### 4.5. Micro-type di bawah 12px — 78 kemunculan

**Aturan:** 12px adalah lantai untuk label sungguhan. Hierarki dibangun dengan bobot, bukan dengan
mengecilkan huruf.

**Kondisi:**

| Nilai | Jumlah |
| :--- | ---: |
| `text-[11px]` | 66 |
| `text-[10px]` | 10 |
| `text-[9px]` | 2 |

**Kenapa buruk:** 9–11px tidak terbaca di HP di bawah matahari, dan tidak bisa di-zoom tanpa
merusak layout. Ini juga berhubungan dengan §2.1 — budaya mengecilkan huruf yang sama.

**Perbaikan:** naikkan lantai ke 12px (`text-xs`). Untuk label yang butuh lebih kecil, pakai
`text-xs` + `font-semibold` + warna lebih gelap, bukan ukuran lebih kecil.

---

### 4.6. Emoji sebagai ikonografi — 31 emoji unik

**Aturan:** emoji bukan sistem ikon. Pakai set ikon yang koheren, atau tidak sama sekali.

**Kondisi:** 31 emoji unik, termasuk `👨` (9×), `👩` (8×), `💡` (7×), `✅` (7×), `💪` (4×),
`🌟` (4×), `📝`, `📚`, `👍`, `🎉`.

**Catatan jujur:** sebagian emoji di sini **mungkin tepat** — `👨`/`👩` pada latihan gender
bahasa Jerman adalah isi pelajaran, bukan hiasan. Yang perlu dinilai adalah emoji sebagai
**penanda status/aksi** (`✅`/`❌` untuk benar/salah, `💡` untuk petunjuk), karena di sana set ikon
yang konsisten akan lebih baik.

**Perbaikan:** bedakan dua kategori — emoji sebagai **konten** (biarkan) vs emoji sebagai **UI**
(ganti ikon). Jangan ganti semuanya.

---

### 4.7. `uppercase` + `tracking` sebagai label universal — 49 tempat

**Aturan:** huruf kapital + letter-spacing harus disimpan untuk label yang benar-benar kategoris.

**Kondisi:** 52 `uppercase`, 49 di antaranya berpasangan dengan `tracking-*`.

**Kenapa buruk:** kalau semua label kecil memakai pola yang sama, tidak ada label yang menonjol.
Pola ini juga ciri khas dashboard template.

**Perbaikan:** sisakan untuk 3–5 label kategori sungguhan (mis. judul seksi di modal analitik).
Sisanya pakai kalimat normal dengan bobot lebih tebal.

---

### 4.8. Glassmorphism — 7 tempat, sebagian wajar

**Aturan:** `backdrop-blur` untuk panel yang berisi teks = slop. Blur hanya untuk lapisan yang
memang perlu memisahkan diri dari konten di belakangnya.

**Kondisi — dua kategori berbeda:**

| Lokasi | Pemakaian | Penilaian |
| :--- | :--- | :--- |
| `KeyManagerModal.tsx:176` | backdrop modal `bg-slate-900/60 backdrop-blur-xs` | ✅ wajar — blur meredam latar di belakang modal |
| `AlphabetDetailModal.tsx:69` | idem | ✅ wajar |
| `SubmissionAnalyticsModal.tsx:200` | idem | ✅ wajar |
| `SpellingTrainer.tsx:530` | idem | ✅ wajar |
| `ScenarioFlashcards.tsx:237` | chip `bg-white/10 backdrop-blur-xs` di atas kartu gradien | ⚠️ dekoratif |
| `ScenarioFlashcards.tsx:265` | panel teks `bg-white/10 backdrop-blur-md` | ❌ **teks di atas blur** |
| `LoginPage.tsx:38` | ikon `bg-white/10 backdrop-blur-sm` | ⚠️ dekoratif |

**Perbaikan:** biarkan empat backdrop modal apa adanya. Perbaiki dua yang dekoratif —
`ScenarioFlashcards.tsx:265` adalah kasus paling jelas (paragraf teks di atas panel blur).

---

### 4.9. Yang sengaja TIDAK dimasukkan

Tell berikut ada di taksonomi tapi **tidak berlaku** untuk repo ini — jangan dikerjakan:

| Tell | Kenapa dilewati |
| :--- | :--- |
| Three-card trick, testimonial palsu, "Trusted by", pricing 3 tier | Ini aplikasi, bukan landing page |
| Bento grid, hero scroll-jacking, 3D blob | Tidak ada halaman marketing |
| Gradient text pada "AI" | Tidak ada klaim AI di UI |
| Satu `theme-color` untuk dua skema | Tidak memakai `theme-color` |
| `prefers-reduced-motion` | Sudah ditangani di §2.2 |

---

## 5. Yang tidak tercakup

Checklist ini **tidak** memeriksa:

- **Performa runtime perangkat rendah** — LCP, CLS, dan alokasi memori Web Audio API pada HP berspesifikasi rendah.
- **Apakah desainnya *bagus*** — anti-slop hanya mencegah yang generik, bukan menjamin yang baik.

*Catatan pembaharuan:* Poin kontras warna semantik OKLCH (WCAG AA > 11:1), aksesibilitas form dasar (`role="alert"`), dan penanganan *virtual keyboard* HP kini telah secara resmi dicakup dan distandardisasi di `DESIGN.md`.

Untuk itu, skill `mobile-native` punya 11 gejala lain (pull-to-refresh, carousel, status bar,
tap delay). Sebagian besar tidak relevan untuk repo ini dan sengaja tidak dimasukkan.

---

## 6. Batasan kejujuran

**Semua temuan di dokumen ini adalah analisis statis.** Tidak satu pun diuji di perangkat nyata.

Skill sumbernya sendiri menyatakan:

> *"Test on hardware before calling it done. Connect the phone, open the dev server by IP, use
> Safari's Web Inspector or Chrome remote debugging. Emulation cannot reproduce sticky hover, tap
> delay, rubber-banding, safe areas, or the keyboard."*

Jadi:
- §2.1 (input zoom) **pasti** terjadi di iOS Safari — perilaku platform, bukan dugaan.
- §2.2 (reduced motion) **pasti** tidak berfungsi — media query-nya memang tidak ada.
- §2.3 (100vh) dan §2.4 (safe area) **belum terbukti rusak** — bisa jadi padding yang ada sudah
  menutupi. Perlu perangkat ber-notch untuk memastikan.

Jangan menyatakan sebuah baris selesai berdasarkan dokumen ini saja.
