import { Schema } from 'effect'

export const DialogLineSchema = Schema.Struct({
  speaker: Schema.String,
  germanText: Schema.String,
  indonesianText: Schema.String,
})

export const VocabClueSchema = Schema.Struct({
  germanWord: Schema.String,
  indonesianMeaning: Schema.String,
  grammarTip: Schema.String,
})

/**
 * Soal Richtig/Falsch (Benar/Salah) hasil AI, dipakai untuk level B1.
 *
 * `isCorrect` adalah kunci jawaban: true = pernyataan sesuai dialog.
 * `explanation` menjelaskan dasar jawabannya memakai konteks dialog.
 */
export const ComprehensionQuestionSchema = Schema.Struct({
  statement: Schema.String,
  indonesianText: Schema.String,
  isCorrect: Schema.Boolean,
  explanation: Schema.String,
})

export const GeneratedLessonSchema = Schema.Struct({
  title: Schema.String,
  sceneDescription: Schema.String,
  dialogue: Schema.Array(DialogLineSchema),
  vocabClues: Schema.Array(VocabClueSchema),
  /**
   * Opsional: hanya diisi untuk skenario level B1. Skenario A1/A2 dan data
   * lama tidak punya field ini, sehingga dekode tetap berhasil.
   */
  comprehensionQuestions: Schema.optional(Schema.Array(ComprehensionQuestionSchema)),
})
