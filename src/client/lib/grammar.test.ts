import { describe, it, expect } from 'vitest'
import { buildQuestions } from './grammar'

function vocab(germanWord: string, indonesianMeaning: string, grammarTip: string) {
  return { germanWord, indonesianMeaning, grammarTip }
}

describe('buildQuestions — prioritisasi topik grammar', () => {
  const vocabClues = [
    vocab('der Kaffee', 'kopi', 'Kata benda maskulin.'),
    vocab('die Lampe', 'lampu', 'Kata benda feminin.'),
    vocab('trinken', 'minum', 'Kata kerja.'),
    vocab('gehen', 'pergi', 'Kata kerja.'),
  ]
  const dialogue = [{ germanText: 'Ich trinke gern Kaffee.' }]

  it('tetap menghasilkan tepat 10 soal saat topik diberikan', () => {
    expect(buildQuestions(vocabClues, dialogue, ['passiv'])).toHaveLength(10)
  })

  it('tanpa topik, tidak ada soal yang diberi label topik', () => {
    const questions = buildQuestions(vocabClues, dialogue)

    expect(questions.every((q) => q.topicIds === undefined)).toBe(true)
  })

  it('mendahulukan soal yang kategorinya cocok dengan topik terpilih', () => {
    // 'passiv' dipetakan ke kategori Verb, jadi soal tentang kata kerja
    // seharusnya muncul lebih dulu dan diberi label.
    const questions = buildQuestions(vocabClues, dialogue, ['passiv'])
    const labelled = questions.filter((q) => q.topicIds?.includes('passiv'))

    expect(labelled.length).toBeGreaterThan(0)
    expect(questions[0].topicIds).toContain('passiv')
  })

  it('topik tanpa pemetaan kategori tidak mengubah apa pun', () => {
    const without = buildQuestions(vocabClues, dialogue)
    const withTekamolo = buildQuestions(vocabClues, dialogue, ['tekamolo'])

    expect(JSON.stringify(withTekamolo)).toBe(JSON.stringify(without))
  })

  it('mengabaikan ID topik yang tidak dikenal tanpa error', () => {
    const without = buildQuestions(vocabClues, dialogue)
    const withUnknown = buildQuestions(vocabClues, dialogue, ['topik-karangan'])

    expect(JSON.stringify(withUnknown)).toBe(JSON.stringify(without))
  })

  it('deterministik: dua panggilan dengan argumen sama menghasilkan hasil identik', () => {
    const a = buildQuestions(vocabClues, dialogue, ['passiv', 'relativsatz'])
    const b = buildQuestions(vocabClues, dialogue, ['passiv', 'relativsatz'])

    expect(JSON.stringify(a)).toBe(JSON.stringify(b))
  })
})

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
