import { describe, it, expect, vi, beforeEach } from 'vitest'

const directMock = vi.fn()
const spaceMock = vi.fn()
const googleMock = vi.fn()

vi.mock('../lib/edgeTtsDirect', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/edgeTtsDirect')>()
  return { ...actual, synthesizeEdgeDirect: directMock }
})

vi.mock('../lib/hfEdgeTts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/hfEdgeTts')>()
  return {
    ...actual,
    edgeTtsSpace: {
      synthesize: spaceMock,
      silence: () => Buffer.alloc(64, 0),
      isHealthy: async () => true,
    },
  }
})

vi.mock('../lib/googleTtsFallback', () => ({
  synthesizeGoogleTts: googleMock,
}))

const { synthesizeLine, cacheHeadersFor, __clearTtsCache } = await import('../lib/ttsChain')

const TEXT = 'Guten Tag!'
const VOICE = 'de-DE-ConradNeural'

beforeEach(() => {
  __clearTtsCache()
  directMock.mockReset()
  spaceMock.mockReset()
  googleMock.mockReset()
  directMock.mockResolvedValue(Buffer.alloc(8192, 1))
  spaceMock.mockResolvedValue(Buffer.alloc(8192, 2))
  googleMock.mockResolvedValue(Buffer.alloc(2048, 3))
})

describe('synthesizeLine — urutan engine', () => {
  it('edge-tts dipakai lebih dulu dan engine lain tidak disentuh', async () => {
    const { engine, audio } = await synthesizeLine(TEXT, VOICE)
    expect(engine).toBe('edge-tts')
    expect(audio[0]).toBe(1)
    expect(spaceMock).not.toHaveBeenCalled()
    expect(googleMock).not.toHaveBeenCalled()
  })

  it('edge gagal → hf-space (lapis 2), google tidak disentuh', async () => {
    directMock.mockRejectedValue(new Error('handshake 200'))
    const { engine, audio } = await synthesizeLine(TEXT, VOICE)
    expect(engine).toBe('hf-space')
    expect(audio[0]).toBe(2)
    expect(googleMock).not.toHaveBeenCalled()
  })

  it('edge + hf-space gagal → google (lapis 3)', async () => {
    directMock.mockRejectedValue(new Error('handshake 200'))
    spaceMock.mockRejectedValue(new Error('queue stalled'))
    const { engine, audio } = await synthesizeLine(TEXT, VOICE)
    expect(engine).toBe('google-fallback')
    expect(audio[0]).toBe(3)
  })

  it('hf-space dianggap gagal bila audionya terlalu pendek', async () => {
    directMock.mockRejectedValue(new Error('handshake 200'))
    spaceMock.mockResolvedValue(Buffer.alloc(100, 2))
    const { engine } = await synthesizeLine(TEXT, VOICE)
    expect(engine).toBe('google-fallback')
  })

  it('melempar bila ketiga lapis gagal', async () => {
    directMock.mockRejectedValue(new Error('a'))
    spaceMock.mockRejectedValue(new Error('b'))
    googleMock.mockRejectedValue(new Error('c'))
    await expect(synthesizeLine(TEXT, VOICE)).rejects.toThrow('c')
  })

  it('teks kosong ditolak sebelum menyentuh jaringan', async () => {
    await expect(synthesizeLine('   ', VOICE)).rejects.toThrow(/kosong/)
    expect(directMock).not.toHaveBeenCalled()
  })

  it('Space menerima label panjang, bukan voiceId pendek', async () => {
    directMock.mockRejectedValue(new Error('x'))
    await synthesizeLine(TEXT, VOICE)
    const label = spaceMock.mock.calls[0][1] as string
    expect(label).toContain('de-DE-ConradNeural')
    expect(label).toContain('(Male)')
  })
})

describe('cacheHeadersFor — kebijakan cache per engine', () => {
  it('engine utama boleh immutable (audio stabil)', () => {
    const h = cacheHeadersFor('edge-tts')
    expect(h['Cache-Control']).toContain('immutable')
    expect(h['Cache-Control']).toContain('max-age=31536000')
  })

  it('hasil cadangan harus must-revalidate agar suara pria pulih otomatis', () => {
    for (const engine of ['hf-space', 'google-fallback'] as const) {
      const h = cacheHeadersFor(engine)
      expect(h['Cache-Control']).toContain('must-revalidate')
      expect(h['Cache-Control']).not.toContain('immutable')
    }
  })
})

describe('cache memori', () => {
  it('panggilan kedua untuk teks yang sama tidak menyentuh jaringan', async () => {
    const first = await synthesizeLine(TEXT, VOICE)
    expect(first.engine).toBe('edge-tts')
    expect(directMock).toHaveBeenCalledTimes(1)

    const t0 = Date.now()
    const second = await synthesizeLine(TEXT, VOICE)
    expect(Date.now() - t0).toBeLessThan(50)      // tidak ada round-trip jaringan
    expect(directMock).toHaveBeenCalledTimes(1)
    expect(second.audio).toEqual(first.audio)
    expect(second.engine).toBe(first.engine)
  })

  it('voiceId berbeda tidak berbagi cache (suara pria ≠ wanita)', async () => {
    await synthesizeLine(TEXT, 'de-DE-ConradNeural')
    await synthesizeLine(TEXT, 'de-DE-AmalaNeural')
    expect(directMock).toHaveBeenCalledTimes(2)
  })

  it('spasi di ujung teks dinormalkan sebelum jadi kunci', async () => {
    await synthesizeLine('Hallo', VOICE)
    await synthesizeLine('  Hallo  ', VOICE)
    expect(directMock).toHaveBeenCalledTimes(1)
  })

  it('KEGAGALAN tidak di-cache: percobaan berikutnya menyintesis lagi', async () => {
    directMock.mockRejectedValueOnce(new Error('handshake 200'))
    const fallback = await synthesizeLine(TEXT, VOICE)
    expect(fallback.engine).toBe('hf-space')

    // Panggilan berikutnya untuk teks LAIN harus mencoba edge lagi.
    directMock.mockClear()
    spaceMock.mockClear()
    const retry = await synthesizeLine('Anderer Satz.', VOICE)
    expect(directMock).toHaveBeenCalledTimes(1)
    expect(retry.engine).toBe('edge-tts')
  })

  it('engine yang di-cache ikut dilaporkan apa adanya', async () => {
    directMock.mockRejectedValue(new Error('handshake 200'))
    spaceMock.mockRejectedValue(new Error('queue stalled'))
    const g = await synthesizeLine(TEXT, VOICE)
    expect(g.engine).toBe('google-fallback')

    // Panggilan ulang mengembalikan engine yang sama tanpa memanggil jaringan.
    googleMock.mockClear()
    const again = await synthesizeLine(TEXT, VOICE)
    expect(again.engine).toBe('google-fallback')
    expect(googleMock).not.toHaveBeenCalled()
  })
})
