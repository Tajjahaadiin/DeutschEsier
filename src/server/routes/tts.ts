/**
 * Route TTS satu kalimat — dipakai tombol ▶ per baris, vocab clue, dan
 * pratinjau di Generator.
 *
 * Rantai engine ada di `lib/ttsChain.ts` (edge-tts → hf-space → google), bukan
 * di sini, supaya jalur per-kartu dan jalur skenario penuh tidak bisa berbeda.
 *
 * Dipisah dari /api/sessions/:id/audio (skenario gabungan) karena per-kalimat
 * dipanggil acak dan hasilnya di-cache per kalimat oleh CDN.
 */
import { Hono } from 'hono'
import { createHash } from 'node:crypto'
import { synthesizeLine, cacheHeadersFor } from '../lib/ttsChain'
import { EDGE_VOICE_BY_PERSONA } from '../lib/edgeTtsDirect'
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
  const voiceId = EDGE_VOICE_BY_PERSONA[resolvedId] ?? EDGE_VOICE_BY_PERSONA.weiblich

  // ETag TIDAK memuat engine: audio hasil fallback tidak boleh berbagi
  // identitas dengan audio edge-tts. Dengan begitu, ketika engine utama pulih,
  // ETag berubah dan klien mengambil suara pria asli alih-alih menyimpan
  // versi cadangan selamanya.
  const etagKey = (engine: string) => '"' + createHash('sha1').update(engine + '|' + voiceId + '|' + text.trim()).digest('hex').slice(0, 20) + '"'

  // Cek cepat: bila klien membawa ETag untuk engine utama dan itu cocok,
  // tidak perlu menyintesis apa pun.
  const primaryEtag = etagKey('edge-tts')
  if (c.req.header('if-none-match') === primaryEtag) {
    return c.body(null, 304)
  }

  try {
    const { audio, engine } = await synthesizeLine(text.trim(), voiceId)
    const etag = etagKey(engine)
    if (c.req.header('if-none-match') === etag) return c.body(null, 304)

    c.header('Content-Type', 'audio/mpeg')
    c.header('ETag', etag)
    c.header('X-TTS-Engine', engine)
    c.header('X-TTS-Voice', voiceId)
    c.header('X-TTS-Gender', persona?.gender ?? (gender === 'male' ? 'male' : 'female'))
    for (const [k, v] of Object.entries(cacheHeadersFor(engine))) c.header(k, v)
    return c.body(audio as unknown as ArrayBuffer)
  } catch (err: any) {
    console.warn('[tts] semua engine gagal:', err?.message || err)
    c.header('X-TTS-Error', 'upstream_failed')
    // Jangan pernah biarkan CDN menyimpan kegagalan: setelah edge-tts pulih,
    // siswa akan tetap menerima 502 dari cache.
    c.header('Cache-Control', 'no-store')
    return c.json({ error: 'tts_unavailable' }, 502)
  }
})

export default ttsRouter
