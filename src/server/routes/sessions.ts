import { Hono } from 'hono'
import { db } from '../../db/client'
import { learningSession } from '../../db/schema'
import { eq, desc } from 'drizzle-orm'
import { requireTeacherAuth } from './auth'

const sessionsRouter = new Hono()

/** Jumlah dialog valid: bilangan bulat 1-20, default 8 bila tidak valid/kosong. */
function normalizeDialogueCount(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isInteger(raw)) return 8
  return Math.min(20, Math.max(1, raw))
}

/**
 * Kolom soal Richtig/Falsch (level B1) untuk operasi tulis.
 *
 * undefined  -> kolom tidak disentuh sama sekali (dipakai mode edit agar data
 *               lama tidak ikut terhapus saat klien tidak mengirim field ini)
 * null       -> kolom dikosongkan (guru sengaja menghapus)
 * array      -> disimpan sebagai JSON
 */
function comprehensionQuestionsColumn(
  raw: unknown
): { comprehensionQuestionsJson?: string | null } {
  if (raw === undefined) return {}
  if (raw === null) return { comprehensionQuestionsJson: null }
  return { comprehensionQuestionsJson: JSON.stringify(raw) }
}

/**
 * Kolom pola kalimat (tab Materi grammatik) untuk operasi tulis.
 * Aturan sama dengan comprehensionQuestionsColumn: undefined = jangan sentuh.
 */
function grammarPatternsColumn(raw: unknown): { grammarPatternsJson?: string | null } {
  if (raw === undefined) return {}
  if (raw === null) return { grammarPatternsJson: null }
  return { grammarPatternsJson: JSON.stringify(raw) }
}

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

    const dialogueCount = normalizeDialogueCount(body.dialogueCount)
    const comprehensionCol = comprehensionQuestionsColumn(body.comprehensionQuestions)
    const grammarPatternsCol = grammarPatternsColumn(body.grammarPatterns)
    
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
        dialogueCount,
        ...comprehensionCol,
        ...grammarPatternsCol,
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
        dialogueCount,
        ...comprehensionCol,
        ...grammarPatternsCol,
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
      dialogueCount: normalizeDialogueCount(body.dialogueCount),
      ...comprehensionQuestionsColumn(body.comprehensionQuestions),
      ...grammarPatternsColumn(body.grammarPatterns),
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
