import { Effect, Schedule, Duration, Schema } from 'effect'
import { GoogleGenAI, Type } from '@google/genai'
import { GeneratedLessonSchema } from './schemas'
import { GRAMMAR_TOPICS, MAX_GRAMMAR_TOPICS, type GrammarTopic } from '../../shared/grammarTopics'
import { GRAMMAR_ROLES } from '../../shared/grammarRoles'

export class GeminiApiError extends Error {
  readonly _tag = 'GeminiApiError'
}
export class DahlApiError extends Error {
  readonly _tag = 'DahlApiError'
}
export class JsonParseError extends Error {
  readonly _tag = 'JsonParseError'
}
export class SchemaValidationError extends Error {
  readonly _tag = 'SchemaValidationError'
}

let dahlKeyIndex = 0

function getDahlConfig(): { base: string; keys: string[]; model: string } | null {
  const base = process.env.DAHL_API_BASE || 'https://inference.dahl.global/v1'
  const rawKeys = process.env.DAHL_API_KEYS || process.env.DAHL_API_KEY || ''
  const keys = rawKeys
    .split(',')
    .map((k) => k.trim())
    .filter((k) => k.length > 0)
  const model = process.env.DAHL_MODEL || 'MiniMaxAI/MiniMax-M2.7'

  if (keys.length === 0) return null
  return { base, keys, model }
}

/**
 * Membersihkan respon teks dari model (misal tag <think>...</think> atau markdown code fences)
 * agar JSON.parse dapat mengekstrak objek JSON yang valid.
 */
export function extractCleanJson(rawText: string): string {
  // 1. Hapus tag <think>...</think> dari model reasoning
  let cleaned = rawText.replace(/<think>[\s\S]*?<\/think>/gi, '').trim()

  // 2. Jika dibungkus code block markdown ```json ... ```, ekstrak isinya
  const codeBlockMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)
  if (codeBlockMatch) {
    cleaned = codeBlockMatch[1].trim()
  }

  // 3. Cari bracket pembuka { pertama dan bracket penutup } terakhir
  const firstBrace = cleaned.indexOf('{')
  const lastBrace = cleaned.lastIndexOf('}')
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1)
  }

  return cleaned
}

/**
 * Panggilan fallback ke Dahl Inference dengan rotasi multi-key otomatis
 */
async function callDahlWithKeyRotation(fullPrompt: string): Promise<string> {
  const config = getDahlConfig()
  if (!config) {
    throw new DahlApiError('DAHL_API_KEYS tidak dikonfigurasi di environment.')
  }

  const { base, keys, model } = config
  let lastError: any = null

  // Coba semua key yang tersedia secara bergiliran (round-robin)
  for (let attempt = 0; attempt < keys.length; attempt++) {
    const currentKey = keys[dahlKeyIndex % keys.length]
    dahlKeyIndex = (dahlKeyIndex + 1) % keys.length

    try {
      const res = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'system',
              content:
                'You are an expert German language teacher. Respond ONLY with a valid, raw JSON object matching the requested schema. Do not include markdown formatting, codeblocks, or explanatory text.',
            },
            {
              role: 'user',
              content: fullPrompt,
            },
          ],
          temperature: 0.3,
        }),
      })

      if (res.status === 429) {
        console.warn(`[Dahl Key ${dahlKeyIndex}] 429 Rate limited, mencoba key berikutnya...`)
        lastError = new Error(`Dahl 429 Rate Limit (Key ${dahlKeyIndex})`)
        continue
      }

      if (!res.ok) {
        const errText = await res.text()
        console.warn(`[Dahl Key ${dahlKeyIndex}] HTTP Error ${res.status}:`, errText)
        lastError = new Error(`Dahl HTTP ${res.status}: ${errText}`)
        continue
      }

      const data = await res.json()
      const content = data.choices?.[0]?.message?.content
      if (!content || !content.trim()) {
        throw new Error('Dahl returned empty content')
      }

      return content
    } catch (err: any) {
      console.warn(`[Dahl attempt ${attempt + 1}/${keys.length} failed]:`, err.message || err)
      lastError = err
    }
  }

  throw new DahlApiError(`Semua key Dahl gagal: ${lastError?.message || lastError}`)
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
  grammarTopicIds: string[] = [],
  speakerCount = 2
) {
  const fullPrompt = buildPrompt(prompt, cefrLevel, cognateWords, dialogueCount, grammarTopicIds, speakerCount)
  // Soal Richtig/Falsch level B1 (dan A2 jika dibutuhkan)
  const wantsComprehension = cefrLevel === 'B1' || cefrLevel === 'A2'
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
              // Hanya diminta untuk level B1 dan A2
              ...(wantsComprehension
                ? {
                    comprehensionQuestions: {
                      type: Type.ARRAY,
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
                            enum: [...GRAMMAR_ROLES],
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
              // Soal latihan tata bahasa, hanya bila guru memilih topik B1.
              ...(wantsGrammarTopics
                ? {
                    grammarQuestions: {
                      type: Type.ARRAY,
                      // Petunjuk jumlah ke model; bukan jaminan keras, karena
                      // Effect Schema sengaja tetap toleran (lihat schemas.ts).
                      // SDK @google/genai mengetikkan minItems/maxItems sebagai string.
                      minItems: '10',
                      maxItems: '10',
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          sentence: { type: Type.STRING },
                          isCorrect: { type: Type.BOOLEAN },
                          explanationId: { type: Type.STRING },
                          correctedSentence: { type: Type.STRING },
                          topicId: { type: Type.STRING },
                          segments: {
                            type: Type.ARRAY,
                            items: {
                              type: Type.OBJECT,
                              properties: {
                                text: { type: Type.STRING },
                                role: {
                                  type: Type.STRING,
                                  enum: [...GRAMMAR_ROLES],
                                },
                              },
                              required: ['text', 'role'],
                            },
                          },
                        },
                        required: [
                          'sentence',
                          'isCorrect',
                          'explanationId',
                          'correctedSentence',
                          'topicId',
                          'segments',
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
              ...(wantsGrammarTopics ? ['grammarQuestions'] : []),
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

  const callAndParseGemini = callGemini.pipe(
    Effect.flatMap((rawText) =>
      Effect.try({
        try: () => JSON.parse(extractCleanJson(rawText)) as unknown,
        catch: (err) => new JsonParseError(`JSON parse failed: ${err}`),
      })
    ),
    Effect.retry(retryPolicy)
  )

  // Jaring pengaman multi-provider: Coba Gemini -> Jika 429 / kuota habis -> Fallback ke Dahl Multi-Key
  const callAndParse = callAndParseGemini.pipe(
    Effect.catchAll((geminiErr) => {
      console.warn('[Gemini Quota Exceeded / Failed, beralih ke Dahl Multi-Key Fallback...]:', geminiErr.message)
      return Effect.tryPromise({
        try: () => callDahlWithKeyRotation(fullPrompt),
        catch: (dahlErr) => new DahlApiError(`Gemini & Dahl kedua provider gagal: ${dahlErr}`),
      }).pipe(
        Effect.flatMap((rawText) =>
          Effect.try({
            try: () => JSON.parse(extractCleanJson(rawText)) as unknown,
            catch: (err) => new JsonParseError(`JSON parse failed: ${err}`),
          })
        )
      )
    })
  )

  return callAndParse.pipe(
    Effect.flatMap((parsed) =>
      Schema.decodeUnknown(GeneratedLessonSchema)(parsed).pipe(
        Effect.mapError((err) => new SchemaValidationError(`Schema validation failed: ${err}`))
      )
    )
  )
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

/**
 * Susun instruksi prompt untuk soal latihan tata bahasa (level B1).
 *
 * Inti fiturnya: soal bertanya "apakah kalimat ini gramatikal?" dan setiap
 * kalimat yang salah WAJIB disertai bentuk yang benar, karena tidak ada mesin
 * tata bahasa di proyek ini yang bisa memverifikasi keluaran AI.
 */
export function buildGrammarQuestionsBlock(topicIds: string[]): string {
  const topics = topicsForPrompt(topicIds)
  if (topics.length === 0) return ''

  const list = topics.map((t) => `- topicId "${t.id}": ${t.german} (${t.nameId})`).join('\n')

  return `\n\nSoal latihan tata bahasa (level B1) — isi "grammarQuestions":\nSetiap soal menanyakan: "Apakah kalimat ini gramatikal?" (benar atau salah secara tata bahasa).\nTopik yang diuji:\n${list}\n\nAturan:\n1. Buat tepat 10 soal. Sekitar separuh kalimatnya SALAH secara tata bahasa, dan benar/salah dibuat berselang-seling\n2. Setiap soal berisi satu kalimat Jerman pada field "sentence"\n3. Kalimat yang salah harus punya TEPAT SATU kesalahan tata bahasa yang berkaitan dengan topiknya (mis. auxiliary salah: "Ich bin gestern die Küche geputzt." seharusnya "Ich habe gestern die Küche geputzt.")\n4. isCorrect diisi true bila kalimat itu benar secara tata bahasa, false bila salah\n5. correctedSentence WAJIB diisi: bentuk kalimat yang benar. Bila isCorrect true, salin "sentence" persis ke correctedSentence\n6. explanationId diisi penjelasan aturannya dalam bahasa Indonesia, 1-2 kalimat, menyebut aturan yang dilanggar\n7. topicId disalin persis dari daftar di atas\n8. segments memecah "sentence" menjadi potongan berurutan; tiap potongan punya "text" dan "role" (salah satu dari "subjekt", "praedikat", "objekt", "other"); gabungan semua "text" harus sama dengan "sentence"`
}

export function buildPrompt(
  prompt: string,
  level: string,
  cognates: string[],
  dialogueCount: number,
  grammarTopicIds: string[] = [],
  speakerCount = 2
): string {
  const cognateList = cognates.length > 0 ? `\nKata kognate yang WAJIB digunakan: ${cognates.join(', ')}` : ''
  const grammarTopicsBlock =
    level === 'B1' ? buildGrammarTopicsBlock(grammarTopicIds) : ''
  const grammarQuestionsBlock =
    level === 'B1' ? buildGrammarQuestionsBlock(grammarTopicIds) : ''

  // Format penamaan pembicara (didukung 2 atau 3 pembicara deterministik)
  const letters = ['A', 'B', 'C']
  const count = Math.min(3, Math.max(2, speakerCount || 2))
  const speakerNames = letters.slice(0, count).map((l) => `"Sprecher ${l}"`).join(', ')

  // Panduan komposisi gender deterministik:
  // 2 Pembicara: Sprecher A (weiblich / Perempuan), Sprecher B (männlich-1 / Laki-laki 1)
  // 3 Pembicara: Sprecher A (weiblich / Perempuan), Sprecher B (männlich-1 / Laki-laki 1), Sprecher C (männlich-2 / Laki-laki 2)
  const speakerGenderGuide =
    count === 3
      ? '\n   - Komposisi gender pembicara WAJIB deterministik: Tepat 1 Perempuan ("Sprecher A" - weiblich) dan 2 Laki-laki ("Sprecher B" - männlich-1 dan "Sprecher C" - männlich-2). Sesuaikan kata ganti orang (er/sie) dan sapaan (Herr/Frau) secara konsisten.'
      : '\n   - Komposisi gender pembicara WAJIB deterministik: "Sprecher A" adalah Perempuan (weiblich) dan "Sprecher B" adalah Laki-laki (männlich-1).';

  // Blok kuis pemahaman disesuaikan dengan tingkat kemampuan CEFR (A2 dan B1)
  const comprehensionBlock =
    level === 'B1' || level === 'A2'
      ? `\n\nSoal Pemahaman Dialog (Richtig oder Falsch) untuk level ${level}:
9. Buat tepat 10 soal Richtig oder Falsch berdasarkan dialog di atas
10. Sebagian soal harus SALAH: ubah satu fakta penting dari dialog (subjek, objek, tempat, waktu, atau angka) sehingga pernyataannya tidak sesuai dialog
11. Sebagian soal lainnya harus BENAR: pernyataannya sesuai dialog
12. statement diisi pernyataan bahasa Jerman yang harus dinilai Benar atau Salah
13. indonesianText adalah terjemahan Indonesia dari statement
14. isCorrect diisi true bila pernyataan sesuai dialog, false bila tidak
15. explanation menjelaskan singkat mengapa jawabannya demikian berdasarkan dialog`
      : ''

  // Panduan tata bahasa bertingkat per level CEFR
  const cefrPatternsGuide =
    level === 'A1'
      ? `\nPola kalimat untuk tab Materi grammatik level A1 — sertakan tepat 3 pola dasar:
- name "Aussagesatz", nameId "Kalimat Berita": pola Subjekt – Prädikat – Objekt dengan kata kerja di posisi kedua
- name "W-Frage", nameId "Kalimat Tanya W": kata tanya (wer, was, wo, wann) di awal, kata kerja di posisi kedua
- name "Ja/Nein-Frage", nameId "Kalimat Tanya Ya/Tidak": kata kerja di posisi pertama`
      : level === 'A2'
      ? `\nPola kalimat untuk tab Materi grammatik level A2 — sertakan 3 pola kalimat tingkat dasar-lanjut:
- name "Perfekt mit haben/sein", nameId "Kalimat Bentuk Lampau Perfekt": Hilfsverb posisi kedua + Partizip II di akhir kalimat
- name "Kausalsatz mit weil", nameId "Kalimat Sebab-Akibat (weil)": Subjunktion "weil" dengan kata kerja terkonjugasi di posisi paling akhir
- name "Modalverben im Präsens", nameId "Kalimat Kata Kerja Modal": Modalverb di posisi kedua + Infinitiv di akhir kalimat`
      : `\nPola kalimat untuk tab Materi grammatik level B1 — sertakan 3 pola kalimat tingkat mandiri:
- name "Konzessivsatz mit obwohl", nameId "Kalimat Pertentangan (obwohl)": Subjunktion "obwohl" dengan kata kerja di posisi paling akhir
- name "Relativsatz", nameId "Klausa Relatif (yang...)": Relativpronomen + Verbfall am Ende
- name "Infinitiv mit zu", nameId "Konstruksi Infinitiv dengan zu": Klausa tujuan/keterangan dengan "zu + Infinitiv"`

  return `Kamu adalah guru bahasa Jerman yang berpengalaman. Buat dialog pembelajaran bahasa Jerman untuk siswa Indonesia level ${level}.\n\nSkenario: ${prompt}${cognateList}\n\nPanduan:\n1. Dialog harus natural dan relevan dengan skenario\n2. Gunakan percakapan antar ${count} pembicara: ${speakerNames}${speakerGenderGuide}\n3. Teks Jerman harus sesuai level ${level} CEFR\n4. Terjemahan Indonesia harus natural\n5. vocabClues berisi kata-kata kunci dengan tip grammar yang membantu\n6. sceneDescription menggambarkan latar tempat dan konteks dialog\n7. Sertakan tepat ${dialogueCount} baris dialog\n8. vocabClues minimal 4-6 kata${comprehensionBlock}\n${cefrPatternsGuide}\n\nAturan pengisian tiap pola:\n1. formula diisi rumus singkat memakai istilah Jerman, mis. "Subjekt – Prädikat – Objekt"\n2. exampleGerman: UTAMAKAN kalimat yang sudah ada di dialog di atas bila cocok dengan polanya. Bila tidak ada yang cocok, buat kalimat baru yang sederhana dan sesuai skenario\n3. exampleIndonesian diisi terjemahan Indonesia dari exampleGerman\n4. segments memecah exampleGerman menjadi potongan berurutan; setiap potongan punya "text" dan "role"\n5. role hanya boleh salah satu dari: "subjekt", "praedikat", "objekt", atau "other" (untuk kata tanya, kata bantu, negasi, dan bagian lain)\n6. Gabungan semua "text" pada segments harus sama dengan exampleGerman${grammarTopicsBlock}${grammarQuestionsBlock}`
}
