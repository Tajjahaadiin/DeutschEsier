import { Hono } from 'hono'
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts'
import { createHash } from 'crypto'
import { existsSync, mkdirSync, createReadStream, createWriteStream, promises as fsPromises } from 'fs'
import { join } from 'path'

const ttsRouter = new Hono()

const pendingRequests = new Map<string, Promise<void>>()

const CACHE_DIR = join(process.cwd(), 'public', 'audio', 'cache')
if (!existsSync(CACHE_DIR)) {
  mkdirSync(CACHE_DIR, { recursive: true })
}

// Voices:
// Pria: de-DE-ConradNeural (standar bariton) atau de-DE-KillianNeural
// Wanita: de-DE-KatjaNeural
const MALE_VOICE = 'de-DE-ConradNeural'
const FEMALE_VOICE = 'de-DE-KatjaNeural'

ttsRouter.get('/', async (c) => {
  const text = c.req.query('text')
  const gender = c.req.query('gender') || 'male'

  if (!text || text.trim() === '') {
    return c.json({ error: 'Text parameter is required' }, 400)
  }

  const voiceName = gender === 'female' ? FEMALE_VOICE : MALE_VOICE
  const hash = createHash('md5').update(`${voiceName}_${text}`).digest('hex')
  const cacheFilePath = join(CACHE_DIR, `${hash}.mp3`)

  try {
    // Jika cache hit
    if (existsSync(cacheFilePath)) {
      c.header('Content-Type', 'audio/mpeg')
      c.header('Cache-Control', 'public, max-age=31536000, immutable')
      return c.body(createReadStream(cacheFilePath) as any)
    }

    // Jika sedang digenerate oleh request lain, tunggu promise-nya selesai
    if (pendingRequests.has(hash)) {
      await pendingRequests.get(hash)
      if (existsSync(cacheFilePath)) {
        c.header('Content-Type', 'audio/mpeg')
        c.header('Cache-Control', 'public, max-age=31536000, immutable')
        return c.body(createReadStream(cacheFilePath) as any)
      }
    }

    // Generate baru dengan atomic write
    const generatePromise = (async () => {
      const tempPath = join(CACHE_DIR, `${hash}.${Date.now()}.${Math.random().toString(36).substring(7)}.tmp`)
      try {
        const tts = new MsEdgeTTS()
        await tts.setMetadata(voiceName, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3)
        const { audioStream } = tts.toStream(text)

        const fileStream = createWriteStream(tempPath)
        audioStream.pipe(fileStream)

        await new Promise<void>((resolve, reject) => {
          fileStream.on('finish', () => resolve())
          audioStream.on('error', reject)
          fileStream.on('error', reject)
        })

        await fsPromises.rename(tempPath, cacheFilePath)
      } catch (err) {
        try {
          if (existsSync(tempPath)) await fsPromises.unlink(tempPath)
        } catch {}
        throw err
      }
    })()

    pendingRequests.set(hash, generatePromise)
    try {
      await generatePromise
    } finally {
      pendingRequests.delete(hash)
    }

    c.header('Content-Type', 'audio/mpeg')
    c.header('Cache-Control', 'public, max-age=31536000, immutable')
    return c.body(createReadStream(cacheFilePath) as any)
  } catch (error: any) {
    console.error('Edge TTS generation failed:', error)
    return c.json({ error: error?.message || 'TTS generation failed' }, 500)
  }
})

export default ttsRouter
