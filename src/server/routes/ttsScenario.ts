/**
 * PROTOTIPE — POST /api/tts-scenario
 *
 * Input: SELURUH dialog sekaligus (bukan per baris).
 * Output: satu file MP3 gabungan dengan jeda antar baris.
 *
 *   POST /api/tts-scenario
 *   { "turns": [ { "speaker": "A", "germanText": "...", "personaId": "weiblich" }, ... ] }
 *
 * Ditempatkan berdampingan dengan /api/tts (produksi) supaya bisa dibandingkan
 * tanpa mengubah perilaku yang sedang live.
 */
import { Hono } from 'hono'
import { edgeTtsSpace } from '../lib/hfEdgeTts'
import { synthesizeScenario, type ScenarioTurn, TURN_GAP_MS } from '../lib/scenarioTts'

const scenarioRouter = new Hono()

export const MAX_TURNS = 20
export const MAX_TURN_CHARS = 1000

scenarioRouter.post('/', async (c) => {
  let body: { turns?: unknown }
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Body harus JSON' }, 400)
  }

  const raw = body.turns
  if (!Array.isArray(raw) || raw.length === 0) {
    return c.json({ error: 'turns wajib berupa array tidak kosong' }, 400)
  }
  if (raw.length > MAX_TURNS) {
    return c.json({ error: `Maksimal ${MAX_TURNS} baris dialog` }, 400)
  }

  const turns: ScenarioTurn[] = []
  for (let i = 0; i < raw.length; i++) {
    const t = raw[i] as any
    if (typeof t?.germanText !== 'string' || !t.germanText.trim()) {
      return c.json({ error: `turns[${i}].germanText wajib diisi` }, 400)
    }
    if (t.germanText.length > MAX_TURN_CHARS) {
      return c.json({ error: `turns[${i}].germanText melebihi ${MAX_TURN_CHARS} karakter` }, 400)
    }
    turns.push({
      speaker: String(t.speaker ?? 'Sprecher'),
      germanText: t.germanText,
      personaId: typeof t.personaId === 'string' ? t.personaId : undefined,
    })
  }

  try {
    const result = await synthesizeScenario(turns, edgeTtsSpace)

    c.header('Content-Type', result.contentType)
    c.header('X-TTS-Engine', 'hf-edge-tts')
    c.header('X-TTS-Turns', String(result.turns))
    c.header('X-TTS-Turns-Ok', String(result.perTurn.filter((t) => t.ok).length))
    c.header('X-TTS-Bytes', String(result.bytes))
    c.header('X-TTS-Elapsed-Ms', String(result.elapsedMs))
    c.header('X-TTS-Gap-Ms', String(TURN_GAP_MS))
    // Cache panjang: isi dialog ikut jadi bagian kunci URL (POST tidak di-cache
    // CDN, tapi header ini berguna bila nanti dipindah ke GET).
    c.header('Cache-Control', 'public, max-age=31536000, immutable')
    return c.body(result.audio as unknown as ArrayBuffer)
  } catch (err: any) {
    console.warn('[tts-scenario] gagal:', err?.message || err)
    c.header('X-TTS-Error', 'upstream_failed')
    return c.json({ error: 'scenario_tts_unavailable', detail: err?.message }, 502)
  }
})

export default scenarioRouter
