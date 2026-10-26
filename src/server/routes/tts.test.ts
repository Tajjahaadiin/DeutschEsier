import { describe, it, expect, vi } from 'vitest'
import * as kokoroHf from '../lib/kokoroHf'
import { wrapPcmInWav } from '../lib/wavHeader'

const { default: app } = await import('../app')

describe('GET /api/tts', () => {
  it('menolak bila text kosong (400)', async () => {
    const res = await app.request('/api/tts')
    expect(res.status).toBe(400)
    expect(((await res.json()) as any).error).toContain('Text parameter is required')
  })

  it('mengalirkan audio/wav dari Kokoro Martin Space untuk persona pria (männlich-1 bariton vs männlich-2 asli murni)', async () => {
    const dummyWav = wrapPcmInWav(Buffer.alloc(48000), 24000, 1, 16)
    vi.spyOn(kokoroHf, 'synthesizeKokoroMartin').mockResolvedValue(dummyWav)

    try {
      // 1. Uji männlich-1 (detune -2.0 semitone -> sample rate turun ke 21382 Hz)
      const res1 = await app.request('/api/tts?text=Hallo&persona=m%C3%A4nnlich-1')
      expect(res1.status).toBe(200)
      expect(res1.headers.get('content-type')).toBe('audio/wav')
      const buf1 = Buffer.from(await res1.arrayBuffer())
      expect(buf1.readUInt32LE(24)).toBe(21382)

      // 2. Uji männlich-2 (suara asli murni -> sample rate tetap 24000 Hz)
      const res2 = await app.request('/api/tts?text=Hallo&persona=m%C3%A4nnlich-2')
      expect(res2.status).toBe(200)
      expect(res2.headers.get('content-type')).toBe('audio/wav')
      const buf2 = Buffer.from(await res2.arrayBuffer())
      expect(buf2.readUInt32LE(24)).toBe(24000)
    } finally {
      vi.restoreAllMocks()
    }
  })

  it('mengalirkan audio/mpeg dari Google TTS untuk persona wanita', async () => {
    const origFetch = globalThis.fetch
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(Buffer.from('mp3-stream-data').buffer),
    } as any)

    try {
      const res = await app.request('/api/tts?text=Hallo&persona=weiblich')
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toBe('audio/mpeg')
    } finally {
      globalThis.fetch = origFetch
    }
  })

  it('menolak teks yang melebihi batas 1000 karakter (400)', async () => {
    const longText = 'a'.repeat(1001)
    const res = await app.request(`/api/tts?text=${encodeURIComponent(longText)}`)
    expect(res.status).toBe(400)
    expect(((await res.json()) as any).error).toContain('exceeds maximum allowed length')
  })

  it('mengembalikan status 502 bila upstream audio gagal', async () => {
    const origFetch = globalThis.fetch
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as any)

    try {
      const res = await app.request('/api/tts?text=Hallo&persona=weiblich')
      expect(res.status).toBe(502)
    } finally {
      globalThis.fetch = origFetch
    }
  })
})
