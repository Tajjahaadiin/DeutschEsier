import { Hono } from 'hono'
import { promises as fs } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { nanoid } from 'nanoid'
import { EdgeTTS } from 'node-edge-tts'
import { getTtsPersona } from '../../shared/ttsPersonas'

const ttsRouter = new Hono()

export const MAX_TTS_TEXT_LENGTH = 1000
const EDGE_TIMEOUT_MS = 12000
const MAX_ATTEMPTS = 3

/**
 * Route TTS sisi server — satu suara per persona, tanpa fallback yang mengganti
 * gender.
 *
 * Setiap persona dipetakan ke voiceId Microsoft Edge neural miliknya sendiri di
 * `src/shared/ttsPersonas.ts`. Kalau Edge TTS gagal setelah retry, route
 * mengembalikan 502 dan klien memakai Web Speech API yang juga sadar gender.
 * Lebih baik tanpa audio daripada audio bergender salah.
 *
 * Ketahanan terhadap IP datacenter (Vercel/AWS):
 * - `node-edge-tts@1.2.12` sudah memakai endpoint `api.msedgeservices.com` +
 *   token Sec-MS-GEC **v2**, jadi 403 endpoint-usang tidak lagi terjadi.
 * - Yang tersisa adalah rate limit sementara (429) saat lonjakan paralel.
 *   Retry dengan backoff di bawah menanganinya; 403 tidak di-retry karena
 *   menandakan perubahan protokol yang butuh naik versi pustaka.
 * - Vercel CDN cache (`s-maxage=31536000, immutable`) adalah pertahanan utama:
 *   teks yang sama hanya menyentuh Microsoft SEKALI. Kunci cache adalah URL
 *   lengkap (text+persona), dan klien memakai `cache: 'force-cache'`.
 */
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
  const voice = persona?.voiceId ?? (gender === 'male' ? 'de-DE-ConradNeural' : 'de-DE-KatjaNeural')
  const cleanText = text.trim()

  let lastError = ''

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const outPath = join(tmpdir(), `tts-${nanoid()}.mp3`)

    try {
      const tts = new EdgeTTS({
        voice,
        lang: 'de-DE',
        outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
        timeout: EDGE_TIMEOUT_MS,
      })
      await tts.ttsPromise(cleanText, outPath)

      const audio = await fs.readFile(outPath)
      // Edge TTS menulis file 0 byte saat gagal tanpa melempar error.
      if (audio.length < 512) {
        lastError = 'empty_audio'
        continue
      }

      c.header('Content-Type', 'audio/mpeg')
      c.header('X-TTS-Voice', voice)
      c.header('Cache-Control', 'public, max-age=31536000, s-maxage=31536000, immutable')
      c.header('CDN-Cache-Control', 'public, s-maxage=31536000')
      c.header('Vercel-CDN-Cache-Control', 'public, s-maxage=31536000')
      return c.body(audio as unknown as ArrayBuffer)
    } catch (err: any) {
      lastError = err?.message || String(err)
      // 403 = protokol berubah (butuh naik versi pustaka), bukan lonjakan sesaat.
      // Mengulanginya hanya membuang waktu fungsi serverless.
      if (lastError.includes('403')) break
      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 400 * 2 ** (attempt - 1)))
      }
    } finally {
      fs.unlink(outPath).catch(() => {})
    }
  }

  console.warn(`[TTS] voice=${voice} gagal setelah retry: ${lastError}`)
  c.header('X-TTS-Error', lastError.includes('403') ? 'protocol_403' : 'upstream_failed')
  return c.json({ error: 'tts_unavailable' }, 502)
})

export default ttsRouter
