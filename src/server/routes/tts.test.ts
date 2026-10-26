import { describe, it, expect, vi } from 'vitest'
import { EdgeTTS } from 'node-edge-tts'

const { default: app } = await import('../app')

describe('GET /api/tts', () => {
  it('menolak bila text kosong (400)', async () => {
    const res = await app.request('/api/tts')
    expect(res.status).toBe(400)
    expect(((await res.json()) as any).error).toContain('Text parameter is required')
  })

  it('mengalirkan audio/mpeg dari EdgeTTS dan menetapkan header cache immutable', async () => {
    const res = await app.request('/api/tts?text=Hallo&persona=m%C3%A4nnlich-1')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('audio/mpeg')
    expect(res.headers.get('cache-control')).toContain('immutable')
    expect(res.headers.get('cdn-cache-control')).toContain('31536000')
  })

  it('menolak teks yang melebihi batas 1000 karakter (400)', async () => {
    const longText = 'a'.repeat(1001)
    const res = await app.request(`/api/tts?text=${encodeURIComponent(longText)}`)
    expect(res.status).toBe(400)
    expect(((await res.json()) as any).error).toContain('exceeds maximum allowed length')
  })

  it('mengembalikan status 502 bila kedua upstream (EdgeTTS dan Google) gagal', async () => {
    const origTtsPromise = EdgeTTS.prototype.ttsPromise
    EdgeTTS.prototype.ttsPromise = vi.fn().mockRejectedValueOnce(new Error('Edge WAF block'))

    const origFetch = globalThis.fetch
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as any)

    try {
      const res = await app.request('/api/tts?text=Hallo')
      expect(res.status).toBe(502)
    } finally {
      EdgeTTS.prototype.ttsPromise = origTtsPromise
      globalThis.fetch = origFetch
    }
  })
})
