import { Hono } from 'hono'
import { db } from '../../db/client'
import { scenarioAccessKey } from '../../db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { requireTeacherAuth } from './auth'

const accessKeysRouter = new Hono()

function generateAccessKeyCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `DE-${result}`
}

// 1. GET /:id/keys
accessKeysRouter.get('/:id/keys', requireTeacherAuth, async (c) => {
  try {
    const id = c.req.param('id')
    const rawKeys = await db
      .select()
      .from(scenarioAccessKey)
      .where(eq(scenarioAccessKey.sessionId, id))
      .orderBy(desc(scenarioAccessKey.createdAt))

    const keys = rawKeys.map((k) => ({
      ...k,
      isExpired: new Date(k.expiresAt) < new Date(),
    }))

    return c.json({ keys })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to fetch access keys' }, 500)
  }
})

// 2. POST /:id/keys
accessKeysRouter.post('/:id/keys', requireTeacherAuth, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json().catch(() => ({}))
    const hoursValid = typeof body.hoursValid === 'number' && body.hoursValid > 0 ? body.hoursValid : 24
    const expiresAt = new Date(Date.now() + (hoursValid || 24) * 3600 * 1000).toISOString()
    const key = generateAccessKeyCode()

    const [insertedRecord] = await db
      .insert(scenarioAccessKey)
      .values({
        key,
        sessionId: id,
        label: body.label || '',
        expiresAt,
        isActive: true,
      })
      .returning()

    return c.json({ success: true, key: insertedRecord })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to create access key' }, 500)
  }
})

// 3. DELETE /:id/keys/:keyId
accessKeysRouter.delete('/:id/keys/:keyId', requireTeacherAuth, async (c) => {
  try {
    const keyId = c.req.param('keyId')
    await db
      .delete(scenarioAccessKey)
      .where(eq(scenarioAccessKey.id, parseInt(keyId, 10)))

    return c.json({ success: true })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to delete access key' }, 500)
  }
})

// 4. GET /:id/verify-access
accessKeysRouter.get('/:id/verify-access', async (c) => {
  try {
    const id = c.req.param('id')
    const rawKey = c.req.query('key') || ''
    const queryKey = rawKey.trim().toUpperCase()

    if (!queryKey) {
      return c.json({ valid: false, reason: 'missing_key' })
    }

    const [found] = await db
      .select()
      .from(scenarioAccessKey)
      .where(
        and(
          eq(scenarioAccessKey.sessionId, id),
          eq(scenarioAccessKey.key, queryKey),
          eq(scenarioAccessKey.isActive, true)
        )
      )
      .limit(1)

    if (!found) {
      return c.json({ valid: false, reason: 'not_found' })
    }

    if (new Date(found.expiresAt) < new Date()) {
      return c.json({
        valid: false,
        reason: 'expired',
        expiresAt: found.expiresAt,
        label: found.label,
      })
    }

    return c.json({
      valid: true,
      expiresAt: found.expiresAt,
      label: found.label,
    })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to verify access key' }, 500)
  }
})

export default accessKeysRouter
