import { describe, it, expect } from 'vitest'

const TEST_PW = 'pass-auth-test-xyz'
process.env.TEACHER_PASSWORD = TEST_PW

const { default: app } = await import('../app')
const { isValidTeacherToken } = await import('./auth')

describe('POST /api/auth/login', () => {
  it('berhasil login dengan password yang benar dan mengembalikan token valid', async () => {
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: TEST_PW }),
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body.success).toBe(true)
    expect(body.role).toBe('teacher')
    expect(typeof body.token).toBe('string')
    expect(isValidTeacherToken(body.token)).toBe(true)
  })

  it('menolak login dengan password salah (401)', async () => {
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: 'wrong-password' }),
    })

    expect(res.status).toBe(401)
    const body = (await res.json()) as any
    expect(body.error).toContain('Password guru salah')
  })

  it('menolak login jika body kosong atau tanpa password (401)', async () => {
    const res = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    expect(res.status).toBe(401)
  })
})

describe('GET /api/auth/verify', () => {
  it('mengonfirmasi token valid lewat Authorization header', async () => {
    const loginRes = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: TEST_PW }),
    })
    const { token } = (await loginRes.json()) as any

    const res = await app.request('/api/auth/verify', {
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body.authenticated).toBe(true)
    expect(body.role).toBe('teacher')
  })

  it('mengonfirmasi token valid lewat X-Teacher-Token header', async () => {
    const loginRes = await app.request('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: TEST_PW }),
    })
    const { token } = (await loginRes.json()) as any

    const res = await app.request('/api/auth/verify', {
      headers: { 'X-Teacher-Token': token },
    })

    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body.authenticated).toBe(true)
  })

  it('mengembalikan authenticated: false bila token palsu atau tidak dikirim', async () => {
    const resNoAuth = await app.request('/api/auth/verify')
    expect(resNoAuth.status).toBe(200)
    expect(((await resNoAuth.json()) as any).authenticated).toBe(false)

    const resBadToken = await app.request('/api/auth/verify', {
      headers: { Authorization: 'Bearer invalid.token.payload' },
    })
    expect(resBadToken.status).toBe(200)
    expect(((await resBadToken.json()) as any).authenticated).toBe(false)
  })
})
