/**
 * Route TTS satu kalimat — dipakai tombol ▶ per baris, vocab clue, dan
 * pratinjau di Generator.
 *
 * Suara diambil dari HuggingFace Space Edge-TTS (Conrad/Killian/Florian pria
 * asli), bukan lagi Kokoro + Google. Endpoint WebSocket Microsoft langsung
 * tidak bisa dipakai: handshake-nya dijawab HTTP 200 di semua lingkungan yang
 * diuji, sehingga node-edge-tts selalu gagal.
 *
 * Dipisah dari /api/sessions/:id/audio (skenario gabungan) karena per-kalimat
 * dipanggil acak dan hasilnya di-cache per kalimat oleh CDN.
 */
import { Hono } from 'hono'
import { createHash } from 'node:crypto'
import { edgeTtsSpace, VOICE_LABEL_BY_ID } from '../lib/hfEdgeTts'
import { getTtsPersona } from '../../shared/ttsPersonas'

const ttsRouter = new Hono()

export const MAX_TTS_TEXT_LENGTH = 1000

ttsRouter.get('/', async (c) => {
  const text = c.req.query('text')
  const personaId = c.req.query('persona')
  const gender = c.req.query('gender') as 'male' | 'female' | undefined

  if (!text || text.trim() === '') {
    return c.json({ error: 'Text parameter is required' }, 400)
  }
  if (text.length > MAX_TTS_TEXT_LENGTH) {
    return c.json({ error: `Text exceeds maximum allowed length of ${MAX_TTS_TEXT_LENGTH} characters` }, 400)
  }

  const persona = getTtsPersona(personaId)
  const resolvedId = persona?.id ?? (gender === 'male' ? 'männlich-1' : 'weiblich')
  const voiceLabel = VOICE_LABEL_BY_ID[resolvedId] ?? VOICE_LABEL_BY_ID['weiblich']

  const etag = '"' + createHash('sha1').update(resolvedId + '|' + text.trim()).digest('hex').slice(0, 20) + '"'
  if (c.req.header('if-none-match') === etag) return c.body(null, 304)

  try {
    const audio = await edgeTtsSpace.synthesize(text.trim(), voiceLabel)

    c.header('Content-Type', 'audio/mpeg')
    c.header('ETag', etag)
    c.header('X-TTS-Engine', 'hf-edge-tts')
    c.header('X-TTS-Voice', voiceLabel.split(' - ')[0])
    c.header('X-TTS-Gender', persona?.gender ?? (gender === 'male' ? 'male' : 'female'))
    c.header('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable')
    c.header('CDN-Cache-Control', 'public, s-maxage=31536000')
    c.header('Vercel-CDN-Cache-Control', 'public, s-maxage=31536000')
    return c.body(audio as unknown as ArrayBuffer)
  } catch (err: any) {
    console.warn('[tts] gagal:', err?.message || err)
    c.header('X-TTS-Error', 'upstream_failed')
    return c.json({ error: 'tts_unavailable' }, 502)
  }
})

export default ttsRouter
