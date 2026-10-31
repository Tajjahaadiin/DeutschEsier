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

const { synthesizeLine, cacheHeadersFor } = await import('../lib/ttsChain')

const TEXT = 'Guten Tag!'
const VOICE = 'de-DE-ConradNeural'

beforeEach(() => {
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
