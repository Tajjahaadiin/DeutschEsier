# Riset Teknis: Sumber Aturan UI/Web yang Dapat Diverifikasi (Sumber Web Primer)

**Tanggal Dokumen:** Oktober 2026
**Target Repository:** DeutschEasier (`Vite 6`, `React 18.3.1`, `TypeScript 5.7`, `Tailwind CSS 4` via `@tailwindcss/vite`, Hono, Drizzle + Postgres)
**Commit acuan pengukuran:** `41fef8e` (`fix(tts): sync global persona changes across all Grundlagen tabs via persona-change event`)
**Penulis:** Research Subagent
**Terkait:** [`docs/ui-checklist.md`](ui-checklist.md), [`docs/research-design-rules-sources.md`](research-design-rules-sources.md) (**tidak diulang di sini**), [`DESIGN.md`](../DESIGN.md), [`docs/adr/0001-tailwind-v4-and-component-strategy.md`](adr/0001-tailwind-v4-and-component-strategy.md)

---

## 1. Ringkasan Eksekutif

1. **12 sumber web terverifikasi dan 5 di antaranya memberi angka baru yang bisa langsung dipakai.** Riset sebelumnya (`research-design-rules-sources.md`) menambang GitHub dan hanya menyentuh WCAG lewat halaman *Understanding* sebagai pelengkap. Dokumen ini memindahkan pusat gravitasi ke **spesifikasi normatif** (`w3.org/TR/WCAG22/`), **halaman referensi platform** (MDN), dan **data lapangan** (WebAIM Million 2026). Semua kutipan di bawah adalah byte dari halaman aslinya, diambil dengan `curl`.
2. **Temuan terpenting: repo sudah jauh lebih bersih daripada yang dicatat `ui-checklist.md`, dan check­list itu sekarang salah di beberapa baris.** Pada HEAD `41fef8e`: gradient **0** (dulu 15), `transition-all` **84** (dulu 101), `min-h-screen` **0** (dulu 8), `text-[Npx]` **1** (dulu 78), `text-red-*` **0** (dulu 13), `index.html:2` sudah `<html lang="id">`, `viewport-fit=cover` sudah ada, `prefers-reduced-motion` **3** blok sudah ada. `role="alert"` + `aria-live` **8 pasang** (dulu 0). Radius turun ke **4 tingkat** (`sm`/`md`/`lg`/`full`) — persis DESIGN.md. **Checklist-nya yang harus diperbarui, bukan kodenya.**
3. **Lubang yang benar-benar tersisa, dan semuanya terukur, bukan dugaan.** `aria-invalid` **0**, `aria-describedby` **0**, `htmlFor` **0**, `id=` pada kontrol form **0**, `tabular-nums` **0**. Artinya 39 kontrol form punya 37 yang **tanpa nama programatik** (satu-satunya jalur nama adalah `<label>` yang membungkus, dan itu tidak dipakai) — label visual ada dan terlihat, tapi `<label>` di 10 berkas **tidak terhubung** ke kontrolnya. Ini kegagalan WCAG 1.3.1 + 3.3.2 + 4.1.2 + 2.5.3 yang tidak terlihat sama sekali di layar.
4. **Kontras: 4 pasangan teks gagal WCAG AA 1.4.3, semuanya terhitung persis.** DIukur dari token `@theme` di `src/client/index.css:18-32` dan nilai `oklch()` Tailwind v4 di `node_modules/tailwindcss/theme.css`, lalu dikonversi ke sRGB dengan rumus WCAG:
   - `text-rose-600` di atas `bg-rose-50` = **4.12:1** (gagal 4.5:1) — **12 kemunculan**, ini warna panel error.
   - `text-emerald-600` = **3.65:1** di atas putih (gagal 4.5:1) — 11 kemunculan.
   - `text-slate-400` = **2.63:1** di atas putih / **2.51:1** di atas `slate-50` (gagal) — **91 kemunculan**, jumlah terbanyak di repo.
   - `--color-warning #fe9a00` = **2.13:1** di atas putih (gagal bahkan ambang 3:1 non-teks). Nilainya tidak dipakai sebagai teks, tapi ada di `@theme` sebagai token resmi.
   
   Yang **lulus**: `blue-600 #155dfc` 5.25:1, `white on blue-600` 5.25:1, `text-muted #45556c` 7.58:1, `rose-700 on rose-50` 5.81:1. Jadi perbaikan kontras bukan proyek besar — 4 pasangan, dua di antaranya satu-langkah (`rose-600`→`rose-700`, `emerald-600`→`emerald-700`).
5. **Fokus keyboard adalah kegagalan paling luas di repo: 142 dari 143 `<button>` tidak punya indikator fokus sama sekali.** Hanya `src/client/components/ui/button.tsx:6` yang punya `focus-visible:ring-2` — dan komponen itu hanya diimpor 2 berkas. Sisanya: tidak ada `focus:` maupun `focus-visible:` pada tag `<button>`-nya, dan `index.css` **tidak punya** aturan fokus global. Konsekuensinya dua lapis: (a) `<input>`/`<select>` memakai `focus:outline-none` **36×** lalu diberi `focus:ring`/`focus:border` sebagai pengganti — itu menyala saat klik mouse juga, bukan mode `:focus-visible`; (b) 142 `<button>` **tidak menyentuh apa pun**, jadi mereka bergantung sepenuhnya pada ring fokus bawaan browser. Ring bawaan itu **tidak** dihapus, jadi WCAG 2.4.7 secara teknis **belum tentu gagal** — tapi tidak ada satu pun bukti di kode bahwa ia sengaja dipertahankan, dan DESIGN.md §Do mewajibkan *"`:focus-visible` yang terlihat jelas pada semua elemen interaktif"*. Statusnya ⚠️, bukan ❌, dan itu penting untuk tidak melebih-lebihkan. MDN: *"Many browsers show a 'focus ring' by default in this case"*.
6. **Target sentuh: 52 tombol punya padding ≤6px per sisi** (heuristik: `<button>` + `p-1`/`p-1.5`/`py-1`/`px-1`). 25 di antaranya ada di `ViewPage.tsx` — halaman yang dipakai siswa. Contoh terburuk: tombol kecepatan audio `px-2 py-1 text-xs` di `ViewPage.tsx:683` ≈ **22×22px**, di bawah ambang WCAG 2.5.8 (24×24 CSS px). Ini **perkiraan statis**, bukan pengukuran browser — lihat §8.
7. **`lang="de"` sudah ada 7 tempat, tapi ikon "die Tage"/"die Nummer" dan kartu alfabet melewatkannya.** `AlphabetCard.tsx:80,91` memakai `lang="de"` dengan benar; `DayPage.tsx:70` dan `NumberPage.tsx:79` merender `die Tage`/`die Nummer` **tanpa** `lang="de"` — kata benda Jerman berkategori `die` diucapkan pembaca layar dengan fonetik Indonesia. WCAG 3.1.2 + DESIGN.md baris "Do" sudah mewajibkan ini; yang kurang implementasinya.
8. **Data lapangan WebAIM Million 2026 membenarkan prioritas.** *"Low contrast text, below the WCAG 2 AA thresholds, was found on 83.9% of home pages… This was the most commonly-detected accessibility issue."* Kontras #1, label #2 (`52.8%` halaman punya "Missing labels"). Ini dua kategori yang repo ini masih gagal. **Batasan yang harus dikutip bersama angka itu:** WebAIM sendiri menyatakan *"All automated tools, including WAVE, have limitations—not all conformance failures can be automatically detected."*
9. **Tidak ada sumber yang memaksa menambah dependency.** ADR-0001 tidak dilanggar. axe-core **tidak terpasang** dan dokumen ini **tidak** merekomendasikan pemasangannya (larangan instalasi), tapi halaman daftar aturan axe dipakai untuk **menyatakan jujur** apa yang bisa dan tidak bisa diverifikasi linter.
10. **Satu koreksi terhadap brief tugas:** ambang INP adalah **200 ms**, bukan 400 ms. web.dev `articles/vitals`: *"pages should have a INP of 200 milliseconds or less."* Angka 400 ms tidak muncul di sumber mana pun yang saya periksa; jangan pakai.

---

## 2. Metode

**Penemuan.** Semua kandidat dari brief diperiksa keberadaannya dengan `curl -sS -o /dev/null -w '%{http_code}'` **sebelum** dibaca. Yang mengembalikan `301` diikuti dengan `curl -L` sampai dapat `200` dan URL akhir dicatat (MDN memindahkan banyak path ke `/docs/Web/CSS/Reference/...` pada 2026). Yang 404 dicatat di §4 tanpa ditebak.

**Pengambilan & kutipan.** Setiap halaman yang dikutip diunduh utuh ke `/tmp/src/*.html`, lalu tag HTML dibuang dan entitas di-`unescape`. Kutipan diambil dari teks hasil ekstraksi itu — bukan dari ingatan, bukan dari snippet mesin pencari. Panjang halaman yang diambil antara 29 KB (WebAIM Contrast) dan 512 KB (WCAG 2.2 normatif). Setiap kutipan diberi lokasi seksi asalnya.

**Pengukuran repo.** Semua angka "kondisi repo" dihitung ulang **pada HEAD `41fef8e`** dengan `grep -rho`/`grep -rn` atas `src/client/**/*.tsx`, `index.html`, dan `src/client/index.css`, ditambah dua skrip Python sekali-pakai untuk hal yang tidak bisa dijawab satu `grep`:
- **cek nama aksesibel** — untuk tiap `<(input|select|textarea)`, lihat isi tag untuk `aria-label`/`aria-labelledby`/`id=`, lalu lihat ~900 byte sebelum tag untuk `<label>` yang belum ditutup `</label>`.
- **cek target sentuh & elemen klik non-interaktif** — untuk tiap tiap `<button>` lihat 6–10 baris setelahnya untuk pola padding kecil; untuk tiap `onClick` pada `<div|Card|li|tr|td|span>` lihat apakah ada `role=`/`tabIndex=`.

Skrip-skrip ini **tidak disimpan** (sekali pakai) — perintah setara berbasis `grep` ada di `ui-checklist.md` §3. Batasannya jujur: lihat §8.

**Kontras.** Dihitung dengan rumus WCAG (relative luminance `L = 0.2126R + 0.7152G + 0.0722B`, `CR = (L1+0.05)/(L2+0.05)`). Nilai warna diambil dari dua tempat yang **bisa dibaca**: token hex di `src/client/index.css:18-32`, dan nilai `oklch()` asli Tailwind v4 di `node_modules/tailwindcss/theme.css` yang dikonversi ke sRGB lewat OKLab→linear-sRGB→gamma. Konversi ini deterministik, bukan perkiraan mata; tapi hasil pembulatan bisa berbeda **±0.02** dari alat seperti WebAIM Contrast Checker. Semua ambang yang dipakai berasal dari halaman yang dikutip, bukan dari ingatan.

**Konvensi status.** Mengikuti `docs/ui-checklist.md`: ✅ bersih · ❌ melanggar · ⚠️ perlu dicek. Status di sini hasil **pengukuran statis**, bukan uji perangkat atau browser.

---

## 3. Sumber yang Terverifikasi

### 3.1. WCAG 2.2 — Spesifikasi Normatif

| Field | Nilai |
| :--- | :--- |
| URL | https://www.w3.org/TR/WCAG22/ |
| HTTP | `200`, 512.457 B |
| Jenis | **Spesifikasi normatif.** Ini teks yang menentukan konformans; halaman *Understanding* hanya penjelasan informatif |
| Verifikasi | `curl -sS -L https://www.w3.org/TR/WCAG22/`, `grep -c "4.5:1"` → 2, `grep -c "24 by 24 CSS pixels"` → 1 |

**Checkable?** Ya — setiap kriteria adalah pernyataan tentang kondisi DOM/CSS yang bisa diperiksa. Yang **tidak** checkable otomatis: 2.4.11 (butuh viewport nyata), 2.5.8 yang mengizinkan pengecualian *Spacing* (butuh geometri render).

**Kutipan verbatim:**

> **1.4.3 Contrast (Minimum) (Level AA)** — "The visual presentation of text and images of text has a contrast ratio of at least 4.5:1, except for the following: **Large Text** Large-scale text and images of large-scale text have a contrast ratio of at least 3:1;"

> **2.5.8 Target Size (Minimum) (Level AA)** — "The size of the target for pointer inputs is at least 24 by 24 CSS pixels, except when: **Spacing** Undersized targets (those less than 24 by 24 CSS pixels) are positioned so that if a 24 CSS pixel diameter circle is centered on the bounding box of each, the circles do not intersect another target or the circle for another undersized target;"

> **2.4.11 Focus Not Obscured (Minimum) (Level AA)** — "When a user interface component receives keyboard focus, the component is not entirely hidden due to author-created content."

**Relevansi untuk DeutschEasier.** Ini sumber kanonik untuk semua aturan di §5.1 dan §5.5. `2.4.11` sangat spesifik untuk repo ini: `DashboardLayout.tsx:210` punya `<header>` `sticky top-0 z-20` dan `DashboardLayout.tsx:229` punya drawer `fixed inset-y-0 z-50`. Saat drawer mobile terbuka, **tidak** ada attribute `inert`/`aria-hidden`/focus trap, jadi Tab bisa masuk ke kontrol di balik drawer. `2.5.8` berlaku langsung untuk 52 tombol §1.6.

**Verdict: ADOPT sebagai sumber kanonik.** Ketika aturan di `ui-checklist.md` butuh ambang, kutip dari sini, bukan dari blog.

---

### 3.2. WCAG 2.2 Understanding Docs (11 kriteria)

| Field | Nilai |
| :--- | :--- |
| URL contoh | https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html |
| HTTP | `200` untuk **11 dari 11** kriteria yang diminta |
| Ukuran | 38 KB – 203 KB per halaman |
| Sifat | **Informatif**, bukan normatif — header halaman sendiri berbunyi: *"Informative explanations, not required to meet WCAG"* |
| Verifikasi | `curl` per halaman ke `/tmp/src/wcag-*.html`, lalu ekstraksi teks seksi `Success Criterion (SC)` |

**Checkable?** Sama dengan §3.1 — ya, dan halaman ini memberi angka + pengecualian dalam bahasa yang lebih mudah dikutip di review.

**Kutipan verbatim per kriteria:**

**1.4.11 Non-text Contrast (AA)** — https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html
> "The visual presentation of the following have a contrast ratio of at least 3:1 against adjacent color(s): **User Interface Components** Visual information required to identify user interface components and states, except for inactive components or where the appearance of the component is determined by the user agent and not modified by the author; **Graphical Objects** Parts of graphics required to understand the content…"

**2.4.7 Focus Visible (AA)** — https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html
> "Any keyboard operable user interface has a mode of operation where the keyboard focus indicator is visible."

Dan penjelasan yang menutup celah yang sering dipakai untuk membenarkan `focus:outline-none`:
> "Author responsibilities: … Authors are responsible for providing at least one mode of operation where the focus is visible. In most cases there is only one mode of operation so this success criterion applies. The focus indicator must not be time limited: when the keyboard focus is shown, it must remain visible."

**3.3.1 Error Identification (A)** — https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html
> "If an input error is automatically detected, the item that is in error is identified and the error is described to the user in text."
> "The error must be indicated in text."

**3.3.2 Labels or Instructions (A)** — https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html
> "Labels or instructions are provided when content requires user input."
> "In the case of radio buttons, checkboxes, comboboxes, or similar controls that provide users with options, each option must have an appropriate label so that users know what they are actually selecting."

**3.3.3 Error Suggestion (AA)** — https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html
> "If an input error is automatically detected and suggestions for correction are known, then the suggestions are provided to the user, unless it would jeopardize the security or purpose of the content."

**1.3.1 Info and Relationships (A)** — https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html
> "Information, structure, and relationships conveyed through presentation can be programmatically determined or are available in text."
> "…form fields may be positioned as groups that share text labels; a different background color may be used to…"

**4.1.2 Name, Role, Value (A)** — https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html
> "For all user interface components (including but not limited to: form elements, links and components generated by scripts), the name and role can be programmatically determined; states, properties, and values that can be set by the user can be programmatically set; and notification of changes to these items is available to user agents, including assistive technologies."
> "Note: This success criterion is primarily for web authors who develop or script their own user interface components. For example, standard HTML controls already meet this success criterion when used according to specification."

**3.1.2 Language of Parts (AA)** — https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html
> "The human language of each passage or phrase in the content can be programmatically determined except for proper names, technical terms, words of indeterminate language, and words or phrases that have become part of the vernacular of the immediately surrounding text."
> "Phrases and passages consist of one or more words. As a result, even an individual word can be subject to the requirements of this criterion, unless it falls under one of the exceptions."

**Relevansi untuk DeutschEasier.**

- **1.4.11** dua arah. (a) Ring fokus: `blue-500 #2b7fff` = **3.76:1** di atas putih, **3.60:1** di atas `slate-50` — **lulus** 3:1, jadi ring biru boleh dipakai sebagai indikator fokus. (b) **Batas input** `border-border #e2e8f0` = **1.23:1** di atas putih, **1.18:1** di atas `neutral #f8fafc` — **gagal 3:1**. Ini temuan baru: batas input pencarian (`HomePage.tsx:107`, `GrundlagenPage.tsx:390,397`) satu-satunya penanda bahwa itu *kolom input* dan tidak mencapai 3:1. Mengecualikan "inactive components" tidak menolong karena input ini aktif.
- **2.4.7** langsung menyerang 36 `focus:outline-none`. Pengganti `focus:ring-*` yang dipicu `:focus` (bukan `:focus-visible`) **secara teknis memenuhi** "a mode of operation where the focus indicator is visible" — jadi baris ini **bukan** pelanggaran otomatis. Yang pelanggaran: 6 kontrol dengan `focus:outline-none` dan **tanpa** ring/border (lihat §5.2).
- **3.3.1 + 3.3.2 + 4.1.2** satu temuan: label visual ada, nama programatik tidak. Lihat §5.3.
- **3.1.2** sudah diterapkan sebagian (7 `lang="de"`), bocor di dua `<h1>`.

---

### 3.3. WebAIM — Contrast and Color Accessibility + The WebAIM Million (2026)

| Field | Nilai |
| :--- | :--- |
| URL 1 | https://webaim.org/articles/contrast/ — `200`, 29.439 B |
| URL 2 | https://webaim.org/projects/million/ — `200`, 42.130 B |
| Edisi Million | **Laporan 2026**, data **Februari 2026**, sampel **1.000.000** halaman (Tranco), mesin **WAVE** |
| Checkable? | Angkanya **tidak** checkable di repo ini (itu statistik web). Tapi **ambang dan presisi hitungnya** checkable |
| Verifikasi | HTML diambil, teks seksi diekstrak; tahun laporan dari `<title>`: *"WebAIM Million - The 2026 report on the accessibility of the top 1,000,000 home pages"* |

**Kutipan verbatim — aturan (halaman Contrast):**

> "Large text is easier to read, so the contrast requirement is reduced to 3:1. WCAG defines large text as text that is 18pt and larger, or 14pt and larger if it is bold."

> "In web pages, pixels are much more common for text size than points. 18 points maps to 24 pixels and 14 points to approximately 18.67 pixels."

> "You cannot round a contrast ratio up to 4.5:1."

Kutipan ketiga ini adalah alasan mengapa di §5.1 saya **tidak** membulatkan 4.12:1 menjadi "hampir 4.5" dan tidak membulatkan 4.53:1 menjadi "aman" — keduanya dilaporkan apa adanya.

**Kutipan verbatim — data lapangan (Million 2026):**

> "Across the one million home pages, 56,114,377 distinct accessibility errors were detected—an average of 56.1 errors per page."

> "Low contrast text, below the WCAG 2 AA thresholds, was found on 83.9% of home pages, an increase from 79.1% in 2025. This was the most commonly-detected accessibility issue. On average, each home page had 34 distinct instances of low-contrast text, up 15% from 2025."

> "Missing labels 52.8% … Empty buttons 30.6% … Missing language 13.5%"

> **Batasan yang wajib dikutip bersama angkanya:** "All automated tools, including WAVE, have limitations—not all conformance failures can be automatically detected. Absence of detected errors does not indicate that a page is accessible or conformant."

**Relevansi untuk DeutschEasier.** Tiga dari empat kategori teratas WebAIM — kontras (83.9%), label (52.8%), tombol kosong (30.6%) — **semuanya masih gagal di repo ini** (§5.1, §5.3, §5.4). Kategori yang **lulus**: missing language, karena `index.html:2` sudah `lang="id"`. Prioritas kerja jadi punya urutan yang bersandar pada data 1 juta halaman, bukan selera.

**Verdict: ADOPT** — angka ambang dan urutan prioritas. **SKIP** angka "56.1 error/halaman" sebagai target repo: itu rata-rata seluruh web, bukan benchmark untuk aplikasi berisi form.

---

### 3.4. MDN Web Docs — `:focus-visible`

| Field | Nilai |
| :--- | :--- |
| URL | https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible |
| HTTP akhir | `200` setelah redirect dari `/docs/Web/CSS/Reference/Selectors/:focus-visible` |
| Ukuran | 331.091 B |
| Checkable? | Ya — keberadaan selector di kelas Tailwind bisa di-grep |
| Verifikasi | `curl -L`, ekstraksi teks; baris "Baseline" dicek |

**Kutipan verbatim:**

> "**Baseline** Widely available — This feature is well established and works across many devices and browser versions. It's been available across browsers since March 2022."

> "The `:focus-visible` pseudo-class applies while an element matches the `:focus` pseudo-class and the UA (User Agent) determines via heuristics that the focus should be made evident on the element. (Many browsers show a 'focus ring' by default in this case.)"

> "Because of the appearance, some authors removed the user-agent outline focus styles. Changing focus style can decrease usability, while removing focus styles makes keyboard navigation inaccessible for sighted users."

**Relevansi.** Tailwind v4 punya `focus-visible:` sebagai variant bawaan, dan Native/base browser support Baseline sejak Maret 2022 — jadi **tidak ada alasan kompatibilitas** untuk memakai `focus:` sebagai ganti `focus-visible:` untuk indikator fokus. Di repo: `focus-visible` **4** vs `focus:ring` **57**. Kutipan ketiga persis menggambarkan bagian terakhir `focus:outline-none` di 36 tempat.

**Verdict: ADOPT.** Perbaikan mekanis: `focus:ring-2 focus:ring-x` → `focus-visible:ring-2 focus-visible:ring-x`, dan **hapus** `focus:outline-none` (atau ubah ke `focus-visible:outline-none` setelah ring-nya terbukti ≥3:1).

---

### 3.5. MDN Web Docs — `prefers-reduced-motion`

| Field | Nilai |
| :--- | :--- |
| URL | https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion |
| HTTP | `200` (path lama `/docs/Web/CSS/reduced-motion` → **404**; lihat §4) |
| Checkable? | Ya — ada/tidaknya media query di CSS |
| Verifikasi | `curl -L`, ekstraksi teks seksi pembuka |

**Kutipan verbatim:**

> "The `prefers-reduced-motion` CSS media feature is used to detect if a user has enabled a setting on their device to minimize the amount of non-essential motion. The setting is used to convey to the browser on the device that the user prefers an interface that removes, reduces, or replaces motion-based animations."

> "Such animations can trigger discomfort for those with vestibular motion disorders. Animations such as scaling or panning large objects can be vestibular motion triggers."

> "`reduce` Indicates that a user has enabled the setting on their device for reduced motion. The `reduce` keyword value evaluates as true; therefore, `@media (prefers-reduced-motion)` is equivalent to `@media (prefers-reduced-motion: reduce)`."

**Relevansi.** **Sudah dipenuhi** — `src/client/index.css:110-121` punya dua blok `@media (prefers-reduced-motion: reduce)` yang meredam `.interactive-hover` dan mengganti `.animate-modal` dengan `fadeIn` (opacity saja). Ini sesuai definisi "reduce, or replace". `ui-checklist.md` §2.2 masih mencatat "0 dari 2 animasi" — **baris itu usang**, lihat §5.6 dan pembaruan §1 di `ui-checklist.md`.

**Verdict: ADOPT sebagai referensi; status repo ✅.** Jangan kerjakan lagi.

---

### 3.6. MDN Web Docs — `env()` dan safe-area inset + viewport meta

| Field | Nilai |
| :--- | :--- |
| URL | https://developer.mozilla.org/en-US/docs/Web/CSS/env |
| URL pendamping | https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Viewport_meta_element — `200`, 190.724 B |
| Checkable? | Ya — `grep viewport-fit index.html`, `grep env(safe-area-index src/client` |
| Verifikasi | Kedua halaman diambil; `grep -io "viewport-fit=cover"` pada halaman viewport → 1 match |

**Kutipan verbatim (halaman viewport meta):**

> "`viewport-fit` Defines the viewable portions of the web page. It can be one of the keywords `auto`, `contain`, or `cover`. … `cover`: The viewport is scaled to fill the device display. It's highly recommended to use the safe area inset variables to ensure that important content doesn't end up outside the display."

**Kutipan verbatim (contoh resmi di halaman yang sama):**

> "The following content value uses multiple keywords that hint to the browser to use fullscreen mode, along with `viewport-fit`, which helps avoid display cutouts such as mobile device notches: `<meta name="viewport" content="width=device-width, viewport-fit=cover" />`"

**Relevansi.** **Sudah dipenuhi.** `index.html:5` = `content="width=device-width, initial-scale=1.0, viewport-fit=cover"`. `ui-checklist.md` §2.4 masih mencatat "keduanya absen" — **usang**. Yang belum diperiksa: apakah ada elemen `fixed bottom` yang **benar-benar** memakai `env(safe-area-inset-bottom)`. `grep -rn "env(safe-area-inset" src/client` → lihat §5.6.

---

### 3.7. MDN Web Docs — `touch-action`, `overscroll-behavior`, `:user-invalid`, satuan `dvh/svh/lvh`

| Field | Nilai |
| :--- | :--- |
| URL | https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action · `.../overscroll-behavior` · `.../:user-invalid` · `.../length` |
| HTTP | Semua `200` (via `/docs/Web/CSS/Reference/...`) |
| Checkable? | Ya untuk 3 pertama (`grep`); `dvh` juga ya (grep + build output) |
| Verifikasi | Empat halaman diambil; teks seksi pembuka diekstrak |

**Kutipan verbatim:**

`touch-action`:
> "The `touch-action` CSS property sets how an element's region can be manipulated by a touchscreen user (for example, by zooming features built into the browser). By default, panning (scrolling) and pinching gestures are handled exclusively by the browser."

`length` — definisi `dvh`:
> "The respective viewport-percentage units for small, large, and dynamic viewport sizes are `svh`, `lvh`, and `dvh`. `vh` is equivalent to `lvh`, representing the viewport-percentage length unit based on the large viewport size."

**Relevansi.** Kalimat `vh` ≡ `lvh` adalah **justifikasi teknis** untuk aturan `100dvh` yang sudah ada di DESIGN.md dan ADR — `vh`/`lvh` mengukur viewport **terbesar**, bukan yang terlihat. Repo sudah `min-h-screen` **0**, dan `index.css:124-131` sudah punya fallback `@supports not (min-height: 100dvh)`. ✅ selesai.

`touch-action` dan `overscroll-behavior`: **0 kemunculan** di `src/client`. Itu **✅ benar** untuk repo ini — MDN menjelaskan default browser sudah menangani pan/pinch, dan tidak ada gesture kustom. **Jangan tambahkan.** Berguna hanya jika kelak ada swipe-to-rate flashcard (trigger yang sudah dicatat di `docs/research-apple-design-skill-emil-kowalski.md` §5).

`:user-invalid`: **0 kemunculan**, dan repo **tidak butuh**. Repo hanya punya 2 atribut `required` dan memvalidasi manual di JS (`gateErrorMsg`, `error`). Kalau validasi dipindah ke constraint validation native, `:user-invalid` lebih tepat daripada `:invalid` (yang menyala sejak halaman dimuat) — tapi itu **bukan** pekerjaan sekarang. Catatan, jangan dikerjakan.

**Verdict: ADOPT sebagai dokumentasi ✅.** Tidak ada pekerjaan baru.

---

### 3.8. web.dev — Web Vitals: ambang LCP / INP / CLS

| Field | Nilai |
| :--- | :--- |
| URL | https://web.dev/articles/vitals — `200`, 143.710 B, *"Published: May 4, 2020, Last updated: October 31, 2024"* |
| URL pendamping | https://web.dev/articles/cls — `200` |
| Checkable? | **Tidak** tanpa menjalankan Lighthouse/PSI. Yang checkable hanya **penyebab** CLS (gambar/iframe tanpa dimensi, font tanpa `font-display`) |
| Verifikasi | Kedua halaman diambil, teks seksi *Core Web Vitals* diekstrak |

**Kutipan verbatim (vitals):**

> "**Largest Contentful Paint (LCP)**: measures loading performance. To provide a good user experience, LCP should occur within 2.5 seconds of when the page first starts loading."

> "**Interaction to Next Paint (INP)**: measures interactivity. To provide a good user experience, pages should have a INP of 200 milliseconds or less."

> "**Cumulative Layout Shift (CLS)**: measures visual stability. To provide a good user experience, pages should maintain a CLS of 0.1. or less."

> "To ensure you're hitting the recommended target for these metrics for most of your users, a good threshold to measure is the 75th percentile of page loads, segmented across mobile and desktop devices."

**Kutipan verbatim (cls):**

> "Good CLS values are 0.1 or less. Poor values are greater than 0.25."

**Relevansi untuk DeutschEasier.**

- **CLS penyebab #1 di repo: tidak ada.** `grep -rn "<img" src/client` → **0**. Tidak ada `<iframe>`. Semua ikon adalah lucide (`<svg>` inline dengan `width`/`height` dari prop `size`), jadi tidak ada ruang yang belum dicadangkan. **Tidak ada pekerjaan CLS yang bisa dilakukan** — dan itu fakta, bukan optimisme.
- **Font: `font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, …` (`index.css:57`)** — font sistem, **nol unduhan**, jadi FOUT/FOIT tidak mungkin terjadi. Ini juga alasan `DESIGN.md` baris `fontFamily: system-ui` benar.
- **LCP & INP: tidak terukur statis.** Butuh Lighthouse atau data lapangan. **Jangan** menyatakan lulus atau gagal.

**Verdict: ADOPT ambangnya sebagai gate opsional saat ada Lighthouse; SKIP sebagai pekerjaan sekarang.** Kontribusi nyata dokumen ini ke repo: **menutup** item "Performa" di `ui-checklist.md` §5 dengan alasan yang terukur ("0 gambar, 0 iframe, 0 webfont → 3 penyebab CLS/FOUT tidak ada"), bukan dengan "belum diperiksa".

---

### 3.9. Deque University — daftar aturan axe-core 4.10

| Field | Nilai |
| :--- | :--- |
| URL | https://dequeuniversity.com/rules/axe/4.10 — `200`, 132.723 B |
| Checkable? | **Ini justru sumber untuk menyatakan apa yang TIDAK bisa diverifikasi** |
| Verifikasi | Halaman diambil; 19 rule ID dicari dan deskripsinya diekstrak |

**Kutipan verbatim (deskripsi + tag WCAG):**

> `label` — "Ensure every form element has a label" — Critical — tags: `cat.forms, wcag2a, wcag412, section508, …`

> `select-name` — "Ensure select element has an accessible name" — Critical — `cat.forms, wcag2a, wcag412, …`

> `color-contrast` — "Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds" — Serious — `cat.color, wcag2aa, …`

> `target-size` — "Ensure touch targets have sufficient size and space" — Serious — `cat.sensory-and-visual-cues, wcag22aa, wcag258`

> `heading-order` — "Ensure the order of headings is semantically correct" — **Moderate** — `cat.semantics, best-practice` ← *bukan* tag WCAG; ini best-practice, bukan kegagalan konformans

**Relevansi — dan ini bagian pentingnya.** Daftar ini memberi tiga batas yang harus ditulis jujur di `ui-checklist.md` §6:

1. **Yang BISA ditangkap axe**: `label`/`select-name`/`aria-input-field-name` (nama aksesibel), `color-contrast`, `target-size`, `html-has-lang`, `button-name`, `aria-valid-attr-value`. Artinya 37 kontrol tanpa nama (§3.2) **akan** tertangkap otomatis — dan itu artinya `grep htmlFor` di dokumen sebelumnya sudah cukup untuk memprediksinya.
2. **Yang TIDAK bisa**: WCAG 2.4.7 (apakah fokus *terlihat*), 2.4.11 (tertutup sticky header), 3.1.2 (`lang` pada *bagian* teks — axe tidak memeriksa elemen `<span>` non-`lang`), 3.3.3 (apakah saran perbaikan ada dan berguna), dan seluruh kualitas copy.
3. **`heading-order` bertag `best-practice`, bukan WCAG.** Jadi menandai halaman dengan 0 atau >1 `<h1>` sebagai "pelanggaran WCAG" akan **salah**. Yang benar: itu pelanggaran **best practice**.

**axe-core tidak terpasang** di repo ini (`package.json` tidak memuat `@axe-core/*`, `jest-axe`, `vitest-axe`, atau `pa11y`). Dokumen ini **tidak** mengusulkan pemasangan (larangan instalasi), tapi menyatakan: alat ini akan memberi nilai lebih tinggi daripada semua `grep` di §5, dengan biaya satu devDependency.

**Verdict: ADOPT sebagai peta batas verifikasi.**

---

### 3.10. MDN — atribut global `lang`

| Field | Nilai |
| :--- | :--- |
| URL | https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang — `200` |
| Checkable? | Ya — `grep` pada `index.html` dan pada elemen yang merender teks Jerman |
| Verifikasi | Halaman diambil, seksi pembuka diekstrak |

**Kutipan verbatim:**

> "The `lang` global attribute helps define the language of an element: the language that non-editable elements are written in, or the language that the editable elements should be written in by the user. The attribute contains a single BCP 47 language tag."

> "**Note:** The language is in an unknown state if there's no indication of language anywhere. It is recommended to always specify an appropriate value for this attribute, especially due to accessibility concerns."

**Relevansi.** `index.html:2` = `<html lang="id">` ✅. Teks Jerman: **7 `lang="de"`** di 5 berkas (`AlphabetCard.tsx:80,91`, `ComprehensionQuiz.tsx:253`, `WordCard.tsx:44,67`, `ViewPage.tsx:767,817`). Yang **bocor**: `DayPage.tsx:70` (`die Tage`), `NumberPage.tsx:79` (`die Nummer`), `GrundlagenPage.tsx:370,383` (`die Nummer`, `die Tage` di tab) — **4 tempat**. Ini kategori yang paling murah diperbaiki di seluruh dokumen: 4 atribut, nol risiko visual.

---

### 3.11. https://html.spec.whatwg.org — `lang` di spesifikasi HTML

| Field | Nilai |
| :--- | :--- |
| URL | https://html.spec.whatwg.org/multipage/dom.html — `200` |
| Checkable? | Ya |
| Verifikasi | Halaman diambil (HTTP 200). **Tidak** dikutip verbatim: `lang` didefinisikan di `/multipage/dom.html#attr-lang`, dan halaman itu terlalu besar untuk dipotong andal dengan ekstraksi teks sederhana. |

**Verdict: ⚠️ disebut, tidak dikutip.** MDN (§3.10) + WCAG 3.1.1/3.1.2 (§3.2) sudah menutup kebutuhan yang sama dengan kutipan verbatim. **Jangan** mengutip spesifikasi WHATWG dari ingatan.

---

### 3.12. Apple HIG & Material Design — sebagai **rekomendasi platform**, bukan standar

| Field | Nilai |
| :--- | :--- |
| URL | https://developer.apple.com/design/human-interface-guidelines/ · https://m3.material.io/ |
| Checkable? | **Tidak bisa dikutip** — lihat §4 |
| Verifikasi | Dicoba di penelitian sebelumnya (`research-design-rules-sources.md` §4.3): HIG 200 tapi isi bergantung JavaScript; m3.material.io SPA, 0 kemunculan `label-large` |

**Status: tidak terverifikasi, jadi tidak dipakai.** Angka 44pt (Apple) dan 48dp (Material) yang disebut di brief **tidak** akan saya tulis sebagai kutipan. Yang **bisa** saya nyatakan sebagai fakta terverifikasi hanyalah ambang WCAG 2.5.8: **24×24 CSS px**. Untuk target sentuh repo ini, 24×24 sudah ambang yang mengikat secara konformans; 44/48 adalah aspirasi desain yang tidak punya sumber terkutip di sini.

---

## 4. Sumber yang TIDAK Terverifikasi

Disusun jujur. Tidak ada yang ditebak, tidak ada angka yang direkonstruksi dari ingatan.

### 4.1. HTTP 404 / path tidak ada

| URL yang dicoba | Hasil |
| :--- | :--- |
| https://developer.mozilla.org/en-US/docs/Web/CSS/prefers-reduced-motion | **404**. Path yang benar adalah `/docs/Web/CSS/@media/prefers-reduced-motion` (dikutip di §3.5). Kesalahan path, bukan kesalahan sumber. |
| https://developer.mozilla.org/en-US/docs/Web/CSS/reduced-motion | **404** juga. Tidak ada halaman MDN di path ini. |

### 4.2. HTTP 200 tapi tidak bisa dikutip

| URL | Hasil |
| :--- | :--- |
| https://html.spec.whatwg.org/multipage/dom.html | `200`, tapi bagian `#attr-lang` tidak berhasil saya potong jadi kutipan verbatim yang bisa dipertanggungjawabkan. Tidak dipakai (§3.11). |
| https://developer.apple.com/design/human-interface-guidelines/ | Penelitian sebelumnya: 200, 17.978 B, **hanya kerangka navigasi** yang terbaca. Angka 44pt **tidak** terverifikasi di sini. |
| https://m3.material.io/ | SPA. Penelitian sebelumnya: 0 kemunculan `label-large` pada HTML mentah. Angka 48dp **tidak** terverifikasi. |

### 4.3. Tidak diperiksa sama sekali

| Sumber | Alasan |
| :--- | :--- |
| Nielsen Norman Group (form design, error messages) | Brief mensyaratkan "hanya jika menghasilkan aturan yang CHECKABLE". NN/g adalah riset perilaku dengan gambar/video; aturannya berupa prinsip ("let users see errors inline") yang **sudah** dinyatakan lebih tegas oleh WCAG 3.3.1/3.3.3. Tidak memberi aturan baru yang bisa di-grep. **SKIP dengan alasan**, bukan karena tidak ada. |
| Lighthouse / PageSpeed Insights | Butuh menjalankan tool dan instance hidup — dilarang oleh brief ("do not run the dev server"), dan `npx lighthouse` = instalasi. |
| `prefers-color-scheme` (MDN) | Diperiksa `200`, tapi repo **tidak** punya dark mode (`grep prefers-color-scheme` → 0) dan **tidak** punya `theme-color`. Aturan ini tidak punya objek untuk diperiksa. Dicatat, tidak diadopsi. |
| WebAIM "Missing form labels" persentase **per-kategori** | Halaman Million menyebut `Missing labels 52.8%` di tabel tren, tapi tidak ada seksi prosa khusus form labeling yang bisa saya kutip lebih panjang. Angka 52.8% saya pakai apa adanya dari tabel, tidak saya tafsirkan jadi "52.8% halaman punya input tanpa label". |
| axe-core hasil aktual pada repo | Alatnya tidak terpasang dan pemasangan dilarang. Semua klaim "akan tertangkap axe" di §3.9 adalah **prediksi dari tag rule**, bukan hasil run. |

---

## 5. Aturan Konkret yang Layak Diadopsi

**Kriteria masuk:** (a) bisa diperiksa dengan membaca kode atau menjalankan satu perintah, (b) berlaku untuk repo ini, (c) **belumada** di `docs/ui-checklist.md` atau `docs/research-design-rules-sources.md`. Yang sudah ada diberi label "sudah ada" dan **tidak** diulang.

Status diukur pada HEAD `41fef8e`. ✅ bersih · ❌ melanggar · ⚠️ perlu dicek.

### 5.1. Kontras — 4 pelanggaran terhitung, semua WWCAG AA 1.4.3

Sumber ambang: [WCAG 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) (§3.2), [WebAIM Contrast](https://webaim.org/articles/contrast/) (§3.3).

| Pasangan | Kelas / token | Rasio | Ambang | Status | Kemunculan |
| :--- | :--- | ---: | :--- | :--- | ---: |
| `rose-600` di atas `rose-50` | `text-rose-600` + `bg-rose-50` (panel error) | **4.12:1** | 4.5:1 | ❌ | **13** |
| `emerald-600` di atas putih | `text-emerald-600` | **3.65:1** | 4.5:1 | ❌ | **11** |
| `slate-400` di atas putih / `slate-50` | `text-slate-400` | **2.63 / 2.51:1** | 4.5:1 | ❌ | **91** |
| `--color-warning` `#fe9a00` di atas putih | token `@theme` | **2.13:1** | 3:1 (non-teks) | ❌ token | 1 (token) |
| `border-border` `#e2e8f0` di atas putih | batas input | **1.23:1** | 3:1 (1.4.11) | ❌ | lihat §5.5 |
| `rose-700` di atas `rose-50` | `text-rose-700` | 5.81:1 | 4.5:1 | ✅ | 13 |
| `blue-600` di atas putih | `text-primary` | 5.25:1 | 4.5:1 | ✅ | — |
| `white` di atas `blue-600` | `bg-primary text-on-primary` | 5.25:1 | 4.5:1 | ✅ | — |
| `text-muted` `#45556c` di atas putih | `text-text-muted` | 7.58:1 | 4.5:1 | ✅ | 30 |

**Cara memeriksa sekarang:** hitung dengan Python satu-baris (perintah di `ui-checklist.md` §3), **bukan** mata dan bukan screenshot. Perintah itu mengembalikan rasio; perbandingan dengan 4.5 dilakukan manual.

**Perbaikan, urut dampak:**
1. `text-rose-600` → `text-rose-700` (12 tempat, 1 penggantian string) → 5.81:1.
2. `text-emerald-600` → `text-emerald-700` (11 tempat) → **5.09:1** di atas `emerald-50`, dan lulus di atas putih.
3. `text-slate-400` → `text-slate-500` **hanya untuk teks yang harus dibaca**. **91 kemunculan** — jangan sapu rata. Banyak di antaranya ikon dekoratif (`AlphabetPage.tsx:203` ikon pencarian di dalam input, `:215` tombol bersihkan) yang **bukan** teks dan hanya butuh 3:1 → masih gagal (2.63:1), tapi penggantinya ikon warna `text-slate-500` (4.76:1) juga benar. Yang jelas teks: `AlphabetPage.tsx:305` (empty state), `NumberPage.tsx:162,265,294,387`.
4. `--color-warning` → turunkan lightness ke sekitar `oklch(60% 0.16 70)` (≈`amber-600` `#e17100`, 3.20:1) atau lebih gelap lagi jika dipakai sebagai teks (butuh 4.5:1 → `amber-700` `#bb4d00`, **4.52:1** di atas `amber-100`, 6.36:1 untuk `amber-800`).

**Jangan** memperbaiki dengan cara menurunkan ambang atau mengecualikan "teks kecil". WebAIM: *"You cannot round a contrast ratio up to 4.5:1."*

### 5.2. Fokus keyboard — 36 kontrol mematikan outline

Sumber: [WCAG 2.4.7](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html) (§3.2) + [MDN `:focus-visible`](https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible) (§3.4).

| Aturan | Checkable? | Relevan? | Status |
| :--- | :--- | :--- | :--- |
| Setiap `<button>` punya indikator fokus eksplisit | skrip: `<button>` → cari `focus:`/`focus-visible` sampai `>` penutup tag | **Tinggi** — **142 dari 143** tanpa fokus eksplisit | ⚠️ |
| Indikator fokus memakai `:focus-visible`, bukan `:focus` | `grep -rho 'focus-visible' … \| wc -l` vs `grep -rho 'focus:ring' … \| wc -l` | **Tinggi** — **4** vs **57** | ❌ |
| `focus:outline-none` hanya boleh ada jika ada pengganti yang terlihat | `grep -rn 'focus:outline-none'` per baris, cek ada `focus:ring`/`focus:border` di tag yang sama | **Tinggi** — **36** ada, semua `<input>`/`<select>` | ⚠️ |
| Sticky header / drawer tidak menutupi elemen fokus | Requires browser check — `2.4.11` butuh geometri viewport | **Tinggi** — `DashboardLayout.tsx:210` sticky `z-20`, `:229` drawer `z-50` tanpa `inert` | ⚠️ |

**Kenapa statusnya ⚠️ dan bukan ❌:** `focus:outline-none` di repo hanya dipasang pada **`<input>`/`<select>`** (36 tempat, selalu berpasangan dengan `focus:ring-2`/`focus:ring-1`/`focus:border-*`), **tidak** pada `<button>`. Tidak ada aturan `outline: none` di `index.css`. Jadi ring fokus bawaan browser **tidak dihapus** untuk tombol — 142 tombol itu memakai default platform, yang secara WCAG 2.4.7 adalah *"a mode of operation where the keyboard focus indicator is visible"*. Yang gagal adalah **konsistensi dan DESIGN.md**: tidak ada indikator fokus yang dirancang, hanya yang kebetulan diwarisi.

**Perbaikan mekanis (satu pola, 15 berkas):**
```
focus:outline-none focus:ring-2 focus:ring-blue-500
  →
focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary
```
Ring `primary #155dfc` di atas putih = **5.25:1**; `blue-500 #2b7fff` yang dipakai sekarang = 3.76:1 — keduanya **lulus** 1.4.11 (≥3:1), jadi penggantian hue ini opsional demi konsistensi token, bukan kewajiban.

**Kenapa `focus-visible` dan bukan `focus`:** indikator fokus yang menyala saat klik mouse adalah alasan historis orang memasang `outline-none` (MDN: *"Because of the appearance, some authors removed the user-agent outline focus styles"*). Pindah ke `focus-visible` menghapus alasan itu, bukan hanya gejalanya.

### 5.3. Nama aksesibel: 37 dari 39 kontrol tanpa nama programatik

Sumber: [WCAG 1.3.1](https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html) + [3.3.2](https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html) + [4.1.2](https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html) (§3.2), [axe `label`/`select-name`](https://dequeuniversity.com/rules/axe/4.10) (§3.9).

| Aturan | Checkable? | Relevan? | Status |
| :--- | :--- | :--- | :--- |
| Setiap kontrol form punya nama aksesibel (`<label htmlFor>` + `id`, `aria-label`, atau `<label>` membungkus) | skrip 1 kali-pakai; setara grep: `grep -c htmlFor` = **0**, `grep -c aria-label` = **12**, kontrol = **39** | **Tinggi** — form-heavy | ❌ **37/39** |
| Label tidak boleh hanya `<label>` lepas tanpa `htmlFor` | `grep -rho '<label[^>]*>' \| grep -vc 'htmlFor\|aria-label'` | **Tinggi** — **10** `<label>` tanpa `htmlFor` | ❌ |

**Temuan yang paling penting di seluruh dokumen ini.** Repo punya **10 `<label>` terlihat** di 8 berkas (`KeyManagerModal.tsx:220,274`, `SpellingTrainer.tsx:330,547,567`, `GrammarTopicPicker.tsx:39,86`, `GrammarPanel.tsx:459`, `ComprehensionQuiz.tsx:218`, `ScenarioQuiz.tsx:739`, `GeneratorPage.tsx:396,409,424,442,492,501`, `LoginPage.tsx:66`) — **tidak satupun** punya `htmlFor`, dan tidak satupun `<input>`/`<select>` punya `id=`. Secara visual label ada di atas field; secara programatik **hubungannya tidak ada**. Pembaca layar mengumumkan "edit teks" tanpa nama.

`GrammarTopicPicker.tsx:86-99` adalah **contoh positif** yang harus ditiru: `<label>` membungkus `<input type="checkbox" aria-label={topic.german}>` — nama aksesibel ada, meskipun lewat `aria-label` bukan `htmlFor`.

**Perbaikan:** untuk setiap pasangan, tambahkan `id` pada kontrol dan `htmlFor` pada label. Pola:
```tsx
<label htmlFor="cefr-level" className="…">Level CEFR</label>
<select id="cefr-level" …>
```
23 `id` baru, 23 `htmlFor` baru. Nol perubahan visual. Ini menutup 3.3.2 + 4.1.2 + 2.5.3 sekaligus dan membuat `label-in-name` otomatis lulus karena teks label = nama aksesibel.

**Placeholder bukan label.** 3 input hanya punya `placeholder` tanpa `id`/`aria-label`: `AlphabetPage.tsx:205`, `GrundlagenPage.tsx:391`, `HomePage.tsx:102`. Placeholder hilang begitu pengguna mengetik — tidak memenuhi 3.3.2.

### 5.4. Target sentuh — 52 tombol dengan padding ≤6px

Sumber: [WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) — *"at least 24 by 24 CSS pixels"* (§3.2), [axe `target-size`](https://dequeuniversity.com/rules/axe/4.10) (§3.9).

| Aturan | Checkable? | Relevan? | Status |
| :--- | :--- | :--- | :--- |
| Tombol/target ≥24×24 CSS px, atau ada jarak yang mencegah salah-klik | **Perkiraan statis**: `<button>` + `p-1`/`p-1.5`/`py-1`/`px-1` → hitung galat sendiri | **Tinggi** — siswa di HP | ⚠️ **52 tombol** |
| Ikon yang bisa diklik punya `aria-label`/teks (bukan hanya `title=`) | `grep` `title=` pada tombol tanpa teks | Tinggi | ⚠️ mayoritas mengandalkan `title=` |

**52 `<button>` dengan padding kecil**, terdistribusi: `AlphabetPage.tsx` (11), `ViewPage.tsx` (8), `SpellingTrainer.tsx` (5), `ScenarioQuiz.tsx` (4), `GeneratorPage.tsx` (4), `DashboardLayout.tsx` (4), `KeyManagerModal.tsx` (4), `GrammarPanel.tsx` (3), `SubmissionAnalyticsModal.tsx` (3), `DayPage.tsx` (3), `AlphabetCard.tsx` (2), `ScenarioFlashcards.tsx` (2), `ComprehensionQuiz.tsx` (1), `NumberPage.tsx` (1).

**Kasus terdekat dengan kegagalan pasti:** `ViewPage.tsx:683` tombol kecepatan audio `px-2 py-1 text-xs` → tinggi ≈ 16+8 = **~22px**, lebar ≈ 4×7+16 = **~44px**. Tinggi di bawah 24. Ada 4 tombol berdampingan dalam satu baris (`[1.0, 0.8, 0.75, 0.5]`), memenuhi pengecualian *Spacing* hanya jika jarak antar-bounding-box ≥8px — **tidak** bisa dipastikan tanpa render.

**Perbaikan:** naikkan padding satu langkah pada tombol ikon saja (`p-1.5` → `p-2.5`, lalu pastikan ikon `size={16}` + `p-2` = 32px efektif, di atas 24). Untuk tombol kecepatan audio, `py-1` → `py-1.5` dan `text-xs` → `text-label`. **Jangan** sapu semua 52 — sebagian (*pagination*, tab kecil) memenuhi pengecualian *Inline*/*Spacing*.

**`title=` bukan pengganti `aria-label`.** **39** `title=` di repo. `title` **bukan** nama aksesibel yang andal (tidak muncul di pembaca layar sentuh, tidak di keyboard). Contoh nyata: `HomePage.tsx:175,186,197,208` — **empat** tombol ikon (`ExternalLink`, `Key`, `Pencil`, `Trash2`), `p-2` ≈ 32px, hanya dengan `title=`. Contoh yang **benar**: `DashboardLayout.tsx:85,215` memakai `aria-label`. Pola yang harus ditiru.

### 5.5. Kontras non-teks: batas input tidak terlihat (1.4.11)

Sumber: [WCAG 1.4.11](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) (§3.2).

| Aturan | Checkable? | Relevan? | Status |
| :--- | :--- | :--- | :--- |
| Batas kontrol form ≥3:1 terhadap latar bersebelahan | hitung `border-border #e2e8f0` vs `surface`/`neutral` | **Tinggi** | ❌ **1.23:1** / **1.18:1** |
| Ring fokus ≥3:1 | hitung `primary` vs latar | Tinggi | ✅ 5.25:1 / 3.76:1 (`blue-500`) |

Ini kegagalan yang **tidak terlihat di screenshot** karena batas tipis pada layar retina tampak "normal". Nilai `#e2e8f0` dari `@theme --color-border` di `index.css:25`. Ampth 3:1 berasal dari 1.4.11, bukan dari selera.

**Perbaikan:** `--color-border` tidak boleh dinaikkan global (dipakai sebagai pemisah kartu 91×). Yang benar: beri input/select/textarea border **eksplisit lebih gelap** — `slate-300 #cad5e2` = 1.49:1 (masih gagal), jadi butuh sekitar `slate-400 #90a1b9` (2.63:1, **masih gagal**) → `slate-500 #62748e` (4.76:1 ✅). Artinya: **batas input harus `slate-500`** atau diberi latar `surface-muted` yang kontras dengan halaman. Ini keputusan desain, bukan mekanis — **jangan** diterapkan tanpa keputusan.

### 5.6. Baris `ui-checklist.md` yang **usang** (bukan aturan baru, tapi wajib dikoreksi)

Ini bukan aturan hasil riset web. Ini konsekuensi dari §3.5 dan §3.6: subjek aturannya sudah berubah karena refaktor. Saya ukur, saya laporkan.

| Baris `ui-checklist.md` | Klaim lama | Ukuran di HEAD `41fef8e` | Penyebab |
| :--- | :--- | :--- | :--- |
| §1 `prefers-reduced-motion` | ❌ 0 dari 2 | **✅ 3 baris** di `index.css:110,118,124` (2 blok media query) | ditambahkan |
| §1 `env(safe-area-inset-*)` butuh `viewport-fit=cover` | ❌ keduanya absen | **✅ keduanya ada**: `viewport-fit=cover` (`index.html:5`) + `pb-[calc(1rem_+_env(safe-area-inset-bottom))]` (`SelectionBasket.tsx:7`) | selesai |
| §1 `100vh` | ⚠️ 8 tempat | **✅ 0** (`grep min-h-screen\|h-screen`) | `min-h-dvh` + fallback `@supports` |
| §1 gradient indigo/violet | ❌ 15 tempat | **✅ 0** | hue pindah ke `blue-600` |
| §1 gradient pada tombol | ❌ 12 tombol | **✅ 0** | dihapus |
| §1 radius | ❌ 6 tingkat tanpa hierarki | **✅ 4 tingkat** (`md` 156, `lg` 123, `sm` 46, `full` 15) — persis DESIGN.md | token `@theme` |
| §1 micro-type <12px | ❌ 78 | **1** (`DashboardLayout.tsx:166` `text-[11px]`) | token `text-label` |
| §1 `uppercase` + `tracking` | ❌ 49 | **11** `uppercase` | label kategori |
| §1 input <16px | ❌ 18 | **✅ 0** | `text-base` |
| §1 `red-*` | ❌ 13 `text-red-*` | **✅ 0** | pindah ke `rose-*` |
| §1 `aria-live`/`role=alert` (dirujuk di riset sebelumnya) | ❌ 0 | **✅ 8 pasang** | ditambahkan |

**Ini alasan mengapa `ui-checklist.md` harus diperbarui, bukan hanya ditambah.** Checklist yang salah lebih berbahaya daripada checklist yang kosong: ia membuat orang memperbaiki yang sudah benar. Tapi **perhatian**: `rose-*` menggantikan `red-*` membawa kontras 4.12:1 (§5.1) — jadi perbaikan warna lama menciptakan regresi kontras baru. Itu pola yang berulang: setiap perbaikan mekanis perlu satu pemeriksaan kontras setelahnya.

### 5.7. Yang sudah ada di dokumen lain — **jangan** diduplikasi

| Aturan | Lokasi |
| :--- | :--- |
| Input minimal 16px (iOS zoom) | `ui-checklist.md` §2.1 |
| `100dvh` untuk app shell | `ui-checklist.md` §2.3 |
| `env(safe-area-inset-*)` + `viewport-fit=cover` | `ui-checklist.md` §2.4 |
| Gate `:hover` di `@media (hover: hover)` | `ui-checklist.md` §1 |
| Anti-slop: gradient, emoji, radius, micro-type, `uppercase`+`tracking`, glassmorphism | `ui-checklist.md` §4 |
| `aria-invalid`/`aria-describedby`/`aria-live` sudah **diusulkan** | `research-design-rules-sources.md` §5.1 — sekarang **terukur** di sini (§5.3), bukan baru |
| WCAG 2.5.8 / 3.3.1 / 2.5.3 sudah **dikutip** | `research-design-rules-sources.md` §3.6 |
| `transition-all` | `research-design-rules-sources.md` §5.2 |
| `tabular-nums` | `research-design-rules-sources.md` §5.3 |

**Satu-satunya aturan di tabel terakhir yang berubah status:** `tabular-nums` = **0** kemunculan di repo. Itu sudah tercatat sebagai "⚠️ belum diuji" di riset sebelumnya; sekarang angkanya ada, dan jawabannya **tidak ada satu pun angka yang memakai angka tabular**. Tapi repo ini **tidak punya tabel angka yang lebar** — angka muncul sebagai skor tunggal dan tanggal, bukan kolom. Jadi `tabular-nums` **tidak** relevan di sini. Lihat §8 poin 4.

---

## 6. Yang Bertentangan dengan DESIGN.md atau ADR-0001

ADR-0001 memutuskan: komponen UI kustom, `cn()` sebagai primitif, **tanpa** CLI shadcn, Radix hanya disalin modular bila perlu WAI-ARIA kompleks, `@keyframes` native alih-alih library animasi.

| Sumber | Klaim | Penilaian |
| :--- | :--- | :--- |
| **WCAG 1.4.11 pada batas input** (§5.5) | Batas kontrol aktif harus ≥3:1; `--color-border #e2e8f0` = 1.23:1 | ⚠️ **Benturan dengan DESIGN.md, bukan ADR.** DESIGN.md §Colors: *"Border — slate 200, semua garis pemisah."* Satu token untuk dua tugas (pemisah kartu **dan** batas input) tidak bisa memenuhi 1.4.11. Perlu token baru `--color-border-control`. Itu perubahan DESIGN.md, jadi **butuh keputusan pemilik desain**, bukan pilihan implementasi. |
| **WCAG ambang 4.5:1 pada `rose-600`** (§5.1) | `text-rose-600` gagal | ⚠️ **Benturan dengan DESIGN.md.** DESIGN.md §Colors: *"Danger — rose 600. Hanya untuk jawaban salah, error, dan aksi merusak."* Token `--color-danger` di `index.css:29` **sudah** `#ec003f` = 4.53:1 dan **lulus** — tapi kode memakai `rose-600` langsung (12×) alih-alih `text-danger`, jadi nilainya **nyaris** sama dan **sama-sama di bawah 4.5:1 saat di atas `rose-50`**. Perbaikan yang benar: pakai `text-danger`/`text-rose-700`, dan jika DESIGN.md menginginkan rose-600, maka **latar** panel error harus putih, bukan `rose-50`. Perlu keputusan. |
| **WCAG 2.5.8 24×24** (§5.4) | 52 tombol di bawah ambang | ✅ **Tidak bertentangan.** DESIGN.md sudah menetapkan kepadatan berbeda per peran: *"Siswa (mengerjakan) — lapang, satu tugas per layar, target sentuh besar"*. 2.5.8 **menegakkan** apa yang DESIGN.md sudah niatkan. Yang gagal adalah implementasi di `ViewPage.tsx`, bukan kontraknya. |
| **`:focus-visible` (§5.2)** | Ganti `focus:` → `focus-visible:` | ✅ **Sejalan.** DESIGN.md §Do: *"Sediakan `:focus-visible` yang terlihat jelas pada semua elemen interaktif."* Jadi ini **kegagalan memenuhi DESIGN.md sendiri**, bukan aturan baru dari luar. |
| **`lang="de"` (§3.10)** | `die Tage`/`die Nummer` tanpa `lang` | ✅ **Sejalan.** DESIGN.md §Do: *"Tandai teks Jerman dengan `lang="de"`."* Juga kegagalan memenuhi kontrak sendiri. |
| **axe-core sebagai devDependency** (§3.9) | Linter aksesibilitas | ✅ **Sejalan dengan ADR-0001.** Ini *tool*, bukan komponen UI atau library runtime — `npx axe`/`vitest-axe` tidak mengubah `src/`, tidak menggantikan `cn()`, tidak menyentuh pohon komponen. Tekanan yang sama dengan `npx @google/design.md lint` yang sudah diterima di riset sebelumnya. Tapi **tidak diusulkan sekarang** (larangan instalasi). |
| **Google Fonts / `font-display: swap`** (web.dev font guidance) | Pertimbangan FOUT | ✅ **Tidak relevan.** DESIGN.md: *"Satu keluarga huruf untuk seluruh aplikasi"* = `system-ui`. Nol webfont = nol FOUT. **Jangan** tambahkan webfont untuk "memperbaiki" tipografi; itu melanggar DESIGN.md dan menciptakan beban baru. |
| **Material 3 / Apple HIG (44pt/48dp)** | Ambang target lebih besar dari 24 | ⚠️ **Tidak bertentangan, tapi tidak dipakai** karena tidak bisa dikutip (§4.2). Jika kelak dipakai, itu keputusan desain untuk *siswa di HP* saja, bukan untuk dashboard guru yang DESIGN.md nyatakan padat. |

**Kesimpulan §6:** tidak ada rekomendasi yang melanggar ADR-0001. Dua hal berstatus **benturan dengan DESIGN.md** dan keduanya butuh keputusan pemilik desain, bukan implementasi buta: (a) border input butuh token terpisah, (b) rose-600 di atas rose-50 butuh memilih antara menggelapkan teks atau menerangkan latar.

---

## 7. Rekomendasi Bertahap

ADR-0002 menjadwalkan **Fase 3: Refaktor Komponen Antarmuka**. Refaktor itu **sudah terjadi** (`f4b35ec`, `ceee182`). Rekomendasi di bawah mengikuti kenyataan itu: sebagian besar Tahap 0 lama **sudah selesai** dan tidak perlu dijadwalkan lagi.

### Tahap 0 — Sekarang, nol risiko visual (≤1 jam)

Empat perbaikan mekanis yang tidak mengubah satu piksel pun secara sengaja, dan semuanya bisa di-review dalam satu duduk.

1. **`lang="de"` pada 4 tempat yang bocor.** `DayPage.tsx:70`, `NumberPage.tsx:79`, `GrundlagenPage.tsx:370,383`. Empat atribut. Menutup 3.1.2 dan memenuhi DESIGN.md.
2. **`text-rose-600` → `text-rose-700`** (12 tempat). 4.12:1 → 5.81:1.
3. **`text-emerald-600` → `text-emerald-700`** (11 tempat). 3.65:1 → 5.09:1/5.09:1.
4. **Perbarui `docs/ui-checklist.md`** dengan angka HEAD `41fef8e`: 10 baris di §5.6 sudah berubah status, dan tambahkan §5 "Aksesibilitas & interaksi" baru. Itu **deliverable wajib** dokumen ini.

**Jangan di Tahap 0:** menyentuh `text-slate-400` (91 kemunculan, perlu triase ikon vs teks), `--color-border` (keputusan desain), radius, atau pemasangan alat.

### Tahap 1 — Aksesibilitas form (1 duduk, ~23 pasangan `id`/`htmlFor`)

Grep jadi alat yang berguna **hanya setelah** ini dikerjakan, karena `grep -c htmlFor` akan mulai memberi angka bermakna.

1. **23 pasang `id`+`htmlFor`** untuk 10 `<label>` lepas (§5.3). Ini satu perubahan per form: `LoginPage`, `GeneratorPage` (6 label), `KeyManagerModal`, `ScenarioQuiz`, `ComprehensionQuiz`, `SpellingTrainer`, `GrammarPanel`, `GrammarTopicPicker`.
2. **`aria-label`** untuk 3 input yang hanya punya placeholder: `AlphabetPage.tsx:205`, `GrundlagenPage.tsx:391`, `HomePage.tsx:102`; dan untuk 5 `<select>` tanpa label: `AlphabetPage.tsx:118`, `DayPage.tsx:77`, `HomePage.tsx:109`, `GrundlagenPage.tsx:398`, `DashboardLayout.tsx:145`.
3. **`aria-label`** untuk tombol ikon yang hanya `title=`: `HomePage.tsx:175,186,197,208`, `SpellingTrainer.tsx:314`, `ViewPage.tsx:831`, `GeneratorPage.tsx:660,671`.

**Verifikasi setelahnya:** `grep -c htmlFor` ≥ 23, dan skrip nama-aksesibel: `37 → 0`.

### Tahap 1b — Fokus (keputusan kecil dulu, lalu mekanis)

Sebelum menyentuh 142 tombol, **putuskan satu hal**: apakah repo menerima ring fokus bawaan browser untuk tombol, atau mau indikator sendiri. DESIGN.md §Do bilang "`:focus-visible` yang terlihat jelas", jadi jawabannya yang kedua. Setelah itu:

1. Satu aturan global di `index.css` lebih murah daripada 142 perubahan per-tombol:
   ```css
   @layer base {
     button:focus-visible,
     select:focus-visible,
     a:focus-visible,
     [tabindex]:focus-visible {
       outline: 2px solid var(--color-primary);
       outline-offset: 2px;
     }
     input:focus-visible, textarea:focus-visible {
       outline: 2px solid var(--color-primary);
       outline-offset: 0;
     }
   }
   ```
   Satu blok menutup 142 tombol, 5 `<select>` yang belum punya `focus:`, dan semua `[tabindex]`.
2. **`focus:` → `focus-visible:`** untuk 36 `focus:outline-none` dan 57 `focus:ring*`, atau biarkan `focus:` jika aturan (1) sudah memberi outline yang tidak bisa dimatikan. **Jangan** `outline: none` tanpa outline pengganti.

### Tahap 2 — Fokus keyboard (mekanis, 15 berkas)

1. **`focus:` → `focus-visible:`** untuk indikator ring di 57 tempat. Ini menghapus alasan historis `focus:outline-none`.
2. **Hapus `focus:outline-none`** dari 36 tempat setelah (1) — atau ubah ke `focus-visible:outline-none` **hanya** jika ditemani ring.
3. **Tambah fokus pada 3 tombol ikon `HomePage`** yang sekarang tanpa `focus:` sama sekali.

**Verifikasi:** ada blok `:focus-visible` di `index.css` (`grep -c 'focus-visible' src/client/index.css` ≥ 1), dan di halaman mana pun Tab menampilkan ring pada tombol, `<select>`, dan input. Yang kedua butuh browser — tidak bisa dibuktikan dengan grep.

### Tahap 3 — Butuh keputusan desain, jangan dikerjakan tanpa itu

| Pekerjaan | Kenapa butuh keputusan |
| :--- | :--- |
| Token `--color-border-control` untuk batas input | Mengubah DESIGN.md §Colors. Lihat §6. |
| `text-slate-400` triase 91 kemunculan | Setengahnya ikon dekoratif (ada `aria-hidden="true"`); menaikkan semuanya akan menghilangkan hierarki visual. |
| `--color-warning` digelapkan | DESIGN.md bilang warning = amber; menentukan nuansa amber = keputusan desain. |
| Target 24×24 pada 52 tombol | Pengecualian *Spacing*/*Inline* berarti sebagian **sudah** lolos. Menyapu semua akan menggemukkan dashboard guru yang DESIGN.md nyatakan padat. |

### Tahap 4 — Alat, jika dan hanya jika diizinkan memasang

`axe-core` (lewat `vitest-axe` atau `@axe-core/cli`) di CI akan menangkap `label`, `select-name`, `color-contrast`, `target-size` (§3.9) — empat kategori yang di dokumen ini **hanya** bisa dihitung dengan grep dan skrip sekali-pakai. **Tidak** akan menangkap 2.4.7, 2.4.11, 3.1.2 per-elemen, atau kualitas copy.

### Yang dilewati, dengan alasan

| Dilewati | Alasan |
| :--- | :--- |
| Core Web Vitals (LCP/INP/CLS) sebagai gate | Tidak terukur tanpa Lighthouse; 3 penyebab utama CLS/FOUT (gambar, iframe, webfont) **tidak ada** di repo (§3.8). |
| `touch-action`, `overscroll-behavior` | Default browser sudah benar; tidak ada gesture kustom. Menambahkannya = kode mati (§3.7). |
| `:user-invalid` | Repo memvalidasi di JS, bukan constraint validation native (§3.7). |
| `prefers-color-scheme` / dark mode | Tidak ada dark mode, tidak diminta. |
| `tabular-nums` | Tidak ada kolom angka yang lebar — skor tunggal dan tanggal (§5.7). |
| Target 44pt/48dp dari HIG/Material | Tidak bisa dikutip (§4.2). Ambang mengikatnya 24×24. |
| NN/g | Tidak menghasilkan aturan checkable baru di luar WCAG 3.3.x (§4.3). |

---

## 8. Yang Tidak Terbukti

Daftar klaim yang **tidak** berhasil saya buktikan, agar tidak terbaca sebagai kepastian.

1. **Tidak ada satu pun perbaikan yang diuji di browser.** Semua status adalah analisis statis, sama seperti `ui-checklist.md` §5. Khususnya: ring fokus 3.76:1 (§5.2) adalah perhitungan, bukan hasil render — antialias dan `ring-offset` bisa mengubah persepsi.
2. **Kontras dihitung dengan konversi OKLCH→sRGB, bukan dengan alat ukur.** Hasilnya bisa berbeda **±0.02** dari WebAIM Contrast Checker atau axe. Yang paling rawan: `rose-600 #ec003f` di atas `rose-50` = **4.12:1**. Itu 0.38 di bawah ambang — cukup jauh sehingga pembulatan tidak akan menyelamatkannya. Tapi `danger #ec003f` di atas putih = **4.53:1** hanya 0.03 di atas ambang; **perbedaan pembulatan bisa membalik kesimpulan itu**. Jangan menyatakan `text-danger` di atas putih lulus/gagal tanpa alat.
3. **52 tombol "di bawah 24px" adalah perkiraan, bukan ukuran.** Saya menghitung dari kelas padding Tailwind (`p-1` = 4px, `p-1.5` = 6px) + tinggi baris teks. Font sistem, `line-height` dari token (`body` = 1.6, `label` = 1.4), dan `border` menambah tinggi. Angka 52 adalah **batas atas kandidat**; sebagian memenuhi pengecualian *Spacing* WCAG 2.5.8 dan **tidak** melanggar. "22×22px" untuk `ViewPage.tsx:683` juga perkiraan.
4. **"`tabular-nums` tidak relevan" adalah keputusan, bukan pengukuran.** Saya hitung **0** kemunculan, tapi saya **tidak** membuka semua layar analitik untuk memastikan tidak ada tabel angka yang butuh. `SubmissionAnalyticsModal.tsx` punya 663+ baris dan saya tidak membaca setiap render.
5. **Nama aksesibel "37 dari 39" adalah hasil skrip saya, bukan axe.** Skrip itu memeriksa `aria-label`/`aria-labelledby`/`id=` di tag dan `<label>` yang belum ditutup di 900 byte sebelumnya. Ia **bisa** salah: (a) `<label>` yang ditutup lalu `<input>` di *sibling* akan terhitung "membungkus" padahal tidak; (b) kontrol yang dirender dari map tanpa `id` literal. Saya sudah memverifikasi manual 5 sampel (`LoginPage.tsx:66/73`, `KeyManagerModal.tsx:274/277`, `ScenarioQuiz.tsx:739/743`, `GeneratorPage.tsx:409/410`, `GrammarTopicPicker.tsx:86/93`) dan kelimanya konsisten dengan hasil skrip. Tapi **axe-core belum dijalankan**, jadi angka riil bisa berbeda.
6. **`DashboardLayout` drawer tanpa `inert`/focus trap: saya tidak membuktikan Tab bisa keluar.** Saya hanya membaca bahwa `mobileDrawerOpen` merender `<div class="fixed … z-50">` tanpa `inert`, `aria-hidden`, atau `role="dialog"`, dan backdrop z-40 hanya `onClick`. Bahwa fokus Tab bisa lolos ke konten di baliknya adalah **inferensi dari markup**, bukan tes keyboard. Butuh satu kali uji Tab.
7. **Angka WebAIM hanya untuk *home page*.** 1.000.000 halaman beranda, bukan aplikasi berformulir. "83.9% halaman punya kontras rendah" **tidak** berarti "repo ini pasti punya masalah kontras" — repo ini punya hitungan sendiri di §5.1. Kutipan itu dipakai untuk prioritas, bukan diagnosis.
8. **Tahun WebAIM.** Laporan berjudul "2026" dengan data Februari 2026 dan perbandingan 2019–2025. Saya menganggapnya laporan terbaru yang ada; saya **tidak** memverifikasi apakah ada laporan yang lebih baru di path lain.
9. **WCAG 2.2 Understanding halaman bersifat informatif, bukan normatif.** Halamannya sendiri menyatakan *"Informative explanations, not required to meet WCAG"*. Jadi persentase dan ambang angka di §3.2 saya anggap **sama** dengan §3.1 karena teksnya identik, dan saya sudah mengecek tiga ambang kunci (`4.5:1`, `24 by 24 CSS pixels`, `not entirely hidden due to author-created content`) pada **keduanya**.
10. **`<html lang="en">` yang dicatat riset sebelumnya sudah tidak ada.** Pada HEAD `41fef8e`, `index.html:2` = `<html lang="id">`. Riset sebelumnya (`research-design-rules-sources.md` §1 poin 6 dan §5.1) mencatat `lang="en"` — **itu sudah usang** dan tidak boleh dijadikan dasar pekerjaan.
11. **`transition-all` masih 84.** Turun dari 101, tapi belum 0. Tidak masuk tabel §5 karena sudah tercatat di riset sebelumnya (§5.2, "sudah ada"). Disebut di sini agar angkanya tidak hilang.
12. **Tidak ada kutipan Apple HIG atau Material 3 di dokumen ini.** Angka 44pt dan 48dp **tidak** terverifikasi. Jika nanti ada yang mengutipnya dari dokumen ini, itu kesalahan.

---

## 9. Rujukan Sumber Primer (semua sudah diambil, semua HTTP 200)

**Normatif & semantik:**
- https://www.w3.org/TR/WCAG22/ — spesifikasi normatif, 512.457 B.
- https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html — 1.4.3, ambang 4.5:1.
- https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html — 1.4.11, ambang 3:1.
- https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html — 2.4.7, tanggung jawab penulis.
- https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html — 2.4.11.
- https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions.html — 3.3.2.
- https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html — 3.3.1, "The error must be indicated in text."
- https://www.w3.org/WAI/WCAG22/Understanding/error-suggestion.html — 3.3.3.
- https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html — 2.5.8, 24×24 CSS px + 5 pengecualian.
- https://www.w3.org/WAI/WCAG22/Understanding/info-and-relationships.html — 1.3.1.
- https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html — 4.1.2.
- https://www.w3.org/WAI/WCAG22/Understanding/language-of-parts.html — 3.1.2.

**Data lapangan:**
- https://webaim.org/articles/contrast/ — 18pt/24px, "You cannot round a contrast ratio up to 4.5:1."
- https://webaim.org/projects/million/ — laporan 2026, data Februari 2026, 83.9% kontras, 52.8% label.

**Referensi platform:**
- https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible — Baseline sejak Maret 2022.
- https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion — definisi `reduce`.
- https://developer.mozilla.org/en-US/docs/Web/CSS/env — `env(safe-area-inset-*)`.
- https://developer.mozilla.org/en-US/docs/Web/HTML/Guides/Viewport_meta_element — `viewport-fit=cover` + peringatan inset.
- https://developer.mozilla.org/en-US/docs/Web/CSS/length — `vh` ≡ `lvh`, definisi `dvh`/`svh`.
- https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action — default browser pan/pinch.
- https://developer.mozilla.org/en-US/docs/Web/CSS/overscroll-behavior
- https://developer.mozilla.org/en-US/docs/Web/CSS/:user-invalid
- https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-color-scheme — diperiksa, tidak dipakai.
- https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/lang — BCP 47, peringatan bahasa tak dikenal.

**Performa:**
- https://web.dev/articles/vitals — LCP 2.5 s, INP 200 ms, CLS 0.1, persentil 75.
- https://web.dev/articles/cls — "Good CLS values are 0.1 or less. Poor values are greater than 0.25."

**Alat & batas alat:**
- https://dequeuniversity.com/rules/axe/4.10 — deskripsi + tag WCAG per rule; `heading-order` = best-practice, bukan WCAG.

**Kontra-verifikasi (404):**
- https://developer.mozilla.org/en-US/docs/Web/CSS/prefers-reduced-motion — **404**.
- https://developer.mozilla.org/en-US/docs/Web/CSS/reduced-motion — **404**.
