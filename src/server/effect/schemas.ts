import { Schema } from 'effect'
import { isGrammarTopicId } from '../../shared/grammarTopics'

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

/**
 * Peran gramatikal satu potongan kalimat, dipakai UI untuk memberi warna.
 * 'other' menampung bagian lain seperti kata tanya, kata bantu, atau negasi.
 */
export const GrammarSegmentSchema = Schema.Struct({
  text: Schema.String,
  role: Schema.Literal('subjekt', 'praedikat', 'objekt', 'other'),
})

/**
 * Satu pola kalimat untuk tab Materi grammatik.
 *
 * `segments` memecah contoh kalimat per peran agar bisa diwarnai. Gabungan
 * segments sengaja TIDAK diwajibkan sama persis dengan exampleGerman: itu hanya
 * urusan tampilan, dan menolaknya akan menggagalkan generate tanpa alasan kuat.
 */
export const GrammarPatternSchema = Schema.Struct({
  name: Schema.String,
  nameId: Schema.String,
  formula: Schema.String,
  exampleGerman: Schema.String,
  exampleIndonesian: Schema.String,
  segments: Schema.Array(GrammarSegmentSchema),
})

/** Satu contoh pemakaian untuk sebuah topik tata bahasa. */
export const GrammarTopicExampleSchema = Schema.Struct({
  german: Schema.String,
  indonesian: Schema.String,
  note: Schema.String,
})

/**
 * Materi satu topik tata bahasa hasil AI (mis. Passiv, Konjunktiv II).
 *
 * Bentuknya sengaja TIDAK memakai `segments` seperti pola kalimat, karena
 * topik abstrak bukan pola S-P-O.
 */
export const GrammarTopicContentSchema = Schema.Struct({
  topicId: Schema.String,
  name: Schema.String,
  nameId: Schema.String,
  explanationId: Schema.String,
  formula: Schema.String,
  examples: Schema.Array(GrammarTopicExampleSchema),
})

/**
 * Buang entri yang `topicId`-nya tidak ada di taksonomi (AI kadang mengarang).
 * Sengaja dibuang, bukan digagalkan: satu entri keliru tidak boleh membatalkan
 * seluruh hasil generate yang sudah ditunggu guru.
 */
const GrammarTopicsSchema = Schema.transform(
  Schema.Array(GrammarTopicContentSchema),
  Schema.Array(GrammarTopicContentSchema),
  {
    strict: false,
    decode: (entries) => entries.filter((e) => isGrammarTopicId(e.topicId)),
    encode: (entries) => entries,
  }
)

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
  /**
   * Opsional: pola kalimat (S-P-O dll.) untuk tab Materi grammatik.
   * Sengaja opsional agar data lama tetap bisa dibaca.
   */
  grammarPatterns: Schema.optional(Schema.Array(GrammarPatternSchema)),
  /**
   * Opsional: materi per topik tata bahasa B1 yang dipilih guru.
   * Hanya ada bila guru memilih topik; data lama tidak punya field ini.
   */
  grammarTopics: Schema.optional(GrammarTopicsSchema),
})
