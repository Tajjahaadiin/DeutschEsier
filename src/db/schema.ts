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
  accessKey: text('access_key').notNull().default(''),
  studentName: text('student_name').notNull(),
  score: integer('score').notNull(),
  totalQuestions: integer('total_questions').notNull(),
  correctAnswers: integer('correct_answers').notNull(),
  answersJson: text('answers_json').notNull(),
  submittedAt: text('submitted_at').$defaultFn(() => new Date().toISOString()).notNull(),
}, (table) => [
  index('idx_submission_session').on(table.sessionId),
])

export type WordBank = typeof wordBank.$inferSelect
export type NewWordBank = typeof wordBank.$inferInsert
export type LearningSession = typeof learningSession.$inferSelect
export type NewLearningSession = typeof learningSession.$inferInsert
export type ScenarioAccessKey = typeof scenarioAccessKey.$inferSelect
export type NewScenarioAccessKey = typeof scenarioAccessKey.$inferInsert
export type QuizSubmission = typeof quizSubmission.$inferSelect
export type NewQuizSubmission = typeof quizSubmission.$inferInsert
