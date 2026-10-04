-- 0005: tambah kolom comprehension_questions_json pada learning_session
--
-- Menyimpan soal Richtig/Falsch (Benar/Salah) hasil AI untuk skenario level B1
-- sebagai JSON array. Level A1/A2 dan data lama tetap NULL.
--
-- CATATAN: berkas 0000-0003 lama adalah artefak SQLite dan sudah dihapus;
-- 0000_baseline.sql adalah baseline PostgreSQL. Berkas ini ditulis dalam
-- dialek PostgreSQL dan diterapkan langsung ke database Neon.
--
-- Aditif dan aman: kolom nullable tanpa default, baris lama tidak berubah.

ALTER TABLE "learning_session"
  ADD COLUMN IF NOT EXISTS "comprehension_questions_json" text;
