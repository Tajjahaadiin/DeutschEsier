import { describe, it, expect } from 'vitest'
import { parseComprehensionQuestions, isCorrectAnswer } from './comprehension'

const valid = {
  statement: 'Sprecher A trinkt Tee.',
  indonesianText: 'Pembicara A minum teh.',
  isCorrect: false,
  explanation: 'Ia memesan kopi.',
}

describe('parseComprehensionQuestions', () => {
  it('mengembalikan array kosong untuk nilai kosong/rusak', () => {
    expect(parseComprehensionQuestions(null)).toEqual([])
    expect(parseComprehensionQuestions(undefined)).toEqual([])
    expect(parseComprehensionQuestions('')).toEqual([])
    expect(parseComprehensionQuestions('bukan json{')).toEqual([])
    expect(parseComprehensionQuestions('{"a":1}')).toEqual([])
  })

  it('membaca JSON string berisi soal valid', () => {
    const parsed = parseComprehensionQuestions(JSON.stringify([valid]))

    expect(parsed).toHaveLength(1)
    expect(parsed[0].statement).toBe('Sprecher A trinkt Tee.')
    expect(parsed[0].isCorrect).toBe(false)
  })

  it('membuang soal rusak tetapi menyisakan yang valid', () => {
    const broken = { statement: 'X', indonesianText: 'Y' }
    const parsed = parseComprehensionQuestions(JSON.stringify([valid, broken]))

    expect(parsed).toHaveLength(1)
    expect(parsed[0].statement).toBe(valid.statement)
  })
})

describe('isCorrectAnswer', () => {
  it('menilai jawaban siswa terhadap kunci', () => {
    const q = { ...valid, isCorrect: true }

    expect(isCorrectAnswer(q, 'richtig')).toBe(true)
    expect(isCorrectAnswer(q, 'falsch')).toBe(false)
    expect(isCorrectAnswer(valid, 'falsch')).toBe(true)
    expect(isCorrectAnswer(valid, 'richtig')).toBe(false)
  })

  it('menolak jawaban kosong/tidak valid sebagai salah', () => {
    // Soal berkunci Falsch tidak boleh dianggap benar hanya karena siswa
    // belum menjawab (undefined).
    const q = { ...valid, isCorrect: false }

    expect(isCorrectAnswer(q, undefined as any)).toBe(false)
    expect(isCorrectAnswer(q, '' as any)).toBe(false)
    expect(isCorrectAnswer(q, 'x' as any)).toBe(false)
  })
})
