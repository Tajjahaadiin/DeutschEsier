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
