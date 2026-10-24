import { Hono } from 'hono'
import { EdgeTTS } from 'node-edge-tts'
import { resolveEdgeVoiceId } from '../../shared/ttsPersonas'
import { promises as fs } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { nanoid } from 'nanoid'

const ttsRouter = new Hono()

export const MAX_TTS_TEXT_LENGTH = 1000

ttsRouter.get('/', async (c) => {
  const text = c.req.query('text')
  const voiceParam = c.req.query('voice') || c.req.query('persona')
  const genderParam = (c.req.query('gender') || '').toLowerCase()
  const fallbackGender: 'male' | 'female' = genderParam === 'male' ? 'male' : 'female'

  if (!text || text.trim() === '') {
    return c.json({ error: 'Text parameter is required' }, 400)
  }

  if (text.length > MAX_TTS_TEXT_LENGTH) {
    return c.json({ error: `Text exceeds maximum allowed length of ${MAX_TTS_TEXT_LENGTH} characters` }, 400)
  }

  const voiceName = resolveEdgeVoiceId(voiceParam || (genderParam ? genderParam : undefined), fallbackGender)

  // 1. Jalur Utama: Jika CLOUDFLARE_TTS_PROXY dikonfigurasi, gunakan proxy Cloudflare Edge
  const proxyBase = process.env.CLOUDFLARE_TTS_PROXY
  if (proxyBase) {
    try {
      const cleanProxy = proxyBase.replace(/\/+$/, '')
      const proxyUrl = `${cleanProxy}/tts?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(voiceName)}`
      const resp = await fetch(proxyUrl)
      if (resp.ok) {
        const audioBuffer = Buffer.from(await resp.arrayBuffer())
        c.header('Content-Type', 'audio/mpeg')
        c.header('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable')
        c.header('CDN-Cache-Control', 'public, s-maxage=31536000')
        c.header('Vercel-CDN-Cache-Control', 'public, s-maxage=31536000')
        return c.body(audioBuffer)
      }
      console.warn(`[tts] Cloudflare proxy returned ${resp.status}, falling back to direct EdgeTTS...`)
    } catch (proxyErr) {
      console.warn('[tts] Cloudflare proxy unreachable, falling back to direct EdgeTTS:', proxyErr)
    }
  }

  // 2. Jalur Standar: node-edge-tts lokal
  const tempPath = join(tmpdir(), `tts-${nanoid()}.mp3`)

  try {
    const tts = new EdgeTTS({
      voice: voiceName,
      lang: 'de-DE',
      outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
      timeout: 10000,
    })

    await tts.ttsPromise(text, tempPath)
    const audioBuffer = await fs.readFile(tempPath)

    // Headers untuk caching bertingkat: Browser + Vercel Global Edge CDN
    c.header('Content-Type', 'audio/mpeg')
    c.header('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable')
    c.header('CDN-Cache-Control', 'public, s-maxage=31536000')
    c.header('Vercel-CDN-Cache-Control', 'public, s-maxage=31536000')

    return c.body(audioBuffer)
  } catch (error: any) {
    console.error('Edge TTS generation failed, falling back to HTTP audio stream:', error?.message || error)

    // 3. Jaring Pengaman Terakhir di Production Vercel:
    // Jika EdgeTTS diblokir (Unexpected server response: 200 di AWS Lambda/Vercel datacenter IP),
    // ambil audio Jerman MP3 via direct HTTP TTS stream agar murid tetap mendengar suara audio jernih.
    try {
      const googleTtsUrl = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=de&client=tw-ob`
      const fallbackResp = await fetch(googleTtsUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://translate.google.com/',
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
      console.error('HTTP audio fallback also failed:', fbErr)
    }

    return c.json({ error: error?.message || 'TTS generation failed' }, 500)
  } finally {
    fs.unlink(tempPath).catch(() => {})
  }
})

export default ttsRouter

