import { Hono } from 'hono'
import { synthesizeGeminiSpeech } from '../lib/geminiTts'

const ttsRouter = new Hono()

export const MAX_TTS_TEXT_LENGTH = 1000

ttsRouter.get('/', async (c) => {
  const text = c.req.query('text')
  const voiceParam = c.req.query('voice') || c.req.query('persona')
  const genderParam = (c.req.query('gender') || '').toLowerCase()
  const personaIdentifier = voiceParam || (genderParam ? genderParam : undefined)

  if (!text || text.trim() === '') {
    return c.json({ error: 'Text parameter is required' }, 400)
  }

  if (text.length > MAX_TTS_TEXT_LENGTH) {
    return c.json({ error: `Text exceeds maximum allowed length of ${MAX_TTS_TEXT_LENGTH} characters` }, 400)
  }

  try {
    const wavBuffer = await synthesizeGeminiSpeech(text.trim(), personaIdentifier)

    // Caching bertingkat: Browser + Vercel Global Edge CDN
    c.header('Content-Type', 'audio/wav')
    c.header('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable')
    c.header('CDN-Cache-Control', 'public, s-maxage=31536000')
    c.header('Vercel-CDN-Cache-Control', 'public, s-maxage=31536000')

    return c.body(wavBuffer)
  } catch (error: any) {
    console.error('[Gemini TTS] Synthesis failed:', error?.message || error)

    // Jaring pengaman darurat (Google HTTP stream) jika API key bermasalah/kuota habis
    try {
      const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=de&client=tw-ob`
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
    } catch (fbErr) {
      console.error('[TTS Emergency Fallback] Failed:', fbErr)
    }

    return c.json({ error: error?.message || 'TTS generation failed' }, 500)
  }
})

export default ttsRouter
