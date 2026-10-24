import { Hono } from 'hono'
import { generateLesson } from '../effect/ai-service'
import { Effect } from 'effect'
import { db } from '../../db/client'
import { wordBank } from '../../db/schema'
import { inArray } from 'drizzle-orm'
import { requireTeacherAuth } from './auth'
import { validateTopicIds, MAX_GRAMMAR_TOPICS } from '../../shared/grammarTopics'

const generateRouter = new Hono()

/** Batas jumlah dialog yang boleh diminta guru. */
export const MIN_DIALOGUE_COUNT = 1
export const MAX_DIALOGUE_COUNT = 20
export const DEFAULT_DIALOGUE_COUNT = 8

export const ALLOWED_CEFR_LEVELS = ['A1', 'A2', 'B1'] as const
export type CefrLevel = (typeof ALLOWED_CEFR_LEVELS)[number]

function isCefrLevel(value: unknown): value is CefrLevel {
  return typeof value === 'string' && (ALLOWED_CEFR_LEVELS as readonly string[]).includes(value)
}

generateRouter.post('/', requireTeacherAuth, async (c) => {
  try {
    const body = await c.req.json()
    const { prompt, cefrLevel, wordIds, dialogueCount, grammarTopics, speakerCount } = body
    
    if (!prompt || !cefrLevel) {
      return c.json({ error: 'Missing prompt or cefrLevel' }, 400)
    }

    if (!isCefrLevel(cefrLevel)) {
      return c.json(
        {
          error: `Level CEFR tidak valid: "${cefrLevel}". Pilihan yang didukung: ${ALLOWED_CEFR_LEVELS.join(', ')}.`,
        },
        400
      )
    }

    let speakers = 2
    if (speakerCount !== undefined) {
      if (typeof speakerCount !== 'number' || !Number.isInteger(speakerCount) || speakerCount < 2 || speakerCount > 3) {
        return c.json({ error: 'Jumlah pembicara harus berupa bilangan bulat antara 2 dan 3.' }, 400)
      }
      speakers = speakerCount
    }

    let count = DEFAULT_DIALOGUE_COUNT
    if (dialogueCount !== undefined) {
      if (
        typeof dialogueCount !== 'number' ||
        !Number.isInteger(dialogueCount) ||
        dialogueCount < MIN_DIALOGUE_COUNT ||
        dialogueCount > MAX_DIALOGUE_COUNT
      ) {
        return c.json(
          {
            error: `Jumlah dialog harus berupa bilangan bulat antara ${MIN_DIALOGUE_COUNT} dan ${MAX_DIALOGUE_COUNT}.`,
          },
          400
        )
      }
      count = dialogueCount
    }

    // Topik grammar hanya berlaku untuk level B1. Daftar harus sah seluruhnya
    // (bukan sebagian) supaya kesalahan klien terlihat sebagai 400.
    let topicIds: string[] = []
    if (grammarTopics !== undefined) {
      const valid = validateTopicIds(grammarTopics)
      if (valid === null) {
        return c.json(
          {
            error: `Daftar topik grammar tidak valid. Maksimal ${MAX_GRAMMAR_TOPICS} topik yang dikenal.`,
          },
          400
        )
      }
      if (valid.length > 0 && cefrLevel !== 'B1') {
        return c.json(
          { error: 'Topik grammar hanya tersedia untuk level B1.' },
          400
        )
      }
      topicIds = valid
    }

    let cognateWords: string[] = []
    if (wordIds && Array.isArray(wordIds) && wordIds.length > 0) {
      const words = await db.select({ word: wordBank.germanWord }).from(wordBank).where(inArray(wordBank.id, wordIds))
      cognateWords = words.map(w => w.word)
    }

    const result = await Effect.runPromise(
      generateLesson(prompt, cefrLevel, cognateWords, count, topicIds, speakers)
    )

    // Suntikkan personaId deterministik ke tiap baris dialog secara otomatis di backend
    const dialogueWithPersonas = result.dialogue.map((turn) => {
      let assignedPersona = 'weiblich'
      let assignedGender: 'male' | 'female' = 'female'

      if (turn.speaker.includes('B')) {
        assignedPersona = 'männlich-1'
        assignedGender = 'male'
      } else if (turn.speaker.includes('C')) {
        assignedPersona = 'männlich-2'
        assignedGender = 'male'
      }

      return {
        ...turn,
        personaId: assignedPersona,
        gender: assignedGender,
      }
    })

    return c.json({
      lesson: {
        ...result,
        dialogue: dialogueWithPersonas,
      },
    })
  } catch (error: any) {
    console.error('Generation Error:', error)
    return c.json({ error: error?.message || 'Failed to generate lesson' }, 500)
  }
})

export default generateRouter
