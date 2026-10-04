import { describe, it, expect } from 'vitest'
import { Effect, Schema } from 'effect'
import { GeneratedLessonSchema } from './schemas'

const decode = (input: unknown) =>
  Effect.runPromise(Schema.decodeUnknown(GeneratedLessonSchema)(input))

/** Pelajaran valid versi lama: belum punya comprehensionQuestions. */
const baseLesson = {
  title: 'Im Café',
  sceneDescription: 'Dua orang memesan kopi.',
  dialogue: [
    { speaker: 'Sprecher A', germanText: 'Guten Tag!', indonesianText: 'Selamat siang!' },
  ],
  vocabClues: [
    { germanWord: 'der Kaffee', indonesianMeaning: 'kopi', grammarTip: 'Kata benda maskulin.' },
  ],
}

const question = {
  statement: 'Sprecher A trinkt Tee.',
  indonesianText: 'Pembicara A minum teh.',
  isCorrect: false,
  explanation: 'Berdasarkan dialog, ia memesan kopi, bukan teh.',
}

describe('GeneratedLessonSchema — soal Richtig/Falsch level B1', () => {  it('menerima pelajaran dengan soal Richtig/Falsch', async () => {
    const lesson = await decode({ ...baseLesson, comprehensionQuestions: [question] })

    expect(lesson.comprehensionQuestions).toHaveLength(1)
    expect(lesson.comprehensionQuestions?.[0].isCorrect).toBe(false)
  })

  it('menerima pelajaran lama yang belum punya soal Richtig/Falsch', async () => {
    const lesson = await decode(baseLesson)

    expect(lesson.comprehensionQuestions).toBeUndefined()
  })

  it('menolak soal tanpa penjelasan', async () => {
    const broken = { statement: 'X', indonesianText: 'Y', isCorrect: true }

    await expect(decode({ ...baseLesson, comprehensionQuestions: [broken] })).rejects.toThrow()
  })

  it('menolak jawaban yang bukan boolean', async () => {
    const broken = { ...question, isCorrect: 'salah' }

    await expect(decode({ ...baseLesson, comprehensionQuestions: [broken] })).rejects.toThrow()
  })
})

describe('GeneratedLessonSchema — soal latihan tata bahasa (Latihan)', () => {
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

  it('menerima pelajaran dengan soal latihan tata bahasa', async () => {
    const lesson = await decode({ ...baseLesson, grammarQuestions: [question] })

    expect(lesson.grammarQuestions).toHaveLength(1)
    expect(lesson.grammarQuestions?.[0].isCorrect).toBe(false)
    expect(lesson.grammarQuestions?.[0].topicId).toBe('tempus-perfekt')
  })

  it('menerima pelajaran tanpa soal latihan (data lama & level lain)', async () => {
    const lesson = await decode(baseLesson)

    expect(lesson.grammarQuestions).toBeUndefined()
  })

  it('membuang hanya entri yang rusak, sisanya tetap', async () => {
    const broken = { sentence: 'X' }
    const lesson = await decode({ ...baseLesson, grammarQuestions: [question, broken] })

    expect(lesson.grammarQuestions).toHaveLength(1)
  })

  it('membuang soal dengan topicId yang tidak dikenal', async () => {
    const unknown = { ...question, topicId: 'topik-karangan' }
    const lesson = await decode({ ...baseLesson, grammarQuestions: [unknown] })

    expect(lesson.grammarQuestions).toEqual([])
  })

  it('menormalkan correctedSentence kosong pada soal yang benar', async () => {
    const correct = { ...question, isCorrect: true, correctedSentence: '' }
    const lesson = await decode({ ...baseLesson, grammarQuestions: [correct] })

    expect(lesson.grammarQuestions?.[0].correctedSentence).toBe(question.sentence)
  })
})

describe('GeneratedLessonSchema — pola kalimat (S-P-O dll.)', () => {
  const pattern = {
    name: 'Aussagesatz',
    nameId: 'Kalimat Berita',
    formula: 'Subjekt – Prädikat – Objekt',
    exampleGerman: 'Der Mann trinkt Kaffee.',
    exampleIndonesian: 'Pria itu minum kopi.',
    segments: [
      { text: 'Der Mann', role: 'subjekt' },
      { text: 'trinkt', role: 'praedikat' },
      { text: 'Kaffee', role: 'objekt' },
    ],
  }

  it('menerima pelajaran dengan pola kalimat', async () => {
    const lesson = await decode({ ...baseLesson, grammarPatterns: [pattern] })

    expect(lesson.grammarPatterns).toHaveLength(1)
    expect(lesson.grammarPatterns?.[0].segments[1].role).toBe('praedikat')
  })

  it('menerima pelajaran lama yang belum punya pola kalimat', async () => {
    const lesson = await decode(baseLesson)

    expect(lesson.grammarPatterns).toBeUndefined()
  })

  it('menolak role di luar daftar yang dikenal', async () => {
    const broken = {
      ...pattern,
      segments: [{ text: 'Der Mann', role: 'verb' }],
    }

    await expect(decode({ ...baseLesson, grammarPatterns: [broken] })).rejects.toThrow()
  })

  it('menolak pola tanpa contoh terjemahan', async () => {
    const { exampleIndonesian, ...broken } = pattern

    await expect(decode({ ...baseLesson, grammarPatterns: [broken] })).rejects.toThrow()
  })

  it('tetap menerima pola walau gabungan segments tidak sama persis dengan contoh', async () => {
    // Pemisahan segmen hanya untuk pewarnaan; tidak boleh menggagalkan generate.
    const lenient = { ...pattern, exampleGerman: 'Der Mann trinkt Kaffee.' }

    const lesson = await decode({ ...baseLesson, grammarPatterns: [lenient] })

    expect(lesson.grammarPatterns).toHaveLength(1)
  })
})
