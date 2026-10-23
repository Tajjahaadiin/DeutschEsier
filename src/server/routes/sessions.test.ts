import { describe, it, expect, beforeEach, vi } from 'vitest'

/** Password khusus test; tidak ada kredensial nyata di berkas ini. */
const TEST_PASSWORD = 'test-teacher-pw'
process.env.TEACHER_PASSWORD = TEST_PASSWORD

/**
 * Mock `db` dengan antrean hasil.
 *
 * Setiap pemanggilan `.limit()` / `.orderBy()` mengambil satu entri dari
 * `state.queue`, sehingga urutan query terbaca eksplisit di tiap test.
 */
const state = vi.hoisted(() => ({
  queue: [] as unknown[][],
  lastUpdateSet: null as any,
  lastInsertValues: null as any,
}))

vi.mock('../../db/client', () => {
  const chain: any = {
    from: () => chain,
    where: () => chain,
    orderBy: async () => state.queue.shift() ?? [],
    limit: async () => state.queue.shift() ?? [],
  }
  return {
    db: {
      select: () => chain,
      insert: () => ({
        values: async (vals: any) => {
          state.lastInsertValues = vals
          return {}
        },
      }),
      update: () => ({
        set: (vals: any) => {
          state.lastUpdateSet = vals
          return chain
        },
      }),
      delete: () => chain,
    },
  }
})

const { default: app } = await import('../app')

async function loginAsTeacher(): Promise<string> {
  const res = await app.request('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: TEST_PASSWORD }),
  })
  return ((await res.json()) as { token: string }).token
}

const SESSION_ROW = { id: 'sess-1', title: 'Kafe', dialogueJson: '[]' }

beforeEach(() => {
  state.queue = []
  delete process.env.REQUIRE_ACCESS_KEY
})

describe('GET /api/sessions — daftar sesi', () => {
  it('menolak tanpa token guru', async () => {
    const res = await app.request('/api/sessions')
    expect(res.status).toBe(401)
  })

  it('mengizinkan guru dengan token', async () => {
    state.queue.push([SESSION_ROW])
    const token = await loginAsTeacher()
    const res = await app.request('/api/sessions', {
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.status).toBe(200)
  })
})

describe('GET /api/sessions/:id — REQUIRE_ACCESS_KEY mati (perilaku lama)', () => {
  it('tetap 200 tanpa kunci apa pun', async () => {
    state.queue.push([SESSION_ROW])

    const res = await app.request('/api/sessions/sess-1')

    expect(res.status).toBe(200)
  })
})

describe('GET /api/sessions/:id — REQUIRE_ACCESS_KEY menyala', () => {
  beforeEach(() => {
    process.env.REQUIRE_ACCESS_KEY = 'true'
  })

  it('menolak 403 tanpa kunci', async () => {
    state.queue.push([SESSION_ROW])

    const res = await app.request('/api/sessions/sess-1')

    expect(res.status).toBe(403)
    expect(((await res.json()) as any).reason).toBe('missing_key')
  })

  it('mengizinkan dengan kunci valid untuk sesi itu', async () => {
    state.queue.push([
      { key: 'DE-AAAAA', sessionId: 'sess-1', isActive: true, expiresAt: '2099-01-01T00:00:00.000Z' },
    ])
    state.queue.push([SESSION_ROW])

    const res = await app.request('/api/sessions/sess-1?key=de-aaaaa')

    expect(res.status).toBe(200)
  })

  it('menolak 403 bila kunci kedaluwarsa', async () => {
    // Pemeriksaan kunci berjalan SEBELUM sesi diambil, jadi baris kunci dulu.
    state.queue.push([
      { key: 'DE-AAAAA', sessionId: 'sess-1', isActive: true, expiresAt: '2020-01-01T00:00:00.000Z' },
    ])

    const res = await app.request('/api/sessions/sess-1?key=DE-AAAAA')

    expect(res.status).toBe(403)
    expect(((await res.json()) as any).reason).toBe('expired')
  })

  it('menolak 403 bila kunci milik sesi LAIN', async () => {
    // Simulasikan database yang MENGEMBALIKAN baris walau filter sessionId
    // dihilangkan: kunci ini valid, tetapi milik sesi lain. Route harus tetap
    // menolak, jadi pemeriksaan harus bergantung pada sessionId baris itu,
    // bukan sekadar "ada kunci valid di database".
    state.queue.push([
      { key: 'DE-BBBBB', sessionId: 'sess-LAIN', isActive: true, expiresAt: '2099-01-01T00:00:00.000Z' },
    ])

    const res = await app.request('/api/sessions/sess-1?key=DE-BBBBB')

    expect(res.status).toBe(403)
  })

  it('mengizinkan guru tanpa kunci', async () => {
    state.queue.push([SESSION_ROW])
    const token = await loginAsTeacher()

    const res = await app.request('/api/sessions/sess-1', {
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.status).toBe(200)
  })
})

describe('POST & PUT /api/sessions — semantik kolom JSON (undefined vs null)', () => {
  it('mode update: mempertahankan kolom ketika field undefined (tidak disentuh)', async () => {
    const token = await loginAsTeacher()
    // existing session found in DB
    state.queue.push([SESSION_ROW])

    const res = await app.request('/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: 'sess-1',
        title: 'Judul Baru',
        scenarioPrompt: 'Prompt',
        cefrLevel: 'B1',
        dialogueJson: [],
        vocabCluesJson: [],
        // comprehensionQuestions, grammarPatterns, grammarTopics, grammarQuestions adalah undefined
      }),
    })

    expect(res.status).toBe(200)
    expect(state.lastUpdateSet).toBeDefined()
    expect('comprehensionQuestionsJson' in state.lastUpdateSet).toBe(false)
    expect('grammarPatternsJson' in state.lastUpdateSet).toBe(false)
    expect('grammarTopicsJson' in state.lastUpdateSet).toBe(false)
    expect('grammarQuestionsJson' in state.lastUpdateSet).toBe(false)
  })

  it('mode update: mengosongkan kolom ke null jika field bernilai null secara eksplisit', async () => {
    const token = await loginAsTeacher()
    // existing session found in DB
    state.queue.push([SESSION_ROW])

    const res = await app.request('/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: 'sess-1',
        title: 'Judul Baru',
        scenarioPrompt: 'Prompt',
        cefrLevel: 'B1',
        dialogueJson: [],
        vocabCluesJson: [],
        comprehensionQuestions: null,
        grammarPatterns: null,
        grammarTopics: null,
        grammarQuestions: null,
      }),
    })

    expect(res.status).toBe(200)
    expect(state.lastUpdateSet.comprehensionQuestionsJson).toBeNull()
    expect(state.lastUpdateSet.grammarPatternsJson).toBeNull()
    expect(state.lastUpdateSet.grammarTopicsJson).toBeNull()
    expect(state.lastUpdateSet.grammarQuestionsJson).toBeNull()
  })

  it('mode insert: menyimpan payload sebagai string JSON bila ada', async () => {
    const token = await loginAsTeacher()
    // no existing session found in DB
    state.queue.push([])

    const sampleQ = [{ statement: 'A', isCorrect: true }]

    const res = await app.request('/api/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        id: 'sess-new',
        title: 'Judul Baru',
        scenarioPrompt: 'Prompt',
        cefrLevel: 'B1',
        dialogueJson: [],
        vocabCluesJson: [],
        comprehensionQuestions: sampleQ,
      }),
    })

    expect(res.status).toBe(200)
    expect(state.lastInsertValues.comprehensionQuestionsJson).toBe(JSON.stringify(sampleQ))
  })
})

