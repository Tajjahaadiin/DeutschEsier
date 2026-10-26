import { Hono } from 'hono'
import { synthesizeKokoroMartin } from '../lib/kokoroHf'
import { detuneWavBuffer } from '../lib/wavDetune'
import { getTtsPersona } from '../../shared/ttsPersonas'

const ttsRouter = new Hono()

export const MAX_TTS_TEXT_LENGTH = 1000

/**
 * Route TTS sisi server:
 * - Pria (male, männlich-1, männlich-2): Disintesis via HuggingFace Space Kokoro Martin neural
 * - Wanita (female, weiblich): Disintesis via Google Translate TTS native stream
 * - Header Vercel Edge CDN Cache 1 tahun untuk penghematan bandwidth maksimal
 */
ttsRouter.get('/', async (c) => {
  const text = c.req.query('text')
  const persona = c.req.query('persona')
  const genderQuery = c.req.query('gender') as 'male' | 'female' | undefined

  if (!text || text.trim() === '') {
    return c.json({ error: 'Text parameter is required' }, 400)
  }

  if (text.length > MAX_TTS_TEXT_LENGTH) {
    return c.json({ error: `Text exceeds maximum allowed length of ${MAX_TTS_TEXT_LENGTH} characters` }, 400)
  }

  const personaObj = getTtsPersona(persona)
  const isMale = personaObj
    ? personaObj.gender === 'male'
    : (genderQuery === 'male' || (persona && (persona.includes('male') || persona.includes('männlich'))))

  // 1. Prioritas Suara Pria: Kokoro German Martin via HuggingFace Space
  // Pembedaan Akustik:
  // - männlich-1: Bariton matang/dewasa (detune -2.0 semitone, speed 0.98x)
  // - männlich-2: Tenor muda/energik (detune +1.8 semitone, speed 1.05x)
  if (isMale) {
    try {
      const isMale2 = persona === 'männlich-2' || persona === 'male-2'
      const speed = isMale2 ? 1.05 : 0.98
      const semitoneShift = isMale2 ? 1.8 : -2.0

      const kokoroBuffer = await synthesizeKokoroMartin(text.trim(), speed)
      if (kokoroBuffer) {
        // Terapkan detune pitch instan pada header WAV
        const tunedBuffer = detuneWavBuffer(kokoroBuffer, semitoneShift)

        c.header('Content-Type', 'audio/wav')
        c.header('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable')
        c.header('CDN-Cache-Control', 'public, s-maxage=31536000')
        c.header('Vercel-CDN-Cache-Control', 'public, s-maxage=31536000')
        return c.body(tunedBuffer as unknown as ArrayBuffer)
      }
    } catch (err: any) {
      console.warn('[Kokoro HF Fallback to Google]:', err?.message || err)
    }
  }

  // 2. Prioritas Suara Wanita / Fallback Jaring Pengaman: Google Translate TTS Stream
  try {
    const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(
      text.trim()
    )}&tl=de&client=tw-ob`

    const fallbackResp = await fetch(googleTtsUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://translate.google.com/',
      },
    })

    if (fallbackResp.ok) {
      const audioBuffer = Buffer.from(await fallbackResp.arrayBuffer())
      c.header('Content-Type', 'audio/mpeg')
      c.header('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable')
      c.header('CDN-Cache-Control', 'public, s-maxage=31536000')
      c.header('Vercel-CDN-Cache-Control', 'public, s-maxage=31536000')
      return c.body(audioBuffer)
    }

    return c.json({ error: 'TTS upstream response not ok' }, 502)
  } catch (error: any) {
    console.error('[TTS Remote Fallback Error]:', error?.message || error)
    return c.json({ error: error?.message || 'TTS generation failed' }, 500)
  }
})

export default ttsRouter
