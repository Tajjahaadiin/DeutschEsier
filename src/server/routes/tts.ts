import { Hono } from 'hono'
import { EdgeTTS } from 'node-edge-tts'
import { resolveEdgeVoiceId } from '../../shared/ttsPersonas'
import { promises as fs } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { nanoid } from 'nanoid'

const ttsRouter = new Hono()

ttsRouter.get('/', async (c) => {
  const text = c.req.query('text')
  const voiceParam = c.req.query('voice') || c.req.query('persona')
  const genderParam = (c.req.query('gender') || '').toLowerCase()
  const fallbackGender: 'male' | 'female' = genderParam === 'male' ? 'male' : 'female'

  if (!text || text.trim() === '') {
    return c.json({ error: 'Text parameter is required' }, 400)
  }

  const voiceName = resolveEdgeVoiceId(voiceParam || (genderParam ? genderParam : undefined), fallbackGender)
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
    console.error('Edge TTS generation failed:', error)
    return c.json({ error: error?.message || 'TTS generation failed' }, 500)
  } finally {
    fs.unlink(tempPath).catch(() => {})
  }
})

export default ttsRouter

