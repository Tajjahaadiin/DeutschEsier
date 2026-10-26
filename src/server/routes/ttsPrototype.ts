/**
 * Route prototype TTS — GET /api/tts-prototype?text=...&persona=...
 *
 * Berdampingan dengan /api/tts yang lama supaya bisa dibandingkan langsung
 * tanpa mengubah perilaku produksi.
 */
import { Hono } from 'hono'
import { synthesizePrototype } from '../lib/googleTts'
import { getTtsPersona } from '../../shared/ttsPersonas'

const protoRouter = new Hono()

export const MAX_TEXT = 1000

protoRouter.get('/', async (c) => {
  const text = c.req.query('text')
  const personaId = c.req.query('persona')

  if (!text || !text.trim()) return c.json({ error: 'Text parameter is required' }, 400)
  if (text.length > MAX_TEXT) return c.json({ error: `Text exceeds ${MAX_TEXT} characters` }, 400)

  const persona = getTtsPersona(personaId)

  try {
    const { audio, chunks, bytes } = await synthesizePrototype(text)

    c.header('Content-Type', 'audio/mpeg')
    c.header('X-TTS-Engine', 'google-translate')
    c.header('X-TTS-Voice', persona?.voiceId ?? 'default')
    c.header('X-TTS-Gender', persona?.gender ?? 'unknown')
    c.header('X-TTS-Chunks', String(chunks))
    c.header('X-TTS-Bytes', String(bytes))
    c.header('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable')
    return c.body(audio as unknown as ArrayBuffer)
  } catch (err: any) {
    console.warn('[tts-prototype] gagal:', err?.message || err)
    c.header('X-TTS-Error', 'upstream_failed')
    return c.json({ error: 'tts_prototype_unavailable', detail: err?.message }, 502)
  }
})

export default protoRouter
