import { Hono } from 'hono'

const authRouter = new Hono()

// Simpan token aktif di memori
const activeTokens = new Set<string>()

export function isValidTeacherToken(token: string): boolean {
  if (!token) return false
  return activeTokens.has(token)
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
    const expectedPassword =
      process.env.TEACHER_PASSWORD || process.env.TEACHER_SECRET_KEY || 'guru123'

    if (body.password === expectedPassword) {
      const token =
        'guru-session-' +
        Date.now() +
        '-' +
        Math.random().toString(36).substring(2, 9)
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
