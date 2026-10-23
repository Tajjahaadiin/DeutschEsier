# 0002. Urutan Migrasi Tailwind v4 dan Refaktor Arsitektur Jalur Gramatik

Aplikasi DeutschEasier telah menyelesaikan audit fungsional gramatik B1 (K1–K11), sehingga prasyarat penundaan migrasi Tailwind v4 pada ADR-0001 telah terpenuhi. Namun, review arsitektur menemukan beberapa peluang perbaikan modul (deepening) pada jalur gramatik dan kuis yang juga menyentuh berkas antarmuka.

Kami memutuskan urutan eksekusi teknis sebagai berikut:

1. **Fase 1: Refaktor Logika Non-UI (Kandidat 02 & 05)**
   Mempersatukan sumber kebenaran peran gramatikal (`role`) ke `src/shared/grammarRoles.ts` dan algoritma parser array JSON toleran sebelum menyentuh lapisan styling. Fase ini murni berkas TypeScript (`.ts`) tanpa risiko konflik merge dengan komponen UI.
2. **Fase 2: Migrasi ke Tailwind CSS v4**
   Melakukan migrasi engine styling secara terisolasi menggunakan `@tailwindcss/vite`, mencopot `postcss` dan `autoprefixer`, serta mewajibkan border shim global (`border-color: var(--color-slate-200, #e2e8f0)`) pada `@layer base` di `src/client/index.css` guna mengeliminasi risiko visual regression akibat perubahan default `currentColor` di v4.
3. **Fase 3: Refaktor Komponen Antarmuka (Kandidat 03 & 04)**
   Mengeksekusi modularisasi gerbang akses `ViewPage` dan dekomposisi fungsi `buildQuestions` setelah ekosistem styling v4 terbukti stabil.
