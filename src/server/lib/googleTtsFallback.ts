/**
 * Fallback TTS saat HF Edge-TTS tidak tersedia.
 *
 * Memakai Google Translate TTS lewat @sefinek/google-tts-api (HTTPS biasa).
 * Sudah terbukti hidup saat Edge-TTS Space macet maupun saat endpoint
 * WebSocket Microsoft menolak handshake.
 *
 * Konsekuensi yang diterima: Google hanya punya SATU suara per bahasa, jadi
 * persona pria tidak lagi memakai Conrad/Killian. Perbedaan timbre dilakukan
 * di klien lewat pitch/formant (sudah ada di audio.ts). Ini kompromi yang
 * disengaja: audio bergender kurang tepat lebih baik daripada tidak ada audio.
 */
import { createHash } from 'node:crypto'
import { getAllAudioBase64 } from '@sefinek/google-tts-api'

// Cache ber-TTL: tanpa batas waktu, teks yang sudah tidak dipakai skenario
// mana pun akan menetap sampai instance fungsi didaur ulang.
const CACHE_TTL_MS = 60 * 60 * 1000
const cache = new Map<string, { audio: Buffer; at: number }>()
const MAX_CACHE = 200

/**
 * Sintesis via Google Translate TTS.
 * @param text teks yang diucapkan
 * @param lang kode bahasa (default de)
 */
export async function synthesizeGoogleTts(text: string, lang = 'de'): Promise<Buffer> {
  const clean = text.trim()
  if (!clean) throw new Error('text kosong')

  const key = createHash('sha1').update(`${lang}|${clean}`).digest('hex')
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.audio
  if (hit) cache.delete(key)

  const parts = await getAllAudioBase64(clean, { lang })
  const audio = Buffer.concat(parts.map((p) => Buffer.from(p.base64, 'base64')))

  // Guard: Google sesekali mengembalikan potongan kosong tanpa melempar error.
  if (audio.length < 512) throw new Error('audio kosong dari Google TTS')

  if (cache.size >= MAX_CACHE) {
    const oldest = cache.keys().next().value
    if (oldest) cache.delete(oldest)
  }
  cache.set(key, { audio, at: Date.now() })
  return audio
}
