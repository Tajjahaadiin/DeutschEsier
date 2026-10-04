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

describe('GeneratedLessonSchema — soal Richtig/Falsch level B1', () => {
  it('menerima pelajaran dengan soal Richtig/Falsch', async () => {
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
