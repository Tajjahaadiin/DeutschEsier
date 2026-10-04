import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock hanya pada system boundary eksternal: SDK Google Gemini.
// Tidak ada jaringan/API key nyata yang dipakai saat test.
const { generateContent } = vi.hoisted(() => ({ generateContent: vi.fn() }))

vi.mock('@google/genai', () => ({
  GoogleGenAI: class {
    models = { generateContent }
  },
  Type: {
    OBJECT: 'OBJECT',
    STRING: 'STRING',
    ARRAY: 'ARRAY',
    BOOLEAN: 'BOOLEAN',
  },
}))

process.env.GEMINI_API_KEY = 'test-key'
process.env.TEACHER_PASSWORD = 'test-password'

const { default: app } = await import('../app')

const VALID_LESSON = JSON.stringify({
  title: 'Im Café',
  sceneDescription: 'Dua orang memesan kopi.',
  dialogue: [
    { speaker: 'Sprecher A', germanText: 'Guten Tag!', indonesianText: 'Selamat siang!' },
    { speaker: 'Sprecher B', germanText: 'Hallo!', indonesianText: 'Halo!' },
  ],
  vocabClues: [
    { germanWord: 'der Kaffee', indonesianMeaning: 'kopi', grammarTip: 'Kata benda maskulin.' },
  ],
})

async function teacherToken(): Promise<string> {
  const res = await app.request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'test-password' }),
  })
  const data = (await res.json()) as { token: string }
  return data.token
}

async function postGenerate(payload: Record<string, unknown>) {
  const token = await teacherToken()
  return app.request('/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  })
}

/** Isi prompt yang dikirim ke Gemini pada pemanggilan terakhir. */
function lastPromptSentToGemini(): string {
  const call = generateContent.mock.calls.at(-1)
  return String(call?.[0]?.contents ?? '')
}

/** responseSchema Gemini pada pemanggilan terakhir. */
function lastResponseSchema(): any {
  const call = generateContent.mock.calls.at(-1)
  return call?.[0]?.config?.responseSchema
}

beforeEach(() => {
  generateContent.mockReset()
  generateContent.mockResolvedValue({ text: VALID_LESSON })
})

describe('POST /api/generate — kontrol jumlah dialog', () => {
  it('menginstruksikan AI membuat dialog sebanyak yang diminta guru', async () => {
    const res = await postGenerate({ prompt: 'Di kafe Berlin', cefrLevel: 'A1', dialogueCount: 12 })

    expect(res.status).toBe(200)
    expect(lastPromptSentToGemini()).toContain('12 baris dialog')
  })

  it('menolak permintaan lebih dari 20 dialog', async () => {
    const res = await postGenerate({ prompt: 'Di kafe Berlin', cefrLevel: 'A1', dialogueCount: 21 })

    expect(res.status).toBe(400)
    expect(generateContent).not.toHaveBeenCalled()
  })

  it('menerima tepat 20 dialog (batas atas)', async () => {
    const res = await postGenerate({ prompt: 'Di kafe Berlin', cefrLevel: 'A1', dialogueCount: 20 })

    expect(res.status).toBe(200)
    expect(lastPromptSentToGemini()).toContain('20 baris dialog')
  })

  it('menolak 0 dialog (di bawah minimum)', async () => {
    const res = await postGenerate({ prompt: 'Di kafe Berlin', cefrLevel: 'A1', dialogueCount: 0 })

    expect(res.status).toBe(400)
    expect(generateContent).not.toHaveBeenCalled()
  })

  it('menolak jumlah dialog pecahan', async () => {
    const res = await postGenerate({ prompt: 'Di kafe Berlin', cefrLevel: 'A1', dialogueCount: 7.5 })

    expect(res.status).toBe(400)
    expect(generateContent).not.toHaveBeenCalled()
  })

  it('memakai default 8 dialog bila jumlah tidak diberikan', async () => {
    const res = await postGenerate({ prompt: 'Di kafe Berlin', cefrLevel: 'A1' })

    expect(res.status).toBe(200)
    const prompt = lastPromptSentToGemini()
    expect(prompt).toContain('8 baris dialog')
    expect(prompt).not.toContain('6-8')
  })

})

describe('POST /api/generate — soal Richtig/Falsch level B1', () => {
  it('meminta AI membuat 10 soal Richtig/Falsch saat level B1', async () => {
    const res = await postGenerate({ prompt: 'Di kafe Berlin', cefrLevel: 'B1' })

    expect(res.status).toBe(200)
    const prompt = lastPromptSentToGemini()
    expect(prompt).toContain('Richtig')
    expect(prompt).toContain('10 soal')
  })

  it('mewajibkan comprehensionQuestions di responseSchema saat level B1', async () => {
    await postGenerate({ prompt: 'Di kafe Berlin', cefrLevel: 'B1' })

    const schema = lastResponseSchema()
    expect(schema.properties.comprehensionQuestions).toBeDefined()
    expect(schema.properties.comprehensionQuestions.type).toBe('ARRAY')
    expect(schema.required).toContain('comprehensionQuestions')

    // Bentuk tiap soal harus benar-benar dideklarasikan, bukan hanya tipenya.
    const item = schema.properties.comprehensionQuestions.items
    expect(item.required).toEqual([
      'statement',
      'indonesianText',
      'isCorrect',
      'explanation',
    ])
    expect(item.properties.isCorrect.type).toBe('BOOLEAN')
    expect(item.properties.statement.type).toBe('STRING')
    expect(item.properties.explanation.type).toBe('STRING')

    // Jumlah soal dibatasi struktural, bukan hanya lewat teks prompt.
    expect(schema.properties.comprehensionQuestions.minItems).toBe('10')
    expect(schema.properties.comprehensionQuestions.maxItems).toBe('10')
  })

  it('tidak meminta soal Richtig/Falsch pada level A1', async () => {
    await postGenerate({ prompt: 'Di kafe Berlin', cefrLevel: 'A1' })

    const prompt = lastPromptSentToGemini()
    expect(prompt).not.toContain('Richtig')
    expect(lastResponseSchema().properties.comprehensionQuestions).toBeUndefined()
  })

  it('mengembalikan comprehensionQuestions ke klien saat level B1', async () => {
    generateContent.mockResolvedValue({
      text: JSON.stringify({
        ...JSON.parse(VALID_LESSON),
        comprehensionQuestions: [
          {
            statement: 'Sprecher A trinkt Tee.',
            indonesianText: 'Pembicara A minum teh.',
            isCorrect: false,
            explanation: 'Ia memesan kopi, bukan teh.',
          },
        ],
      }),
    })

    const res = await postGenerate({ prompt: 'Di kafe Berlin', cefrLevel: 'B1' })
    const body = (await res.json()) as any

    expect(res.status).toBe(200)
    expect(body.lesson.comprehensionQuestions).toHaveLength(1)
  })
})

describe('POST /api/generate — pemilihan topik grammar B1', () => {
  it('menerima daftar topik yang valid untuk level B1', async () => {
    const res = await postGenerate({
      prompt: 'Di kafe Berlin',
      cefrLevel: 'B1',
      grammarTopics: ['passiv', 'relativsatz'],
    })

    expect(res.status).toBe(200)
  })

  it('menolak grammarTopics yang bukan array', async () => {
    const res = await postGenerate({
      prompt: 'Di kafe Berlin',
      cefrLevel: 'B1',
      grammarTopics: 'passiv',
    })

    expect(res.status).toBe(400)
    expect(generateContent).not.toHaveBeenCalled()
  })

  it('menolak ID topik yang tidak dikenal', async () => {
    const res = await postGenerate({
      prompt: 'Di kafe Berlin',
      cefrLevel: 'B1',
      grammarTopics: ['konjunktiv-2', 'topik-karangan'],
    })

    expect(res.status).toBe(400)
    expect(generateContent).not.toHaveBeenCalled()
  })

  it('menolak lebih dari 8 topik', async () => {
    const tooMany = [
      'passiv',
      'relativsatz',
      'konjunktiv-2',
      'tekamolo',
      'modalpartikeln',
      'genitiv',
      'futur-1',
      'praeposition-wechsel',
      'pluralbildung',
    ]
    const res = await postGenerate({
      prompt: 'Di kafe Berlin',
      cefrLevel: 'B1',
      grammarTopics: tooMany,
    })

    expect(res.status).toBe(400)
    expect(generateContent).not.toHaveBeenCalled()
  })

  it('menolak topik grammar saat level bukan B1', async () => {
    const res = await postGenerate({
      prompt: 'Di kafe Berlin',
      cefrLevel: 'A1',
      grammarTopics: ['passiv'],
    })

    expect(res.status).toBe(400)
    expect(generateContent).not.toHaveBeenCalled()
  })

  it('tetap berjalan bila grammarTopics tidak dikirim', async () => {
    const res = await postGenerate({ prompt: 'Di kafe Berlin', cefrLevel: 'B1' })

    expect(res.status).toBe(200)
  })

  it('mengirim topik terpilih ke prompt dan responseSchema', async () => {
    await postGenerate({
      prompt: 'Di kafe Berlin',
      cefrLevel: 'B1',
      grammarTopics: ['passiv', 'relativsatz'],
    })

    const prompt = lastPromptSentToGemini()
    expect(prompt).toContain('Passiv')
    expect(prompt).toContain('Relativsatz')
    expect(prompt).toContain('grammarTopics')

    const schema = lastResponseSchema()
    expect(schema.properties.grammarTopics).toBeDefined()
    expect(schema.properties.grammarTopics.type).toBe('ARRAY')
    expect(schema.required).toContain('grammarTopics')

    const item = schema.properties.grammarTopics.items
    expect(item.required).toEqual([
      'topicId',
      'name',
      'nameId',
      'explanationId',
      'formula',
      'examples',
    ])
  })

  it('tidak meminta grammarTopics bila tidak ada topik dipilih', async () => {
    await postGenerate({ prompt: 'Di kafe Berlin', cefrLevel: 'B1' })

    expect(lastPromptSentToGemini()).not.toContain('grammarTopics')
    expect(lastResponseSchema().properties.grammarTopics).toBeUndefined()
  })

  it('tidak meminta grammarTopics pada level A1', async () => {
    await postGenerate({ prompt: 'Di kafe Berlin', cefrLevel: 'A1' })

    expect(lastResponseSchema().properties.grammarTopics).toBeUndefined()
  })

  it('membuang topik yang tidak dikenal dari keluaran AI, tanpa gagal', async () => {
    generateContent.mockResolvedValue({
      text: JSON.stringify({
        ...JSON.parse(VALID_LESSON),
        grammarTopics: [
          {
            topicId: 'passiv',
            name: 'Passiv',
            nameId: 'Passiv',
            explanationId: 'Fokus ke kejadian.',
            formula: 'werden + Partizip II',
            examples: [{ german: 'Das Haus wird gebaut.', indonesian: 'Rumah itu dibangun.', note: '' }],
          },
          {
            topicId: 'topik-karangan',
            name: 'Erfunden',
            nameId: 'Karangan',
            explanationId: 'x',
            formula: 'x',
            examples: [{ german: 'x', indonesian: 'x', note: '' }],
          },
        ],
      }),
    })

    const res = await postGenerate({
      prompt: 'Di kafe Berlin',
      cefrLevel: 'B1',
      grammarTopics: ['passiv'],
    })
    const body = (await res.json()) as any

    expect(res.status).toBe(200)
    expect(body.lesson.grammarTopics).toHaveLength(1)
    expect(body.lesson.grammarTopics[0].topicId).toBe('passiv')
  })
})

describe('POST /api/generate — soal latihan tata bahasa', () => {
  const topics = ['tempus-perfekt']

  it('meminta soal latihan tata bahasa saat B1 dengan topik', async () => {
    await postGenerate({ prompt: 'Di kafe Berlin', cefrLevel: 'B1', grammarTopics: topics })

    const prompt = lastPromptSentToGemini()
    expect(prompt).toContain('gramatikal')
    expect(prompt).toContain('correctedSentence')
    expect(prompt).toContain('10 soal')
  })

  it('mewajibkan grammarQuestions di responseSchema saat B1 dengan topik', async () => {
    await postGenerate({ prompt: 'Di kafe Berlin', cefrLevel: 'B1', grammarTopics: topics })

    const schema = lastResponseSchema()
    expect(schema.properties.grammarQuestions).toBeDefined()
    expect(schema.properties.grammarQuestions.type).toBe('ARRAY')
    expect(schema.required).toContain('grammarQuestions')

    const item = schema.properties.grammarQuestions.items
    expect(item.required).toEqual([
      'sentence',
      'isCorrect',
      'explanationId',
      'correctedSentence',
      'topicId',
      'segments',
    ])
    expect(item.properties.isCorrect.type).toBe('BOOLEAN')

    // Jumlah soal dibatasi struktural, bukan hanya lewat teks prompt.
    expect(schema.properties.grammarQuestions.minItems).toBe('10')
    expect(schema.properties.grammarQuestions.maxItems).toBe('10')
  })

  it('tidak meminta soal latihan bila tidak ada topik dipilih', async () => {
    await postGenerate({ prompt: 'Di kafe Berlin', cefrLevel: 'B1' })

    expect(lastPromptSentToGemini()).not.toContain('gramatikal')
    const schema = lastResponseSchema()
    expect(schema.properties.grammarQuestions).toBeUndefined()
    expect(schema.required).not.toContain('grammarQuestions')
  })

  it('tidak meminta soal latihan pada level A1/A2', async () => {
    await postGenerate({ prompt: 'Di kafe Berlin', cefrLevel: 'A1' })
    expect(lastResponseSchema().properties.grammarQuestions).toBeUndefined()
    expect(lastResponseSchema().required).not.toContain('grammarQuestions')

    await postGenerate({ prompt: 'Di kafe Berlin', cefrLevel: 'A2' })
    expect(lastResponseSchema().properties.grammarQuestions).toBeUndefined()
    expect(lastResponseSchema().required).not.toContain('grammarQuestions')
  })

  it('tetap mewajibkan grammarPatterns di semua level (tidak boleh rusak)', async () => {
    for (const level of ['A1', 'A2', 'B1']) {
      await postGenerate({ prompt: 'Di kafe Berlin', cefrLevel: level })
      expect(lastResponseSchema().required).toContain('grammarPatterns')
    }
  })

  it('mengembalikan soal latihan ke klien saat B1 dengan topik', async () => {
    generateContent.mockResolvedValue({
      text: JSON.stringify({
        ...JSON.parse(VALID_LESSON),
        grammarQuestions: [
          {
            sentence: 'Ich bin gestern die Küche geputzt.',
            isCorrect: false,
            explanationId: 'Putzen memakai haben.',
            correctedSentence: 'Ich habe gestern die Küche geputzt.',
            topicId: 'tempus-perfekt',
            segments: [{ text: 'Ich bin gestern die Küche geputzt.', role: 'other' }],
          },
        ],
      }),
    })

    const res = await postGenerate({
      prompt: 'Di kafe Berlin',
      cefrLevel: 'B1',
      grammarTopics: topics,
    })
    const body = (await res.json()) as any

    expect(res.status).toBe(200)
    expect(body.lesson.grammarQuestions).toHaveLength(1)
    expect(body.lesson.grammarQuestions[0].isCorrect).toBe(false)
  })
})

describe('buildGrammarQuestionsBlock — isi instruksi', () => {
  it('mencantumkan topik dan aturan kunci', async () => {
    const { buildGrammarQuestionsBlock } = await import('../effect/ai-service')
    const block = buildGrammarQuestionsBlock(['tempus-perfekt'])

    expect(block).toContain('Perfekt')
    expect(block).toContain('10 soal')
    expect(block).toContain('correctedSentence')
    expect(block).toContain('topicId')
  })

  it('mengembalikan string kosong bila tidak ada topik', async () => {
    const { buildGrammarQuestionsBlock } = await import('../effect/ai-service')

    expect(buildGrammarQuestionsBlock([])).toBe('')
  })
})

describe('POST /api/generate — pola kalimat untuk tab Materi', () => {
  it('meminta tiga pola kalimat dasar beserta pemecahan peran', async () => {
    await postGenerate({ prompt: 'Di kafe Berlin', cefrLevel: 'A1' })

    const prompt = lastPromptSentToGemini()
    expect(prompt).toContain('Aussagesatz')
    expect(prompt).toContain('W-Frage')
    expect(prompt).toContain('Ja/Nein-Frage')
    expect(prompt).toContain('subjekt')
    expect(prompt).toContain('praedikat')
    expect(prompt).toContain('objekt')
  })

  it('menginstruksikan memakai kalimat dari dialog bila ada', async () => {
    await postGenerate({ prompt: 'Di kafe Berlin', cefrLevel: 'A1' })

    expect(lastPromptSentToGemini()).toContain('dialog')
  })

  it('mewajibkan grammarPatterns di responseSchema dengan role terbatas', async () => {
    await postGenerate({ prompt: 'Di kafe Berlin', cefrLevel: 'A1' })

    const schema = lastResponseSchema()
    const gp = schema.properties.grammarPatterns
    expect(gp.type).toBe('ARRAY')
    expect(schema.required).toContain('grammarPatterns')

    const item = gp.items
    expect(item.required).toEqual([
      'name',
      'nameId',
      'formula',
      'exampleGerman',
      'exampleIndonesian',
      'segments',
    ])

    const segment = item.properties.segments.items
    expect(segment.properties.role.enum).toEqual([
      'subjekt',
      'praedikat',
      'objekt',
      'other',
    ])
  })

  it('menolak pola dengan role yang tidak dikenal', async () => {
    generateContent.mockResolvedValue({
      text: JSON.stringify({
        ...JSON.parse(VALID_LESSON),
        grammarPatterns: [
          {
            name: 'Aussagesatz',
            nameId: 'Kalimat Berita',
            formula: 'S-P-O',
            exampleGerman: 'Der Mann trinkt Kaffee.',
            exampleIndonesian: 'Pria itu minum kopi.',
            segments: [{ text: 'Der Mann', role: 'verb' }],
          },
        ],
      }),
    })

    const res = await postGenerate({ prompt: 'Di kafe Berlin', cefrLevel: 'A1' })

    expect(res.status).toBe(500)
  })
})

describe('buildGrammarTopicsBlock — batas & isi', () => {
  it('mencetak nama Jerman dan label Indonesia dari taksonomi', async () => {
    const { buildGrammarTopicsBlock } = await import('../effect/ai-service')
    const block = buildGrammarTopicsBlock(['passiv'])

    expect(block).toContain('Passiv')
    expect(block).toContain('passiv')
    expect(block).toContain('grammarTopics')
  })

  it('mengembalikan string kosong bila tidak ada topik', async () => {
    const { buildGrammarTopicsBlock } = await import('../effect/ai-service')

    expect(buildGrammarTopicsBlock([])).toBe('')
  })

  it('mengabaikan ID yang tidak dikenal', async () => {
    const { buildGrammarTopicsBlock } = await import('../effect/ai-service')

    expect(buildGrammarTopicsBlock(['tidak-ada'])).toBe('')
  })
})

describe('buildPrompt — guard level untuk topik grammar', () => {
  it('tidak menyelipkan blok topik B1 ke prompt A1', async () => {
    const { buildPrompt } = await import('../effect/ai-service')
    const prompt = buildPrompt('Di kafe', 'A1', [], 8, ['passiv'])

    expect(prompt).not.toContain('Materi tata bahasa untuk topik berikut')
  })

  it('menyelipkan blok topik pada prompt B1', async () => {
    const { buildPrompt } = await import('../effect/ai-service')
    const prompt = buildPrompt('Di kafe', 'B1', [], 8, ['passiv'])

    expect(prompt).toContain('Materi tata bahasa untuk topik berikut')
  })
})
