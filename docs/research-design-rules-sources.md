# Riset Teknis: Sumber Aturan Desain yang Dapat Diverifikasi untuk Persiapan Refaktor Desain

**Tanggal Dokumen:** Oktober 2026
**Target Repository:** DeutschEasier (`Vite 6`, `React 18.3.1`, `TypeScript 5.7`, `Tailwind CSS 4` via `@tailwindcss/vite`, Hono, Drizzle + Postgres)
**Penulis:** Research Subagent (Technical Research)
**Terkait:** [`docs/ui-checklist.md`](ui-checklist.md), [`docs/adr/0001-tailwind-v4-and-component-strategy.md`](adr/0001-tailwind-v4-and-component-strategy.md), [`docs/adr/0002-migration-and-refactor-sequencing.md`](adr/0002-migration-and-refactor-sequencing.md)

---

## 1. Ringkasan Eksekutif

1. **Hanya 6 dari 10 kandidat terbukti nyata dan relevan.** Yang mati: `vercel/design`, `sindresorhus/awesome-design`, dan `raunofreiberg/ui-playbook` sebagai sumber aturan (arsip WIP sejak Januari 2023). `badlogic/pi-skills` nyata tapi **nol skill desain** — isinya `brave-search`, `browser-tools`, `gccli`, `gdcli`, `gmcli`, `transcribe`, `vscode`, `youtube-transcript`.
2. **Temuan terpenting yang belum pernah dilihat repo ini: [`google-labs-code/design.md`](https://github.com/google-labs-code/design.md) (28.497 bintang, Apache-2.0).** Ini **spesifikasi format + linter yang benar-benar dieksekusi**, bukan prosa. `npx @google/design.md lint` memvalidasi token, referensi silang, dan **kontras WCAG AA**. Ada ekspor `css-tailwind` yang menghasilkan blok `@theme { }` **Tailwind v4** — cocok persis dengan stack repo. Ini satu-satunya kandidat yang mengubah "design.md" dari dokumen mati menjadi artefak yang di-gate di CI.
3. **`frontend-design` di [`anthropics/skills`](https://github.com/anthropics/skills) nyata dan sangat spesifik**, tapi bentuknya larangan bergaya (anti-slop), bukan aturan terukur. Berguna sebagai *review lens*, bukan checklist grep. Verdict: **ADAPT sebagian**.
4. **`break-ui` (dari `emilkowalski/skills`) adalah kandidat terbaik kedua.** Tabel *failure signatures*-nya (flex-shrink avatar, `min-width: 0`, `overflow-wrap: anywhere`, `tabular-nums`, `Intl.PluralRules`, `lang="de"`) semuanya bisa diperiksa dengan membaca kode. Ini mengisi lubang yang `ui-checklist.md` §4 akui belum tercakup: "Tampilan visual — hierarki, spasi".
5. **Aturan kontras bukan sekadar saran.** Repo punya **78 nilai font-size arbitrer** (`text-[9px]` 2×, `text-[10px]` 10×, `text-[11px]` 66×) melawan hanya 11 `text-base`. Artinya skala tipografi **tidak ada**; ini temuan token drift, bukan temuan visual.
6. **`docs/ui-checklist.md` menutupi seluler; tidak satupun menutupi form, kontras, dan semantik.** Repo punya 30 `<input|textarea|select>` dan **0** `aria-invalid`, **0** `aria-describedby`, **0** `role="alert"`/`aria-live`. `text-red-*` muncul 13× sebagai pesan error — teks error yang tidak pernah diumumkan ke screen reader. `index.html:2` juga `<html lang="en">` padahal UI berbahasa Indonesia.
7. **Tidak ada kandidat yang memaksa menambah dependency.** ADR-0001 tidak dilanggar oleh apapun yang direkomendasikan di sini. Satu-satunya gesekan adalah `pick-ui-library` yang merekomendasikan `base-ui`/`cva`/`recharts` — **ditandai sebagai konflik**, lihat §6.
8. **Rekomendasi bertahap:** (a) sekarang, ~1 jam: audit form aksesibilitas + `lang` + token drift → jadikan bagian baru `ui-checklist.md`; (b) saat refaktor: tetapkan token desain lewat `DESIGN.md` + linter di CI; (c) lewati: `design.md` brand templates (123k bintang, isinya identitas brand lain), Material 3, dan seluruh skill animasi.

---

## 2. Metode

**Penemuan kandidat.** Tiga jalur, tanpa satu pun mengandalkan snippet hasil mesin pencari:

1. Daftar dari tugas (10 kandidat) — diperiksa satu per satu.
2. `/git/trees/main?recursive=1` pada repo yang sudah terbukti nyata (`emilkowalski/skills`, `anthropics/skills`, `badlogic/pi-skills`, `google-labs-code/design.md`) untuk melihat **seluruh** isi, bukan hanya berkas yang disebut di deskripsi.
3. `api.github.com/search/repositories` untuk `design.md in:name` (menemukan `google-labs-code/design.md` dan `VoltAgent/awesome-design-md`) dan `design guidelines "SKILL.md"` (4 hasil, semuanya tidak relevan).

**Verifikasi.** Setiap klaim repo bersandar pada satu atau lebih dari:
- `https://api.github.com/repos/<owner>/<repo>` — bintang, fork, lisensi, `created_at`, `pushed_at`.
- `https://api.github.com/repos/<owner>/<repo>/git/trees/<branch>?recursive=1` — daftar berkas + ukuran byte. Semua pohon yang dikutip mengembalikan `"truncated": false`.
- `https://raw.githubusercontent.com/...` — isi berkas asli. Semua kutipan di dokumen ini adalah byte dari raw, bukan rekonstruksi.

**Batasan pengukuran.** Rate limit GitHub (60/jam, tanpa token) sempat habis; 31 permintaan tersisa dipakai untuk metadata yang tidak bisa didapat dari `raw`. Halaman `m3.material.io` merender lewat JavaScript sehingga **tidak bisa dikutip** (lihat §8). Halaman `developer.apple.com/design/human-interface-guidelines` **bisa** diambil tapi bergantung pada JavaScript untuk isi — hanya kerangka yang terbaca.

**Pengukuran repo.** Semua angka "kondisi repo" di §5 dihitung dengan `grep` atas `src/client/**/*.tsx` dan `index.html` pada commit saat dokumen ini ditulis. Perintah verifikasi ada di §5.7.

**Konvensi status.** Mengikuti `docs/ui-checklist.md`: ✅ bersih, ❌ melanggar, ⚠️ perlu dicek. Status di sini adalah **hasil pengukuran statis**, bukan hasil uji perangkat.

---

## 3. Kandidat yang Terverifikasi

### 3.1. `google-labs-code/design.md` — ⭐ 28.497

| Field | Nilai |
| :--- | :--- |
| URL | https://github.com/google-labs-code/design.md |
| Bintang / Fork | 28.497 / 2.256 |
| Lisensi | `Apache-2.0` |
| Dibuat / Push terakhir | 2026-04-10 / 2026-10-16 |
| Verifikasi | `api.github.com/repos/google-labs-code/design.md`, `.../git/trees/main?recursive=1`, `raw.githubusercontent.com/.../docs/spec.md` |

**Bentuk.** Format dokumen (`DESIGN.md`) + **linter CLI yang dieksekusi** (`packages/cli/`). 11 aturan lint, semuanya bertingkat (`error`/`warning`), semuanya punya berkas `.test.ts` yang menyertainya — mis. `packages/cli/src/linter/linter/rules/contrast-ratio.test.ts`. Ada juga `export --format css-tailwind` yang menghasilkan blok `@theme { ... }` Tailwind v4.

**Checkable?** **Ya — paling checkable dari semua kandidat.** Ini satu-satunya yang punya kode yang menjalankan aturannya. `packages/cli/src/linter/linter/rules/contrast-ratio.ts` menyimpan `const WCAG_AA_MINIMUM = 4.5;` dan mengeluarkan temuan bila pasangan `backgroundColor`/`textColor` di bawahnya.

**Kutipan verbatim:**

Format bersifat normatif pada token, naratif pada prosa
> `docs/spec.md`: "A DESIGN.md file contains two parts: human-readable markdown prose and machine-readable YAML design tokens. […] The tokens are the normative values; the prose provides context for how to apply them."

Urutan seksi wajib
> `docs/spec.md` §Section Order: "1. **Overview** (also: "Brand & Style") 2. **Colors** 3. **Typography** 4. **Layout** (also: "Layout & Spacing") 5. **Elevation & Depth** (also: "Elevation") 6. **Shapes** 7. **Components** 8. **Do's and Don'ts**"

Daftar Do/Don'ts yang diusulkan spec (contoh, bukan wajib)
> `docs/spec.md` §Do's and Don'ts:
> ```
> - Do use the primary color only for the single most important action per screen
> - Don't mix rounded and sharp corners in the same view
> - Do maintain WCAG AA contrast ratios (4.5:1 for normal text)
> - Don't use more than two font weights on a single screen
> ```

Perilaku wajib pada konten ganda
> `docs/spec.md` §Consumer Behavior for Unknown Content: "| Duplicate section heading | Error; reject the file | Two `## Colors` headings |"

**Relevansi untuk DeutschEasier.** Tinggi, dan **spesifik ke stack**. Repo sudah punya `@theme inline { --color-background; --color-foreground }` di `src/client/index.css:19-22` — itu sudah benih token system, tapi hanya 2 token untuk seluruh aplikasi. Warna sebenarnya dipakai lewat kelas literal (`bg-slate-50` 50×, `bg-slate-100` 50×, `border-slate-200` 91×, `border-slate-300` 31×, `text-slate-500` 85×, `text-slate-600` 57×) — lima tingkat abu-abu yang berdekatan tanpa hierarki yang dinyatakan. `DESIGN.md` memaksa hierarki itu ditulis **dan** di-lint, dan ekspornya masuk ke `@theme` v4 tanpa runtime baru.

**Verdict: ADOPT (sebagian) — untuk fase refaktor, bukan sekarang.** Tulis `DESIGN.md` kecil (Colors, Typography, Layout, Shapes, Components, Do's/Don'ts), jalankan `npx @google/design.md lint` di CI. Jangan pakai contoh `examples/` — isinya identitas brand fiktif.

---

### 3.2. `emilkowalski/skills` — ⭐ 48.955 (sisa yang belum ditambang)

| Field | Nilai |
| :--- | :--- |
| URL | https://github.com/emilkowalski/skills |
| Bintang / Fork | 48.955 / 2.833 |
| Lisensi | `MIT` |
| Dibuat / Push terakhir | 2026-03-16 / 2026-10-11 |
| Verifikasi | `api.github.com/repos/emilkowalski/skills`, `.../git/trees/main?recursive=1`, raw `skills/*/SKILL.md` |

`mobile-native` dan `apple-design` sudah dibahas di `docs/ui-checklist.md` dan `docs/research-apple-design-skill-emil-kowalski.md`. Berikut penilaian **15 skill yang tersisa** terhadap aplikasi berbasis form (bukan gesture):

| Skill | Ukuran | Relevan? | Alasan |
| :--- | ---: | :--- | :--- |
| `break-ui` | 14.380 B (+`CATALOG.md` 8.268 B) | **Ya — terbaik** | Uji data terburuk; semua perbaikan berupaya CSS/lint yang bisa di-grep |
| `emil-design-eng` | 27.123 B | **Sebagian** | Tabel *Review Checklist* 11 baris, beberapa bisa di-grep langsung |
| `pick-ui-library` | 4.790 B | Marginal | Katalog pustaka; bertabrakan dengan ADR-0001 (§6) |
| `find-animation-opportunities` | 9.808 B | Tidak | Mencari yang *belum* beranimasi; repo tidak butuh lebih banyak animasi |
| `improve-animations` / `review-animations` | 8.208 / 8.407 B | Tidak | Audit motion; repo punya 2 keyframe total |
| `animate`, `animation-performance`, `animation-vocabulary`, `animate-expo` | 11.860–17.891 B | Tidak | Tanpa dependency animasi; ADR-0001 poin 4 sudah memilih CSS native |
| `apple-design` | 23.036 B | Tidak (sudah diputuskan) | Verdict MARGINAL di riset sebelumnya |
| `prototype` | 7.830 B | Marginal | Membutuhkan dev server + picker; berguna sekali saat refaktor besar |
| `ask-sonner` | 7.233 B | Tidak | Tidak memakai Sonner |
| `write-swift` | 42.445 B | Tidak | Swift |

Skill tambahan: `review-animations/STANDARDS.md` (9.801 B), `improve-animations/AUDIT.md` (7.387 B), `improve-animations/PLAN-TEMPLATE.md` (3.100 B), `prototype/PICKER.md` (7.548 B), `break-ui/CATALOG.md` (8.268 B), `ask-sonner/API.md` (4.545 B), `animate/RECIPES.md` (7.957 B), `animate-expo/RECIPES.md` (16.808 B).

**Checkable? `break-ui`: ya, tinggi.** Setiap baris tabel *failure signatures* memetakan gejala visual → penyebab CSS → perbaikan, dan gejalanya bisa dicari di kode.

Kutipan verbatim (`skills/break-ui/SKILL.md`):

> "| Text overflows its box instead of wrapping or truncating | Flex/grid child has `min-width: auto` | `min-width: 0` on the text column (`minmax(0, 1fr)` in grid) |"

> "| Numbers jitter when they update, columns misalign | Proportional figures | `font-variant-numeric: tabular-nums` |"

> "| `1284`, `1,284.000000001`, `NaN`, `undefined` | Raw number rendered | `Intl.NumberFormat` with the user's locale; guard null |"

Juga keputusan per-field yang eksplisit dan bisa ditinjau:
> "**Truncate in the middle** when items differ at the *end*: file names (`Q3-report…v12-final.pdf`), emails sharing a long domain, paths, hashes. End-truncation makes them identical."

Dan aturan data terburuk yang sudah menyiapkan kasus Jerman:
> `skills/break-ui/CATALOG.md`: "| `Benachrichtigungseinstellungen` | German compound (30 chars, no spaces); label overflow, unbreakable |"

**`emil-design-eng` — tabel Review Checklist (verbatim, 11 baris):**

> "| `transition: all` | Specify exact properties: `transition: transform 200ms ease-out` |
> | `scale(0)` entry animation | Start from `scale(0.95)` with `opacity: 0` |
> | `ease-in` on UI element | Switch to `ease-out` or custom curve |
> | Duration > 300ms on UI element | Reduce to 150-250ms |
> | Hover animation without media query | Add `@media (hover: hover) and (pointer: fine)` |"

**Relevansi untuk DeutschEasier.** `break-ui` tinggi: form nama siswa, kunci akses, label kategori kata — semuanya menampilkan data yang bisa panjang. `transition-all` **101 kemunculan** dan semuanya kandidat `transition-all` → properti eksplisit (perilaku yang sama, biaya lebih rendah). `emil-design-eng` sebagian: `prefers-reduced-motion` dan gate `hover` sudah tercatat di `ui-checklist.md` (jangan diduplikasi), tapi baris `transition: all` tidak.

**Verdict: ADAPT `break-ui` (fixture + tabel), ADAPT 2 baris `emil-design-eng`.** SKIP 11 skill lainnya.

---

### 3.3. `anthropics/skills` → `skills/frontend-design` — ⭐ 183.216

| Field | Nilai |
| :--- | :--- |
| URL | https://github.com/anthropics/skills |
| Bintang / Fork | 183.216 / 21.694 |
| Lisensi | Tidak ada `LICENSE` di repo root (`spdx_id: null`); skill individual membawa `LICENSE.txt` sendiri — `frontend-design/LICENSE.txt` = 10.174 B, `brand-guidelines/LICENSE.txt` = Apache-2.0 |
| Dibuat / Push terakhir | 2025-09-22 / 2026-10-09 |
| Verifikasi | `api.github.com/repos/anthropics/skills`, `.../git/trees/main?recursive=1`, raw `skills/frontend-design/SKILL.md` (9.390 B, 71 baris) |

**Bentuk.** `SKILL.md` tunggal, tanpa referensi tambahan. Bukan checklist — ini perintah peran ("design lead di studio").

**Checkable? Sebagian.** Daftar anti-pattern-nya sangat spesifik dan bisa dicari di kode (mis. eyebrow ALL-CAPS, `→` di label tombol, radius seragam). Tapi aturan utamanya ("jangan terasa templated") butuh penilaian manusia.

**Kutipan verbatim:**

Anti-pattern yang bisa dicari:
> "Avoid these default typographic treatments; they are the commonest tells of a generated page:
> - Accenting just a single word or phrase in a headline, like putting one word in italic/bold or a different color.
> - Using all caps for labels.
> - Adding unnecessary typographic labels above content."

Radius seragam — ini **persis** kondisi repo:
> "4. the SaaS-card kit: content chopped into identical rounded cards, one border-radius on everything regardless of hierarchy, the same soft grey shadow (rgba(0,0,0,.1)) under each, and gradient washes as decoration;"

Lantai kualitas aksesibilitas (dinyatakan sebagai syarat, bukan aspirasi):
> "Build to a quality floor without announcing it: responsive down to mobile, visible keyboard focus, reduced motion respected, visually accessible, harmonious color palettes."

Copywriting yang bisa ditinjau:
> "Use active voice as default. A CTA says exactly what happens when it is used: 'Save changes,' not 'Submit.' An action keeps the same name through the whole flow, so the button that says 'Publish' produces a toast that says 'Published.'"

> "Errors don't apologize, and they are never vague about what happened. An empty screen is an invitation to act."

**Relevansi.** Tinggi untuk dua hal spesifik:
- **Radius.** Repo memakai **6 tingkat** radius: `rounded-md` 6×, `rounded-lg` 68×, `rounded-xl` 103×, `rounded-2xl` 59×, `rounded-3xl` 12×, `rounded-full` 72×. Ini tepat gejala "one border-radius on everything" — hanya saja reponya memakai enam, bukan satu. Hierarki radius tidak dinyatakan di mana pun.
- **Eyebrow ALL-CAPS.** `LoginPage.tsx:65` memakai `uppercase tracking-wider` untuk label field — kombinasi yang frontend-design sebut sebagai tell.

**Yang harus diabaikan.** Seluruh bagian "Ground your designs in the subject matter" dan "Process: plan, review against the brief, build, critique" dirancang untuk membangun halaman dari nol (hero, palette, typeface baru). DeutschEasier adalah aplikasi operasional dengan identitas yang sudah ada — mengganti typeface/palette bukan tujuan refaktor.

**Verdict: ADAPT — ambil 3 bagian saja** (anti-pattern tipografi, hierarki radius, nada copy error/empty). SKIP sisanya. Catatan lisensi: skill individual berlisensi, tapi repo root tidak punya `LICENSE` — jangan vendor tanpa membaca `frontend-design/LICENSE.txt`.

---

### 3.4. `shadcn-ui/ui` + Vercel Geist — sumber aturan, bukan komponen

| Field | Nilai |
| :--- | :--- |
| URL | https://github.com/shadcn-ui/ui · https://vercel.com/geist/introduction |
| Bintang / Fork | 126.319 / 8.622 (shadcn) |
| Lisensi | `MIT` (shadcn) · Geist: dokumentasi situs, tanpa lisensi repo |
| Push terakhir | 2026-10-23 (shadcn) · Geist: halaman hidup, tidak dapat tanggal |
| Verifikasi | `api.github.com/repos/shadcn-ui/ui`, raw `apps/v4/content/docs/(root)/index.mdx` (HTTP 200), `vercel.com/geist/colors` (HTTP 200, 206 KB) |

**Bentuk.** shadcn: dokumentasi situs + kode yang **disalin** (bukan dependency). Geist: dokumentasi sistem desain Vercel dengan pasangan **Do / Avoid** eksplisit.

**Checkable?** Geist: **ya, dan sangat ringkas** — setiap pasangan Do/Avoid adalah satu aturan CSS yang bisa diperiksa.
shadcn: **tidak**, karena dokumentasi utamanya adalah "filosofi" (kepemilikan kode), bukan aturan visual.

**Kutipan verbatim dari `vercel.com/geist/colors`:**

> "Draw each border once — Do: Keep the divider inside the border. — Avoid: Overlapping alpha borders make intersections stand out."

> "Keep material shadows translucent — Do: Transparent shadows blend with the background. — Avoid: Opaque shadows leave a gray halo."

> "Gray for text, icons, fills, borders, and dividers by default. Gray-alpha only when the background should show through, such as in shadows or overlays."

> "There are two background colors for pages and UI components. In most instances, you should use Background 1 […] Background 2 should be used sparingly."

**Relevansi.** "Draw each border once" langsung berlaku: repo punya 91 `border-slate-200` + 31 `border-slate-300` + shim global `border-color: var(--color-slate-200)` di `index.css:9-17`. Dua tingkat border yang berdekatan tanpa aturan kapan memakai yang mana. Prinsip Dua Background juga berlaku: `bg-white` 134× + `bg-slate-50` 50× + `bg-slate-100` 50× = tiga latar tanpa hierarki tertulis.

**Verdict: ADAPT 2 aturan Geist** (border sekali, dua latar). **SKIP shadcn sebagai sumber aturan** — docs-nya tentang kepemilikan kode, bukan desain; ADR-0001 sudah memutuskan soal shadcn.

**Catatan konflik:** halaman Geist Components mendaftar 90+ komponen siap pakai. Mengadopsi komponennya = melanggar ADR-0001 poin 3. Ambil **aturan warnanya saja**, bukan komponennya.

---

### 3.5. `raunofreiberg/ui-playbook` — ⭐ 1.433

| Field | Nilai |
| :--- | :--- |
| URL | https://github.com/raunofreiberg/ui-playbook · https://uiplaybook.dev |
| Bintang / Fork | 1.433 / 86 |
| Lisensi | `MIT` |
| Dibuat / Push terakhir | 2020-07-08 / **2023-01-06** |
| Verifikasi | `api.github.com/repos/raunofreiberg/ui-playbook` (`default_branch: master`), raw `master/README.md`, raw `master/src/pages/play/textfield.mdx` (8.917 B) |

**Bentuk.** Halaman `.mdx` per komponen (`src/pages/play/{button,textfield,motion,...}.mdx`), masing-masing dengan seksi **Functionality / Best practices / Implementation / Accessibility**.

**Checkable? Ya.** Error handling dan asosiasi label adalah kondisi DOM yang bisa diperiksa.

**Kutipan verbatim (`src/pages/play/textfield.mdx`):**

> "Placeholders aren't visible to the user once the field has been filled in, nor are they announced by screen readers."

> "If an error is displayed, you should: Associate the error with the `<input>` element via the [`aria-describedby`](...) attribute. Set [`aria-invalid`](...) to `true` on the `<input>` element."

> "To accept numeric inputs, you would commonly use `<input type="number">`. This has some non-trivial drawbacks related to the input not being fully accessible […] Instead, consider using a text input with the HTML `pattern` attribute like so: `<input type="text" inputmode="numeric" pattern="[0-9]*">`"

**Relevansi.** **Sangat tinggi** — ini satu-satunya sumber yang membahas **form** secara spesifik, dan aplikasi ini form-heavy (30 input/textarea/select). Status repo: `aria-invalid` **0**, `aria-describedby` **0**. Halaman `textfield` adalah halaman yang tepat.

**Peringatan.** README menyatakan `> WIP`, dan push terakhir **Januari 2023** — 3,7 tahun sebelum dokumen ini. Hanya 9 halaman (`tooltip`, `button`, `select`, `notification`, `textfield`, `avatar`, `checkbox`, `motion`, `popover`). Perlakukan sebagai rujukan, **bukan** spesifikasi yang dipelihara: `aria-invalid` di sini sejalan dengan W3C, tetapi klaim implementasi lain tidak diaudit.

**Verdict: ADAPT (read-only) halaman `textfield`** untuk aturan form. SKIP `motion` (tidak relevan; dan repo 2023 tidak tahu Tailwind v4).

---

### 3.6. Apple HIG & WCAG 2.2 — sumber primer

**Apple HIG** — https://developer.apple.com/design/human-interface-guidelines/

`curl` mengembalikan HTTP 200 (17.978 B) tetapi halaman bergantung pada JavaScript untuk isi topik; hanya kerangka navigasi yang terbaca. Yang bisa dikutip terbatas pada hal yang sudah tercantum di `ui-checklist.md` (lewat `mobile-native`). **Tidak ada aturan baru yang bisa saya kutip verbatim dari HIG** — jangan mengarang. Verdict: **SKIP** (sudah tercakup via `mobile-native`).

**WCAG 2.2 Understanding Docs** — https://www.w3.org/WAI/WCAG22/Understanding/

Setiap kriteria punya halaman sendiri yang **bisa diambil penuh** dan dikutip. Ini sumber primer yang paling dapat diandalkan di seluruh dokumen. Empat kriteria yang langsung berlaku, dengan teks verbatim:

**2.5.8 Target Size (Minimum), Level AA** — https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
> "The intent of this success criterion is to help ensure targets can be easily activated without accidentally activating an adjacent target. […] Providing sufficient size, or sufficient spacing between targets, will reduce the likelihood of accidentally activating the wrong control."

Ambang: 24×24 CSS px (atau jarak yang memadai). **Relevan tinggi** — penghitung `w-6 h-6`, `w-5 h-5`, `p-1`, `py-1` di repo: **178 kemunculan**. Ikon 20px (`w-5 h-5`) di bawah ambang.

**3.3.1 Error Identification, Level A** — https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html
> "The intent of this success criterion is to ensure that users are aware that an error has occurred and can determine what is wrong. In the case of an unsuccessful form submission, it is not sufficient to only re-display the form without providing any hint that the submission failed. **The error must be indicated in text.**"

**Relevan tinggi**: repo menampilkan error dengan `text-red-*` (13 kemunculan) — warna saja tidak cukup; dan tidak ada `aria-live`/`role="alert"` (0) sehingga error tidak diumumkan.

**2.5.3 Label in Name, Level A** — https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html
> "The intent of this success criterion is to ensure that the words which visually label a component are also the words associated with the component programmatically. […] Users typically have a much better experience if the words and characters in the visible label of a control match or are contained within the accessible name."

**Relevan tinggi**: `LoginPage.tsx:66` merender `<label>` **tanpa `htmlFor`** dan `<input>` di baris 73 **tanpa `id`** — label visual ada, nama programatik tidak. Repo punya 16 `htmlFor|<label` tapi tidak ada jaminan pasangan.

**3.3.7 Redundant Entry, Level A** — https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html
Berlaku untuk alur siswa: nama + kunci akses yang mungkin diminta ulang di beberapa skenario.

**Verdict: ADOPT sebagai sumber kanonik.** Ketika aturan form/aksesibilitas perlu dinyatakan, kutip kriteria WCAG-nya, bukan skill pihak ketiga.

---

## 4. Kandidat yang TIDAK Terverifikasi / Tidak Ditemukan

Disusun jujur. Tidak ada yang ditebak.

### 4.1. Tidak ditemukan sama sekali (HTTP 404)

| Nama yang diminta | Hasil verifikasi |
| :--- | :--- |
| `vercel/design` | `raw.githubusercontent.com/vercel/design/main/README.md` → **404**. Repo tidak ada. Vercel tidak punya repo bernama `design`. |
| `sindresorhus/awesome-design` | `raw.../sindresorhus/awesome-design/main/README.md` → **404**. Juga `awesome-design/awesome-design` → 404. Repo awesome-list bernama itu **tidak ada** di GitHub. |
| `frontend-checklist` (repo generik) | `search/repositories?q=frontend-checklist+in:name` → `total_count: null` (kuota search habis). **Tidak diverifikasi** — jangan diasumsikan ada. |

### 4.2. Nyata tapi bukan yang diharapkan

**`badlogic/pi-skills`** — nyata. ⭐ 2.638, MIT, dibuat 2025-12-12, push 2026-06-06. Verifikasi: `api.github.com/repos/badlogic/pi-skills` + `git/trees/main?recursive=1`.

Isi lengkap (8 skill, `"truncated": false`):

```
brave-search/SKILL.md        browser-tools/SKILL.md    gccli/SKILL.md
gdcli/SKILL.md               gmcli/SKILL.md            transcribe/SKILL.md
vscode/SKILL.md              youtube-transcript/SKILL.md
```

**Nol skill desain.** Repo ini adalah perkakas integrasi (Google Calendar/Drive/Gmail CLI, browser automation, transkripsi). Verdict: **SKIP** — tidak ada yang bisa diadaptasi untuk desain.

**`raunofreiberg/ui-playbook`** — nyata, tapi satu-satunya sumber form yang berguna di §3.5. `archived: false` tapi push terakhir 2023-01-06 dan README berlabel `> WIP`. Sudah dicatat.

### 4.3. Ada tapi tidak bisa dikutip sebagai sumber aturan

**Material Design 3** — https://m3.material.io/ (HTTP 200, 62.022 B). Halaman adalah SPA: saya grep `label-large` pada HTML mentah → **0 kemunculan**. Konten dirender JavaScript; `curl` tidak mendapat apa pun yang bisa dikutip. Saya **tidak** akan mengarang nilai type scale M3 dari ingatan.

Selain itu, konteksnya salah: M3 adalah sistem untuk Android dengan elevation, ripple, dan dynamic color yang tidak ada padanannya di Tailwind v4 + web. Verdict: **SKIP**, dan alasan ketidakmampuan verifikasi diutamakan.

**Apple HIG** — HTTP 200 tapi isi topik bergantung JavaScript (lihat §3.6). Tidak ada aturan baru yang terverifikasi.

### 4.4. Terverifikasi tapi bukan sumber aturan desain

**`VoltAgent/awesome-design-md`** — nyata dan besar: ⭐ 123.106, MIT, push 2026-10-14. Verifikasi: `api.github.com/repos/VoltAgent/awesome-design-md`.

Tapi bentuknya adalah **kumpulan `DESIGN.md` milik brand lain**: "A collection of DESIGN.md files analysis by popular brand design systems. Drop one into your project". Ini galeri identitas visual, bukan aturan yang bisa diperiksa. Menyalin `DESIGN.md` brand lain ke repo ini adalah kebalikan dari tujuan: hasilnya identitas visual curian, bukan kesiapan refaktor.

Gunanya hanya satu: melihat **bentuk** `DESIGN.md` yang benar. Spesifikasinya sudah ada di §3.1. Verdict: **SKIP sebagai sumber aturan.**

**`anthropics/skills` `brand-guidelines`** (2.235 B) — isinya **warna Anthropic** (`#141413`, `#faf9f5`, `#b0aea5`, `#e8e6dc`) untuk "any sort of artifact that may benefit from having Anthropic's look-and-feel". Tidak berlaku untuk produk pihak ketiga. SKIP.

**`anthropics/skills` `web-artifacts-builder`** (3.087 B) — memakai "React 18 + TypeScript + Vite + Parcel + Tailwind CSS + shadcn/ui". Ini konflik langsung dengan ADR-0001. Satu-satunya bagian yang bisa dipakai adalah satu kalimat:

> "VERY IMPORTANT: To avoid what is often referred to as "AI slop", avoid using excessive centered layouts, purple gradients, uniform rounded corners, and Inter font."

Itu pun sudah tercakup oleh `frontend-design` (§3.3) yang lebih lengkap. SKIP.

---

## 5. Aturan Konkret yang Layak Diadopsi

**Kriteria masuk:** (a) bisa diperiksa dengan membaca kode/build output, (b) berlaku untuk repo ini. Aturan yang sudah ada di `docs/ui-checklist.md` **tidak diulang** — diberi label "sudah ada".

Status: ✅ bersih · ❌ melanggar · ⚠️ perlu dicek.

### 5.1. Form & aksesibilitas (lubang terbesar yang belum tertutup)

| Aturan | Sumber | Checkable? | Relevan? | Status |
| :--- | :--- | :--- | :--- | :--- |
| Setiap `<input>` punya `id` + `<label htmlFor>` yang cocok | [WCAG 2.5.3](https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html) + [ui-playbook textfield](https://github.com/raunofreiberg/ui-playbook/blob/master/src/pages/play/textfield.mdx) | `grep -c htmlFor` vs `grep -c "<input"` — harus sebanding | Ya — 16 label vs 30 input, tidak ada jaminan pasangan | ❌ `LoginPage.tsx:66` label tanpa `htmlFor`, `:73` input tanpa `id` |
| Error field diset `aria-invalid` + `aria-describedby` | ui-playbook textfield; WCAG 3.3.1 | `grep -rc aria-invalid src/client` — target ≥ jumlah form dengan validasi | Ya — repo punya validasi (password, nama siswa) | ❌ **0** |
| Error tidak hanya dibedakan warna — ada teks | [WCAG 3.3.1](https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html) | Baca JSX yang merender `text-red-*` — harus ada teks, bukan hanya border merah | Ya — 13 kemunculan `text-red-*` | ⚠️ perlu dibaca per lokasi |
| Pesan error dinamis diumumkan (`role="alert"` atau `aria-live`) | WCAG 4.1.3 Status Messages | `grep -rn 'role="alert"\|aria-live' src/client` — target ≥1 per form | Ya | ❌ **0** |
| Placeholder bukan pengganti label | ui-playbook textfield | Cari `<input>` dengan `placeholder` tapi tanpa `aria-label`/`htmlFor` | Ya — `HomePage.tsx:175` input pencarian hanya punya `placeholder` | ⚠️ sebagian (lihat `LoginPage.tsx:75` yang punya keduanya) |
| Input angka: `type="text" inputmode="numeric" pattern="[0-9]*"`, bukan `type="number"` | ui-playbook textfield | `grep -rn 'type="number"'` — target 0 untuk input nilai | Perlu dicek apakah ada input angka (level/poin) | ⚠️ belum diperiksa |
| `<html lang>` sesuai bahasa UI, `lang` berbeda untuk konten asing | WCAG 3.1.1/3.1.2 | `grep -n 'html lang' index.html` | **Tinggi** — UI Indonesia, kosakata Jerman | ❌ `index.html:2` = `<html lang="en">`, 0 `lang="de"` |

**Catatan `lang`:** ini satu baris, biaya nol, dan langsung memperbaiki cara screen reader melafalkan seluruh aplikasi. Kosakata Jerman (`der/die/das`) sebaiknya `lang="de"` pada elemen yang menampilkannya — bonus untuk pelafalan yang benar, bukan sekadar kepatuhan.

### 5.2. Token & konsistensi visual

| Aturan | Sumber | Checkable? | Relevan? | Status |
| :--- | :--- | :--- | :--- | :--- |
| Kontras teks ≥ 4.5:1 (AA) | [design.md `contrast-ratio.ts`](https://github.com/google-labs-code/design.md) (`WCAG_AA_MINIMUM = 4.5`) | Otomatis via `npx @google/design.md lint` setelah `DESIGN.md` ditulis | Ya — `text-slate-500` 85× di atas `bg-white`/`bg-slate-50` | ⚠️ belum diukur; `slate-500` di atas `slate-50` **mungkin** gagal |
| Jangan campur sudut rounded dan tajam dalam satu view | [`design.md` spec §Do's and Don'ts](https://github.com/google-labs-code/design.md/blob/main/docs/spec.md) | Bandingkan himpunan kelas `rounded-*` per halaman | Ya — 6 tingkat radius | ❌ `md` 6 · `lg` 68 · `xl` 103 · `2xl` 59 · `3xl` 12 · `full` 72, tanpa hierarki tertulis |
| Skala tipografi dari token, bukan nilai arbitrer | `design.md` §Typography token | `grep -rho "text-\[[0-9.]*px\]" src/client \| wc -l` — target 0 | **Tinggi** | ❌ **78** (`text-[9px]` 2 · `text-[10px]` 10 · `text-[11px]` 66) vs 11 `text-base` |
| Tidak ada `font-size` di bawah 12px untuk teks yang harus dibaca | UI-playbook/`break-ui` (line-height sempit memotong diakritik) + praktik aksesibilitas | Sama seperti baris di atas | Ya | ❌ 12 kemunculan ≤10px |
| Gambar border satu kali (jangan dua border alpha bertumpuk) | [Geist Colors](https://vercel.com/geist/colors) — "Draw each border once" | Periksa apakah elemen memakai `border` + `ring`/outline untuk tujuan yang sama | Ya — 91 `border-slate-200` + 31 `border-slate-300` + shim global | ⚠️ perlu diperiksa per komponen |
| Maksimal dua latar halaman (Background 1/2), bukan tiga | Geist Colors | Hitung varian latar per halaman | Ya | ❌ `bg-white` 134 · `bg-slate-50` 50 · `bg-slate-100` 50 |
| Jangan `transition: all` — sebutkan properti | [`emil-design-eng/SKILL.md` Review Checklist](https://github.com/emilkowalski/skills/blob/main/skills/emil-design-eng/SKILL.md) | `grep -rn "transition-all" src/client \| wc -l` — target 0 | Ya — tidak ada animasi kompleks, jadi tidak butuh `all` | ❌ **101** |
| Hierarki radius eksplisit (≤3 tingkat + `full` untuk pil/avatar) | [`frontend-design/SKILL.md`](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md) anti-pattern #4 | Lihat baris radius di atas | Ya | ❌ sama |

**Catatan `transition-all`:** ini perbaikan mekanis, bukan estetika. `transition-all` meng-animasikan setiap properti yang berubah — termasuk `width`/`height` yang memicu layout. Mengganti ke `transition-colors` hampir selalu perilaku yang sama secara visual dengan frame cost lebih rendah. 101 lokasi, mekanis, bisa dipecah per berkas.

### 5.3. Ketahanan data (long strings) — untuk alur siswa

| Aturan | Sumber | Checkable? | Relevan? | Status |
| :--- | :--- | :--- | :--- | :--- |
| Kolom teks di flex/grid punya `min-width: 0` | [`break-ui` failure signatures](https://github.com/emilkowalski/skills/blob/main/skills/break-ui/SKILL.md) | Baca komponen yang merender data panjang (nama siswa, label kategori) | Ya — nama siswa di analitik guru | ⚠️ belum diuji |
| Email/URL/nama Jerman komposit: `overflow-wrap: anywhere` | `break-ui` (`Benachrichtigungseinstellungen`, 30 karakter tanpa spasi) | Cari elemen yang merender string tanpa break opportunity | **Tinggi** — bahasa Jerman punya komposit panjang | ⚠️ belum diuji |
| Angka: `font-variant-numeric: tabular-nums` | `break-ui` | Cari angka dalam tabel/kolom | Ya — skor, persentase di analitik | ⚠️ belum diuji |
| Angka diformat `Intl.NumberFormat`, plural lewat `Intl.PluralRules` | `break-ui` | `grep -rn "Intl.NumberFormat\|Intl.PluralRules"` | Sedang — "1 jawaban" vs "2 jawaban" | ⚠️ belum diperiksa |
| Avatar/ikon berukuran tetap: `flex-shrink: 0` | `break-ui` | Cari `Lucide` icon di dalam flex row | Ya | ⚠️ belum diuji |
| Keputusan truncate/wrap **per field**, bukan global | `break-ui` §"Truncate, wrap, or clamp" | Adanya keputusan tertulis di komponen | Ya — teks soal kuis panjang | ⚠️ belum ada |

### 5.4. Ukuran target sentuh

| Aturan | Sumber | Checkable? | Relevan? | Status |
| :--- | :--- | :--- | :--- | :--- |
| Target ≥24×24 CSS px ATAU jarak memadai antar target | [WCAG 2.5.8 (AA)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) | Cari `w-5 h-5`/`w-6 h-6`/`p-1` pada elemen interaktif | **Tinggi** — siswa di HP | ⚠️ 178 kemunculan pola kecil; yang interaktif belum dihitung |

### 5.5. Copy dan state kosong

| Aturan | Sumber | Checkable? | Relevan? | Status |
| :--- | :--- | :--- | :--- | :--- |
| Nama aksi konsisten sepanjang alur (tombol "Kirim" → toast "Terkirim") | [frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md) | Cari string tombol vs string konfirmasi | Ya — buat skenario → bagikan link → lihat hasil | ⚠️ belum diaudit |
| Error tidak minta maaf, tidak kabur — sebut apa yang salah dan cara memperbaiki | `frontend-design` | Baca copy error | Ya | ⚠️ belum diaudit |
| Empty state = ajakan bertindak, bukan suasana | `frontend-design` | Cari state kosong (bank kata kosong, belum ada jawaban) | Ya — guru dengan 0 skenario | ⚠️ belum diaudit |
| Template string dengan `·` / `WORD — fragmen` / ALL-CAPS eyebrow = default, bukan pilihan | `frontend-design` anti-pattern #5 | `grep -rn "uppercase tracking\|·"` | Ya | ⚠️ `LoginPage.tsx:65` `uppercase tracking-wider` |

### 5.6. Yang sudah ada di `ui-checklist.md` — jangan diduplikasi

| Aturan | Lokasi |
| :--- | :--- |
| Input minimal 16px (iOS zoom) | `ui-checklist.md` §2.1 — 18 pelanggaran |
| `prefers-reduced-motion` | §2.2 — 0 dari 2 animasi |
| `100dvh` untuk app shell | §2.3 — 8 tempat |
| `env(safe-area-inset-*)` + `viewport-fit=cover` | §2.4 |
| Gate `:hover` di `@media (hover: hover)` | §1 — ✅ via Tailwind v4 |
| Jangan `user-scalable=no`, `touch-action: none`, `user-select: none` di body | §1 — ✅ |

**Perhatikan interaksi:** `ui-checklist.md` §2.1 menaikkan input ke `text-base`. Aturan token di §5.2 menuntut skala tipografi eksplisit. Kerjakan **berurutan** — naikkan ke `text-base` dulu (perbaikan perilaku), baru tetapkan scale (perbaikan sistem) saat refaktor. Kalau digabung, hasil `text-base` bisa dibatalkan oleh aturan scale baru.

### 5.7. Perintah verifikasi

```bash
# --- Form & aksesibilitas ---
grep -rn "aria-invalid" src/client | wc -l                  # target: > 0
grep -rn "aria-describedby" src/client | wc -l              # target: > 0
grep -rn 'role="alert"\|aria-live' src/client | wc -l       # target: > 0
grep -c "<input\|<textarea\|<select" -r src/client --include=*.tsx | awk -F: '{s+=$2} END{print "input:",s}'
grep -rn "htmlFor" src/client --include=*.tsx | wc -l       # harus sebanding dengan input
grep -n "<html" index.html                                  # harus lang="id"

# --- Token & konsistensi ---
grep -rho "text-\[[0-9.]*px\]" src/client --include=*.tsx | wc -l   # target: 0
grep -rn "transition-all" src/client --include=*.tsx | wc -l        # target: 0
grep -rho "rounded-\(sm\|md\|lg\|xl\|2xl\|3xl\|full\)\b" src/client --include=*.tsx \
  | sort | uniq -c | sort -rn                                       # target: <= 4 jenis
grep -rho "bg-\(white\|slate-[0-9]*\)\b" src/client --include=*.tsx \
  | sort | uniq -c | sort -rn                                       # target: <= 2 latar/halaman

# --- Target sentuh (manual: yang interaktif saja) ---
grep -rn "w-5 h-5\|h-5 w-5\|w-6 h-6\|h-6 w-6" src/client --include=*.tsx | wc -l

# --- Kontras: hanya setelah DESIGN.md ada ---
npx @google/design.md lint DESIGN.md --format json   # DILARANG dijalankan sekarang (larangan instalasi)
```

Angka "kondisi repo" di §5 adalah hasil *snapshot* perintah-perintah ini pada commit saat dokumen ditulis. Jalankan ulang sebelum mempercayainya.

---

## 6. Yang Bertentangan dengan ADR-0001

ADR-0001 memutuskan: **custom UI components saja**, `cn()` sebagai primitif, **tanpa** CLI shadcn penuh, Radix hanya disalin modular bila butuh WAI-ARIA kompleks, `tailwindcss-animate` diganti `@keyframes` native.

| Kandidat | Klaim yang berbenturan | Penilaian |
| :--- | :--- | :--- |
| **`pick-ui-library`** (emil) | "Unstyled, accessible UI components (dialogs, popovers, menus, selects…) → **base-ui**"; "Type-safe, variant-driven styling for Tailwind → **cva**"; "General charts → **recharts**"; "State management → **zustand**" | ⚠️ **Bertentangan bila diadopsi sebagai instruksi.** ADR-0001 memilih menyalin primitive Radix modular, bukan memasang `base-ui` sebagai dependency. `pick-ui-library` adalah **katalog pemilihan library**, sedangkan ADR-0001 adalah keputusan *menolak* menambah library. Skill ini bahkan menyuruh memeriksa `package.json` dulu — "If the project already uses a listed library, use it" — dan repo ini tidak memakai satu pun. **Jangan pasang skill ini sebagai instruksi aktif.** Kalau suatu hari muncul kebutuhan chart, `recharts` adalah input ke ADR baru, bukan lisensi otomatis. |
| **`anthropics/skills/web-artifacts-builder`** | "Stack: React 18 + TypeScript + Vite + Parcel + Tailwind CSS + **shadcn/ui**" | ❌ **Bertentangan langsung.** ADR-0001 poin 3 menolak shadcn CLI. Jangan dipakai. |
| **Vercel Geist — halaman Components** | 90+ komponen siap pakai (Address Input, Combobox, Destructive Action Modal, …) | ⚠️ Mengadopsi komponennya = melanggar ADR-0001 poin 3. Ambil **aturan warna** (`/geist/colors`) saja. |
| **`apple-design` & skill animasi** | "Avoid CSS transitions and `@keyframes` for anything gesture-driven" | ✅ **Tidak bertentangan**, dan sudah dianalisis di riset sebelumnya: ADR-0001 poin 4 sah untuk modal non-gesture. Tidak ada perubahan yang perlu dilakukan. |
| **`google-labs-code/design.md`** | Tidak menyebut library apa pun. Ekspor `css-tailwind` menghasilkan blok `@theme { }` **Tailwind v4** — persis `@import "tailwindcss"` yang sudah dipakai repo | ✅ **Sejalan dan komplementer.** Tidak menambah dependency runtime (`npx` = alat, bukan isi `package.json`). Memperkuat ADR-0001 dengan memberi token system yang tidak butuh library. |
| **`frontend-design`** | Menganjurkan typeface non-default, palette baru | ⚠️ **Benturan lunak, bukan struktural.** Mengganti font/palette adalah keputusan produk, bukan keputusan teknis, dan tidak bertentangan dengan ADR. Tapi ini juga yang paling berisiko memicu regresi visual yang justru ingin dihindari ADR-0002. Ambil bagian anti-pattern saja. |
| **`ui-playbook`** | Tidak menyebut library. Contohnya CSS polos | ✅ Sejalan. |

**Kesimpulan §6:** tidak ada rekomendasi di §5 dan §7 yang melanggar ADR-0001. Yang berbenturan adalah **skill pemilihan library** dan **komponen siap pakai** — keduanya sengaja tidak direkomendasikan sebagai instruksi aktif.

---

## 7. Rekomendasi Bertahap

ADR-0001 menunda Tailwind v4; ADR-0002 sudah memenuhi prasyarat itu dan menjadwalkan **Fase 3: Refaktor Komponen Antarmuka** setelah ekosistem styling v4 stabil. "Refaktor desain" yang dimaksud user jatuh persis di fase itu. Rencana di bawah mengikat diri ke sana.

### Tahap 0 — Sekarang, sebelum refaktor (biaya ~1 jam, nol risiko visual)

Ini bukan pekerjaan desain. Ini mengisi lubang yang `ui-checklist.md` §4 akui belum diperiksa, dan tidak mengubah satupun piksel.

1. **`index.html:2` → `<html lang="id">`.** Satu baris. Memperbaiki pelafalan seluruh aplikasi oleh screen reader.
2. **Tambahkan `aria-invalid` + `aria-describedby` pada form yang punya validasi.** Minimal `LoginPage.tsx` dan form nama siswa. Ini menutup WCAG 3.3.1 untuk satu jalur nyata.
3. **Bungkus pesan error dinamis dalam `aria-live="polite"`** (atau wadah `role="alert"`). Sekali buat satu komponen kecil, pakai di semua tempat.
4. **Tambahkan bagian baru ke `docs/ui-checklist.md`** dari §5.1–§5.4 dokumen ini, dengan format dan status jujur yang sama. Ini satu-satunya deliverable yang wajib dari riset ini.
5. **Kumpulkan baseline:** jalankan perintah §5.7 dan simpan angkanya. Tanpa baseline, "sudah membaik" tidak bisa dibuktikan setelah refaktor.

**Yang tidak dilakukan di Tahap 0:** menulis `DESIGN.md`, mengganti `transition-all`, menyentuh radius. Semuanya butuh keputusan desain yang belum ada.

### Tahap 1 — Saat refaktor desain dimulai (setelah ADR-0002 Fase 3)

Urutan ini penting; tiap langkah menghasilkan ground truth untuk langkah berikutnya.

1. **Tetapkan token dulu, ubah komponen kemudian.** Tulis `DESIGN.md` minimal berisi Colors (pilih **2 latar**, bukan 3; pilih **1–2 tingkat border**), Typography (satu skala, hilangkan 78 nilai arbitrer), Shapes (≤3 radius + `full`), dan Do's/Don'ts. Ikuti urutan seksi dari spec `google-labs-code/design.md` §Section Order.
2. **Jalankan linter sebagai gate CI, bukan sekadar dokumentasi.** `npx @google/design.md lint DESIGN.md` memeriksa referensi token yang rusak dan **kontras WCAG AA 4.5:1** — sesuatu yang tidak bisa dilakukan `grep` dan tidak akan pernah bisa dilakukan review manual secara konsisten.
3. **Ekspor token ke `@theme` v4.** `npx @google/design.md export --format css-tailwind DESIGN.md` menghasilkan blok `@theme { }`. Ganti `@theme inline` 2-token di `src/client/index.css:19-22` dengan hasil ini. Ini mendarat **di tempat yang sudah ada**, bukan pola baru.
4. **Baru migrasikan kelas.** `bg-white`/`bg-slate-50`/`bg-slate-100` → token latar. `text-[9px]`…`text-[11px]` → token tipografi. `rounded-*` → token bentuk. Satu berkas per commit, supaya regresi bisa di-`git bisect`.
5. **`transition-all` → properti eksplisit** (101 lokasi). Mekanis, bisa masuk kapan saja di tengah langkah 4 sebagai "sambil lewat".
6. **Uji data terburuk** pada komponen yang menampilkan data pengguna: nama siswa di analitik, label kategori kata, teks soal. Pakai `break-ui` sebagai lensa, bukan sebagai skill terpasang — cukup tabel *failure signatures*-nya.

### Tahap 2 — Yang dilewati, dengan alasan

| Dilewati | Alasan |
| :--- | :--- |
| `badlogic/pi-skills` | Nol skill desain (§4.2) |
| `VoltAgent/awesome-design-md` | Identitas brand pihak lain, bukan aturan (§4.4) |
| Material Design 3 | SPA, tidak bisa dikutip; konteks Android (§4.3) |
| Apple HIG sebagai sumber baru | Sudah tercakup via `mobile-native` di `ui-checklist.md` (§3.6) |
| `pick-ui-library` sebagai instruksi | Bertentangan dengan ADR-0001 (§6) |
| 11 skill animasi emil | Repo punya 2 keyframe, tanpa dependency animasi (ADR-0001 poin 4) |
| `brand-guidelines`, `web-artifacts-builder` | Brand Anthropic / stack shadcn (§4.4) |
| Mengganti typeface/palette ala `frontend-design` | Keputusan produk, risiko regresi visual — bertentangan dengan semangat ADR-0002 |

### Kapan adopsi menjadi masuk akal (trigger konkret)

- **`DESIGN.md` + linter:** saat refaktor desain benar-benar dimulai. Sebelum itu, tidak ada token untuk di-lint.
- **`break-ui` sebagai fixture nyata:** saat komponen baru pertama kali menampilkan data guru/siswa (nama, email, analitik).
- **Skill animasi apa pun:** bila muncul kebutuhan drag/swipe (mis. flashcard swipe-to-rate) — persis trigger yang sudah dicatat di `docs/research-apple-design-skill-emil-kowalski.md` §5. Sampai itu tidak terjadi, menyalinnya adalah beban mati.

---

## 8. Yang Tidak Terbukti

Daftar klaim yang **tidak** berhasil saya verifikasi, agar tidak terbaca sebagai kepastian.

1. **Repo `frontend-checklist` generik tidak diverifikasi.** Kuota GitHub Search (10/jam) habis sebelum pencarian selesai (`total_count: null`). Saya tidak dapat menyatakan repo itu tidak ada — hanya bahwa saya tidak mencarinya sampai tuntas.
2. **Kontras warna repo tidak diukur.** Saya mencatat `text-slate-500` (85×) dan `bg-slate-50` (50×) sebagai **berisiko**, bukan sebagai pelanggaran. Rasio sebenarnya butuh perhitungan per pasangan; itu pekerjaan `npx @google/design.md lint` yang **dilarang dijalankan** pada tugas ini (larangan instalasi). **Jangan menyatakan repo ini gagal WCAG AA berdasarkan dokumen ini.**
3. **Halaman dasar Material 3 tidak bisa dikutip.** `curl` mengembalikan 62 KB kerangka SPA dengan **0** kemunculan `label-large`. Saya tidak menyalin nilai type scale M3 dari ingatan, dan tidak ada nilai M3 di dokumen ini.
4. **Apple HIG tidak terbaca isinya.** HTTP 200 tapi konten bergantung JavaScript. Tidak ada aturan HIG baru yang dikutip di sini.
5. **Material 3 belum dicoba sebagai sumber di masa depan.** Ambang batas saya untuk memasukkan konsisten: 11 skill emil dinilai lewat frontmatter + heading + bagian spesifik, bukan pembacaan kata-per-kata seluruh 27 KB `emil-design-eng` dan 42 KB `write-swift`. Kutipan yang saya ambil adalah byte asli; tapi saya mungkin melewatkan aturan berguna di bagian yang tidak saya baca.
6. **Tabel di §5 menguji nama kelas Tailwind literal.** Kelas yang dibangun dinamis (`className={cn(...)}`, template string bertingkat) bisa lolos dari `grep`. Angka `transition-all` 101 dan `text-[Npx]` 78 adalah **batas bawah**, bukan total.
7. **Tidak ada satupun temuan di §5 yang diuji di browser.** Semua adalah analisis statis, sama seperti `ui-checklist.md` §5. Khususnya: `min-width: 0` dan `overflow-wrap: anywhere` (§5.3) adalah dugaan berbasis pola, dan bisa jadi tidak pernah bermasalah pada data nyata repo ini.
8. **Status lisensi `anthropics/skills` ambigu.** `api.github.com/repos/anthropics/skills` mengembalikan `license: null`. README menyatakan "Many skills in this repo are open source (Apache 2.0)" dan tiap skill membawa `LICENSE.txt` sendiri (Apache-2.0, 10.174–11.345 B), tetapi **tidak ada `LICENSE` di root**. Saya tidak memeriksa isi `frontend-design/LICENSE.txt` baris per baris. Jangan vendor tanpa membacanya.
9. **`@google/design.md` sebagai npm package tidak diverifikasi.** README menyebut `npx @google/design.md lint`, dan kode linter ada di repo, tetapi saya **tidak** memeriksa apakah paket itu benar-benar terbit di registry, versinya, atau apakah `npx` akan berhasil. Larangan instalasi berlaku.
10. **Angka bintang, fork, dan tanggal adalah snapshot.** Diambil dari `api.github.com` dalam satu jendela ~15 menit. `pushed_at` bisa berubah tanpa isi yang relevan berubah.

---

## 9. Rujukan Sumber Primer

**Spesifikasi & linter (paling dapat dieksekusi):**
- https://github.com/google-labs-code/design.md — README, format.
- https://raw.githubusercontent.com/google-labs-code/design.md/main/docs/spec.md — skema token, urutan seksi, Do's/Don'ts, perilaku konten ganda.
- https://raw.githubusercontent.com/google-labs-code/design.md/main/PHILOSOPHY.md — "prose, not tokens, is the focus".
- https://raw.githubusercontent.com/google-labs-code/design.md/main/packages/cli/src/linter/linter/rules/contrast-ratio.ts — `WCAG_AA_MINIMUM = 4.5`.
- https://api.github.com/repos/google-labs-code/design.md/git/trees/main?recursive=1 — 11 aturan lint, tiap aturan ber-`.test.ts`.
- https://raw.githubusercontent.com/google-labs-code/design.md/main/README.md — `lint`, `export --format css-tailwind`, `--format dtcg`.

**Skill (Emil Kowalski):**
- https://raw.githubusercontent.com/emilkowalski/skills/main/skills/break-ui/SKILL.md — tabel *failure signatures*, keputusan truncate/wrap.
- https://raw.githubusercontent.com/emilkowalski/skills/main/skills/break-ui/CATALOG.md — nilai data terburuk, termasuk komposit Jerman.
- https://raw.githubusercontent.com/emilkowalski/skills/main/skills/emil-design-eng/SKILL.md — tabel *Review Checklist* 11 baris, `prefers-reduced-motion`, gate hover.
- https://raw.githubusercontent.com/emilkowalski/skills/main/skills/pick-ui-library/SKILL.md — katalog library (sumber konflik §6).
- https://api.github.com/repos/emilkowalski/skills/git/trees/main?recursive=1 — 15 skill + berkas tambahan.

**Skill (Anthropic):**
- https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md — anti-pattern #4/#5, lantai kualitas, nada copy.
- https://raw.githubusercontent.com/anthropics/skills/main/skills/web-artifacts-builder/SKILL.md — stack shadcn (konflik §6).
- https://raw.githubusercontent.com/anthropics/skills/main/skills/brand-guidelines/SKILL.md — brand Anthropic (tidak berlaku).
- https://api.github.com/repos/anthropics/skills/git/trees/main?recursive=1 — daftar lengkap skill.

**Playbook & sistem desain:**
- https://raw.githubusercontent.com/raunofreiberg/ui-playbook/master/src/pages/play/textfield.mdx — label, `aria-invalid`, `aria-describedby`, `inputmode="numeric"`.
- https://raw.githubusercontent.com/raunofreiberg/ui-playbook/master/README.md — `> WIP`, daftar 9 halaman.
- https://vercel.com/geist/colors — "Draw each border once", "Keep material shadows translucent", dua Background.

**Sumber primer aksesibilitas:**
- https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html — WCAG 2.5.8 (AA).
- https://www.w3.org/WAI/WCAG22/Understanding/error-identification.html — WCAG 3.3.1 (A).
- https://www.w3.org/WAI/WCAG22/Understanding/label-in-name.html — WCAG 2.5.3 (A).
- https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html — WCAG 3.3.7 (A).

**Kontra-verifikasi (yang tidak ada / tidak dapat dikutip):**
- https://raw.githubusercontent.com/vercel/design/main/README.md — 404.
- https://raw.githubusercontent.com/sindresorhus/awesome-design/main/README.md — 404.
- https://api.github.com/repos/badlogic/pi-skills/git/trees/main?recursive=1 — 8 skill, nol desain.
- https://m3.material.io/styles/typography/type-scale-tokens — SPA, konten tidak terbaca.
