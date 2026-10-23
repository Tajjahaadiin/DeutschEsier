import { Hono } from 'hono'
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts'
import { resolveEdgeVoiceId } from '../../shared/ttsPersonas'

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
  const tts = new MsEdgeTTS()

  try {
    await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3)
    const { audioStream } = tts.toStream(text)

    // Kumpulkan audio stream ke in-memory Buffer
    const chunks: Buffer[] = []
    for await (const chunk of audioStream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    const audioBuffer = Buffer.concat(chunks)

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
    try {
      tts.close()
    } catch {}
  }
})

export default ttsRouter
