/**
 * Adapter Edge-TTS langsung ke Microsoft (node-edge-tts 1.2.12).
 *
 * Kenapa ini prioritas pertama: latensi 1–2s dan suara pria asli
 * (Conrad/Killian) tanpa perantara. HF Space tetap ada sebagai lapis kedua
 * karena ia bisa macet (antrean Gradio menggantung), dan Google sebagai lapis
 * terakhir supaya dialog tidak pernah bisu.
 *
 * v1.2.12 penting: 1.2.11 dan sebelumnya mengirim token `Sec-MS-GEC` v1 yang
 * ditolak Microsoft (handshake dijawab HTTP 200, bukan upgrade). Upstream
 * Python memperbaikinya di 7.3.1 (`Sec-MS-GEC-Version: 2-<chromium>`), dan
 * versi ini adalah port-nya ke JS. Jangan turunkan versi.
 */
import { EdgeTTS } from 'node-edge-tts'

/** Pemetaan voiceId Edge (bentuk yang diterima WebSocket Microsoft). */
export const EDGE_VOICE_BY_PERSONA: Record<string, string> = {
  weiblich: 'de-DE-AmalaNeural',
  'männlich-1': 'de-DE-ConradNeural',
  'männlich-2': 'de-DE-KillianNeural',
  'male-1': 'de-DE-ConradNeural',
  'male-2': 'de-DE-KillianNeural',
  'female-1': 'de-DE-KatjaNeural',
}

export interface EdgeDirectOptions {
  timeoutMs?: number
}

/**
 * Sintesis satu kalimat lewat WebSocket Microsoft.
 *
 * Memakai `streamAudio()` dan BUKAN `ttsPromise()`: yang terakhir menulis file
 * ke disk lalu kita harus membacanya kembali dan menghapusnya. Streaming
 * mengembalikan Buffer tanpa menyentuh filesystem — penting di fungsi
 * serverless yang /tmp-nya dipakai bersama antar invocation.
 */
export async function synthesizeEdgeDirect(
  text: string,
  voiceId: string,
  { timeoutMs = 8_000 }: EdgeDirectOptions = {},
): Promise<Buffer> {
  const clean = text.trim()
  if (!clean) throw new Error('text kosong')

  const tts = new EdgeTTS({
    voice: voiceId,
    lang: 'de-DE',
    timeout: timeoutMs,
    // Rate/pitch dibiarkan default: persona sudah dibedakan oleh voice asli,
    // bukan dengan menggeser nada.
  })

  const chunks: Buffer[] = []
  for await (const chunk of tts.streamAudio(clean)) {
    // streamAudio juga memancarkan penanda batas kata (subLine); audio saja.
    if (Buffer.isBuffer(chunk)) chunks.push(chunk)
  }

  const audio = Buffer.concat(chunks)
  if (audio.length < 512) throw new Error(`audio terlalu pendek (${audio.length} byte)`)
  return audio
}
