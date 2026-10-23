---
version: "alpha"
name: DeutschEasier
description: Antarmuka aplikasi latihan bahasa Jerman untuk siswa Indonesia. Netral berbasis slate, satu aksen biru, warna semantik untuk benar/salah. Tanpa gradient, tanpa ornamen dekoratif.
omitted:
  - Components
colors:
  primary: "oklch(54.6% 0.245 262.881)"
  on-primary: "oklch(100% 0 0)"
  secondary: "oklch(55.4% 0.046 257.417)"
  neutral: "oklch(98.4% 0.003 247.858)"
  surface: "oklch(100% 0 0)"
  surface-muted: "oklch(96.8% 0.007 247.896)"
  border: "oklch(92.9% 0.013 255.508)"
  text: "oklch(20.8% 0.042 265.755)"
  text-muted: "oklch(44.6% 0.043 257.281)"
  success: "oklch(59.6% 0.145 163.225)"
  danger: "oklch(58.6% 0.253 17.585)"
  warning: "oklch(76.9% 0.188 70.08)"
typography:
  display:
    fontFamily: system-ui
    fontSize: 1.875rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.02em
  heading:
    fontFamily: system-ui
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: system-ui
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: system-ui
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: system-ui
    fontSize: 0.75rem
    fontWeight: 600
    lineHeight: 1.4
rounded:
  sm: 6px
  md: 8px
  lg: 12px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
---

## Overview

DeutschEasier adalah alat kerja, bukan halaman pemasaran. Guru membuat skenario latihan,
siswa mengerjakannya di ponsel, guru membaca hasilnya. Antarmukanya harus terbaca cepat,
padat, dan tidak menarik perhatian pada dirinya sendiri.

Nada visualnya: **tenang dan netral**. Latar terang, teks gelap, satu warna aksen untuk aksi.
Warna lain hanya dipakai untuk menyampaikan makna — benar, salah, peringatan — bukan hiasan.

Aplikasi ini **bukan** landing page SaaS. Tidak ada hero, testimonial, harga, atau ajakan
mencoba. Setiap layar adalah layar kerja.

Bahasa antarmuka: **Indonesia**. Bahasa yang dipelajari: **Jerman**. Keduanya harus dibedakan
jelas — teks Jerman selalu ditandai (`lang="de"`), karena pembaca layar perlu melafalkannya
dengan benar.

## Colors

Palet ini sudah dipakai di kode. Token di bawah **memindahkan** nilai yang ada menjadi nama
semantik; tidak ada warna baru yang dikarang.

- **Primary** `oklch(54.6% 0.245 262.881)` — biru. **Satu-satunya** warna aksi: tombol utama,
  tautan, tab aktif, fokus. Tidak ada aksen kedua.
- **On-primary** — putih, untuk teks di atas primary.
- **Secondary** — slate 500, untuk ikon sekunder dan teks pendukung.
- **Neutral** — slate 50, latar halaman.
- **Surface** — putih, latar kartu dan modal.
- **Surface-muted** — slate 100, latar blok yang perlu dibedakan dari kartu.
- **Border** — slate 200, semua garis pemisah.
- **Text** — slate 900, teks utama.
- **Text-muted** — slate 600, label dan metadata.
- **Success** — emerald 600. Hanya untuk jawaban benar dan status berhasil.
- **Danger** — rose 600. Hanya untuk jawaban salah, error, dan aksi merusak.
- **Warning** — amber 500. Hanya untuk peringatan.

**Aturan warna semantik:** `success` dan `danger` **tidak boleh** dipakai sebagai warna aksen
dekoratif. Kalau sebuah elemen berwarna hijau, artinya benar — bukan "supaya menarik".

## Typography

Satu keluarga huruf untuk seluruh aplikasi. Ini keputusan sadar: aplikasi ini menampilkan
banyak teks Jerman dengan diakritik (ä, ö, ü, ß) dan campuran angka; mengganti huruf tidak
menambah keterbacaan, hanya menambah beban.

Skala lima langkah, tanpa nilai arbitrer:

| Token | Ukuran | Dipakai untuk |
| :--- | :--- | :--- |
| `display` | 30px / 700 | Judul halaman |
| `heading` | 20px / 600 | Judul seksi, judul kartu |
| `body` | 16px / 400 | Teks isi, **dan semua input** |
| `body-sm` | 14px / 400 | Teks pendukung, sel tabel |
| `label` | 12px / 600 | Label form, metadata |

**Lantai tipografi 12px.** Tidak ada teks di bawah 12px. Hierarki dibangun dengan bobot dan
warna, bukan dengan mengecilkan huruf. Alasan: 9–11px tidak terbaca di ponsel di bawah cahaya
matahari, dan tidak bisa di-zoom tanpa merusak tata letak.

**Input wajib 16px.** Input di bawah 16px membuat iOS Safari memperbesar halaman saat fokus.
Memperbaikannya adalah menaikkan ukuran huruf, **bukan** mematikan zoom.

## Layout

Tata letak berbasis satu kolom dengan lebar maksimum, karena aplikasi ini dipakai di ponsel.

- Lebar maksimum konten: `48rem` (768px) untuk layar baca, `64rem` untuk layar kerja.
- Jarak tepi halaman: `16px` di ponsel, `24px` di layar lebar.
- Jarak antar blok: `md` (16px) sebagai default, `lg` (24px) antar seksi.
- Tinggi minimum layar memakai `100dvh`, **bukan** `100vh` — `100vh` terpotong saat bilah
  alamat peramban muncul.
- Area yang menempel di bawah (`fixed bottom`) wajib memberi ruang untuk home indicator:
  `padding-bottom: env(safe-area-inset-bottom)`, dan `viewport-fit=cover` di meta viewport.

Kepadatan berbeda menurut peran, dan itu disengaja:

| Peran | Kepadatan | Alasan |
| :--- | :--- | :--- |
| Siswa (mengerjakan) | lapang | satu tugas per layar, target sentuh besar |
| Guru (membaca hasil) | padat | banyak baris, tabel, perbandingan |

## Elevation & Depth

Kedalaman dipakai untuk memisahkan lapisan, bukan untuk menghias.

- **Kartu** — `1px` border `{colors.border}`. Tanpa bayangan.
- **Kartu terangkat** — bayangan halus `0 1px 2px rgb(0 0 0 / 0.05)`.
- **Modal** — bayangan sedang `0 4px 12px rgb(0 0 0 / 0.10)` + latar gelap `slate-900/60`.
- **Popover/menu** — sama dengan modal, tanpa latar gelap.

**Dilarang:** bayangan dramatis, glow berwarna, bayangan ganda bertumpuk, dan bayangan yang
sama besar di semua elemen. Kalau semua terangkat, tidak ada yang terangkat.

## Shapes

Empat tingkat radius, masing-masing punya satu tugas. Radius mengikuti ukuran elemen, jadi
elemen bersarang selalu punya radius lebih kecil daripada wadahnya.

| Token | Nilai | Dipakai untuk |
| :--- | :--- | :--- |
| `sm` | 6px | chip, badge, penanda kecil |
| `md` | 8px | **tombol dan input** |
| `lg` | 12px | kartu, panel, modal |
| `full` | 9999px | avatar dan penanda status bulat — **bukan** tombol |

**Dilarang:** `rounded-2xl` dan `rounded-3xl` (16px, 24px). Radius sebesar itu membuat kontrol
terlihat seperti kartu, dan pada tombol membuatnya terlihat seperti pil — pola khas antarmuka
buatan mesin.

## Do's and Don'ts

Aturan di bawah adalah hasil audit yang terdokumentasi di `docs/ui-checklist.md`. Dokumen itu
memuat bukti, lokasi berkas, dan cara mengukur. Seksi ini memuat **aturannya**; jangan
menggandakan temuannya di sini.

### Do

- Pakai **satu** warna aksi: `{colors.primary}`. Kalau butuh membedakan dua aksi, bedakan
  dengan bobot (isi vs garis), bukan dengan warna kedua.
- Pakai ikon dari `lucide-react`. Pilih ukuran 16, 18, atau 24 saja.
- Beri setiap input label di atasnya, selalu terlihat. Jangan label mengambang.
- Tandai teks Jerman dengan `lang="de"` agar pembaca layar melafalkannya benar.
- Bangun hierarki dengan bobot huruf dan warna teks, bukan dengan ukuran di bawah 12px.
- Beri umpan balik tekan pada `:active`, bukan hanya `:hover` — ponsel tidak punya hover.
- Sediakan `:focus-visible` yang terlihat jelas pada semua elemen interaktif.
- Hormati `prefers-reduced-motion`: redam animasi gerak, pertahankan transisi opacity.

### Don't

- **Jangan gradient.** Tidak pada tombol, header, latar, atau teks. Tidak ada pengecualian.
- **Jangan `indigo` atau `violet`.** Keduanya di luar palet. Ini tell nomor satu antarmuka
  buatan mesin, dan saat ini muncul di 15 tempat.
- **Jangan `red`.** Warna bahaya adalah `{colors.danger}` (rose). Dua sistem error tidak boleh
  hidup berdampingan.
- **Jangan emoji sebagai ikon antarmuka.** Emoji sebagai **isi pelajaran** boleh — misalnya
  👨/👩 pada latihan gender kata Jerman. Emoji sebagai penanda status (✅ ❌ 💡) harus diganti
  ikon.
- **Jangan `uppercase` + `tracking` sebagai pola label universal.** Sisakan untuk 3–5 label
  yang benar-benar kategoris.
- **Jangan glassmorphism** kecuali sebagai latar gelap di belakang modal.
- **Jangan ornamen dekoratif bertema Jerman:** bendera sebagai wallpaper, pretzel, bratwurst,
  bir, pola belah ketupat, font Fraktur. Ornamen yang baik untuk aplikasi bahasa adalah
  bahasanya sendiri: `Montag, 3. Oktober`, `der/die/das`, nama huruf `Be Em Ha`.
- **Jangan gradient hitam–merah–emas** meski warnanya berasal dari bendera Jerman. Kalau
  bendera diperlukan, satu tempat saja (halaman login) dan sebagai tiga pita datar.
- **Jangan animasi masuk pada setiap elemen**, dan jangan animasi dari `scale(0)`.
- **Jangan `transition-all`.** Sebutkan properti yang berubah.
- **Jangan `100vh`** untuk kerangka aplikasi. Pakai `100dvh`.
- **Jangan mematikan zoom** (`user-scalable=no`, `maximum-scale=1`).

### Ornamen yang diizinkan

| Ornamen | Batas |
| :--- | :--- |
| Tiga pita bendera Jerman (datarm bukan gradient) | Halaman login saja, satu kali |
| Warna semantik `der`/`die`/`das` | Sebagai penanda gender kata, konsisten di seluruh aplikasi |
| Nama huruf Jerman (`Be`, `Em`, `Ha`) | Halaman alfabet |
| Format tanggal Jerman (`Montag, 3. Oktober`) | Halaman kalender |
| Ikon Lucide | Seluruh aplikasi |

Tidak ada ilustrasi, maskot, atau tekstur latar. Kalau sebuah ornamen tidak menyampaikan
informasi, hapus.
