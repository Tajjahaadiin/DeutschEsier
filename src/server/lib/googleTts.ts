/**
 * PROTOTIPE — jangan dipakai di produksi sebelum diuji.
 *
 * Sintesis TTS lewat Google Translate (HTTPS biasa, bukan WebSocket), jadi
 * tidak kena blokir Edge TTS yang membuat /api/tts gagal di Vercel.
 *
 * Gender: Google Translate TTS hanya punya satu suara per bahasa. Persona pria
 * dibedakan lewat pitch di klien (AudioContext playbackRate → formant ikut
 * bergeser). Tidak ada detune header WAV, tidak ada model, tidak ada cold start.
 */
import { getAllAudioBase64 } from '@sefinek/google-tts-api'

export interface PrototypeResult {
  audio: Buffer
  chunks: number
  bytes: number
}

export async function synthesizePrototype(text: string, lang = 'de'): Promise<PrototypeResult> {
  const clean = text.trim()
  if (!clean) throw new Error('text kosong')

  const parts = await getAllAudioBase64(clean, { lang })
  const buffers = parts.map((p) => Buffer.from(p.base64, 'base64'))
  const audio = Buffer.concat(buffers)

  if (audio.length < 512) throw new Error('audio kosong dari upstream')

  return { audio, chunks: buffers.length, bytes: audio.length }
}
