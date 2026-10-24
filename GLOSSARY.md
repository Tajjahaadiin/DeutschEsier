# DeutschEasier Glossary

Aplikasi pembelajaran bahasa Jerman modern berbasis web yang dirancang khusus untuk pembelajar Indonesia.

## Language

**Skenario Pembelajaran (Learning Session)**:
Satu unit sesi belajar berbasis percakapan otentik CEFR (A1–B1) yang dihasilkan AI (Google Gemini) lengkap dengan deskripsi latar, dialog dua pembicara, petunjuk kosakata, pola kalimat, dan soal evaluasi.
_Avoid_: Pelajaran, modul statis, template percakapan

**Kunci Akses (Scenario Access Key)**:
Kode alfanumerik unik berbatas waktu (format `DE-XXXXX`) yang diterbitkan oleh guru agar murid dapat membuka skenario dan mengumpulkan nilai kuis tanpa memerlukan pembuatan akun.
_Avoid_: Token murid, kode kupon, password skenario

**Peran Gramatikal (Grammar Segment Role)**:
Klasifikasi fungsi sintaksis dari potongan kata dalam kalimat Jerman (`subjekt`, `praedikat`, `objekt`, atau `other`) yang digunakan untuk pewarnaan visual struktur kalimat pada tab Materi dan Latihan Grammatik.
_Avoid_: Jenis kata, kelas kata, grammar tag

**Pola Kalimat (Grammar Pattern)**:
Struktur susunan kalimat baku bahasa Jerman (Aussagesatz, W-Frage, Ja/Nein-Frage) yang diekstraksi dari dialog skenario untuk membantu pembelajar memahami posisi kata kerja dan urutan kata.
_Avoid_: Rumus tenses, grammar rule

**Soal Tata Bahasa AI (AI Grammar Question)**:
Soal evaluasi gramatikal hasil AI untuk level B1 yang menanyakan keabsahan kalimat ("Apakah kalimat ini gramatikal?") dan selalu memuat kalimat koreksi yang benar bila kalimat uji salah.
_Avoid_: Soal kuis biasa, soal pilihan ganda gramatik

**Soal Turunan Kosakata (Legacy Grammar Question)**:
Soal Richtig/Falsch yang disusun secara deterministik saat runtime dari vocabClues dan kalimat dialog, digunakan sebagai cadangan bila skenario belum memiliki soal tata bahasa AI.
_Avoid_: Soal AI fallback, auto-quiz

**Persona Vokal (TTS Speaker Persona)**:
Karakter suara sintetis neural Jerman dalam Scenario Generator yang dikurasi ketat menjadi 3 karakter baku: `weiblich` (Wanita ceria, base Kerstin +180 cents, 1.04x), `männlich-1` (Pria tegas/dewasa, base Kerstin -250 cents, 1.06x), dan `männlich-2` (Pria energik, base Thorsten +160 cents, 1.05x). Disintesis secara lokal di browser murid menggunakan VITS/Piper WebAssembly.
_Avoid_: Suara robot, pilihan gender biner biasa, list persona tak terbatas, nama persona fiktif lama

**Client-Side VITS WASM**:
Mesin Text-to-Speech saraf berbasis WebAssembly dan ONNX Runtime Web yang berjalan langsung di peramban murid (`@diffusionstudio/vits-web`), menyimpan model neural (`de_DE-kerstin` dan `de_DE-thorsten`) secara permanen di Origin Private File System (OPFS) untuk sintesis tanpa batas kuota server.
_Avoid_: Server-side TTS rendering, external cloud TTS proxy

**Suara Fondasi (Grundlagen Voice)**:
Satu persona vokal tunggal yang dikunci secara konsisten untuk seluruh modul Die Grundlagen (Alfabet, Angka, Hari, dan Kata Benda), yaitu Katja (`female-1`).
_Avoid_: Multi-persona fondasi, pemilih suara dinamis fondasi

**Komposisi Deterministik Dialog (Deterministic Dialogue Composition)**:
Aturan mutlak bagi generator skenario AI saat menghasilkan percakapan: jika 2 pembicara, wajib `weiblich` dan `männlich-1`; jika lebih dari 2 orang (3 pembicara), wajib tepat 1 wanita dan 2 pria (`Sprecher A` = `weiblich`, `Sprecher B` = `männlich-1`, `Sprecher C` = `männlich-2`).
_Avoid_: Komposisi acak AI, dialog monolog, 3 karakter sesama gender

**Pemuat Kesiapan Aset (Asset Readiness Loader)**:
Status pemblokiran visual (skeleton / loader spinner) dengan redaksi *"Sedang memuat model audio Jerman..."* di halaman skenario (`ViewPage.tsx`) saat browser mengunduh model neural WASM ke memori lokal (OPFS), yang menahan tampilan card dialog dan kuis hingga seluruh aset vokal yang dibutuhkan skenario siap 100%.
_Avoid_: Lazy load tanpa indikator, pemutaran audio sebelum model selesai diunduh

**Die Grundlagen (Fondasi Dasar)**:
Kategori modul pembelajaran mandiri yang memuat materi dasar non-dialog (Bank Kata Kognat, Das Alphabet, Die Nummer, dan Die Tage), dapat dibuka langsung oleh guru di dashboard dan dapat diakses murid menggunakan kunci akses `sessionId = "grundlagen"`.
_Avoid_: Modul umum, menu ekstra, menu sampingan


