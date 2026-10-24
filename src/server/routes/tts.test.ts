import { describe, it, expect, vi, beforeEach } from 'vitest'

const ttsPromiseMock = vi.fn().mockImplementation(async (_text, filePath) => {
  const fs = await import('fs/promises')
  await fs.writeFile(filePath, Buffer.from('dummy-mp3-binary-data'))
})

let lastConfig: any = null

vi.mock('node-edge-tts', () => {
  return {
    EdgeTTS: class {
      constructor(config: any) {
        lastConfig = config
      }
      ttsPromise = ttsPromiseMock
    },
  }
})

const { default: app } = await import('../app')

beforeEach(() => {
  ttsPromiseMock.mockClear()
  lastConfig = null
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
    expect(lastConfig?.voice).toBe('de-DE-KatjaNeural')
    expect(ttsPromiseMock).toHaveBeenCalled()
  })

  it('menerima parameter ?persona=male-2 dan memetakan ke de-DE-KillianNeural', async () => {
    const res = await app.request('/api/tts?text=Hallo&persona=male-2')
    expect(res.status).toBe(200)
    expect(lastConfig?.voice).toBe('de-DE-KillianNeural')
  })

  it('menerima parameter ?voice=de-DE-AmalaNeural secara langsung', async () => {
    const res = await app.request('/api/tts?text=Hallo&voice=de-DE-AmalaNeural')
    expect(res.status).toBe(200)
    expect(lastConfig?.voice).toBe('de-DE-AmalaNeural')
  })

  it('mendukung fallback gender lama ?gender=male', async () => {
    const res = await app.request('/api/tts?text=Hallo&gender=male')
    expect(res.status).toBe(200)
    expect(lastConfig?.voice).toBe('de-DE-ConradNeural')
  })

  it('menolak teks yang melebihi batas 1000 karakter (400)', async () => {
    const longText = 'a'.repeat(1001)
    const res = await app.request(`/api/tts?text=${encodeURIComponent(longText)}`)
    expect(res.status).toBe(400)
    expect(((await res.json()) as any).error).toContain('exceeds maximum allowed length')
    expect(ttsPromiseMock).not.toHaveBeenCalled()
  })
})
