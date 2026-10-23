import { describe, it, expect, vi, beforeEach } from 'vitest'

const setMetadataMock = vi.fn()
const closeMock = vi.fn()

vi.mock('msedge-tts', () => {
  return {
    OUTPUT_FORMAT: { AUDIO_24KHZ_48KBITRATE_MONO_MP3: 'mp3_24k' },
    MsEdgeTTS: class {
      setMetadata = setMetadataMock
      close = closeMock
      toStream = () => ({
        audioStream: (async function* () {
          yield Buffer.from('dummy-mp3-data')
        })(),
      })
    },
  }
})

const { default: app } = await import('../app')

beforeEach(() => {
  setMetadataMock.mockClear()
  closeMock.mockClear()
})

describe('GET /api/tts', () => {
  it('menolak bila text kosong (400)', async () => {
    const res = await app.request('/api/tts')
    expect(res.status).toBe(400)
    expect(((await res.json()) as any).error).toContain('Text parameter is required')
  })

  it('menggunakan voice default de-DE-KatjaNeural bila gender/voice tidak diberikan', async () => {
    const res = await app.request('/api/tts?text=Hallo')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('audio/mpeg')
    expect(setMetadataMock).toHaveBeenCalledWith('de-DE-KatjaNeural', 'mp3_24k')
  })

  it('menerima parameter ?persona=male-2 dan memetakan ke de-DE-KillianNeural', async () => {
    const res = await app.request('/api/tts?text=Hallo&persona=male-2')
    expect(res.status).toBe(200)
    expect(setMetadataMock).toHaveBeenCalledWith('de-DE-KillianNeural', 'mp3_24k')
  })

  it('menerima parameter ?voice=de-DE-AmalaNeural secara langsung', async () => {
    const res = await app.request('/api/tts?text=Hallo&voice=de-DE-AmalaNeural')
    expect(res.status).toBe(200)
    expect(setMetadataMock).toHaveBeenCalledWith('de-DE-AmalaNeural', 'mp3_24k')
  })

  it('mendukung fallback gender lama ?gender=male', async () => {
    const res = await app.request('/api/tts?text=Hallo&gender=male')
    expect(res.status).toBe(200)
    expect(setMetadataMock).toHaveBeenCalledWith('de-DE-ConradNeural', 'mp3_24k')
  })
})
