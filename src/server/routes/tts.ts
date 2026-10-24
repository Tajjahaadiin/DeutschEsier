import { Hono } from 'hono'

const ttsRouter = new Hono()

export const MAX_TTS_TEXT_LENGTH = 1000

/**
 * Route fallback TTS sisi server: mengalirkan audio Jerman MP3 via direct HTTP TTS stream
 * dengan header Vercel Edge CDN Cache bertingkat.
 *
 * Menghilangkan ketergantungan pada kuota ketat Gemini-TTS dan WAF Edge-TTS.
 */
ttsRouter.get('/', async (c) => {
  const text = c.req.query('text')

  if (!text || text.trim() === '') {
    return c.json({ error: 'Text parameter is required' }, 400)
  }

  if (text.length > MAX_TTS_TEXT_LENGTH) {
    return c.json({ error: `Text exceeds maximum allowed length of ${MAX_TTS_TEXT_LENGTH} characters` }, 400)
  }

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
