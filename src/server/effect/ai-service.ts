import { Effect, Schedule, Duration, Schema } from 'effect'
import { GoogleGenAI, Type } from '@google/genai'
import { GeneratedLessonSchema } from './schemas'
import { GRAMMAR_TOPICS, MAX_GRAMMAR_TOPICS, type GrammarTopic } from '../../shared/grammarTopics'

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
  cognateWords: string[],
  dialogueCount = 8,
  grammarTopicIds: string[] = []
) {
  const fullPrompt = buildPrompt(prompt, cefrLevel, cognateWords, dialogueCount, grammarTopicIds)
  const wantsComprehension = cefrLevel === 'B1'
  const topics = topicsForPrompt(grammarTopicIds)
  const wantsGrammarTopics = cefrLevel === 'B1' && topics.length > 0
  
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
              // Hanya diminta untuk level B1 (menggantikan kuis pemahaman).
              ...(wantsComprehension
                ? {
                    comprehensionQuestions: {
                      type: Type.ARRAY,
                      // Petunjuk jumlah ke model; bukan jaminan keras, karena
                      // Effect Schema sengaja tetap toleran (lihat schemas.ts).
                      // SDK @google/genai mengetikkan minItems/maxItems sebagai string.
                      minItems: '10',
                      maxItems: '10',
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          statement: { type: Type.STRING },
                          indonesianText: { type: Type.STRING },
                          isCorrect: { type: Type.BOOLEAN },
                          explanation: { type: Type.STRING },
                        },
                        required: ['statement', 'indonesianText', 'isCorrect', 'explanation'],
                      },
                    },
                  }
                : {}),
              // Pola kalimat untuk tab Materi grammatik (semua level).
              grammarPatterns: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    nameId: { type: Type.STRING },
                    formula: { type: Type.STRING },
                    exampleGerman: { type: Type.STRING },
                    exampleIndonesian: { type: Type.STRING },
                    segments: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          text: { type: Type.STRING },
                          role: {
                            type: Type.STRING,
                            enum: ['subjekt', 'praedikat', 'objekt', 'other'],
                          },
                        },
                        required: ['text', 'role'],
                      },
                    },
                  },
                  required: [
                    'name',
                    'nameId',
                    'formula',
                    'exampleGerman',
                    'exampleIndonesian',
                    'segments',
                  ],
                },
              },
              // Materi per topik tata bahasa, hanya diminta bila guru memilih topik.
              ...(wantsGrammarTopics
                ? {
                    grammarTopics: {
                      type: Type.ARRAY,
                      minItems: String(topics.length),
                      maxItems: String(topics.length),
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          topicId: { type: Type.STRING },
                          name: { type: Type.STRING },
                          nameId: { type: Type.STRING },
                          explanationId: { type: Type.STRING },
                          formula: { type: Type.STRING },
                          examples: {
                            type: Type.ARRAY,
                            minItems: '2',
                            maxItems: '3',
                            items: {
                              type: Type.OBJECT,
                              properties: {
                                german: { type: Type.STRING },
                                indonesian: { type: Type.STRING },
                                note: { type: Type.STRING },
                              },
                              required: ['german', 'indonesian', 'note'],
                            },
                          },
                        },
                        required: [
                          'topicId',
                          'name',
                          'nameId',
                          'explanationId',
                          'formula',
                          'examples',
                        ],
                      },
                    },
                  }
                : {}),
            },
            required: [
              'title',
              'sceneDescription',
              'dialogue',
              'vocabClues',
              'grammarPatterns',
              ...(wantsComprehension ? ['comprehensionQuestions'] : []),
              ...(wantsGrammarTopics ? ['grammarTopics'] : []),
            ],
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

/** Ambil definisi topik (dibatasi MAX_GRAMMAR_TOPICS) untuk prompt & schema. */
function topicsForPrompt(topicIds: string[]): GrammarTopic[] {
  const wanted = new Set(topicIds)
  return GRAMMAR_TOPICS.filter((t) => wanted.has(t.id)).slice(0, MAX_GRAMMAR_TOPICS)
}

/**
 * Susun instruksi prompt untuk materi per topik tata bahasa (level B1).
 *
 * Sengaja fungsi murni dan diekspor agar bisa diuji langsung. Label Jerman dan
 * Indonesia dicetak dari taksonomi supaya model menyalinnya apa adanya dan
 * tidak mengarang ID.
 */
export function buildGrammarTopicsBlock(topicIds: string[]): string {
  const topics = topicsForPrompt(topicIds)
  if (topics.length === 0) return ''

  const list = topics
    .map((t) => `- topicId "${t.id}": ${t.german} (${t.nameId}) — ${t.descriptionId}`)
    .join('\n')

  return `\n\nMateri tata bahasa untuk topik berikut (level B1):\n${list}\n\nUntuk SETIAP topik di atas, isi satu entri pada "grammarTopics":\n1. topicId: salin persis dari daftar di atas\n2. name: nama Jerman topik tersebut\n3. nameId: label Indonesia\n4. explanationId: penjelasan konsep 2-4 kalimat dalam bahasa Indonesia, sesuai keterangan di daftar\n5. formula: rumus/pola singkat memakai istilah Jerman\n6. examples: tepat 2 contoh { german, indonesian, note } — kalimat Jerman yang benar, terjemahan Indonesia, dan catatan singkat\n7. Usahakan minimal satu baris dialog di atas memakai tiap topik bila wajar untuk skenarionya`
}

export function buildPrompt(
  prompt: string,
  level: string,
  cognates: string[],
  dialogueCount: number,
  grammarTopicIds: string[] = []
): string {
  const cognateList = cognates.length > 0 ? `\nKata kognate yang WAJIB digunakan: ${cognates.join(', ')}` : ''
  const grammarTopicsBlock =
    level === 'B1' ? buildGrammarTopicsBlock(grammarTopicIds) : ''

  // Level B1: kuis pemahaman digantikan soal Richtig/Falsch (Benar/Salah).
  const comprehensionBlock =
    level === 'B1'
      ? `\n\nTambahan untuk level B1 — soal Richtig/Falsch (Benar/Salah):\n9. Buat tepat 10 soal Richtig oder Falsch berdasarkan dialog di atas\n10. Sebagian soal harus SALAH: ubah satu fakta penting dari dialog (subjek, objek, tempat, waktu, atau angka) sehingga pernyataannya tidak sesuai dialog\n11. Sebagian soal lainnya harus BENAR: pernyataannya sesuai dialog\n12. statement diisi pernyataan bahasa Jerman yang harus dinilai Benar atau Salah\n13. indonesianText adalah terjemahan Indonesia dari statement\n14. isCorrect diisi true bila pernyataan sesuai dialog, false bila tidak\n15. explanation menjelaskan singkat mengapa jawabannya demikian berdasarkan dialog`
      : ''

  return `Kamu adalah guru bahasa Jerman yang berpengalaman. Buat dialog pembelajaran bahasa Jerman untuk siswa Indonesia level ${level}.\n\nSkenario: ${prompt}${cognateList}\n\nPanduan:\n1. Dialog harus natural dan relevan dengan skenario\n2. Speaker adalah "Sprecher A" und "Sprecher B"\n3. Teks Jerman harus sesuai level ${level} CEFR\n4. Terjemahan Indonesia harus natural\n5. vocabClues berisi kata-kata kunci dengan tip grammar yang membantu\n6. sceneDescription menggambarkan latar tempat dan konteks dialog\n7. Sertakan tepat ${dialogueCount} baris dialog\n8. vocabClues minimal 4-6 kata${comprehensionBlock}\n\nPola kalimat untuk tab Materi grammatik — sertakan tepat 3 pola berikut:\n- name "Aussagesatz", nameId "Kalimat Berita": pola Subjekt – Prädikat – Objekt dengan kata kerja di posisi kedua\n- name "W-Frage", nameId "Kalimat Tanya W": kata tanya (wer, was, wo, wann) di awal, kata kerja di posisi kedua\n- name "Ja/Nein-Frage", nameId "Kalimat Tanya Ya/Tidak": kata kerja di posisi pertama\n\nAturan pengisian tiap pola:\n1. formula diisi rumus singkat memakai istilah Jerman, mis. "Subjekt – Prädikat – Objekt"\n2. exampleGerman: UTAMAKAN kalimat yang sudah ada di dialog di atas bila cocok dengan polanya. Bila tidak ada yang cocok, buat kalimat baru yang sederhana dan sesuai skenario\n3. exampleIndonesian diisi terjemahan Indonesia dari exampleGerman\n4. segments memecah exampleGerman menjadi potongan berurutan; setiap potongan punya "text" dan "role"\n5. role hanya boleh salah satu dari: "subjekt", "praedikat", "objekt", atau "other" (untuk kata tanya, kata bantu, negasi, dan bagian lain)\n6. Gabungan semua "text" pada segments harus sama dengan exampleGerman${grammarTopicsBlock}`
}
