import { Hono } from 'hono'
import { db } from '../../db/client'
import { learningSession } from '../../db/schema'
import { eq, desc } from 'drizzle-orm'
import { requireTeacherAuth } from './auth'

const sessionsRouter = new Hono()

sessionsRouter.get('/', async (c) => {
  try {
    const sessions = await db.select().from(learningSession).orderBy(desc(learningSession.createdAt))
    return c.json({ sessions })
  } catch (error) {
    return c.json({ error: 'Failed to fetch sessions' }, 500)
  }
})

sessionsRouter.get('/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const [session] = await db.select().from(learningSession).where(eq(learningSession.id, id)).limit(1)
    if (!session) return c.json({ error: 'Session not found' }, 404)
    return c.json(session)
  } catch (error) {
    return c.json({ error: 'Failed to fetch session' }, 500)
  }
})

sessionsRouter.post('/', requireTeacherAuth, async (c) => {
  try {
    const body = await c.req.json()
    // Minimal validation
    if (!body.id || !body.title) return c.json({ error: 'Invalid data' }, 400)
    
    // Check if exists
    const [existing] = await db.select().from(learningSession).where(eq(learningSession.id, body.id)).limit(1)
    
    if (existing) {
      await db.update(learningSession).set({
        title: body.title,
        scenarioPrompt: body.scenarioPrompt,
        sceneDescription: body.sceneDescription || '',
        cefrLevel: body.cefrLevel,
        dialogueJson: JSON.stringify(body.dialogueJson),
        vocabCluesJson: JSON.stringify(body.vocabCluesJson),
        updatedAt: new Date().toISOString(),
      }).where(eq(learningSession.id, body.id))
    } else {
      await db.insert(learningSession).values({
        id: body.id,
        title: body.title,
        scenarioPrompt: body.scenarioPrompt,
        sceneDescription: body.sceneDescription || '',
        cefrLevel: body.cefrLevel,
        dialogueJson: JSON.stringify(body.dialogueJson),
        vocabCluesJson: JSON.stringify(body.vocabCluesJson),
      })
    }
    
    return c.json({ success: true, id: body.id })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to save session' }, 500)
  }
})

sessionsRouter.put('/:id', requireTeacherAuth, async (c) => {
  try {
    const id = c.req.param('id')
    const body = await c.req.json()
    await db.update(learningSession).set({
      title: body.title,
      scenarioPrompt: body.scenarioPrompt,
      sceneDescription: body.sceneDescription || '',
      cefrLevel: body.cefrLevel,
      dialogueJson: JSON.stringify(body.dialogueJson),
      vocabCluesJson: JSON.stringify(body.vocabCluesJson),
      updatedAt: new Date().toISOString(),
    }).where(eq(learningSession.id, id))
    return c.json({ success: true, id })
  } catch (error) {
    return c.json({ error: 'Failed to update session' }, 500)
  }
})

sessionsRouter.delete('/:id', requireTeacherAuth, async (c) => {
  try {
    const id = c.req.param('id')
    await db.delete(learningSession).where(eq(learningSession.id, id))
    return c.json({ success: true })
  } catch (error) {
    return c.json({ error: 'Failed to delete session' }, 500)
  }
})

export default sessionsRouter
