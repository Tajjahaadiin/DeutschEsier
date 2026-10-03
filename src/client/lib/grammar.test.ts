import { describe, it, expect } from 'vitest'
import { buildQuestions } from './grammar'

function vocab(germanWord: string, indonesianMeaning: string, grammarTip: string) {
  return { germanWord, indonesianMeaning, grammarTip }
}

describe('buildQuestions — jumlah soal latihan', () => {
  it('menghasilkan tepat 10 soal meski vocab hanya 4 kata', () => {
    const vocabClues = [
      vocab('der Kaffee', 'kopi', 'Kata benda maskulin.'),
      vocab('die Lampe', 'lampu', 'Kata benda feminin.'),
      vocab('das Glas', 'gelas', 'Kata benda netral.'),
      vocab('trinken', 'minum', 'Kata kerja.'),
    ]
    const dialogue = [{ germanText: 'Ich trinke gern Kaffee.' }]

    const questions = buildQuestions(vocabClues, dialogue)

    expect(questions).toHaveLength(10)
  })

  it('menyertakan jawaban Richtig dan Falsch, bukan hanya salah satu', () => {
    const vocabClues = [
      vocab('der Kaffee', 'kopi', 'Kata benda maskulin.'),
      vocab('die Lampe', 'lampu', 'Kata benda feminin.'),
      vocab('das Glas', 'gelas', 'Kata benda netral.'),
      vocab('trinken', 'minum', 'Kata kerja.'),
    ]
    const dialogue = [{ germanText: 'Ich trinke gern Kaffee.' }]

    const questions = buildQuestions(vocabClues, dialogue)

    expect(questions.filter((q) => q.isCorrect).length).toBeGreaterThan(0)
    expect(questions.filter((q) => !q.isCorrect).length).toBeGreaterThan(0)
  })

  it('tidak menghasilkan dua soal dengan pernyataan yang sama', () => {
    // Kata duplikat (AI kadang mengulang kata yang sama) akan menghasilkan
    // pernyataan kembar bila tidak dibuang.
    const vocabClues = [
      vocab('der Kaffee', 'kopi', 'Kata benda maskulin.'),
      vocab('der Kaffee', 'kopi', 'Kata benda maskulin.'),
      vocab('die Lampe', 'lampu', 'Kata benda feminin.'),
      vocab('das Glas', 'gelas', 'Kata benda netral.'),
      vocab('trinken', 'minum', 'Kata kerja.'),
    ]
    const dialogue = [{ germanText: 'Ich trinke gern Kaffee.' }]

    const questions = buildQuestions(vocabClues, dialogue)
    const statements = questions.map((q) => q.statement)

    expect(new Set(statements).size).toBe(statements.length)
  })

  it('menandai pernyataan artikel yang salah sebagai Falsch', () => {
    const vocabClues = [vocab('der Kaffee', 'kopi', 'Kata benda maskulin.')]
    const dialogue = [{ germanText: 'Der Kaffee ist heiß.' }]

    const questions = buildQuestions(vocabClues, dialogue)
    const wrongArticle = questions.find(
      (q) => q.statement === 'Das Wort „Kaffee“ hat den Artikel „die“.'
    )
    const rightArticle = questions.find(
      (q) => q.statement === 'Das Wort „Kaffee“ hat den Artikel „der“.'
    )

    expect(wrongArticle?.isCorrect).toBe(false)
    expect(rightArticle?.isCorrect).toBe(true)
  })
})
