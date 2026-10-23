# 0001. Penundaan Tailwind v4 dan Penolakan Framework Komponen Eksternal

Aplikasi DeutschEasier adalah SPA berbasis Vite 6 dan React 18 dengan sistem styling utility-first menggunakan Tailwind CSS 3. Muncul pertimbangan untuk migrasi ke Tailwind v4 serta adopsi component library (Chakra UI atau shadcn/ui).

Kami memutuskan untuk:
1. **Menunda migrasi Tailwind v4** hingga seluruh audit dan perbaikan fungsional modul pembelajaran bahasa Jerman (kuis, evaluasi gramatik B1) selesai, guna menghindari risiko visual regression (seperti perubahan default border color menjadi `currentColor`).
2. **Menolak Chakra UI v3 sepenuhnya** untuk menghindari penambahan runtime CSS-in-JS (Emotion) seberat 50–150 KB dan inkonsistensi paradigma styling.
3. **Mempertahankan custom UI components** di `src/client/components/ui/` (`button.tsx`, `card.tsx`) berbasis `cn()` (`clsx` + `tailwind-merge`) tanpa memasang CLI penuh shadcn/ui (YAGNI). Primitif Radix UI hanya akan disalin secara modular jika dibutuhkan aksesibilitas WAI-ARIA kompleks.
4. **Menghapus dependensi `tailwindcss-animate`** dan menggantikannya dengan native CSS `@keyframes` di `src/client/index.css`.
