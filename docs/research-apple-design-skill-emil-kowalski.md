# Riset Teknis: Integrasi Isolated Skill `apple-design` (Emil Kowalski) ke DeutschEasier

**Tanggal Dokumen:** Oktober 2026
**Target Repository:** DeutschEasier (`Vite 6.1.0`, `React 18.3.1`, `TypeScript 5.7`, `Tailwind CSS 3`, SPA, Pi Coding Agent v1.4.0)
**Penulis:** Research Subagent (Technical Architecture)

---

## 1. Ringkasan Eksekutif & Rekomendasi Utama

Skill `apple-design` **benar-benar ada** dan berhasil diverifikasi langsung dari sumber primer: `https://github.com/emilkowalski/skills`, berkas `skills/apple-design/SKILL.md` (23.036 byte, 290 baris). Repo berlisensi MIT, 48.939 bintang, terakhir di-push 11 Oktober 2026.

Temuan utama:

1. **Repo terverifikasi.** Nama repo adalah `emilkowalski/skills` (bukan `apple-design`); `apple-design` hanyalah **satu dari 15 skill** di dalamnya. Isinya adalah prinsip desain Apple dari WWDC yang diterjemahkan ke web: spring, interruptibility, velocity handoff, momentum projection, materials/translucency, dan reduced-motion.
2. **Pi mendukung project-local skills secara native.** Berdasarkan `docs/configuration.md` baris 35, path resminya adalah `.pi/skills/`. Skill di direktori ini **hanya dimuat saat Pi berjalan di dalam repo tersebut**, sehingga isolasi benar-benar dijamin oleh mekanisme discovery Pi, bukan oleh konvensi.
3. **Insentif utama isolasi lokal adalah `.gitignore`.** Repo ini sudah mengabaikan `.pi/` (`.gitignore` baris 11). Konsekuensinya: skill di `.pi/skills/` **tidak akan pernah masuk git** dan **tidak bocor ke proyek lain**, tetapi juga **tidak otomatis didapat rekan tim**. Ini adalah *single-tenant, zero-footprint* — persis definisi "isolated" yang diminta.
4. **Verdict relevansi: MARGINAL — tunda (defer).** DeutschEasier adalah aplikasi latihan bahasa Jerman, bukan aplikasi gesture-driven. Repo **nol** dependensi animasi (`motion`, `framer-motion`, `@radix-ui/*` tidak ada di `package.json`), hanya 2 komponen UI (`button.tsx`, `card.tsx`), dan animasi eksisting hanya 2 `@keyframes` CSS (`modalIn`, `fadeIn`) plus kelas `transition-colors`/`transition-all` Tailwind. Seluruh isi inti skill (spring, `setPointerCapture`, momentum projection, velocity handoff) **tidak dapat diterapkan** tanpa menambah dependency baru — yang secara eksplisit ditolak ADR-0001.

**Rekomendasi:** **Jangan install sekarang (YAGNI).** Bila suatu saat dibutuhkan (mis. fitur flashcard swipe/drag), gunakan **Opsi A: vendored copy di `.pi/skills/apple-design/`** — satu-satunya opsi yang nol bocor ke global namespace dan nol jejak di git. Perintah copy-paste ada di §6.

---

## 2. Sumber Primer Skill: `emilkowalski/skills`

### 2.1. Identitas Repo (diverifikasi via GitHub API)

Sumber: `https://api.github.com/repos/emilkowalski/skills`

| Field | Nilai |
| --- | --- |
| `full_name` | `emilkowalski/skills` |
| `html_url` | https://github.com/emilkowalski/skills |
| `description` | `Skills for Designers and Engineers.` |
| `license` | `MIT` (`LICENSE` — "Copyright (c) 2026 Emil Kowalski") |
| `created_at` | 2026-03-16T13:52:31Z |
| `pushed_at` | 2026-10-11T13:58:36Z |
| `stargazers_count` | 48.939 |
| `forks_count` | 2.832 |
| `open_issues_count` | 0 |
| `default_branch` | `main` |
| `size` | 114 KB |
| Tags/releases | Tidak ada (`/tags` mengembalikan `[]`) |

Kematangan: 48.9k bintang, 2.8k fork, commit terakhir 11 Oktober 2026, lisensi MIT yang permisif. Ini proyek aktif dan matang secara adopsi — tetapi **belum ada tag rilis**, sehingga tidak ada versi yang bisa di-pin; setiap update di `main` adalah update yang Anda terima.

### 2.2. Struktur Repo (15 skill, ukuran byte aktual)

Sumber: `https://api.github.com/repos/emilkowalski/skills/git/trees/main?recursive=1`

| Skill | Berkas | Ukuran | Status di skill |
| --- | --- | --- | --- |
| `animate-expo` | `SKILL.md` | 17.891 B | `animate` untuk React Native/Expo |
| `animate` | `SKILL.md` | 11.860 B | — |
| `animation-performance` | `SKILL.md` | 13.966 B | — |
| `animation-vocabulary` | `SKILL.md` | 13.425 B | — |
| **`apple-design`** | **`SKILL.md`** | **23.036 B** | **satu-satunya berkas** |
| `ask-sonner` | `SKILL.md` | 7.233 B | + `API.md` 4.545 B |
| `break-ui` | `SKILL.md` | 14.380 B | + `CATALOG.md` 8.268 B |
| `emil-design-eng` | `SKILL.md` | 27.123 B | — |
| `find-animation-opportunities` | `SKILL.md` | 9.808 B | — |
| `improve-animations` | `SKILL.md` | 8.208 B | + `AUDIT.md` 7.387 B, `PLAN-TEMPLATE.md` 3.100 B |
| `mobile-native` | `SKILL.md` | 16.838 B | — |
| `pick-ui-library` | `SKILL.md` | 4.790 B | — |
| `prototype` | `SKILL.md` | 7.830 B | + `PICKER.md` 7.548 B |
| `review-animations` | `SKILL.md` | 8.407 B | + `STANDARDS.md` 9.801 B |
| `write-swift` | `SKILL.md` | 42.445 B | — |

Berkas root: `README.md` (4.590 B), `LICENSE` (1.070 B), `performance-cheatsheet.md` (932 B), `.gitattributes` (68 B), `.gitignore` (10 B, isi: `.DS_Store`).

**Catatan penting:** `apple-design` adalah skill **single-file**. Ia **tidak** memiliki `references/`, `scripts/`, maupun `assets/`. Artinya menyalinnya adalah operasi copy satu berkas, tanpa resolusi path relatif tambahan.

### 2.3. Frontmatter (dikutip verbatim)

Sumber: https://raw.githubusercontent.com/emilkowalski/skills/main/skills/apple-design/SKILL.md

```yaml
---
name: apple-design
description: Apple's approach to interface design and fluid, physical motion, translated for the web. Use when building or reviewing gesture-driven UI, spring animations, drag/swipe/sheet interactions, momentum and interruptible transitions, translucent materials and depth, typography (optical sizing, tracking, leading), reduced-motion, or the design foundations (feedback, spatial consistency, restraint) behind Apple-style interfaces.
---
```

Tidak ada field `license`, `compatibility`, `allowed-tools`, maupun `disable-model-invocation`. Artinya: skill ini **model-invoked** (dipilih otomatis berdasarkan `description`), dan `/skill:apple-design` tetap tersedia sebagai jalur paksa.

### 2.4. Daftar Heading (verbatim, 17 bagian + Quick Reference)

Sumber: hasil `grep '^#{1,3} '` atas `skills/apple-design/SKILL.md`.

```
# Apple Design
## Initial Response
## The Core Idea
## 1. Response — kill latency
## 2. Direct manipulation — 1:1 tracking
## 3. Interruptibility — the single most important principle
## 4. Behavior over animation — use springs
## 5. Velocity handoff — the seam between drag and animation
## 6. Momentum projection — animate to where the gesture is *going*
## 7. Spatial consistency — symmetric paths, anchored origins
## 8. Hint in the direction of the gesture
## 9. Rubber-banding — soft boundaries
## 10. Gesture design details (the "feel" checklist)
## 11. Frame-level smoothness
## 12. Materials & depth — translucency conveys hierarchy
## 13. Multimodal feedback — motion + sound + haptics
## 14. Reduced motion & accessibility
## 15. Typography — optical sizing, tracking, leading
## 16. Design foundations — the eight principles
## 17. Process
## Quick Reference
```

### 2.5. Substansi Teknis (dengan kutipan + implikasi dependency)

Bagian 3 (*Interruptibility*) menyatakan secara eksplisit bahwa CSS tidak cukup:

> "**Avoid CSS transitions and `@keyframes` for anything gesture-driven** — they can't be smoothly grabbed and reversed mid-flight. Springs animate from the current value by default, which is exactly what interruption needs."

Bagian 4 (*use springs*) menyediakan whitelist nilai konkret Apple:

| Interaction | Damping | Response |
| --- | --- | --- |
| Move / reposition (e.g. PiP) | `1.0` | `0.4` |
| Rotation | `0.8` | `0.4` |
| Drawer / sheet | `0.8` | `0.3` |

…dengan contoh kode yang bergantung pada library eksternal:

```js
import { animate } from 'motion';
animate(el, { y: 0 }, { type: 'spring', bounce: 0, duration: 0.4 });
```

Bagian 2 menuntut `setPointerCapture` dan pelacakan histori velocity per-`pointermove`.

Bagian 14 (*Reduced motion & accessibility*) menuntut tiga media query — `prefers-reduced-motion`, `prefers-reduced-transparency`, `prefers-contrast`:

> "**`prefers-reduced-motion: reduce`** — replace slides/springs/parallax with short opacity **cross-fades or static transitions**."

Bagian 16 merangkum delapan prinsip Apple (Purpose, Agency, Responsibility, Familiarity, Flexibility, Simplicity, Craft, Delight) — bagian ini **tidak bergantung pada library apa pun** dan berlaku universal sebagai checklist review desain.

### 2.6. Cara Pakai yang Dimaksudkan Penulis

Sumber: https://github.com/emilkowalski/skills/blob/main/README.md

README menyediakan satu perintah instalasi:

```bash
npx skills@latest add emilkowalski/skills
```

`skills` adalah CLI dari `vercel-labs/skills` (npm `skills@1.7.4`, "The open agent skills ecosystem"). Berdasarkan `https://raw.githubusercontent.com/vercel-labs/skills/main/docs/commands.md`:

- Default scope: **project** (`./<agent>/skills/`), sedangkan flag `-g, --global` memasang ke direktori user.
- `-s, --skill <name>` memasang skill spesifik saja.
- `--copy` menyalin berkas alih-alih symlink.

Berdasarkan `https://raw.githubusercontent.com/vercel-labs/skills/main/docs/agents.md` baris 20, untuk agent **Pi** CLI ini menargetkan direktori **`.agents/skills/`** (project) dan `~/.agents/skills/` (global) — **bukan** `.pi/skills/`. Pi sendiri memang mendukung kedua lokasi (lihat §3.1), tetapi perlu dicatat bahwa jalur default CLI tidak sama dengan jalur konvensi `.pi/`.

Di sisi model, `SKILL.md` menetapkan protokol pembuka pada heading *Initial Response*: bila skill dipanggil tanpa pertanyaan spesifik, model hanya boleh membalas satu kalimat pengantar dan tidak menambahkan informasi lain sampai user bertanya.

---

## 3. Mekanisme Isolasi Skill di Pi (dari Dokumentasi Lokal)

Semua kutipan di bawah berasal dari Pi Coding Agent v1.4.0 yang terpasang di `/home/tajjz/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/docs/`.

### 3.1. Apakah Pi mendukung project-local skills? Path persisnya?

**Ya.** Dari `docs/configuration.md`, tabel "Project `.pi` directory", baris 35:

```
| `.pi/skills/` | Project skills and supporting files. |
```

Ditambah dari `docs/skills.md`:

```
Place the skill in your user or project skills directory. Directories containing `SKILL.md` are discovered recursively.

Pi also supports the Agent Skills locations `~/.agents/skills/` and `.agents/skills/`. Project `.agents/skills/` directories are discovered from the working directory through its ancestors, stopping at the repository root when one exists.
```

Jadi tersedia **dua** lokasi project-scoped yang sah:

1. `.pi/skills/` — konvensi Pi sendiri.
2. `.agents/skills/` — lokasi Agent Skills spec (portabel lintas agent), di-discover **dari working directory hingga ancestor, berhenti di repo root**.

Karena sub-direktori di-discover rekursif, menaruh skill di `.pi/skills/apple-design/SKILL.md` sudah cukup; tidak perlu didaftarkan manual di settings.

Lokasi global (untuk perbandingan) dari `docs/configuration.md` baris 22:

```
| `<agent-dir>/skills/` | User [skills](skills.md) and supporting files. |
```

`<agent-dir>` default-nya `~/.pi/agent`, terbukti dari isi nyata `/home/tajjz/.pi/agent/skills/` yang hanya berisi `mattpocock-engineering -> /home/tajjz/.pi/agent/vendor/mattpocock-skills/skills/engineering` (symlink). **`apple-design` tidak ada di sana** — jadi belum ada benturan nama saat ini.

### 3.2. Aturan presedensi bila nama bertabrakan

Dari `docs/skills.md`:

```
Malformed `SKILL.md` files and declared skills without descriptions are not loaded. Name collisions keep the first discovered skill and produce a warning.
```

Presedensinya adalah **first-discovered wins**, bukan "project menimpa global". Karena itu:

- **Jangan** memasang `apple-design` versi global. Bila keduanya ada, hasilnya bergantung pada urutan scan, bukan pada niat Anda.
- Isolasi via `.pi/skills/` **tidak** menimpa skill global bernama sama — ia hanya menambah kandidat. Untuk isolasi yang deterministik, pastikan nama itu **tidak** ada di `~/.pi/agent/skills/` (kondisi saat ini terpenuhi).

### 3.3. Bisakah skill hanya tersedia di repo ini? Trade-off

**Ya** — `.pi/skills/` di-discover dari working directory. Namun ada **gate tambahan: project trust**. Dari `docs/security.md`:

```
Pi requires a project-trust decision when it finds any of these resources from the current working directory:
- `.pi/settings.json`
- `.pi/mcp.json`
- `.pi/extensions`, `.pi/skills`, `.pi/prompts`, or `.pi/themes`
- `.pi/SYSTEM.md` or `.pi/APPEND_SYSTEM.md`
- project `.agents/skills` in the current directory or an ancestor directory
```

```
Declining project trust skips those protected resources, except for the initial `sessionDir` lookup described above.
```

Untuk mesin ini gate tersebut **sudah lolos**: `/home/tajjz/.pi/agent/trust.json` memuat entri `"/home/tajjz/project/2026/DeutschEasier": true`. Tidak perlu tindakan tambahan.

Trade-off tiap opsi:

| Aspek | `.pi/skills/apple-design/` (vendored) | `~/.pi/agent/skills/` (global) | `~/.pi/agent/projects-memory/DeutschEasier/skills/` |
| --- | --- | --- | --- |
| Terlihat dari repo ini | Ya | Ya | **Tidak terbukti** (lihat catatan) |
| Terlihat dari repo lain | Tidak | **Ya — bocor** | Tidak |
| Polusi namespace global | Tidak | **Ya** | Tidak (jika berfungsi) |
| Masuk git | **Tidak** — `.pi/` di-`.gitignore` | Tidak relevan | Tidak relevan |
| Rekan tim dapat otomatis | **Tidak** | Tidak | Tidak |
| Ikut `git clone` | Tidak | Tidak | Tidak |
| Dapat di-audit / di-review | **Ya** (berkas nyata di disk, per-repo) | Ya | Ya, tapi di luar repo |
| Portabel ke agent lain | Ya (Agent Skills spec) | Ya | Tidak |
| Overhead repo | ~23 KB di disk, 0 byte di git | 0 | 0 |

Catatan penting mengenai `projects-memory`: direktori `/home/tajjz/.pi/agent/projects-memory/DeutschEasier/skills/` **ada tetapi kosong**, dan `docs/skills.md` / `docs/configuration.md` **tidak menyebutnya sama sekali**. Itu disediakan oleh paket `npm:pi-hermes-memory@0.9.10` (terpasang di `/home/tajjz/.pi/agent/settings.json`, "packages"), bukan oleh Pi core. Tidak ada bukti bahwa isinya benar-benar dimuat sebagai skill — perlakukan sebagai "belum terbukti".

Bukti `.gitignore` (repo ini, baris 1–11):

```
node_modules
dist
.env
.env.local
sqlite.db
sqlite.db-wal
sqlite.db-shm
deutsch_easier.db
.playwright-mcp/
.codegraph/
.pi/
```

Terverifikasi lewat `git check-ignore -v .pi/skills` → `.gitignore:11:.pi/	.pi/skills`. Artinya skill di `.pi/skills/` **tidak akan pernah ter-commit**. Ini disengaja: `.pi/` juga sudah menampung `todos/`, `HANDOFF-*.md`, dan `REPORT-*.md` sebagai artefak kerja lokal.

### 3.4. Bagaimana skill di-invoke? Apa itu `disable-model-invocation`?

Dari `docs/skills.md`:

```
At startup, Pi scans configured skill locations and adds each skill's name, description, and path to the system prompt. It does not add the full instructions.

When a task matches, the model reads `SKILL.md` and follows its instructions. This keeps detailed guidance out of context until it is needed. A model might fail to load a relevant skill, so use `/skill:name` when you need to force it.
```

```
Set `disable-model-invocation: true` in frontmatter when a skill should be available only through its explicit command. The `enableSkillCommands` [setting](settings.md) controls whether skill commands appear in interactive command discovery; manually entered `/skill:name` commands still work.
```

Jadi:

- **Dua jalur:** model-invoked (otomatis, berdasarkan `description`) dan slash command `/skill:apple-design`.
- `disable-model-invocation: true` → skill **hanya** bisa dipicu manual. Berguna untuk skill yang mahal atau mengubah alur kerja, agar tidak ke-trigger tanpa sengaja.
- `enableSkillCommands: false` (setting global `true`) → sembunyikan dari discovery command, tetapi pengetikan manual tetap jalan.
- Karena `apple-design` **tidak** memakai field ini, ia akan di-invoke otomatis bila `description`-nya cocok. Ini justru argumen tambahan untuk isolasi: skill selebar deskripsi itu ("interface design", "typography", "reduced-motion") berpotensi ter-trigger pada pekerjaan UI apa pun — nyaman bila memang diinginkan, mengganggu bila tidak.
- Biaya konteks: hanya `name` + `description` + `path` yang masuk system prompt saat startup. `description` skill ini ~450 karakter — kecil, tapi tetap permanen selama skill ter-discover.

### 3.5. Mekanisme plugin/extension untuk load skill on-demand?

**Ya, ada — dua mekanisme, keduanya tidak diperlukan di sini.**

**a) Pi packages** (`docs/packages.md`):

```
Project packages are installed and loaded only after project trust is resolved. [...] Use `--extension` or `-e` to try a package for one invocation without adding it to settings:
pi -e npm:@example/pi-tools
```

```
Personal installs are written to `~/.pi/agent/settings.json`. Add `--local` or `-l` to write the package declaration to `.pi/settings.json`.
```

Struktur paket minimal yang mendukung skill (`docs/packages.md`):

```
my-pi-package/
├── package.json
├── extensions/
├── skills/
├── prompts/
└── themes/
```

Ini jalur distribusi/berbagi tim, **bukan** jalur isolasi — dan untuk satu berkas `SKILL.md` ini adalah over-engineering yang jelas.

**b) Setting `skills` array** (`docs/settings.md` baris 156):

```
| `skills` | `string[]` | `[]` | Skill files or directories. |
```

Bisa dipakai di `.pi/settings.json` untuk menunjuk langsung ke satu path, mis. `".pi/skills/apple-design"`. Menambahkan berkas settings hanya untuk mendeklarasikan sesuatu yang sudah di-discover otomatis adalah langkah tanpa hasil — **rung 1 YAGNI: ini tidak perlu ada.**

Untuk load **on-demand per-invocation**, `pi -e <path>` bersifat sementara (tidak menyentuh settings). Namun ini juga tidak relevan karena `.pi/skills/` sudah otomatis per-repo.

---

## 4. Konteks Teknis DeutschEasier

### 4.1. Stack & Keputusan ADR-0001

Dari `package.json`: Vite `^6.1.0`, React `^18.3.1`, TypeScript `^5.7.3`, Tailwind `^4.3.3` (devDep), `clsx` + `tailwind-merge`. Animasi: **tidak ada**. `motion`, `framer-motion`, `@radix-ui/*`, `tailwindcss-animate` semuanya **tidak hadir**.

Dari `docs/adr/0001-tailwind-v4-and-component-strategy.md` (verbatim, poin 3 dan 4):

> "3. **Mempertahankan custom UI components** di `src/client/components/ui/` (`button.tsx`, `card.tsx`) berbasis `cn()` (`clsx` + `tailwind-merge`) tanpa memasang CLI penuh shadcn/ui (YAGNI). Primitif Radix UI hanya akan disalin secara modular jika dibutuhkan aksesibilitas WAI-ARIA kompleks."
> "4. **Menghapus dependensi `tailwindcss-animate`** dan menggantikannya dengan native CSS `@keyframes` di `src/client/index.css`."

### 4.2. Bukti Defisit Relevansi

Observasi langsung pada kode:

- `src/client/components/ui/` berisi **tepat 2 berkas**: `button.tsx` dan `card.tsx`. `button.tsx` hanya memakai `transition-colors` Tailwind + `:focus-visible:ring`.
- Animasi eksisting seluruhnya CSS murni di `src/client/index.css`: `@keyframes modalIn` (opacity + `scale(0.95)`) dan `@keyframes fadeIn` (opacity).
- ~199 kemunculan `transition-*` / `animate-*` / `duration-*` di `src/client/**/*.tsx` — semuanya kelas utility Tailwind, tanpa satu pun state machine gesture.
- **Tidak ada** `onPointerDown`, `setPointerCapture`, atau drag handler di seluruh `src/client`.
- **Tidak ada** satu pun `@media (prefers-reduced-motion)` — padahal ini justru bagian skill yang paling relevan (dan paling murah diterapkan).
- Pemakaian `backdrop-blur-*` ada di 5 berkas modal/kartu (mis. `KeyManagerModal.tsx:176`, `ScenarioFlashcards.tsx:265`) — bersinggungan dengan bagian 12 (*Materials & depth*), tetapi sebagai full-screen scrim, bukan *translucent chrome* yang dimaksud skill.
- Nol dependensi gesture/spring.

---

## 5. Verdict Relevansi (YAGNI)

**Verdict: MARGINAL — tunda adopsi. Jangan install sekarang.**

Alasan, berurut menurut kekuatan:

1. **~80% isi `apple-design` tidak dapat dieksekusi di repo ini.** Bagian 2, 3, 5, 6, 9 seluruhnya membutuhkan: (a) library spring (`motion`/`framer-motion`), dan (b) Pointer Events dengan `setPointerCapture`. Repo memiliki keduanya: nol. Menerapkannya berarti menambah dependency runtime baru — bertentangan langsung dengan poin 3 ADR-0001 ("tanpa memasang CLI penuh shadcn/ui (YAGNI)").
2. **Tidak ada gesture surface yang perlu di-spring.** Aplikasi ini berisi kuis, flashcard, dan panel grammar — interaksi klik/ketik. Modal buka-tutup dengan `scale(0.95) → 1` sudah memadai; secara teknis bagian 3 skill bahkan akan menyarankan mengganti `@keyframes` dengan spring, tetapi **tidak ada** gesture interruptible untuk di-spring-kan. Ini menukar CSS tanpa dependency dengan JS + dependency demi nol manfaat.
3. **Bagian yang benar-benar relevan hanya dua, dan keduanya murah diaplikasikan tanpa skill:**
   - Bagian 14 (`prefers-reduced-motion`) — repo belum punya sama sekali. Ini aksesibilitas nyata, dan **tidak butuh AI** untuk menambahkannya.
   - Bagian 16 (delapan prinsip desain) — checklist review manual, tidak butuh tooling.
4. **`description` skill sangat lebar.** Ia akan cocok pada hampir setiap tugas UI ("typography", "interface design", "restraint"). Bila terpasang, ia akan sering masuk pertimbangan model walau tugasnya sekadar mengubah warna tombol — biaya atensi tanpa hasil.

**Kapan adopsi menjadi masuk akal (trigger konkret):**

- Muncul fitur **drag/swipe** yang nyata, mis. flashcard swipe-to-rate (kiri = belum hafal, kanan = sudah hafal) dengan `pointerdown` + `setPointerCapture`.
- Muncul bottom sheet / drawer yang perlu interruptible.
- Tim memutuskan mengadopsi `motion` sebagai dependency runtime.

Ketiga pemicu di atas adalah **scope baru**, bukan pekerjaan yang ada. Sampai salah satunya terjadi, menyalin 23 KB instruksi yang 80%-nya tidak dapat dieksekusi adalah beban mati.

**Interaksi dengan ADR-0001:** tidak ada konflik langsung, tetapi ada dua titik gesek.

- ADR-0001 poin 4 memilih native CSS `@keyframes` sebagai pengganti `tailwindcss-animate`. Bagian 3 `apple-design` **secara eksplisit menolak** `@keyframes` untuk apa pun yang gesture-driven. Untuk modal (non-gesture) keduanya sepakat — `@keyframes` tetap sah. Jadi ADR **tidak perlu diamandemen**; yang perlu dicatat adalah bahwa kesimpulan skill hanya berlaku pada permukaan gesture yang belum ada.
- Bagian 15 (*Typography — optical sizing, tracking, leading*) menyentuh desain tipografi. ADR-0001 menunda migrasi Tailwind v4 demi menghindari risiko visual regression. Menerapkan perubahan `tracking`/`leading` bersamaan dengan itu akan mencampur dua sumber regresi visual. **Jangan gabungkan keduanya dalam satu PR.**

---

## 6. Opsi Integrasi Isolated & Rekomendasi

### 6.1. Perbandingan Tiga Opsi

| Kriteria | **A. Vendored `.pi/skills/`** | B. `projects-memory` | C. Global `~/.pi/agent/skills/` |
| --- | --- | --- | --- |
| Bocor ke proyek lain | **Tidak** | Tidak | **Ya** |
| Polusi namespace global | **Tidak** | Tidak | **Ya** |
| Mekanisme terdokumentasi | **Ya** (`configuration.md:35`) | Tidak (`MEMORY.md` saja) | Ya (`configuration.md:22`) |
| Dapat di-audit per-repo | **Ya** | Tidak | Ya, tapi bukan per-repo |
| Nol jejak di git | **Ya** (`.gitignore:11`) | Ya | Ya |
| Rekan tim dapat otomatis | Tidak | Tidak | Tidak |
| Update dari upstream | Manual `curl` / `npx skills add` | Manual | Manual |
| Risiko | Drift dari upstream | **Tidak terbukti dimuat** | Bocor + `description` lebar men-trigger skill di repo lain |

### 6.2. Rekomendasi: Opsi A (`.pi/skills/apple-design/`)

Hanya opsi A yang memenuhi ketiga syarat sekaligus: (1) mekanisme yang **terdokumentasi resmi** oleh Pi, (2) **tidak** muncul di proyek lain, (3) **tidak** menyentuh `~/.pi/agent/settings.json` maupun `~/.pi/agent/skills/`.

Konsekuensi yang harus diterima secara sadar:

- Skill ini **tidak** ikut `git clone`. Kolaborator lain harus menjalankan perintah yang sama.
- Setiap kali `main` di upstream berubah, salinan lokal menjadi basi. Tidak ada tag rilis, jadi tidak ada versi untuk di-pin.
- Pi akan meminta *project trust* pada pertama kali menjalankannya — untuk DeutschEasier trust **sudah** diberikan (`trust.json: "/home/tajjz/project/2026/DeutschEasier": true`).

### 6.3. Perintah Copy-Paste

**Bila memutuskan mengadopsi** (jalankan dari root repo; tidak ada perubahan pada `package.json`):

```bash
cd /home/tajjz/project/2026/DeutschEasier

# 1. Salin skill (apple-design adalah single-file: hanya SKILL.md, tanpa references/)
mkdir -p .pi/skills/apple-design
curl -fsSL "https://raw.githubusercontent.com/emilkowalski/skills/main/skills/apple-design/SKILL.md" \
  -o .pi/skills/apple-design/SKILL.md

# 2. Simpan catatan provenance (upstream tidak punya tag rilis → pin commit SHA)
curl -fsSL "https://api.github.com/repos/emilkowalski/skills/commits?path=skills/apple-design/SKILL.md&per_page=1" \
  | grep -m1 '"sha"' > .pi/skills/apple-design/.upstream-sha

# 3. Verifikasi: skill TIDAK boleh muncul di git, dan tidak ada duplikat global
git check-ignore -v .pi/skills/apple-design/SKILL.md   # harus → .gitignore:11:.pi/
ls ~/.pi/agent/skills/ | grep -i apple || echo "OK: tidak ada apple-design global"

# 4. Verifikasi di Pi
#    /reload    → muat ulang resource tanpa restart
#    /skill:apple-design  → paksa invoke, konfirmasi skill terdaftar
```

**Untuk membatalkan** (zero residual — cukup hapus direktori):

```bash
rm -rf /home/tajjz/project/2026/DeutschEasier/.pi/skills/apple-design
```

Karena `.pi/` di-`.gitignore`, pembatalannya **tidak meninggalkan diff git apa pun**.

**Sebagai alternatif tanpa meninggalkan berkas permanen** (satu sesi saja, tidak mengubah settings — lihat `docs/packages.md` tentang `-e`):

```bash
cd /home/tajjz/project/2026/DeutschEasier
pi -e "https://github.com/emilkowalski/skills"   # tidak dipakai: menarik 15 skill sekaligus
```

Opsi `-e` di atas **tidak direkomendasikan**: ia memuat seluruh repo 15 skill, mendistorsi `description` routing untuk satu skill yang mungkin tidak dipakai. Jauh lebih tepat memakai Opsi A + `rm -rf` bila sudah selesai.

**Yang secara eksplisit TIDAK direkomendasikan:**

```bash
# JANGAN — memasang ke global namespace, bocor ke semua proyek
npx skills add emilkowalski/skills -g

# JANGAN — default CLI menulis ke .agents/skills/, path berbeda dari konvensi .pi/ repo ini
npx skills add emilkowalski/skills
```

Perintah `npx skills add` baris kedua memang project-scoped, tetapi menulis ke `.agents/skills/` (per `docs/agents.md:20`), bukan `.pi/skills/`. Itu menciptakan konvensi direktori baru di repo yang saat ini tidak memilikinya. Konsisten pada satu jalur.

---

## 7. Yang Tidak Terbukti

Bagian ini mencatat klaim yang **tidak** berhasil diverifikasi, agar tidak terbaca sebagai kepastian.

1. **Repo `github.com/emilkowalski/skills` terverifikasi nyata** — tetapi saya tidak dapat mengakses GitHub melalui `web_search`/`fetch_content`; semua data repo diperoleh via `curl` ke `api.github.com` dan `raw.githubusercontent.com`. Isi `SKILL.md`, `README.md`, `LICENSE`, dan `performance-cheatsheet.md` adalah byte asli dari `raw.githubusercontent.com` (ukuran cocok dengan tree API: 23.036 / 4.590 / 1.070 / 932 byte), bukan rekonstruksi.
2. **Tidak ada tag rilis** (`/tags` → `[]`). Tidak ada versi semantik yang bisa di-pin; "pin commit SHA" di §6.3 adalah mitigasi, bukan pengganti rilis.
3. **`projects-memory/DeutschEasier/skills/` tidak terbukti dimuat sebagai skill.** Direktori ada tetapi kosong, dan `docs/skills.md` maupun `docs/configuration.md` tidak menyebut lokasi ini. Disponsori paket `pi-hermes-memory`, bukan Pi core. Opsi B karena itu **tidak** saya rekomendasikan.
4. **Perilaku konkret `npx skills add ... --agent pi`** tidak diuji. Yang terbukti hanya dokumentasi `docs/agents.md:20` yang memetakan Pi ke `.agents/skills/`. Apakah CLI menulis symlink atau copy, dan apakah Pi memindainya tanpa masalah, tidak diverifikasi secara langsung (dan tidak boleh — ada larangan instalasi pada tugas ini).
5. **Tidak ada pernyataan eksplisit soal presedensi project-vs-user skill** selain kalimat "keep the first discovered skill and produce a warning". Urutan scan konkret antara `.pi/skills/` dan `~/.pi/agent/skills/` tidak didokumentasikan. Karena `apple-design` belum ada di global, ambiguitas ini **tidak berdampak** saat ini — tetapi akan berdampak bila kelak ada yang memasangnya global.
6. **Kualitas/fakta skill tidak diaudit.** Skill mengklaim bersumber dari WWDC (khususnya *Designing Fluid Interfaces*, WWDC 2018) dan menyebut "Apple's eight principles (WWDC 2026)" di commit `2026-07-09`. Saya **tidak** memverifikasi bahwa angka-angka di tabel (damping `1.0`/response `0.4`, `d ≈ 0.998`) benar-benar sesuai materi Apple. Itu klaim penulis, bukan temuan terverifikasi.
7. **Jumlah baris 290 / 23.036 byte** sesuai `wc`; tidak ada berkas referensi tambahan yang terlewat — dibuktikan oleh tree API yang menyatakan `"truncated": false`, dan `skills/apple-design/` hanya berisi satu blob.

---

## 8. Rujukan Sumber Primer

1. **Repo skill (Emil Kowalski):**
   - `https://github.com/emilkowalski/skills` — README, daftar 15 skill, perintah `npx skills@latest add`.
   - `https://raw.githubusercontent.com/emilkowalski/skills/main/skills/apple-design/SKILL.md` — isi lengkap skill (frontmatter, 17 bagian, Quick Reference).
   - `https://raw.githubusercontent.com/emilkowalski/skills/main/LICENSE` — MIT, "Copyright (c) 2026 Emil Kowalski".
   - `https://raw.githubusercontent.com/emilkowalski/skills/main/performance-cheatsheet.md` — tabel 7 baris, tidak termasuk dalam `apple-design/SKILL.md`.
   - `https://api.github.com/repos/emilkowalski/skills` — metadata (bintang, lisensi, tanggal).
   - `https://api.github.com/repos/emilkowalski/skills/git/trees/main?recursive=1` — daftar berkas + ukuran byte.
2. **CLI `skills` (vercel-labs):**
   - `https://raw.githubusercontent.com/vercel-labs/skills/main/README.md` — scope install, `-g` untuk global.
   - `https://raw.githubusercontent.com/vercel-labs/skills/main/docs/commands.md` — tabel opsi `skills add`, tabel "Installation Scope".
   - `https://raw.githubusercontent.com/vercel-labs/skills/main/docs/agents.md` — baris 20: Pi → `.agents/skills/`, `~/.agents/skills/`.
3. **Dokumentasi Pi Coding Agent (lokal, v1.4.0):**
   - `/home/tajjz/.bun/install/global/node_modules/@earendil-works/pi-coding-agent/docs/skills.md` — discovery, frontmatter, `disable-model-invocation`, name collision.
   - `.../docs/configuration.md` — baris 22 (`<agent-dir>/skills/`), baris 35 (`.pi/skills/`).
   - `.../docs/settings.md` — baris 156 (`skills` array), baris 159 (`enableSkillCommands`).
   - `.../docs/security.md` — "Resources protected by project trust".
   - `.../docs/packages.md` — struktur paket, `pi -e`, `--local`.
