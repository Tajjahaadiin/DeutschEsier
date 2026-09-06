import { Hono } from 'hono'
import crypto from 'crypto'

const authRouter = new Hono()

// Simpan token aktif di memori (fallback lokal)
const activeTokens = new Set<string>()

function getSecretKey(): string {
  return process.env.TEACHER_PASSWORD || process.env.TEACHER_SECRET_KEY || 'guru123'
}

function signToken(payload: string): string {
  const secret = getSecretKey()
  const hmac = crypto.createHmac('sha256', secret).update(payload).digest('hex')
  return `${payload}.${hmac}`
}

function verifySignedToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false
  const dotIndex = token.lastIndexOf('.')
  if (dotIndex === -1) return false
  const payload = token.substring(0, dotIndex)
  const hmac = token.substring(dotIndex + 1)
  const expectedHmac = crypto.createHmac('sha256', getSecretKey()).update(payload).digest('hex')

  if (hmac.length !== expectedHmac.length) return false
  if (!crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(expectedHmac))) return false

  // Parse payload: guru-session-${timestamp}-${random}
  const payloadParts = payload.split('-')
  if (payloadParts.length >= 3) {
    const ts = parseInt(payloadParts[2], 10)
    if (!isNaN(ts)) {
      // Expiry 30 hari
      const thirtyDays = 30 * 24 * 60 * 60 * 1000
      if (Date.now() - ts > thirtyDays) return false
    }
  }
  return true
}

export function isValidTeacherToken(token: string): boolean {
  if (!token) return false
  if (activeTokens.has(token)) return true
  return verifySignedToken(token)
}

export const requireTeacherAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization')
  const teacherToken = c.req.header('X-Teacher-Token')
  let token = teacherToken || ''
  if (!token && authHeader) {
    token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim()
  }

  if (!token || !isValidTeacherToken(token)) {
    return c.json({ error: 'Unauthorized: Autentikasi guru diperlukan.' }, 401)
  }
  await next()
}

authRouter.post('/login', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}))
    const expectedPassword = getSecretKey()

    if (body.password === expectedPassword) {
      const rawPayload =
        'guru-session-' +
        Date.now() +
        '-' +
        Math.random().toString(36).substring(2, 9)
      const token = signToken(rawPayload)
      activeTokens.add(token)
      return c.json({ success: true, token, role: 'teacher' })
    }

    return c.json({ error: 'Password guru salah. Silakan coba lagi.' }, 401)
  } catch (error) {
    return c.json({ error: 'Terjadi kesalahan pada server' }, 500)
  }
})

authRouter.get('/verify', (c) => {
  const authHeader = c.req.header('Authorization')
  const teacherToken = c.req.header('X-Teacher-Token')
  let token = teacherToken || ''
  if (!token && authHeader) {
    token = authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim()
  }
  if (token && isValidTeacherToken(token)) {
    return c.json({ authenticated: true, role: 'teacher' })
  }
  return c.json({ authenticated: false }, 200)
})

export default authRouter
