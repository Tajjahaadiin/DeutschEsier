import { describe, it, expect, beforeEach, vi } from 'vitest'

/** Password khusus test; tidak ada kredensial nyata di berkas ini. */
const TEST_PASSWORD = '__TEST_PASSWORD__'
process.env.TEACHER_PASSWORD = TEST_PASSWORD

const state = vi.hoisted(() => ({
  queue: [] as unknown[][],
  inserted: [] as unknown[],
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
        values: async (v: unknown) => {
          state.inserted.push(v)
          return {}
        },
      }),
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

const VALID_KEY_ROW = {
  key: 'DE-AAAAA',
  sessionId: 'sess-1',
  isActive: true,
  expiresAt: '2099-01-01T00:00:00.000Z',
}

function submit(body: Record<string, unknown> = {}) {
  return app.request('/api/sessions/sess-1/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      studentName: 'Andi',
      score: 80,
      totalQuestions: 10,
      correctAnswers: 8,
      answers: [],
      ...body,
    }),
  })
}

beforeEach(() => {
  state.queue = []
  state.inserted = []
  delete process.env.REQUIRE_ACCESS_KEY
})

describe('POST /:id/submissions — REQUIRE_ACCESS_KEY mati (perilaku lama)', () => {
  it('tetap menerima submission tanpa kunci', async () => {
    const res = await submit()

    expect(res.status).toBe(200)
  })
})

describe('POST /:id/submissions — REQUIRE_ACCESS_KEY menyala', () => {
  beforeEach(() => {
    process.env.REQUIRE_ACCESS_KEY = 'true'
  })

  it('menolak 403 tanpa kunci', async () => {
    const res = await submit()

    expect(res.status).toBe(403)
    expect(state.inserted).toHaveLength(0)
  })

  it('menerima dengan kunci valid untuk sesi itu', async () => {
    state.queue.push([VALID_KEY_ROW])

    const res = await submit({ accessKey: 'DE-AAAAA' })

    expect(res.status).toBe(200)
    expect(state.inserted).toHaveLength(1)
  })

  it('menolak 403 bila kunci kedaluwarsa', async () => {
    state.queue.push([{ ...VALID_KEY_ROW, expiresAt: '2020-01-01T00:00:00.000Z' }])

    const res = await submit({ accessKey: 'DE-AAAAA' })

    expect(res.status).toBe(403)
    expect(state.inserted).toHaveLength(0)
  })

  it('menolak 403 bila kunci milik sesi lain', async () => {
    state.queue.push([])

    const res = await submit({ accessKey: 'DE-BBBBBB' })

    expect(res.status).toBe(403)
    expect(state.inserted).toHaveLength(0)
  })

  it('tetap menerima guru tanpa kunci (TEACHER-PREVIEW)', async () => {
    const token = await loginAsTeacher()

    const res = await app.request('/api/sessions/sess-1/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        studentName: 'Guru',
        score: 100,
        totalQuestions: 10,
        correctAnswers: 10,
        answers: [],
        accessKey: 'TEACHER-PREVIEW',
      }),
    })

    expect(res.status).toBe(200)
    expect(state.inserted).toHaveLength(1)
  })
})
