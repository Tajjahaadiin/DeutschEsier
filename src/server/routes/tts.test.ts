import { describe, it, expect, vi } from 'vitest'

const { default: app } = await import('../app')

describe('GET /api/tts', () => {
  it('menolak bila text kosong (400)', async () => {
    const res = await app.request('/api/tts')
    expect(res.status).toBe(400)
    expect(((await res.json()) as any).error).toContain('Text parameter is required')
  })

  it('mengalirkan audio/mpeg dan menetapkan header cache immutable', async () => {
    const origFetch = globalThis.fetch
    globalThis.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      arrayBuffer: () => Promise.resolve(Buffer.from('dummy-stream-audio').buffer),
    } as any)

    try {
      const res = await app.request('/api/tts?text=Hallo')
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toBe('audio/mpeg')
      expect(res.headers.get('cache-control')).toContain('immutable')
      expect(res.headers.get('cdn-cache-control')).toContain('31536000')
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
      const res = await app.request('/api/tts?text=Hallo')
      expect(res.status).toBe(502)
    } finally {
      globalThis.fetch = origFetch
    }
  })
})
