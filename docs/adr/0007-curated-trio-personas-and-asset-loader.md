# ADR-0007: Curated Trio Personas (Weiblich, Männlich-1, Männlich-2) & Blocking Asset Readiness Loader

## Context
Pada evaluasi sebelumnya (ADR-0005 & ADR-0006), arsitektur TTS beralih ke Client-Side VITS/Piper WASM untuk membebaskan backend dari kuota Gemini TTS dan batas koneksi Microsoft Edge TTS.

Namun, terdapat dua kebutuhan lanjutan dari hasil pengujian langsung:
1. **Penamaan Kanonikal & Timbre Kontras**: Pengguna menginginkan cut-off dari nama persona lama dan menetapkan penamaan murni bahasa Jerman: `weiblich` (wanita tunggal) dan `männlich-{n}` (pria). Untuk membedakan dua penutur pria secara tajam, vokal `männlich-1` menggunakan teknik modulasi formant unik (base Kerstin di-detune -250 cents dengan speed 1.06x), sementara `männlich-2` menggunakan base Thorsten (+160 cents, 1.05x).
2. **Kesiapan Aset Sebelum Interaksi Murid**: File neural VITS WASM berukuran ~16 MB hingga ~18 MB. Jika murid langsung disajikan kartu percakapan dan mengklik tombol putar sebelum model terunduh ke OPFS browser, audio akan gagal atau terjatuh ke fallback yang tidak konsisten. Diperlukan blocking guard visual (skeleton/spinner) dengan redaksi *"Sedang memuat model audio Jerman..."* sampai aset siap.

## Decision
1. **Definisi Trio Persona Skenario**:
   - `weiblich`: Base `de_DE-kerstin-low`, detune `+180 cents`, rate `1.04x` (Suara ceria/muda).
   - `männlich-1`: Base `de_DE-kerstin-low`, detune `-250 cents`, rate `1.06x` (Suara pria tegas/dewasa dari modulasi base female).
   - `männlich-2`: Base `de_DE-thorsten-medium`, detune `+160 cents`, rate `1.05x` (Suara pria energik).
2. **Aturan Deterministik Generator AI**:
   - Jika 2 pembicara: Wajib Sprecher A (`weiblich`) dan Sprecher B (`männlich-1`).
   - Jika > 2 pembicara (3 orang): Wajib tepat 2 pria dan 1 wanita: Sprecher A (`weiblich`), Sprecher B (`männlich-1`), Sprecher C (`männlich-2`).
3. **Blocking Asset Readiness Loader pada `ViewPage.tsx`**:
   - Saat skenario dibuka dan akses valid, sistem memeriksa model apa saja yang dibutuhkan oleh pembicara skenario tersebut.
   - Jika belum tersimpan di OPFS browser, halaman menampilkan skeleton loader dengan teks *"Sedang memuat model audio Jerman..."* dan progress download.
   - Kartu dialog dan kuis baru dirender setelah model terverifikasi siap di memori browser.
4. **Pembersihan Prototype**:
   - Menghapus `AudioPrototypePage.tsx` dan rute `/audio-prototype` dari produksi.

## Status
Accepted

## Consequences
### Positive
- Tidak ada kebingungan membedakan pembicara pria dalam dialog 3 orang karena perbedaan formant vokal yang sangat ekstrem.
- Efisiensi bandwidth: Dialog 2 orang (`weiblich` + `männlich-1`) hanya memerlukan unduhan satu model dasar (`de_DE-kerstin-low`, ~16 MB).
- Murid tidak akan pernah mengalami tombol play macet atau audio putus karena card hanya terbuka saat mesin WASM sudah 100% siap.

### Trade-offs / Negatives
- Ada jeda pemuatan beberapa detik saat pertama kali murid membuka skenario di perangkat baru sebelum skeleton berganti menjadi card dialog.
- Skenario lama yang masih menyimpan ID persona lama (`male-1`, dll.) di-mapping secara otomatis ke trio persona baru ini.
