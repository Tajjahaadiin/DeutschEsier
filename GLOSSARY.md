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
Karakter suara sintetis neural Jerman yang merepresentasikan peran sosial dan usia penutur tertentu (misal: Conrad sebagai Male 1 / Guru Formal, Killian sebagai Male 2 / Mahasiswa Kasual, Katja sebagai Female 1 / Tutor Utama, Amala sebagai Female 2 / Mahasiswi Dinamis).
_Avoid_: Suara robot, pilihan gender biner biasa

