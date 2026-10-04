import { describe, it, expect } from 'vitest'
import { parseGrammarQuestions } from './grammarQuestions'

const question = {
  sentence: 'Ich bin gestern die Küche geputzt.',
  isCorrect: false,
  explanationId: 'Putzen memakai haben, bukan sein.',
  correctedSentence: 'Ich habe gestern die Küche geputzt.',
  topicId: 'tempus-perfekt',
  segments: [
    { text: 'Ich ', role: 'subjekt' },
    { text: 'bin ', role: 'praedikat' },
    { text: 'gestern die Küche geputzt.', role: 'objekt' },
  ],
}

describe('parseGrammarQuestions', () => {
  it('mengembalikan array kosong untuk nilai kosong/rusak', () => {
    expect(parseGrammarQuestions(null)).toEqual([])
    expect(parseGrammarQuestions(undefined)).toEqual([])
    expect(parseGrammarQuestions('')).toEqual([])
    expect(parseGrammarQuestions('bukan json{')).toEqual([])
    expect(parseGrammarQuestions('{"a":1}')).toEqual([])
  })

  it('membaca array soal yang valid dan memberi id', () => {
    const parsed = parseGrammarQuestions(JSON.stringify([question]))

    expect(parsed).toHaveLength(1)
    expect(parsed[0].id).toBe('grammar-ai-0')
    expect(parsed[0].sentence).toBe(question.sentence)
    expect(parsed[0].isCorrect).toBe(false)
    expect(parsed[0].correctedSentence).toBe(question.correctedSentence)
    expect(parsed[0].audioText).toBe(question.sentence)
  })

  it('membuang soal rusak tetapi menyisakan yang valid', () => {
    const broken = { sentence: 'X' }
    const parsed = parseGrammarQuestions(JSON.stringify([question, broken]))

    expect(parsed).toHaveLength(1)
    expect(parsed[0].topicId).toBe('tempus-perfekt')
  })

  it('membuang soal dengan topicId yang tidak dikenal', () => {
    const unknownTopic = { ...question, topicId: 'topik-karangan' }
    const parsed = parseGrammarQuestions(JSON.stringify([question, unknownTopic]))

    expect(parsed).toHaveLength(1)
  })

  it('membuang soal tanpa kalimat atau tanpa penjelasan', () => {
    const noSentence = { ...question, sentence: '' }
    const noExplanation = { ...question, explanationId: '' }

    expect(parseGrammarQuestions(JSON.stringify([noSentence]))).toEqual([])
    expect(parseGrammarQuestions(JSON.stringify([noExplanation]))).toEqual([])
  })

  it('menormalkan correctedSentence kosong pada soal yang benar', () => {
    const correct = { ...question, isCorrect: true, correctedSentence: '' }
    const parsed = parseGrammarQuestions(JSON.stringify([correct]))

    expect(parsed[0].correctedSentence).toBe(question.sentence)
  })

  it('mempertahankan correctedSentence pada soal yang salah', () => {
    const parsed = parseGrammarQuestions(JSON.stringify([question]))

    expect(parsed[0].correctedSentence).toBe('Ich habe gestern die Küche geputzt.')
  })

  it('mengubah role segmen tak dikenal menjadi other, tanpa membuang kalimatnya', () => {
    const odd = {
      ...question,
      segments: [{ text: 'Ich bin', role: 'verb' }],
    }
    const parsed = parseGrammarQuestions(JSON.stringify([odd]))

    expect(parsed).toHaveLength(1)
    expect(parsed[0].segments[0].role).toBe('other')
  })

  it('tetap menerima soal tanpa segmen', () => {
    const { segments, ...noSegments } = question
    const parsed = parseGrammarQuestions(JSON.stringify([noSegments]))

    expect(parsed).toHaveLength(1)
    expect(parsed[0].segments).toEqual([])
  })
})
