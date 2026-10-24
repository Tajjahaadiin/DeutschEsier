# ADR-0005: Kurasi 3 Persona Skenario, Suara Tunggal Grundlagen, dan Komposisi Deterministik AI

**Status:** Accepted  
**Tanggal:** 2026-10-24  
**Memperbarui:** ADR-0003 (TTS Persona Architecture), ADR-0004 (TTS Endpoint as Single Source of Persona)

---

## Konteks

Sebelumnya, sistem menyediakan 6 persona vokal Jerman (`male-1..3`, `female-1..3`) dan mengizinkan pemilihan persona bebas di seluruh modul Grundlagen (Alfabet, Angka, Hari, Bank Kata) serta hingga 6 karakter pembicara di Scenario Generator.

Hasil evaluasi pedagogis dan teknis menunjukkan:
1. **Beban Kognitif Berlebih:** Memilih suara di materi fondasi (Grundlagen) mendistraksi murid dari tujuan utama drill fonetik dan kosakata.
2. **Kompleksitas Dialog Tak Realistis:** Dialog dengan 4–6 pembicara jarang digunakan dalam skenario pembelajaran bahasa Jerman A1–B1 dan menghasilkan distribusi giliran bicara yang acak-acakan.
3. **Halusinasi Gender AI:** Tanpa instruksi komposisi yang ketat, AI sering menghasilkan 3 karakter dengan gender seragam atau mencampuradukkan kata ganti orang (*er/sie*) dan sapaan formal (*Herr/Frau*).

---

## Keputusan

1. **Penguncian Suara Modul Die Grundlagen (Single Fixed Voice):**
   - Seluruh modul dasar (`AlphabetPage`, `NumberPage`, `DayPage`, `WordCard`, `SpellingTrainer`) dikunci permanen menggunakan **Katja (`female-1`)**.
   - Semua elemen UI dropdown pemilih suara di halaman Grundlagen dihilangkan.
2. **Kurasi 3 Persona untuk Scenario Generator:**
   - Dropdown pilihan persona di UI Generator dibatasi hanya pada **3 karakter kontras**:
     - `female-1`: **Katja** (Tutor Utama / Wanita)
     - `male-1`: **Conrad** (Guru Formal / Pria Bariton)
     - `male-2`: **Killian** (Mahasiswa Santai / Pria Tenor Muda)
   - Tiga persona lain (`Florian`, `Amala`, `Seraphina`) disembunyikan dari UI namun tetap dipertahankan ID-nya di backend untuk *backward-compatibility* skenario lama.
3. **Komposisi Deterministik Generator AI (1F + 2M):**
   - Opsi jumlah karakter di Generator dibatasi menjadi **2 atau 3 pembicara**.
   - Jika guru memilih 3 pembicara, instruksi ke AI (`buildPrompt`) mewajibkan komposisi deterministik:
     - `Sprecher A`: Wanita (Katja)
     - `Sprecher B`: Pria (Conrad)
     - `Sprecher C`: Pria (Killian)
4. **Backward Compatibility:**
   - Halaman `ViewPage` tetap merender dan memutar rekaman dialog skenario lama yang memiliki 4–6 pembicara atau memakai persona lama tanpa error.

---

## Konsekuensi

- **Positif:**
  - UI Grundlagen bersih, seragam, dan bebas distraksi.
  - Skenario percakapan 3 orang selalu seimbang secara gender dan gramatikal.
  - Jumlah file audio yang perlu di-pregenerate untuk materi statis menyusut 83% (hanya 1 persona Katja, bukan 6 persona).
- **Negatif / Batasan:**
  - Pengguna tidak lagi dapat mengganti suara saat berlatih alfabet atau angka.
