/**
 * Klien HuggingFace Space Edge-TTS (Gradio).
 *
 * Space: https://huggingface.co/spaces/innoai/Edge-TTS-Text-to-Speech
 *
 * Kenapa lewat Space, bukan memanggil Edge TTS langsung: endpoint WebSocket
 * Microsoft (api.msedgeservices.com) menolak handshake dengan HTTP 200 dari
 * semua lingkungan yang diuji, sehingga node-edge-tts tidak bisa dipakai.
 * Space ini bicara WebSocket ke Microsoft dari sisi HuggingFace dan
 * mengeksposnya sebagai HTTP biasa.
 *
 * Rate limit: 18/18 request sukses (10 sekuensial tanpa jeda + 8 paralel),
 * latensi 1.3–3.5s. Tidak ada 429 yang teramati.
 */

const DEFAULT_SPACE = 'https://innoai-edge-tts-text-to-speech.hf.space'
const CALL_PATH = '/gradio_api/call/tts_interface'

/** Label voice yang diterima Space ini; voiceId Edge sendiri tidak dikenali. */
export const VOICE_LABEL_BY_ID: Record<string, string> = {
  weiblich: 'de-DE-AmalaNeural - de-DE (Female)',
  'männlich-1': 'de-DE-ConradNeural - de-DE (Male)',
  'männlich-2': 'de-DE-KillianNeural - de-DE (Male)',
  'male-1': 'de-DE-ConradNeural - de-DE (Male)',
  'male-2': 'de-DE-KillianNeural - de-DE (Male)',
  'female-1': 'de-DE-KatjaNeural - de-DE (Female)',
  'female-2': 'de-DE-AmalaNeural - de-DE (Female)',
  'female-3': 'de-DE-SeraphinaMultilingualNeural - de-DE (Female)',
  'male-3': 'de-DE-FlorianMultilingualNeural - de-DE (Male)',
}

export class EdgeTtsSpace {
  private base: string

  constructor(spaceUrl = process.env.HF_EDGE_TTS_SPACE || DEFAULT_SPACE) {
    this.base = spaceUrl.replace(/\/+$/, '')
  }

  /**
   * Timeout default sengaja pendek (9s). Saat antrean Space macet, Gradio
   * menerima job lalu tidak pernah menyelesaikannya — menunggu lama hanya
   * memindahkan timeout ke fungsi serverless Vercel tanpa hasil. Gagal cepat
   * jauh lebih berguna karena pemanggil bisa langsung jatuh ke fallback.
   */
  async synthesize(text: string, voiceLabel: string, timeoutMs = 9_000): Promise<Buffer> {
    const clean = text.trim()
    if (!clean) throw new Error('text kosong')

    const call = await fetch(`${this.base}${CALL_PATH}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ data: [clean, voiceLabel, 1, 0, 0] }),
      signal: AbortSignal.timeout(timeoutMs),
    })
    if (!call.ok) throw new Error(`call gagal: HTTP ${call.status}`)

    const { event_id } = (await call.json()) as { event_id?: string }
    if (!event_id) throw new Error('event_id tidak ada')

    const sse = await (
      await fetch(`${this.base}${CALL_PATH}/${event_id}`, { signal: AbortSignal.timeout(timeoutMs) })
    ).text()

    const url = sse.match(/"url": "([^"]+)"/)?.[1]
    if (!url) throw new Error('URL audio tidak ada di respons SSE')

    const audioRes = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) })
    if (!audioRes.ok) throw new Error(`unduh audio gagal: HTTP ${audioRes.status}`)

    const buf = Buffer.from(await audioRes.arrayBuffer())
    if (buf.length < 512) throw new Error('audio kosong')
    return buf
  }

  /**
   * Apakah worker Space sehat?
   *
   * Gradio membalas `{"queue_size": N, "rank_eta": null}` saat worker-nya
   * macet: job diterima tapi tidak pernah diproses. Terdeteksi pada
   * innoai/Edge-TTS-Text-to-Speech (queue_size 6–8, rank_eta null, semua voice
   * timeout). Pemeriksaan ini murah (~1s) dan mencegah seluruh dialog gagal
   * setelah menunggu tiap baris timeout.
   */
  async isHealthy(timeoutMs = 4_000): Promise<boolean> {
    try {
      const res = await fetch(`${this.base}/gradio_api/queue/status`, {
        signal: AbortSignal.timeout(timeoutMs),
      })
      if (!res.ok) return false
      const body = (await res.json()) as { queue_size?: number; rank_eta?: number | null }
      const size = typeof body.queue_size === 'number' ? body.queue_size : 0
      const etaKnown = body.rank_eta !== null && body.rank_eta !== undefined
      // Antrean panjang tanpa ETA = worker macet, bukan sibuk.
      if (size > 3 && !etaKnown) return false
      return true
    } catch {
      return false
    }
  }

  /**
   * MP3 senyap untuk jeda antar baris.
   *
   * Tidak memakai ffmpeg: biner itu tidak tersedia di runtime Vercel secara
   * default, sehingga seluruh jeda hilang di produksi (terverifikasi — dengan
   * PATH tanpa ffmpeg, fungsi lama selalu mengembalikan null).
   *
   * Frame dibangun langsung dari bitstream MP3. Space mengeluarkan
   * MPEG-2 Layer III, 48 kbps, 24 kHz, mono, tanpa CRC:
   *   header ff f3 64 c4, frame 144 byte, 576 sampel = 24 ms per frame.
   * Sisa 140 byte (side info + main data) dinolkan → senyap sejati
   * (diverifikasi astats: peak/RMS = -inf dB) dan tetap ter-decode bersih
   * saat dikonkatenasi dengan frame suara.
   */
  private silenceCache = new Map<number, Buffer>()

  private static readonly SILENT_FRAME = Buffer.concat([
    Buffer.from([0xff, 0xf3, 0x64, 0xc4]),
    Buffer.alloc(140),
  ])

  private static readonly FRAME_MS = 24

  /** Jeda senyap sepanjang ~`ms`, dibulatkan ke kelipatan frame (24 ms). */
  silence(ms: number): Buffer {
    const frames = Math.max(1, Math.round(ms / EdgeTtsSpace.FRAME_MS))
    const cached = this.silenceCache.get(frames)
    if (cached) return cached

    const buf = Buffer.concat(Array.from({ length: frames }, () => EdgeTtsSpace.SILENT_FRAME))
    this.silenceCache.set(frames, buf)
    return buf
  }
}

export const edgeTtsSpace = new EdgeTtsSpace()
