/**
 * PROTOTIPE — sintesis satu skenario penuh jadi SATU file MP3.
 *
 * Input: seluruh dialog (bukan per baris). Server menyintesis tiap baris lewat
 * HuggingFace Space Edge-TTS (suara pria/wanita Jerman asli), lalu menggabung
 * semuanya dengan jeda tetap di antaranya.
 *
 * Alasan desain:
 * - Klien cukup satu <audio src> → tidak ada retry per baris, tidak ada
 *   setTimeout antar baris, tidak ada onend yang bisa tidak terpicu.
 * - Space Edge-TTS dipanggil lewat HTTP biasa (Gradio), bukan WebSocket,
 *   jadi tidak terkena penolakan handshake yang membunuh /api/tts.
 * - Suara pria asli (Conrad/Killian/Florian), bukan pitch palsu.
 */
import { EdgeTtsSpace, VOICE_LABEL_BY_ID } from './hfEdgeTts'

export interface ScenarioTurn {
  speaker: string
  germanText: string
  personaId?: string
}

export interface ScenarioAudio {
  audio: Buffer
  contentType: string
  turns: number
  bytes: number
  elapsedMs: number
  /** Per-baris hasil, untuk diagnostik. */
  perTurn: Array<{ index: number; persona: string; ok: boolean; bytes: number; ms: number }>
}

/** Jeda antar baris. Dipakai juga oleh klien untuk scroll sinkron. */
export const TURN_GAP_MS = 450

/**
 * Batas paralel ke Space. Uji rate limit: 8 request serentak sukses, wall 3s,
 * tanpa 429. 4 dipilih agar 20 baris pun selesai jauh di bawah batas 300s
 * Vercel sekaligus tidak mengirim burst besar ke Space gratis.
 */
const CONCURRENCY = 4

async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length)
  let next = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const i = next++
      if (i >= items.length) return
      out[i] = await fn(items[i], i)
    }
  })
  await Promise.all(workers)
  return out
}

export async function synthesizeScenario(
  turns: ScenarioTurn[],
  space: EdgeTtsSpace,
): Promise<ScenarioAudio> {
  const started = Date.now()

  // Sintesis paralel terbatas; hasil dikumpulkan per-index agar urutan tetap.
  const results = await mapLimit(turns, CONCURRENCY, async (turn, i) => {
    const persona = turn.personaId ?? (i % 2 === 0 ? 'weiblich' : 'männlich-1')
    const voice = VOICE_LABEL_BY_ID[persona] ?? VOICE_LABEL_BY_ID['weiblich']
    const t0 = Date.now()
    try {
      const buf = await space.synthesize(turn.germanText, voice)
      const ok = buf.length > 512
      return { persona, ok, buf: ok ? buf : null, bytes: buf.length, ms: Date.now() - t0 }
    } catch (err: any) {
      console.warn(`[scenario] baris ${i + 1} gagal:`, err?.message || err)
      return { persona, ok: false, buf: null, bytes: 0, ms: Date.now() - t0 }
    }
  })

  const parts = results.map((r) => r.buf).filter((b): b is Buffer => b !== null)
  if (parts.length === 0) throw new Error('tidak ada baris yang berhasil disintesis')

  // MP3 adalah format stream: konkatenasi frame valid. Jeda dibuat dengan
  // menyisipkan MP3 senyap pendek agar tidak perlu ffmpeg.
  const silence = parts.length > 1 ? await space.silence(TURN_GAP_MS) : null
  const merged: Buffer[] = []
  parts.forEach((p, idx) => {
    merged.push(p)
    if (silence && idx < parts.length - 1) merged.push(silence)
  })

  const audio = Buffer.concat(merged)
  return {
    audio,
    contentType: 'audio/mpeg',
    turns: turns.length,
    bytes: audio.length,
    elapsedMs: Date.now() - started,
    perTurn: results.map((r, i) => ({ index: i, persona: r.persona, ok: r.ok, bytes: r.bytes, ms: r.ms })),
  }
}
