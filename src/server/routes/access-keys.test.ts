import { describe, it, expect, beforeEach, vi } from 'vitest'

process.env.TEACHER_PASSWORD = 'pass-access-keys'

const state = vi.hoisted(() => ({ queue: [] as unknown[][] }))

vi.mock('../../db/client', () => {
  const chain: any = {
    from: () => chain,
    where: () => chain,
    orderBy: async () => state.queue.shift() ?? [],
    limit: async () => state.queue.shift() ?? [],
    returning: async () => state.queue.shift() ?? [],
  }
  return {
    db: {
      select: () => chain,
      insert: () => ({
        values: () => ({
          returning: async () => state.queue.shift() ?? [],
        }),
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
    body: JSON.stringify({ password: 'pass-access-keys' }),
  })
  return ((await res.json()) as { token: string }).token
}

beforeEach(() => {
  state.queue = []
})

describe('GET /api/sessions/:id/verify-access', () => {
  it('mengembalikan missing_key jika query key tidak ada', async () => {
    const res = await app.request('/api/sessions/sess-1/verify-access')
    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body.valid).toBe(false)
    expect(body.reason).toBe('missing_key')
  })

  it('mengembalikan not_found bila key tidak ada di DB', async () => {
    state.queue.push([])
    const res = await app.request('/api/sessions/sess-1/verify-access?key=DE-NOTFOUND')
    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body.valid).toBe(false)
    expect(body.reason).toBe('not_found')
  })

  it('mengembalikan expired bila key sudah kadaluarsa', async () => {
    state.queue.push([
      {
        id: 1,
        key: 'DE-EXPIRED',
        sessionId: 'sess-1',
        expiresAt: '2020-01-01T00:00:00.000Z',
        isActive: true,
        label: 'Kelas A',
      },
    ])
    const res = await app.request('/api/sessions/sess-1/verify-access?key=DE-EXPIRED')
    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body.valid).toBe(false)
    expect(body.reason).toBe('expired')
    expect(body.label).toBe('Kelas A')
  })

  it('mengembalikan valid: true bila key aktif dan belum kadaluarsa', async () => {
    state.queue.push([
      {
        id: 2,
        key: 'DE-VALID',
        sessionId: 'sess-1',
        expiresAt: '2099-01-01T00:00:00.000Z',
        isActive: true,
        label: 'Kelas B',
      },
    ])
    const res = await app.request('/api/sessions/sess-1/verify-access?key=de-valid')
    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body.valid).toBe(true)
    expect(body.label).toBe('Kelas B')
  })
})

describe('Teacher endpoints: GET/POST/DELETE /api/sessions/:id/keys', () => {
  it('menolak akses tanpa token guru (401)', async () => {
    const resGet = await app.request('/api/sessions/sess-1/keys')
    expect(resGet.status).toBe(401)

    const resPost = await app.request('/api/sessions/sess-1/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ hoursValid: 24 }),
    })
    expect(resPost.status).toBe(401)

    const resDelete = await app.request('/api/sessions/sess-1/keys/1', {
      method: 'DELETE',
    })
    expect(resDelete.status).toBe(401)
  })

  it('guru dapat mengambil daftar keys beserta status isExpired', async () => {
    const token = await loginAsTeacher()
    state.queue.push([
      { id: 10, key: 'DE-1', sessionId: 'sess-1', expiresAt: '2020-01-01T00:00:00.000Z', createdAt: '2020-01-01' },
      { id: 11, key: 'DE-2', sessionId: 'sess-1', expiresAt: '2099-01-01T00:00:00.000Z', createdAt: '2026-01-01' },
    ])

    const res = await app.request('/api/sessions/sess-1/keys', {
      headers: { Authorization: 'Bearer ' + token },
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body.keys).toHaveLength(2)
    expect(body.keys[0].isExpired).toBe(true)
    expect(body.keys[1].isExpired).toBe(false)
  })

  it('guru dapat membuat access key baru', async () => {
    const token = await loginAsTeacher()
    const inserted = { id: 99, key: 'DE-NEWWW', sessionId: 'sess-1', label: 'Tugas' }
    state.queue.push([inserted])

    const res = await app.request('/api/sessions/sess-1/keys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify({ hoursValid: 48, label: 'Tugas' }),
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body.success).toBe(true)
    expect(body.key.key).toBe('DE-NEWWW')
  })

  it('guru dapat menghapus access key', async () => {
    const token = await loginAsTeacher()
    state.queue.push([])

    const res = await app.request('/api/sessions/sess-1/keys/99', {
      method: 'DELETE',
      headers: { Authorization: 'Bearer ' + token },
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body.success).toBe(true)
  })
})
