import { Effect, Schedule, Duration, Schema } from 'effect'
import { GoogleGenAI, Type } from '@google/genai'
import { GeneratedLessonSchema } from './schemas'

export class GeminiApiError extends Error {
  readonly _tag = 'GeminiApiError'
}
export class JsonParseError extends Error {
  readonly _tag = 'JsonParseError'
}
export class SchemaValidationError extends Error {
  readonly _tag = 'SchemaValidationError'
}

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new GeminiApiError('GEMINI_API_KEY is not set. Check your .env file.')
  }
  return new GoogleGenAI({ apiKey })
}

const retryPolicy = Schedule.exponential(Duration.millis(500), 2).pipe(
  Schedule.intersect(Schedule.recurs(3))
)

export function generateLesson(
  prompt: string,
  cefrLevel: 'A1' | 'A2' | 'B1',
  cognateWords: string[]
) {
  const fullPrompt = buildPrompt(prompt, cefrLevel, cognateWords)
  
  const callGemini = Effect.tryPromise({
    try: async () => {
      const ai = getAiClient()
      const response = await ai.models.generateContent({
        model: process.env.GEMINI_MODEL || 'gemini-3.6-flash',
        contents: fullPrompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              sceneDescription: { type: Type.STRING },
              dialogue: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    speaker: { type: Type.STRING },
                    germanText: { type: Type.STRING },
                    indonesianText: { type: Type.STRING },
                  },
                  required: ['speaker', 'germanText', 'indonesianText'],
                },
              },
              vocabClues: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    germanWord: { type: Type.STRING },
                    indonesianMeaning: { type: Type.STRING },
                    grammarTip: { type: Type.STRING },
                  },
                  required: ['germanWord', 'indonesianMeaning', 'grammarTip'],
                },
              },
            },
            required: ['title', 'sceneDescription', 'dialogue', 'vocabClues'],
          },
          temperature: 0.4,
        },
      })
      const text = response.text
      if (!text) throw new Error('Empty response from Gemini')
      return text
    },
    catch: (err) => new GeminiApiError(`Gemini API call failed: ${err}`),
  })
  
  const pipeline = callGemini.pipe(
    Effect.flatMap((rawText) =>
      Effect.try({
        try: () => JSON.parse(rawText) as unknown,
        catch: (err) => new JsonParseError(`JSON parse failed: ${err}`),
      })
    ),
    Effect.flatMap((parsed) =>
      Schema.decodeUnknown(GeneratedLessonSchema)(parsed).pipe(
        Effect.mapError((err) => new SchemaValidationError(`Schema validation failed: ${err}`))
      )
    )
  )

  return pipeline.pipe(Effect.retry(retryPolicy))
}

function buildPrompt(prompt: string, level: string, cognates: string[]): string {
  const cognateList = cognates.length > 0 ? `\nKata kognate yang WAJIB digunakan: ${cognates.join(', ')}` : ''
  return `Kamu adalah guru bahasa Jerman yang berpengalaman. Buat dialog pembelajaran bahasa Jerman untuk siswa Indonesia level ${level}.\n\nSkenario: ${prompt}${cognateList}\n\nPanduan:\n1. Dialog harus natural dan relevan dengan skenario\n2. Speaker adalah "Sprecher A" und "Sprecher B"\n3. Teks Jerman harus sesuai level ${level} CEFR\n4. Terjemahan Indonesia harus natural\n5. vocabClues berisi kata-kata kunci dengan tip grammar yang membantu\n6. sceneDescription menggambarkan latar tempat dan konteks dialog\n7. Sertakan setidaknya 6-8 baris dialog\n8. vocabClues minimal 4-6 kata`
}
