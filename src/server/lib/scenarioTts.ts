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
  /**
   * Milidetik mulai tiap baris di dalam `audio`, sejajar dengan `turns`.
   * Baris yang gagal disintesis tidak punya entri — pakai `perTurn[i].ok`
   * untuk memetakan index baris ke index timings.
   */
  timings: number[]
}

/** Jeda antar baris. Dipakai juga oleh klien untuk scroll sinkron. */
export const TURN_GAP_MS = 450

/**
 * Bitrate MP3 dari Space Edge-TTS (48 kbps CBR, 24 kHz mono). Konstan, jadi
 * durasi bisa dihitung dari ukuran byte tanpa mendekode audio.
 */
const MP3_KBPS = 48

/** Durasi blok MP3 dalam milidetik. */
function mp3DurationMs(bytes: number): number {
  return Math.round((bytes * 8) / MP3_KBPS)
}

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
  //
  // Timings dihitung dari ukuran byte tiap blok (bitrate CBR), bukan dari
  // proporsi panjang teks: kalimat pendek seperti "Ja." hanya 3 karakter tapi
  // butuh ~1.9s, sementara kalimat 107 karakter butuh ~6.3s. Estimasi
  // proporsional karakter melenceng makin jauh di baris-baris akhir.
  const silence = parts.length > 1 ? await space.silence(TURN_GAP_MS) : null
  const gapMs = silence ? mp3DurationMs(silence.length) : 0

  const merged: Buffer[] = []
  const timings: number[] = []
  let cursorMs = 0
  let emitted = 0

  results.forEach((r) => {
    if (!r.buf) return
    timings.push(cursorMs)
    merged.push(r.buf)
    cursorMs += mp3DurationMs(r.buf.length)
    emitted++
    if (silence && emitted < parts.length) {
      merged.push(silence)
      cursorMs += gapMs
    }
  })

  const audio = Buffer.concat(merged)
  return {
    audio,
    contentType: 'audio/mpeg',
    turns: turns.length,
    bytes: audio.length,
    elapsedMs: Date.now() - started,
    perTurn: results.map((r, i) => ({ index: i, persona: r.persona, ok: r.ok, bytes: r.bytes, ms: r.ms })),
    timings,
  }
}
