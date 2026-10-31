import { describe, it, expect, vi, beforeEach } from 'vitest'

const synthesizeMock = vi.fn()
const googleMock = vi.fn()
const directMock = vi.fn()

vi.mock('../lib/googleTtsFallback', () => ({
  synthesizeGoogleTts: googleMock,
}))

vi.mock('../lib/edgeTtsDirect', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/edgeTtsDirect')>()
  return { ...actual, synthesizeEdgeDirect: directMock }
})

vi.mock('../lib/hfEdgeTts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/hfEdgeTts')>()
  return {
    ...actual,
    edgeTtsSpace: { synthesize: synthesizeMock },
  }
})

const { default: app } = await import('../app')
const { __clearTtsCache } = await import('../lib/ttsChain')

function fakeMp3(size = 4096): Buffer {
  const buf = Buffer.alloc(size)
  buf[0] = 0xff
  buf[1] = 0xfb
  return buf
}

/** voiceId yang diterima edge-tts langsung, mis. "de-DE-ConradNeural". */
function voiceCalled(): string {
  return directMock.mock.calls.at(-1)?.[1] as string
}

describe('GET /api/tts', () => {
  beforeEach(() => {
    // Cache memori bersifat module-level; tanpa reset, hasil satu kasus uji
    // bocor ke kasus berikutnya dan tiruan tidak pernah dipanggil.
    __clearTtsCache()
    synthesizeMock.mockReset()
    synthesizeMock.mockResolvedValue(fakeMp3())
    googleMock.mockReset()
    googleMock.mockResolvedValue(fakeMp3(2048))
    // Default: edge-tts langsung sehat (prioritas pertama).
    directMock.mockReset()
    directMock.mockResolvedValue(fakeMp3(8192))
  })

  it('menolak bila text kosong (400)', async () => {
    const res = await app.request('/api/tts')
    expect(res.status).toBe(400)
    expect(((await res.json()) as any).error).toContain('Text parameter is required')
  })

  it('menolak teks melebihi 1000 karakter (400)', async () => {
    const res = await app.request(`/api/tts?text=${encodeURIComponent('a'.repeat(1001))}`)
    expect(res.status).toBe(400)
    expect(((await res.json()) as any).error).toContain('exceeds maximum allowed length')
  })

  it('männlich-1 memakai Conrad (pria) dan mengembalikan audio/mpeg', async () => {
    const res = await app.request('/api/tts?text=Hallo&persona=m%C3%A4nnlich-1')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('audio/mpeg')
    expect(voiceCalled()).toBe('de-DE-ConradNeural')
    expect(res.headers.get('x-tts-engine')).toBe('edge-tts')
    expect(res.headers.get('x-tts-gender')).toBe('male')
  })

  it('REGRESI: männlich-2 memakai Killian, tidak pernah jatuh ke suara wanita', async () => {
    const res = await app.request('/api/tts?text=Hallo&persona=m%C3%A4nnlich-2')
    expect(res.status).toBe(200)
    expect(voiceCalled()).toBe('de-DE-KillianNeural')
    expect(res.headers.get('x-tts-gender')).toBe('male')
  })

  it('persona wanita memakai Amala', async () => {
    const res = await app.request('/api/tts?text=Hallo&persona=weiblich')
    expect(res.status).toBe(200)
    expect(voiceCalled()).toBe('de-DE-AmalaNeural')
    expect(res.headers.get('x-tts-gender')).toBe('female')
  })

  it('fallback gender=male memakai Conrad tanpa persona', async () => {
    await app.request('/api/tts?text=Hallo&gender=male')
    expect(voiceCalled()).toContain('de-DE-ConradNeural')
  })

  it('menyertakan ETag dan menjawab 304 bila sama', async () => {
    const first = await app.request('/api/tts?text=Hallo&persona=weiblich')
    const etag = first.headers.get('etag')
    expect(etag).toBeTruthy()

    directMock.mockClear()
    synthesizeMock.mockClear()
    const second = await app.request('/api/tts?text=Hallo&persona=weiblich', {
      headers: { 'if-none-match': etag! },
    })
    expect(second.status).toBe(304)
    // 304 tidak boleh memanggil upstream lagi
    expect(directMock).not.toHaveBeenCalled()
    expect(synthesizeMock).not.toHaveBeenCalled()
  })

  it('FALLBACK: edge gagal → HF Space menjawab (lapis 2)', async () => {
    directMock.mockRejectedValue(new Error('handshake 200'))
    const res = await app.request('/api/tts?text=Hallo&persona=m%C3%A4nnlich-1')
    expect(res.status).toBe(200)
    expect(res.headers.get('x-tts-engine')).toBe('hf-space')
    expect(synthesizeMock).toHaveBeenCalledTimes(1)
    // Space memakai label panjang, bukan voiceId pendek
    expect(synthesizeMock.mock.calls[0][1]).toContain('de-DE-ConradNeural')
    expect(synthesizeMock.mock.calls[0][1]).toContain('(Male)')
  })

  it('FALLBACK: edge + HF gagal → Google TTS (lapis 3)', async () => {
    directMock.mockRejectedValue(new Error('handshake 200'))
    synthesizeMock.mockRejectedValue(new Error('space down'))
    const res = await app.request('/api/tts?text=Hallo&persona=m%C3%A4nnlich-1')
    expect(res.status).toBe(200)
    expect(res.headers.get('x-tts-engine')).toBe('google-fallback')
    expect(googleMock).toHaveBeenCalledTimes(1)
  })

  it('CACHE: hasil edge immutable, hasil cadangan must-revalidate', async () => {
    const ok = await app.request('/api/tts?text=Hallo&persona=weiblich')
    expect(ok.headers.get('cache-control')).toContain('immutable')

    directMock.mockRejectedValue(new Error('handshake 200'))
    const fb = await app.request('/api/tts?text=Anders&persona=weiblich')
    expect(fb.headers.get('x-tts-engine')).toBe('hf-space')
    expect(fb.headers.get('cache-control')).toContain('must-revalidate')
  })

  it('CACHE: ETag memuat engine, jadi audio cadangan tidak menyamar sebagai utama', async () => {
    const primary = await app.request('/api/tts?text=Hallo&persona=weiblich')
    const primaryEtag = primary.headers.get('etag')
    expect(primary.headers.get('x-tts-engine')).toBe('edge-tts')

    // Teks berbeda agar cache memori tidak menutupi perilaku ETag.
    directMock.mockRejectedValue(new Error('handshake 200'))
    const fallback = await app.request('/api/tts?text=Guten%20Tag&persona=weiblich')
    expect(fallback.headers.get('x-tts-engine')).toBe('hf-space')

    // ETag kedua jelas berbeda; yang penting, engine utama tidak bisa
    // direvalidasi memakai ETag hasil cadangan.
    expect(fallback.headers.get('etag')).not.toBe(primaryEtag)
  })

  it('CACHE: 502 tidak pernah disimpan CDN', async () => {
    directMock.mockRejectedValue(new Error('down'))
    synthesizeMock.mockRejectedValue(new Error('down'))
    googleMock.mockRejectedValue(new Error('down'))
    const res = await app.request('/api/tts?text=Hallo&persona=weiblich')
    expect(res.status).toBe(502)
    expect(res.headers.get('cache-control')).toBe('no-store')
  })

  it('mengembalikan 502 hanya bila ketiga engine gagal', async () => {
    directMock.mockRejectedValue(new Error('edge down'))
    synthesizeMock.mockRejectedValue(new Error('space down'))
    googleMock.mockRejectedValue(new Error('google down'))
    const res = await app.request('/api/tts?text=Hallo&persona=m%C3%A4nnlich-1')
    expect(res.status).toBe(502)
    expect(res.headers.get('content-type')).toContain('application/json')
    expect(res.headers.get('x-tts-error')).toBe('upstream_failed')
  })
})
