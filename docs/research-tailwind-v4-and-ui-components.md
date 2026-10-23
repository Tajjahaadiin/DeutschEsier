# Riset Teknis: Migrasi Tailwind CSS v4 & Evaluasi Adopsi Component Library untuk DeutschEasier

**Tanggal Dokumen:** Maret 2025  
**Target Repository:** DeutschEasier (`Vite 6.1.0`, `React 18.3.1`, `Tailwind CSS 3.4.17`, `tailwindcss-animate 1.0.7`)  
**Penulis:** Research Subagent (Technical Architecture)

---

## 1. Ringkasan Eksekutif & Rekomendasi Utama

Repo DeutschEasier saat ini menggunakan arsitektur Single Page Application (SPA) berbasis Vite 6 dan React 18 dengan sistem styling Tailwind CSS 3.4.17. Struktur UI yang ada di `src/client/components/ui/` (`button.tsx`, `card.tsx`) telah mengadopsi konvensi utilitas `cn()` (`clsx` + `tailwind-merge`) yang dipopulerkan oleh ekosistem shadcn/ui, namun tanpa instalasi CLI penuh.

Berdasarkan investigasi teknis mendalam:
1. **Migrasi ke Tailwind CSS v4 Sangat Direkomendasikan:**
   - Tailwind v4 menghadirkan engine baru berbasis Rust (Oxide) dengan performa build hingga 10x lebih cepat.
   - Dengan plugin resmi `@tailwindcss/vite`, DeutschEasier dapat menghapus `postcss.config.js`, `postcss`, dan `autoprefixer` sepenuhnya karena integrasi Lightning CSS bawaan sudah menangani vendor-prefixing dan inlining CSS.
   - `tailwindcss-animate` telah **resmi didepresiasi** di ekosistem v4 (digantikan oleh `tw-animate-css` atau animasi native). Audit pada repo DeutschEasier menunjukkan bahwa kelas animasi dari plugin ini bahkan **tidak digunakan sama sekali** dalam kode aplikasi; paket ini hanyalah *leftover boilerplate* yang aman dihapus 100%.
2. **Evaluasi Component Library: Pertahankan Custom Component (Pola shadcn-lite) & Tolak Chakra UI v3:**
   - **Tolak Chakra UI v3:** Mengadopsi Chakra UI v3 adalah *antipattern* untuk repo ini. Chakra v3 membawa runtime styling berbasis Emotion, fondasi headless Ark UI terpisah, dan paradigma *style props* (`<Box>`, `<Flex>`) yang bertabrakan langsung dengan arsitektur Tailwind CSS, serta menambah *bundle overhead* ~45 KB hingga 180+ KB gzipped.
   - **Pertahankan Custom Components Saat Ini:** Pola yang ada di `src/client/components/ui/` sudah tepat guna (zero overhead, YAGNI, mudah dimodifikasi).
   - **Adopsi shadcn/ui Secara Selektif (On-Demand):** Tidak perlu migrasi massal. Ketika tim membutuhkan komponen interaktif kompleks dengan standar aksesibilitas tinggi (WAI-ARIA) seperti modal dialog (`KeyManagerModal`, `SubmissionAnalyticsModal`) atau *dropdown/popover*, salin primitif shadcn/ui berbasis `@radix-ui/react-*` secara spesifik tanpa menambah runtime CSS eksternal.

---

## 2. Investigasi Migrasi Tailwind CSS v4

### 2.1. Breaking Changes & Perubahan Arsitektur Utama

Tailwind CSS v4.0 merupakan perombakan arsitektural total dari framework. Berikut adalah perubahan breaking yang relevan untuk DeutschEasier:

1. **CSS-First Configuration (Penggantian `tailwind.config.js` dengan `@theme`):**
   - Di v3, konfigurasi dilakukan di JavaScript (`tailwind.config.js`).
   - Di v4, konfigurasi dilakukan langsung di file CSS utama menggunakan direktif `@theme`. Semua token desain dikompilasi menjadi native CSS Custom Properties (`--color-*`, `--spacing-*`, dll.) yang diinjeksikan pada `:root`.
   - File `tailwind.config.js` tidak lagi diperlukan secara *default* (meskipun dapat dimuat via direktif `@config` untuk backward compatibility).

2. **Penghapusan Direktif `@tailwind`:**
   - Sintaks v3:
     ```css
     @tailwind base;
     @tailwind components;
     @tailwind utilities;
     ```
   - Sintaks v4 digantikan oleh satu baris impor standar CSS:
     ```css
     @import "tailwindcss";
     ```

3. **Deteksi Konten Otomatis (Penghapusan Array `content: []`):**
   - Di v3, pengembang wajib mendefinisikan array `content` (misal: `content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"]`).
   - Di v4, engine Oxide memindai seluruh direktori proyek secara otomatis (mengecualikan file di `.gitignore`, binary, dan `node_modules`). Jika ada path khusus di luar direktori kerja atau paket node_modules tertentu yang perlu dipindai, digunakan direktif `@source`.

4. **Default Border Color Berubah ke `currentColor`:**
   - Pada v3, utility `border` atau `border-t` secara implisit memberikan warna `colors.gray.200` (`#e5e7eb`).
   - Pada v4, utility `border` menggunakan `currentColor` (standar perilaku browser) agar tidak memaksakan warna abu-abu default.
   - *Dampak pada DeutschEasier:* Elemen seperti card atau divider yang hanya menuliskan `border` tanpa kelas warna eksplisit akan berubah warna mengikuti warna teks jika tidak diberikan warna eksplisit (misal `border-slate-200`) atau shim kompatibilitas di `@layer base`.

5. **Perubahan Utilitas & Penamaan Skala:**
   - Utilitas opasitas lama yang sudah deprecated (`bg-opacity-*`, `text-opacity-*`, `border-opacity-*`) dihapus total; wajib menggunakan modifier opasitas modern (`bg-black/50`, `text-slate-700/80`).
   - Skala penamaan shadow dan blur diselaraskan: `shadow-sm` lama di v3 menjadi `shadow-xs` di v4, sedangkan `shadow` lama menjadi `shadow-sm`.
   - `outline-none` diganti namanya menjadi `outline-hidden` (karena utilitas baru `outline-none` kini benar-benar menghasilkan `outline-style: none`).
   - Utilitas `ring` default berubah dari lebar 3px (warna blue-500) menjadi 1px (warna `currentColor`). Jika membutuhkan ring 3px, gunakan kelas eksplisit `ring-3`.

6. **Perubahan Selektor `space-y-*` dan `divide-y-*`:**
   - Di v3 digunakan selektor lobotomized owl `> :not([hidden]) ~ :not([hidden])`.
   - Di v4 digunakan selektor berbasis child `:not(:last-child)` dengan `margin-bottom` demi optimasi performa rendering pada halaman besar.

7. **Persyaratan Browser Modern:**
   - Tailwind v4 menargetkan browser modern: Safari 16.4+, Chrome 111+, Firefox 128+.
   - Fitur inti v4 mengandalkan fitur CSS standar baru seperti `@property` dan `color-mix()`. Untuk aplikasi DeutschEasier (aplikasi modern yang telah menggunakan SpeechSynthesis / AudioContext), baseline browser ini sepenuhnya terpenuhi.

---

### 2.2. Kompatibilitas Plugin & Build Tooling: `@tailwindcss/vite` vs `@tailwindcss/postcss`

DeutschEasier saat ini menggunakan **Vite 6.1.0** dengan `package.json` bertipe `"type": "module"`.

#### Komparasi Tooling:
| Fitur / Karakteristik | PostCSS Plugin (`@tailwindcss/postcss`) | Vite Plugin Resmi (`@tailwindcss/vite`) |
| :--- | :--- | :--- |
| **Paket NPM** | `@tailwindcss/postcss` + `postcss` | `@tailwindcss/vite` |
| **Arsitektur Pipeline** | Mengalir melalui runner PostCSS generik | Terintegrasi langsung ke dalam Vite transform pipeline & Rollup AST |
| **Performa HMR & Build** | Cepat, tapi ada overhead serialization PostCSS AST | Maksimal; scanner Rust Oxide langsung memantau modul Vite graph |
| **Penanganan Vendor Prefixing** | Membutuhkan `autoprefixer` terpisah | Ditangani internal oleh Lightning CSS bawaan |
| **Penanganan `@import` CSS** | Membutuhkan `postcss-import` | Ditangani internal oleh Tailwind v4 engine |
| **Konfigurasi Berkas** | Butuh `postcss.config.js` | Cukup ditambahkan ke `plugins: [react(), tailwindcss()]` di `vite.config.ts` |
| **Rekomendasi Resmi** | Disarankan hanya untuk Next.js / Webpack / CLI non-Vite | **Sangat direkomendasikan untuk proyek berbasis Vite** |

#### Dampak pada File Proyek:
Dengan memilih `@tailwindcss/vite`:
1. File `postcss.config.js` dapat **dihapus sepenuhnya**.
2. Dependensi `autoprefixer` dan `postcss` dapat di-*uninstall*.
3. `vite.config.ts` diperbarui menjadi:
   ```ts
   import { defineConfig } from 'vite'
   import react from '@vitejs/plugin-react'
   import tailwindcss from '@tailwindcss/vite'
   import path from 'path'

   export default defineConfig({
     plugins: [
       react(),
       tailwindcss(),
     ],
     resolve: {
       alias: {
         '@': path.resolve(__dirname, './src'),
       },
     },
     server: {
       proxy: {
         '/api': {
           target: 'http://localhost:3001',
           changeOrigin: true,
         },
       },
     },
   })
   ```

---

### 2.3. Status `tailwindcss-animate` di Tailwind v4

#### Fakta Teknis:
1. **Deprecasi Resmi:**  
   Pada 19 Maret 2025, pembuat shadcn/ui secara resmi menutup pull request #6968 dan memperbarui dokumentasi resmi bahwa paket `tailwindcss-animate` telah **didepresiasi**.  
   Alasannya: `tailwindcss-animate` dibangun dengan JavaScript Plugin API versi Tailwind v2/v3 (`plugin(({ addUtilities, theme }) => ...)`). Pada Tailwind v4 yang mengusung arsitektur *CSS-first*, plugin JavaScript semacam ini tidak lagi selaras dengan `@theme` dan menimbulkan masalah resolusi properti animasi custom.
2. **Pengganti Standar Komunitas:**  
   Komunitas dan shadcn/ui merekomendasikan paket CSS murni: `tw-animate-css` (`@import "tw-animate-css";`), yang mendefinisikan keyframe dan kelas utilitas animasi (`animate-in`, `fade-in`, `zoom-in`, `slide-in-from-*`) langsung dalam sintaks native CSS.
3. **Audit Penggunaan di Repo DeutschEasier:**  
   Pemeriksaan menyeluruh pada seluruh komponen (`src/client/components/`, `src/client/pages/`) menunjukkan bahwa:
   - Tidak ada satu pun berkas yang memanggil kelas khas `tailwindcss-animate` seperti `animate-in`, `fade-in`, `zoom-out`, dsb.
   - Kelas animasi yang digunakan hanyalah animasi standar bawaan Tailwind seperti `animate-spin` pada ikon loading (tersedia secara native di Tailwind v4).
   - Dependensi `"tailwindcss-animate": "^1.0.7"` pada `package.json` dan deklarasinya di `tailwind.config.js` hanyalah sisa dari template *copy-paste* awal.
4. **Kesimpulan untuk DeutschEasier:**  
   Repo ini **tidak memerlukan `tw-animate-css` maupun `tailwindcss-animate`**. Paket `tailwindcss-animate` dapat langsung dihapus dari `package.json` tanpa efek samping visual.

---

### 2.4. Rencana Migrasi Berkas Konfigurasi CSS DeutschEasier

Saat ini `src/client/index.css` berisi:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 210 40% 98%;
    --foreground: 222.2 84% 4.9%;
  }
}
body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
```

Format migrasi ke Tailwind v4 yang bersih dan idiomatik:
```css
@import "tailwindcss";

@layer base {
  :root {
    --background: hsl(210 40% 98%);
    --foreground: hsl(222.2 84% 4.9%);
  }

  /* Shim kompatibilitas border default v3 agar tidak terpengaruh breaking change currentColor */
  *,
  ::after,
  ::before,
  ::backdrop,
  ::file-selector-button {
    border-color: var(--color-slate-200, currentColor);
  }
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}

body {
  background-color: var(--color-background);
  color: var(--color-foreground);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
```

---

## 3. Evaluasi Adopsi Component Library

Dalam pengembangan frontend DeutschEasier, terdapat tiga opsi arsitektur komponen UI:
- **Opsi 1 (Status Quo):** Custom Components berbasis utilitas `clsx` + `tailwind-merge` (`cn()`) di `src/client/components/ui/`.
- **Opsi 2:** Adopsi shadcn/ui penuh (berbasis Radix UI / Base UI headless primitives dengan styling Tailwind CSS).
- **Opsi 3:** Migrasi ke Chakra UI v3 (arsitektur baru berbasis Ark UI + Emotion).

### 3.1. Matriks Perbandingan Komprehensif

| Kriteria Evaluasi | Opsi 1: Custom UI (Status Quo) | Opsi 2: shadcn/ui | Opsi 3: Chakra UI v3 |
| :--- | :--- | :--- | :--- |
| **Distribusi Kode** | Lokal (ditulis tangan di dalam repo) | Salin kode sumber ke repo via CLI/manual | Paket NPM (`@chakra-ui/react`, `@emotion/react`) |
| **Engine Styling** | Tailwind CSS murni (Build-time) | Tailwind CSS murni (Build-time) | Emotion CSS-in-JS (Runtime style compilation) |
| **Dampak Bundle Size** | **0 KB runtime overhead** (hanya `clsx` & `tw-merge` ~2 KB yang sudah ada) | **Sangat kecil** (0 KB CSS runtime; hanya dependensi primitif Radix ~5-10 KB per komponen interaktif) | **Tinggi:** +45 KB hingga 180+ KB gzipped (Emotion runtime + Chakra core + Ark UI state machines) |
| **Kompatibilitas Tailwind v4** | **100% Native** | **100% Didukung Penuh** (CLI resmi mendukung `@theme inline` dan Tailwind v4 per awal 2025) | **Inkompatibel secara filosofis**; berjalan terpisah dengan styling props sendiri |
| **Aksesibilitas (a11y)** | Tergantung implementasi manual tim | Sangat tinggi (dijamin oleh WAI-ARIA Radix UI / Base UI) | Tinggi (dijamin oleh Ark UI & statecharts Zag.js) |
| **Kompleksitas Maintenance** | Sangat Rendah; kode transparan, tidak ada abstraksi pihak ketiga | Rendah-Sedang; kode menjadi milik repo, upgrade primitif via npm | Tinggi; terikat breaking changes major version, snippet CLI, dan konfigurasi Provider |
| **Kesesuaian Arsitektur SPA Vite** | Sempurna; tidak ada setup khusus | Sempurna; path alias `@/components/ui` sudah siap | Membutuhkan setup `Provider`, snippet CLI, penyesuaian tsconfig paths |
| **Gaya Penulisan Kode** | Utility class strings (`className="..."`) | Utility class strings (`className="..."`) | Style props (`<Box p={4} bg="blue.500">`) |

---

### 3.2. Analisis Opsi: Mengapa Chakra UI v3 Tidak Tepat untuk DeutschEasier

1. **Konflik Paradigma Styling:**
   DeutschEasier dibangun dari awal dengan utility classes Tailwind CSS (seperti `bg-slate-50`, `flex items-center gap-2`, `rounded-xl border`). Mengadopsi Chakra UI v3 mengharuskan tim menulis ulang kode menjadi style props (`<Box bg="slate.50">`, `<HStack gap={2}>`) atau membungkus komponen Chakra dengan kelas Tailwind, yang menciptakan inkonsistensi desain dan duplikasi CSS.
2. **Runtime Overhead:**
   Chakra UI v3 mengandalkan Emotion untuk menghitung dan menginjeksi CSS di browser saat aplikasi berjalan (*runtime style resolution*). Untuk aplikasi edukasi interaktif yang memproses kuis real-time, audio TTS, dan audio synchronization, runtime overhead ini membebani main-thread tanpa memberikan keuntungan nyata dibandingkan zero-runtime Tailwind CSS.
3. **Penyimpangan Prinsip YAGNI:**
   Chakra UI v3 membawa sistem tema kompleks (`createSystem`, recipes, semantic tokens, snippet generator). Kebutuhan DeutschEasier saat ini hanyalah beberapa elemen tombol, kartu, badge, dan modal. Memasang Chakra UI v3 melanggar hierarki efisiensi pengembangan (*over-engineering*).

---

### 3.3. Analisis Opsi: shadcn/ui vs Custom Components

1. **Kesamaan Fundamental:**
   Keduanya menganut filosofi yang sama: komponen tidak disembunyikan di dalam `node_modules`, melainkan tinggal langsung di dalam repositori (`src/client/components/ui/`), menggunakan `cn()` untuk penggabungan kelas kondisional, dan digayakan menggunakan Tailwind CSS murni.
2. **Kapan Custom Components Cukup?**
   Untuk komponen presentasional seperti `Button`, `Card`, `Badge`, `Avatar`, atau `Input`, menulis 10-20 baris kode native HTML + Tailwind seperti yang ada di `src/client/components/ui/button.tsx` jauh lebih ringkas, tidak membutuhkan dependensi eksternal, dan langsung bekerja tanpa konfigurasi CLI.
3. **Kapan shadcn/ui (Radix UI Primitives) Dibutuhkan?**
   Saat ini, modal dialog di DeutschEasier (`KeyManagerModal.tsx` dan `SubmissionAnalyticsModal.tsx`) menggunakan implementasi manual:
   ```tsx
   if (!isOpen) return null
   return (
     <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
       ...
     </div>
   )
   ```
   Implementasi manual ini memiliki keterbatasan aksesibilitas: belum memiliki *focus trap* otomatis, *escape key listener* manual, scroll-lock browser, dan pengumuman pembaca layar (screen reader `aria-modal`).  
   Mengadopsi pola shadcn/ui untuk komponen kompleks seperti **Dialog/Modal** (`@radix-ui/react-dialog`) atau **Dropdown Menu** memberikan jaminan aksesibilitas standar industri tanpa mengorbankan performa bundle.

---

## 4. Rekomendasi Arsitektur & Langkah Implementasi

### 4.1. Rekomendasi Definitif
1. **Lakukan Migrasi ke Tailwind CSS v4:**
   - Gunakan `@tailwindcss/vite` untuk menyederhanakan pipeline build Vite 6.
   - Hapus `postcss.config.js`, `postcss`, `autoprefixer`, dan `tailwindcss-animate`.
   - Ubah konfigurasi di `src/client/index.css` menggunakan format `@import "tailwindcss";` dan `@theme inline`.
2. **Pertahankan Arsitektur Custom Component (Pola shadcn-lite):**
   - Tetap gunakan folder `src/client/components/ui/` dengan utilitas `cn()` (`clsx` + `tailwind-merge`).
   - Jangan instal paket Chakra UI v3.
   - Jika di masa mendatang dibutuhkan komponen dialog/modal atau popover yang lebih kompleks dan aksesibel, adopsi kode primitif shadcn/ui (menggunakan `@radix-ui/react-dialog`) secara modular per komponen tanpa perlu menginstal CLI framework besar.

---

### 4.2. Panduan Langkah Demi Langkah (Step-by-Step Implementation Plan)

#### Langkah 1: Pembersihan Dependensi Lama & Instalasi Tailwind v4
Jalankan penghapusan paket yang tidak lagi diperlukan:
```bash
npm uninstall postcss autoprefixer tailwindcss-animate
```

Hapus file `postcss.config.js` dari root repositori:
```bash
rm postcss.config.js
```

Instal Tailwind CSS v4 dan plugin Vite resmi:
```bash
npm install -D tailwindcss@^4.0.0 @tailwindcss/vite@^4.0.0
```

#### Langkah 2: Perbarui Konfigurasi Vite (`vite.config.ts`)
Tambahkan plugin `@tailwindcss/vite`:
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
```

#### Langkah 3: Perbarui File CSS (`src/client/index.css`) & Hapus `tailwind.config.js`
Ganti isi `src/client/index.css` dengan konfigurasi CSS-first v4:
```css
@import "tailwindcss";

@layer base {
  :root {
    --background: hsl(210 40% 98%);
    --foreground: hsl(222.2 84% 4.9%);
  }

  /* Menjaga kompatibilitas warna border default agar sesuai v3 (slate-200) */
  *,
  ::after,
  ::before,
  ::backdrop,
  ::file-selector-button {
    border-color: var(--color-slate-200, currentColor);
  }
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}

body {
  background-color: var(--color-background);
  color: var(--color-foreground);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
```

Hapus berkas `tailwind.config.js` karena seluruh konfigurasi telah berpindah ke CSS:
```bash
rm tailwind.config.js
```

#### Langkah 4: Validasi & Uji Coba
1. Jalankan development server:
   ```bash
   npm run dev:client
   ```
2. Jalankan build produksi untuk memverifikasi Lightning CSS minification:
   ```bash
   npm run build:client
   ```
3. Lakukan pengujian regresi visual pada halaman utama (`HomePage`), pembuat skenario (`GeneratorPage`), dan tampilan belajar siswa (`ViewPage`).

---

## 5. Rujukan Sumber Primer (Primary Sources)

1. **Tailwind CSS v4 Official Documentation & Upgrade Guide:**
   - *Upgrade Guide (v3 to v4):* [tailwindcss.com/docs/upgrade-guide](https://tailwindcss.com/docs/upgrade-guide) — Dokumentasi resmi breaking changes, penggantian direktif `@tailwind`, penghapusan `content: []`, dan default border color.
   - *Vite Integration Guide:* [tailwindcss.com/docs/installation/using-vite](https://tailwindcss.com/docs/installation/using-vite) — Panduan resmi penggunaan `@tailwindcss/vite` dan eliminasi dependensi PostCSS/Autoprefixer.
   - *Theme & Directives:* [tailwindcss.com/docs/theme](https://tailwindcss.com/docs/theme) — Penjelasan direktif `@theme` dan `@theme inline`.
2. **shadcn/ui Documentation & Pull Requests:**
   - *Tailwind v4 Guide:* [ui.shadcn.com/docs/tailwind-v4](https://ui.shadcn.com/docs/tailwind-v4) — Panduan adopsi Tailwind v4, React 19/18 compatibility, serta konversi CSS variables ke `@theme inline`.
   - *Deprecasi `tailwindcss-animate`:* [Pull Request #6968 (shadcn-ui/ui)](https://github.com/shadcn-ui/ui/pull/6968) — Penggantian `tailwindcss-animate` dengan `tw-animate-css` pada 19 Maret 2025.
3. **Chakra UI v3 Official Documentation & Release Notes:**
   - *Announcing Chakra v3:* [chakra-ui.com/blog/announcing-v3](https://chakra-ui.com/blog/announcing-v3) — Rilis arsitektur v3 berbasis Ark UI, penghapusan Framer Motion, dan adopsi recipe styling system.
   - *Using Chakra in Vite:* [chakra-ui.com/docs/get-started/frameworks/vite](https://chakra-ui.com/docs/get-started/frameworks/vite) — Persyaratan instalasi `@chakra-ui/react`, `@emotion/react`, dan konfigurasi snippet CLI.
4. **tw-animate-css Package:**
   - *NPM Registry & Source:* [npmjs.com/package/tw-animate-css](https://www.npmjs.com/package/tw-animate-css) / [github.com/Wombosvideo/tw-animate-css](https://github.com/Wombosvideo/tw-animate-css) — Spesifikasi pengganti murni CSS untuk utilitas animasi enter/exit di Tailwind v4.
