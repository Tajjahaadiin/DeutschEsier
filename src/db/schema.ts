import { pgTable, serial, text, integer, boolean, index } from 'drizzle-orm/pg-core'

export const wordBank = pgTable('word_bank', {
  id: serial('id').primaryKey(),
  germanWord: text('german_word').notNull(),
  article: text('article'),
  indonesianWord: text('indonesian_word').notNull(),
  englishMeaning: text('english_meaning').notNull(),
  category: text('category').notNull(),
  phoneticSimilarity: integer('phonetic_similarity').default(3),
  exampleSentenceDe: text('example_sentence_de').notNull().default(''),
  exampleSentenceId: text('example_sentence_id').notNull().default(''),
  /**
   * Nama berkas audio statis (mis. "kaffee.mp3").
   * Kolom ini masih ada di database produksi namun belum dipakai kode:
   * audio kini dihasilkan runtime via TTS (lihat src/server/routes/tts.ts).
   * Dipertahankan agar schema selaras dengan database.
   */
  audioFilename: text('audio_filename').notNull().default(''),
  cefrLevel: text('cefr_level').notNull().default('A1'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()).notNull(),
}, (table) => [
  index('idx_word_bank_category').on(table.category),
  index('idx_word_bank_german').on(table.germanWord),
])

export const learningSession = pgTable('learning_session', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  scenarioPrompt: text('scenario_prompt').notNull(),
  cefrLevel: text('cefr_level').notNull().default('A1'),
  sceneDescription: text('scene_description').notNull().default(''),
  dialogueJson: text('dialogue_json').notNull(),
  vocabCluesJson: text('vocab_clues_json').notNull(),
  /** Jumlah baris dialog yang diminta guru saat generate (1-20). */
  dialogueCount: integer('dialogue_count').notNull().default(8),
  /**
   * Soal Richtig/Falsch hasil AI (JSON array) untuk skenario level B1.
   * NULL untuk skenario A1/A2 dan data lama sebelum fitur ini.
   */
  comprehensionQuestionsJson: text('comprehension_questions_json'),
  /**
   * Pola kalimat (S-P-O, W-Frage, Ja/Nein-Frage) hasil AI untuk tab Materi
   * grammatik, sebagai JSON array. NULL untuk data lama sebelum fitur ini.
   */
  grammarPatternsJson: text('grammar_patterns_json'),
  /**
   * Pilihan topik grammar B1 guru beserta materi AI-nya, sebagai JSON
   * {"selected": string[], "content": [...]}. NULL untuk A1/A2 dan data lama.
   */
  grammarTopicsJson: text('grammar_topics_json'),
  imageUrl: text('image_url'),
  published: boolean('published').notNull().default(true),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()).notNull(),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()).notNull(),
})

export const scenarioAccessKey = pgTable('scenario_access_key', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  sessionId: text('session_id').notNull(),
  label: text('label').notNull().default(''),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()).notNull(),
  isActive: boolean('is_active').notNull().default(true),
}, (table) => [
  index('idx_access_key').on(table.key),
  index('idx_access_session').on(table.sessionId),
])

export const quizSubmission = pgTable('quiz_submission', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull(),
  /**
   * Jenis aktivitas: 'quiz' (Hörverstehen + Lückentext) atau 'grammar'
   * (latihan Richtig/Falsch). Memisahkan analitik kedua aktivitas.
   */
  kind: text('kind').notNull().default('quiz'),
  accessKey: text('access_key').notNull().default(''),
  studentName: text('student_name').notNull(),
  score: integer('score').notNull(),
  totalQuestions: integer('total_questions').notNull(),
  correctAnswers: integer('correct_answers').notNull(),
  answersJson: text('answers_json').notNull(),
  submittedAt: text('submitted_at').$defaultFn(() => new Date().toISOString()).notNull(),
}, (table) => [
  index('idx_submission_session').on(table.sessionId),
  index('idx_submission_kind').on(table.kind),
])

export type NewWordBank = typeof wordBank.$inferInsert
