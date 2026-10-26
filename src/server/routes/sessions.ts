import { Hono } from 'hono'
import { createHash } from 'node:crypto'
import { db } from '../../db/client'
import { learningSession } from '../../db/schema'
import { eq, desc } from 'drizzle-orm'
import { requireTeacherAuth } from './auth'
import { authorizeSessionAccess } from './access-guard'
import { edgeTtsSpace } from '../lib/hfEdgeTts'
import { synthesizeScenario, type ScenarioTurn } from '../lib/scenarioTts'
import {
  MIN_DIALOGUE_COUNT,
  MAX_DIALOGUE_COUNT,
  DEFAULT_DIALOGUE_COUNT,
} from './generate'

const sessionsRouter = new Hono()

/** Jumlah dialog valid: bilangan bulat 1-20, default 8 bila tidak valid/kosong. */
function normalizeDialogueCount(raw: unknown): number {
  if (typeof raw !== 'number' || !Number.isInteger(raw)) return DEFAULT_DIALOGUE_COUNT
  return Math.min(MAX_DIALOGUE_COUNT, Math.max(MIN_DIALOGUE_COUNT, raw))
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

/**
 * Kolom pilihan topik grammar B1 beserta materi AI-nya.
 * Aturan sama: undefined = jangan sentuh, null = kosongkan, objek = simpan.
 */
function grammarTopicsColumn(raw: unknown): { grammarTopicsJson?: string | null } {
  if (raw === undefined) return {}
  if (raw === null) return { grammarTopicsJson: null }
  return { grammarTopicsJson: JSON.stringify(raw) }
}

/**
 * Kolom soal latihan tata bahasa hasil AI.
 * Aturan sama: undefined = jangan sentuh, null = kosongkan, nilai = simpan.
 */
function grammarQuestionsColumn(raw: unknown): { grammarQuestionsJson?: string | null } {
  if (raw === undefined) return {}
  if (raw === null) return { grammarQuestionsJson: null }
  return { grammarQuestionsJson: JSON.stringify(raw) }
}

sessionsRouter.get('/', requireTeacherAuth, async (c) => {
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

    // Siswa wajib membawa kunci akses untuk sesi ini (bila fitur dinyalakan);
    // guru boleh tanpa kunci. Default fitur MATI, jadi link lama tetap hidup.
    const access = await authorizeSessionAccess(c.req.raw.headers, id, c.req.query('key'))
    if (!access.allowed) {
      return c.json({ error: 'Access key required', reason: access.reason }, 403)
    }

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
    const grammarTopicsCol = grammarTopicsColumn(body.grammarTopics)
    const grammarQuestionsCol = grammarQuestionsColumn(body.grammarQuestions)
    
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
        ...grammarTopicsCol,
        ...grammarQuestionsCol,
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
        ...grammarTopicsCol,
        ...grammarQuestionsCol,
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
      ...grammarTopicsColumn(body.grammarTopics),
      ...grammarQuestionsColumn(body.grammarQuestions),
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

/**
 * GET /api/sessions/:id/audio — satu file MP3 untuk SELURUH dialog sesi.
 *
 * Klien cukup satu <audio src>: tidak ada retry per baris, tidak ada timer
 * antar baris, tidak ada onend yang bisa tidak terpicu.
 *
 * ETag = hash(dialogueJson + persona tiap baris). Kalau guru mengedit dialog,
 * hash berubah sehingga CDN tidak pernah menyajikan audio basi. GET dipilih
 * (bukan POST) supaya Vercel CDN bisa meng-cache hasilnya.
 */
sessionsRouter.get('/:id/audio', async (c) => {
  try {
    const id = c.req.param('id')

    const access = await authorizeSessionAccess(c.req.raw.headers, id, c.req.query('key'))
    if (!access.allowed) {
      return c.json({ error: 'Access key required', reason: access.reason }, 403)
    }

    const [session] = await db.select().from(learningSession).where(eq(learningSession.id, id)).limit(1)
    if (!session) return c.json({ error: 'Session not found' }, 404)

    let turns: ScenarioTurn[]
    try {
      turns = JSON.parse(session.dialogueJson) as ScenarioTurn[]
    } catch {
      return c.json({ error: 'dialogue_json tidak valid' }, 500)
    }
    if (!Array.isArray(turns) || turns.length === 0) {
      return c.json({ error: 'Sesi tidak punya dialog' }, 404)
    }

    const etag = '"' + createHash('sha1').update(
      session.dialogueJson + '|' + turns.map((t) => t.personaId ?? '').join(','),
    ).digest('hex').slice(0, 20) + '"'

    if (c.req.header('if-none-match') === etag) {
      return c.body(null, 304)
    }

    const result = await synthesizeScenario(turns, edgeTtsSpace)

    c.header('Content-Type', result.contentType)
    c.header('ETag', etag)
    c.header('X-Scenario-Turns', String(result.turns))
    c.header('X-Scenario-Turns-Ok', String(result.perTurn.filter((t) => t.ok).length))
    c.header('X-Scenario-Elapsed-Ms', String(result.elapsedMs))
    c.header('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable')
    c.header('CDN-Cache-Control', 'public, s-maxage=31536000')
    c.header('Vercel-CDN-Cache-Control', 'public, s-maxage=31536000')
    return c.body(result.audio as unknown as ArrayBuffer)
  } catch (error: any) {
    console.warn('[sessions/audio] gagal:', error?.message || error)
    c.header('X-Scenario-Error', 'upstream_failed')
    return c.json({ error: 'scenario_tts_unavailable' }, 502)
  }
})

export default sessionsRouter
