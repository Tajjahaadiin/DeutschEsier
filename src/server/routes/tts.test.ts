import { describe, it, expect, vi, beforeEach } from 'vitest'

const synthesizeMock = vi.fn().mockImplementation(async (text: string, personaOrVoice?: string) => {
  return Buffer.from(`RIFF...WAVE...fake-audio-for-${personaOrVoice || 'default'}-${text}`)
})

let lastRequestedVoice: string | undefined = undefined

vi.mock('../lib/geminiTts', () => {
  return {
    synthesizeGeminiSpeech: (text: string, personaOrVoice?: string) => {
      lastRequestedVoice = personaOrVoice
      return synthesizeMock(text, personaOrVoice)
    },
  }
})

const { default: app } = await import('../app')

beforeEach(() => {
  synthesizeMock.mockClear()
  lastRequestedVoice = undefined
})

describe('GET /api/tts', () => {
  it('menolak bila text kosong (400)', async () => {
    const res = await app.request('/api/tts')
    expect(res.status).toBe(400)
    expect(((await res.json()) as any).error).toContain('Text parameter is required')
  })

  it('mengembalikan audio/wav dan memanggil synthesizeGeminiSpeech', async () => {
    const res = await app.request('/api/tts?text=Hallo')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('audio/wav')
    expect(res.headers.get('cache-control')).toContain('immutable')
    expect(synthesizeMock).toHaveBeenCalledWith('Hallo', undefined)
  })

  it('menerima parameter ?persona=male-2', async () => {
    const res = await app.request('/api/tts?text=Hallo&persona=male-2')
    expect(res.status).toBe(200)
    expect(lastRequestedVoice).toBe('male-2')
  })

  it('menerima parameter ?voice=de-DE-AmalaNeural secara langsung', async () => {
    const res = await app.request('/api/tts?text=Hallo&voice=de-DE-AmalaNeural')
    expect(res.status).toBe(200)
    expect(lastRequestedVoice).toBe('de-DE-AmalaNeural')
  })

  it('mendukung parameter gender ?gender=male', async () => {
    const res = await app.request('/api/tts?text=Hallo&gender=male')
    expect(res.status).toBe(200)
    expect(lastRequestedVoice).toBe('male')
  })

  it('menolak teks yang melebihi batas 1000 karakter (400)', async () => {
    const longText = 'a'.repeat(1001)
    const res = await app.request(`/api/tts?text=${encodeURIComponent(longText)}`)
    expect(res.status).toBe(400)
    expect(((await res.json()) as any).error).toContain('exceeds maximum allowed length')
    expect(synthesizeMock).not.toHaveBeenCalled()
  })

  it('melakukan fallback ke Google HTTP TTS bila Gemini mengalami error', async () => {
    synthesizeMock.mockRejectedValueOnce(new Error('Gemini API quota exceeded'))

    const origFetch = globalThis.fetch
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(Buffer.from('google-mp3-fallback').buffer),
    } as any)

    try {
      const res = await app.request('/api/tts?text=Hallo')
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toBe('audio/mpeg')
    } finally {
      globalThis.fetch = origFetch
    }
  })
})
