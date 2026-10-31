/**
 * Rantai sintesis satu baris — satu-satunya tempat urutan engine hidup.
 *
 * Sebelumnya urutan "coba A lalu B lalu C" ditulis dua kali: inline di
 * `routes/tts.ts` dan lagi di dalam `scenarioTts.ts`. Menambah lapisan berarti
 * menyunting dua tempat, dan itulah pola yang dulu membuat satu jalur
 * tertinggal (persona pria berakhir jadi suara wanita).
 *
 * Urutan sengaja:
 *   1. edge-tts   — langsung ke Microsoft, 1–2s, suara pria asli. Prioritas.
 *   2. hf-space   — cadangan bila WebSocket ditolak (handshake 200/403).
 *   3. google     — jaring terakhir: tetap bersuara, timbre bergeser.
 *
 * Setiap kegagalan dicatat dengan nama engine agar `X-TTS-Engine` bisa
 * menunjukkan siapa yang benar-benar menjawab.
 */
import { synthesizeEdgeDirect, EDGE_VOICE_BY_PERSONA } from './edgeTtsDirect'
import { edgeTtsSpace, VOICE_LABEL_BY_ID } from './hfEdgeTts'
import { synthesizeGoogleTts } from './googleTtsFallback'

export type TtsEngine = 'edge-tts' | 'hf-space' | 'google-fallback'

export interface LineAudio {
  audio: Buffer
  engine: TtsEngine
}

const MIN_AUDIO_BYTES = 512

/** Space Gradio butuh label panjang; Edge direct butuh voiceId pendek. */
function hfLabel(voiceId: string): string {
  const found = Object.entries(EDGE_VOICE_BY_PERSONA).find(([, v]) => v === voiceId)
  if (found) return VOICE_LABEL_BY_ID[found[0]] ?? `${voiceId} - de-DE (Male)`
  return `${voiceId} - de-DE (Male)`
}

/**
 * Sintesis satu baris lewat rantai engine.
 *
 * @param text    teks yang diucapkan
 * @param voiceId voiceId Edge, mis. `de-DE-ConradNeural`
 */
export async function synthesizeLine(text: string, voiceId: string): Promise<LineAudio> {
  const clean = text.trim()
  if (!clean) throw new Error('text kosong')

  // 1. Edge-TTS langsung (prioritas).
  try {
    const audio = await synthesizeEdgeDirect(clean, voiceId)
    return { audio, engine: 'edge-tts' }
  } catch (err: any) {
    console.warn('[tts] edge-tts langsung gagal:', err?.message || err)
  }

  // 2. HF Space.
  try {
    const audio = await edgeTtsSpace.synthesize(clean, hfLabel(voiceId))
    if (audio.length >= MIN_AUDIO_BYTES) return { audio, engine: 'hf-space' }
  } catch (err: any) {
    console.warn('[tts] HF Space gagal:', err?.message || err)
  }

  // 3. Google (jaring terakhir).
  const audio = await synthesizeGoogleTts(clean)
  return { audio, engine: 'google-fallback' }
}

/**
 * Kebijakan cache per engine.
 *
 * Hasil engine utama stabil, jadi boleh `immutable`. Hasil cadangan harus
 * di-revalidasi: begitu edge-tts pulih, kita ingin siswa langsung mendapat
 * suara pria asli, bukan menunggu cache setahun.
 *
 * ETag di route ikut memuat nama engine, sehingga audio cadangan tidak pernah
 * menyamar sebagai audio utama.
 */
export function cacheHeadersFor(engine: TtsEngine): Record<string, string> {
  if (engine === 'edge-tts') {
    return {
      'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      'CDN-Cache-Control': 'public, s-maxage=31536000',
      'Vercel-CDN-Cache-Control': 'public, s-maxage=31536000',
    }
  }
  // Cadangan: simpan tapi selalu tanya ulang (304 murah bila ETag cocok).
  return {
    'Cache-Control': 'public, max-age=0, must-revalidate',
    'CDN-Cache-Control': 'public, s-maxage=0, must-revalidate',
    'Vercel-CDN-Cache-Control': 'public, s-maxage=0, must-revalidate',
  }
}
