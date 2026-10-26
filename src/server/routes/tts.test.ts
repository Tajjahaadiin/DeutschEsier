import { describe, it, expect, vi, beforeEach } from 'vitest'

const ttsPromiseMock = vi.fn()
vi.mock('node-edge-tts', () => ({
  EdgeTTS: vi.fn().mockImplementation(function (this: any, opts: any) {
    this.opts = opts
    this.ttsPromise = ttsPromiseMock
  }),
}))
vi.mock('fs', () => ({
  promises: {
    readFile: vi.fn(),
    unlink: vi.fn().mockResolvedValue(undefined),
  },
}))

const { promises: fsMock } = await import('fs')
const { EdgeTTS } = await import('node-edge-tts')
const { default: app } = await import('../app')

/** MP3 valid minimal: frame sync 0xFF 0xEx + payload cukup panjang. */
function fakeMp3(size = 4096): Buffer {
  const buf = Buffer.alloc(size)
  buf[0] = 0xff
  buf[1] = 0xfb
  return buf
}

describe('GET /api/tts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(fsMock.readFile as any).mockResolvedValue(fakeMp3())
  })

  it('menolak bila text kosong (400)', async () => {
    const res = await app.request('/api/tts')
    expect(res.status).toBe(400)
    expect(((await res.json()) as any).error).toContain('Text parameter is required')
  })

  it('menolak teks yang melebihi batas 1000 karakter (400)', async () => {
    const res = await app.request(`/api/tts?text=${encodeURIComponent('a'.repeat(1001))}`)
    expect(res.status).toBe(400)
    expect(((await res.json()) as any).error).toContain('exceeds maximum allowed length')
  })

  it('männlich-1 memakai de-DE-ConradNeural dan mengembalikan audio/mpeg', async () => {
    const res = await app.request('/api/tts?text=Hallo&persona=m%C3%A4nnlich-1')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('audio/mpeg')
    expect(res.headers.get('x-tts-voice')).toBe('de-DE-ConradNeural')
    expect((EdgeTTS as any).mock.calls[0][0].voice).toBe('de-DE-ConradNeural')
  })

  it('REGRESI: männlich-2 memakai de-DE-KillianNeural — suara pria, bukan fallback', async () => {
    const res = await app.request('/api/tts?text=Hallo&persona=m%C3%A4nnlich-2')
    expect(res.status).toBe(200)
    expect(res.headers.get('x-tts-voice')).toBe('de-DE-KillianNeural')
    // Suara pria tidak boleh pernah dijawab dengan suara Google (tanpa header voice)
    expect(res.headers.get('x-tts-voice')).not.toBe('de-DE-KatjaNeural')
  })

  it('persona wanita memakai de-DE-KatjaNeural', async () => {
    const res = await app.request('/api/tts?text=Hallo&persona=female-1')
    expect(res.status).toBe(200)
    expect(res.headers.get('x-tts-voice')).toBe('de-DE-KatjaNeural')
  })

  it('fallback gender=male memakai Conrad tanpa persona', async () => {
    const res = await app.request('/api/tts?text=Hallo&gender=male')
    expect(res.headers.get('x-tts-voice')).toBe('de-DE-ConradNeural')
  })

  it('mengembalikan 502 bila Edge TTS melempar error (klien pakai Web Speech)', async () => {
    ttsPromiseMock.mockRejectedValueOnce(new Error('Unexpected server response: 403'))
    const res = await app.request('/api/tts?text=Hallo&persona=m%C3%A4nnlich-1')
    expect(res.status).toBe(502)
    // Tidak ada audio bergender salah yang dikirim
    expect(res.headers.get('content-type')).toContain('application/json')
  })

  it('mengembalikan 502 bila Edge TTS menulis file 0 byte', async () => {
    ;(fsMock.readFile as any).mockResolvedValue(Buffer.alloc(0))
    const res = await app.request('/api/tts?text=Hallo&persona=m%C3%A4nnlich-1')
    expect(res.status).toBe(502)
    expect(((await res.json()) as any).error).toBe('tts_unavailable')
    expect(res.headers.get('x-tts-error')).toBe('upstream_failed')
  })
})
