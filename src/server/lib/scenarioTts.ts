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
import { synthesizeGoogleTts } from './googleTtsFallback'

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
  /** Mesin yang benar-benar dipakai: 'hf-edge-tts' atau 'google-fallback'. */
  engine: 'hf-edge-tts' | 'google-fallback'
  /** Per-baris hasil, untuk diagnostik. */
  perTurn: Array<{ index: number; persona: string; ok: boolean; bytes: number; ms: number }>
  /**
   * Milidetik mulai tiap baris di dalam `audio`, SEJAJAR dengan `turns`
   * (indeks sama). Baris yang gagal disintesis bernilai -1.
   *
   * Dulu array ini dipadatkan (hanya baris sukses), sehingga klien yang
   * memakai indeksnya langsung sebagai indeks dialog akan menyorot baris yang
   * salah setelah ada satu baris gagal. Sekarang panjangnya selalu sama dengan
   * `turns` agar tidak ada pemetaan ulang di klien.
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

  // Cek kesehatan Space sekali di depan. Saat worker-nya macet, setiap baris
  // akan menggantung sampai timeout; mengetahuinya lebih awal membuat seluruh
  // skenario langsung dialihkan ke fallback tanpa membuang waktu.
  const spaceUsable = await space.isHealthy()
  if (!spaceUsable) {
    console.warn('[scenario] HF Space tidak sehat (antrean macet) → pakai fallback Google TTS')
  }

  // Sintesis paralel terbatas; hasil dikumpulkan per-index agar urutan tetap.
  const results = await mapLimit(turns, CONCURRENCY, async (turn, i) => {
    const persona = turn.personaId ?? (i % 2 === 0 ? 'weiblich' : 'männlich-1')
    const voice = VOICE_LABEL_BY_ID[persona] ?? VOICE_LABEL_BY_ID['weiblich']
    const t0 = Date.now()

    if (spaceUsable) {
      try {
        const buf = await space.synthesize(turn.germanText, voice)
        const ok = buf.length > 512
        if (ok) return { persona, ok, buf, bytes: buf.length, ms: Date.now() - t0, engine: 'hf-edge-tts' as const }
      } catch (err: any) {
        console.warn(`[scenario] baris ${i + 1} gagal di HF, coba fallback:`, err?.message || err)
      }
    }

    // Fallback: tetap menghasilkan audio, walau timbre pria bergantung pada
    // pitch di klien. Lebih baik daripada satu baris hilang dari dialog.
    try {
      const buf = await synthesizeGoogleTts(turn.germanText)
      return { persona, ok: true, buf, bytes: buf.length, ms: Date.now() - t0, engine: 'google-fallback' as const }
    } catch (err: any) {
      console.warn(`[scenario] baris ${i + 1} gagal total:`, err?.message || err)
      return { persona, ok: false, buf: null, bytes: 0, ms: Date.now() - t0, engine: 'google-fallback' as const }
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
  // Silence() kini sinkron (frame MP3 dibangun sendiri), jadi tidak ada
  // ketergantungan pada ffmpeg yang tidak tersedia di Vercel.
  const silence = parts.length > 1 ? space.silence(TURN_GAP_MS) : null
  const gapMs = silence ? mp3DurationMs(silence.length) : 0

  const merged: Buffer[] = []
  // Sejajar `turns`: -1 menandai baris yang gagal.
  const timings: number[] = results.map(() => -1)
  let cursorMs = 0
  let emitted = 0

  results.forEach((r, i) => {
    if (!r.buf) return
    timings[i] = cursorMs
    merged.push(r.buf)
    cursorMs += mp3DurationMs(r.buf.length)
    emitted++
    if (silence && emitted < parts.length) {
      merged.push(silence)
      cursorMs += gapMs
    }
  })

  const audio = Buffer.concat(merged)
  const usedFallback = results.some((r) => r.ok && r.engine === 'google-fallback')
  return {
    audio,
    contentType: 'audio/mpeg',
    engine: usedFallback ? 'google-fallback' : 'hf-edge-tts',
    turns: turns.length,
    bytes: audio.length,
    elapsedMs: Date.now() - started,
    perTurn: results.map((r, i) => ({ index: i, persona: r.persona, ok: r.ok, bytes: r.bytes, ms: r.ms })),
    timings,
  }
}
