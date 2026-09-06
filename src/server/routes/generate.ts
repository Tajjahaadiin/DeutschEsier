import { Hono } from 'hono'
import { generateLesson } from '../effect/ai-service'
import { Effect } from 'effect'
import { db } from '../../db/client'
import { wordBank } from '../../db/schema'
import { inArray } from 'drizzle-orm'
import { requireTeacherAuth } from './auth'

const generateRouter = new Hono()

generateRouter.post('/', requireTeacherAuth, async (c) => {
  try {
    const body = await c.req.json()
    const { prompt, cefrLevel, wordIds } = body
    
    if (!prompt || !cefrLevel) {
      return c.json({ error: 'Missing prompt or cefrLevel' }, 400)
    }

    let cognateWords: string[] = []
    if (wordIds && Array.isArray(wordIds) && wordIds.length > 0) {
      const words = await db.select({ word: wordBank.germanWord }).from(wordBank).where(inArray(wordBank.id, wordIds))
      cognateWords = words.map(w => w.word)
    }

    const result = await Effect.runPromise(generateLesson(prompt, cefrLevel, cognateWords))
    
    return c.json({ lesson: result })
  } catch (error: any) {
    console.error('Generation Error:', error)
    return c.json({ error: error?.message || 'Failed to generate lesson' }, 500)
  }
})

export default generateRouter
