import { Hono } from 'hono'
import { EdgeTTS } from 'node-edge-tts'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { resolveEdgeVoiceId } from '../../shared/ttsPersonas'

const ttsRouter = new Hono()

export const MAX_TTS_TEXT_LENGTH = 1000

/**
 * Route TTS sisi server: mengalirkan audio Jerman MP3 via EdgeTTS neural multi-speaker
 * dengan fallback mulus ke Google TTS jika koneksi diblokir, serta header Vercel Edge CDN Cache.
 */
ttsRouter.get('/', async (c) => {
  const text = c.req.query('text')
  const persona = c.req.query('persona')
  const gender = c.req.query('gender') as 'male' | 'female' | undefined

  if (!text || text.trim() === '') {
    return c.json({ error: 'Text parameter is required' }, 400)
  }

  if (text.length > MAX_TTS_TEXT_LENGTH) {
    return c.json({ error: `Text exceeds maximum allowed length of ${MAX_TTS_TEXT_LENGTH} characters` }, 400)
  }

  const voiceId = resolveEdgeVoiceId(persona, gender || 'female')

  // 1. Prioritas Utama: EdgeTTS Neural Multi-Speaker (Amala, Conrad, Killian, dsb.)
  try {
    const edgeTts = new EdgeTTS({ voice: voiceId })
    const tempFile = path.join(os.tmpdir(), `tts_${Date.now()}_${Math.random().toString(36).slice(2)}.mp3`)
    
    await edgeTts.ttsPromise(text.trim(), tempFile)
    const audioBuffer = await fs.readFile(tempFile)
    await fs.unlink(tempFile).catch(() => {})

    c.header('Content-Type', 'audio/mpeg')
    c.header('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable')
    c.header('CDN-Cache-Control', 'public, s-maxage=31536000')
    c.header('Vercel-CDN-Cache-Control', 'public, s-maxage=31536000')
    return c.body(audioBuffer)
  } catch (edgeErr: any) {
    console.warn(`[EdgeTTS Fallback to Google]: voice ${voiceId} failed:`, edgeErr?.message || edgeErr)
  }

  // 2. Fallback Jaring Pengaman: Google Translate TTS jika EdgeTTS terblokir WAF
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
