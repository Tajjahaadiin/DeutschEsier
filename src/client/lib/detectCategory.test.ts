import { describe, it, expect } from 'vitest'
import { detectCategory, buildQuestions } from './grammar'

/**
 * Tabel kasus detectCategory.
 *
 * Setiap baris adalah satu bug yang pernah ada atau satu regresi yang harus
 * dijaga. Menambah regex tanpa menambah baris di sini tidak dianggap selesai.
 */
const CASES: { tip: string; word?: string; expected: string; why: string }[] = [
  // --- K1: "Adverb" tidak boleh dianggap Verb ---
  { tip: 'Adverb der Zeit', expected: 'Sonstiges', why: 'K1: \\b cocok di "adverb"' },
  { tip: 'Das Adverb „gern“ steht nach dem Verb.', expected: 'Sonstiges', why: 'K1: mengandung "verb" di akhir kalimat' },
  { tip: 'Kata keterangan waktu', expected: 'Sonstiges', why: 'K1: keterangan, bukan kata kerja' },

  // --- K2: "Pronomen" tidak boleh dianggap Nomen ---
  { tip: 'Pronomen im Dativ: ihm', expected: 'Sonstiges', why: 'K2: "pronomen" mengandung "nomen"' },
  { tip: 'Das Pronomen „sie“ ersetzt ein Nomen.', expected: 'Sonstiges', why: 'K2: menyebut nomen di penjelasan' },
  { tip: 'Possessivartikel mein, dein', expected: 'Sonstiges', why: 'K2: bukan kata benda' },

  // --- K3: nomina maskulin berakhiran -en tetap Nomen ---
  { tip: '', word: 'der Garten', expected: 'Nomen', why: 'K3: fallback -en salah menangkap nomina' },
  { tip: '', word: 'der Kuchen', expected: 'Nomen', why: 'K3' },
  { tip: '', word: 'der Wagen', expected: 'Nomen', why: 'K3' },
  { tip: '', word: 'der Hafen', expected: 'Nomen', why: 'K3' },
  { tip: '', word: 'der Ofen', expected: 'Nomen', why: 'K3' },

  // --- K3 lanjutan: nomina TANPA artikel, kapital saja sudah cukup ---
  // AI mengirim bentuk ini saat grammarTip kosong. Premis "kata benda selalu
  // kapital" berlaku tanpa syarat artikel.
  { tip: '', word: 'Garten', expected: 'Nomen', why: 'K3: nomina tanpa artikel' },
  { tip: '', word: 'Fenster', expected: 'Nomen', why: 'K3: nomina tanpa artikel, -er' },
  { tip: '', word: 'Gärten', expected: 'Nomen', why: 'K3: nomina jamak tanpa artikel' },
  { tip: '', word: 'Mädchen', expected: 'Nomen', why: 'K3: nomina -chen' },

  // --- K3 negatif: infinitif asli TETAP Verb ---
  { tip: '', word: 'gehen', expected: 'Verb', why: 'K3 negatif: jangan tukar false-positive jadi false-negative' },
  { tip: '', word: 'kommen', expected: 'Verb', why: 'K3 negatif' },
  { tip: '', word: 'arbeiten', expected: 'Verb', why: 'K3 negatif' },

  // --- Regresi positif: kategori asli tidak boleh berubah ---
  { tip: 'Kata benda maskulin', expected: 'Nomen', why: 'regresi: kata kunci Indonesia' },
  { tip: 'das Substantiv', expected: 'Nomen', why: 'regresi: istilah Jerman' },
  { tip: 'Verb im Perfekt', expected: 'Verb', why: 'regresi: Verb sebagai kata utuh' },
  { tip: 'Praeposition mit Dativ', expected: 'Präposition', why: 'regresi' },
  { tip: 'Konjunktion weil', expected: 'Konjunktion', why: 'regresi' },
  { tip: 'Kata sifat komparatif', expected: 'Adjektiv', why: 'regresi' },
]

describe('detectCategory — tabel kasus', () => {
  for (const c of CASES) {
    it(`${c.tip || c.word} -> ${c.expected} (${c.why})`, () => {
      expect(detectCategory(c.tip, c.word ?? '')).toBe(c.expected)
    })
  }
})

describe('detectCategory — K3 memakai noun hasil splitArticle', () => {
  it('artikel tidak boleh membuat nomina terdeteksi sebagai Verb', () => {
    // Kata tanpa artikel yang berakhiran -en dan berhuruf kecil = infinitif.
    expect(detectCategory('', 'gehen')).toBe('Verb')
    // Kata DENGAN artikel = nomina, apa pun akhirannya.
    expect(detectCategory('', 'der Garten')).toBe('Nomen')
    expect(detectCategory('', 'die Garten')).toBe('Nomen')
  })
})

describe('buildQuestions — akibat yang dirasakan siswa (K1)', () => {
  it('tidak pernah menyatakan "heute ist ein Verb" sebagai jawaban benar', () => {
    const questions = buildQuestions(
      [{ germanWord: 'heute', indonesianMeaning: 'hari ini', grammarTip: 'Adverb der Zeit' }],
      []
    )

    const claimedVerb = questions.filter(
      (q) => q.statement.includes('heute') && q.statement.includes('ist ein Verb')
    )

    // Tidak boleh ada pernyataan yang mengklaim "heute" adalah Verb sekaligus benar.
    expect(claimedVerb.filter((q) => q.isCorrect)).toHaveLength(0)
  })
})
