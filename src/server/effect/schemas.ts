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

export const GeneratedLessonSchema = Schema.Struct({
  title: Schema.String,
  sceneDescription: Schema.String,
  dialogue: Schema.Array(DialogLineSchema),
  vocabClues: Schema.Array(VocabClueSchema),
})
