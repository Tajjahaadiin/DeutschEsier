import { describe, it, expect, vi, beforeEach } from 'vitest'

const synthesizeMock = vi.fn()

vi.mock('../lib/hfEdgeTts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../lib/hfEdgeTts')>()
  return {
    ...actual,
    edgeTtsSpace: { synthesize: synthesizeMock },
  }
})

const { default: app } = await import('../app')

function fakeMp3(size = 4096): Buffer {
  const buf = Buffer.alloc(size)
  buf[0] = 0xff
  buf[1] = 0xfb
  return buf
}

/** Voice label yang diterima Space: "<voiceId> - de-DE (Male|Female)". */
function voiceCalled(): string {
  return synthesizeMock.mock.calls.at(-1)?.[1] as string
}

describe('GET /api/tts', () => {
  beforeEach(() => {
    synthesizeMock.mockReset()
    synthesizeMock.mockResolvedValue(fakeMp3())
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
    expect(voiceCalled()).toContain('de-DE-ConradNeural')
    expect(voiceCalled()).toContain('(Male)')
  })

  it('REGRESI: männlich-2 memakai Killian, tidak pernah jatuh ke suara wanita', async () => {
    const res = await app.request('/api/tts?text=Hallo&persona=m%C3%A4nnlich-2')
    expect(res.status).toBe(200)
    expect(voiceCalled()).toContain('de-DE-KillianNeural')
    expect(voiceCalled()).not.toContain('(Female)')
  })

  it('persona wanita memakai Amala', async () => {
    const res = await app.request('/api/tts?text=Hallo&persona=weiblich')
    expect(res.status).toBe(200)
    expect(voiceCalled()).toContain('de-DE-AmalaNeural')
    expect(voiceCalled()).toContain('(Female)')
  })

  it('fallback gender=male memakai Conrad tanpa persona', async () => {
    await app.request('/api/tts?text=Hallo&gender=male')
    expect(voiceCalled()).toContain('de-DE-ConradNeural')
  })

  it('menyertakan ETag dan menjawab 304 bila sama', async () => {
    const first = await app.request('/api/tts?text=Hallo&persona=weiblich')
    const etag = first.headers.get('etag')
    expect(etag).toBeTruthy()

    synthesizeMock.mockClear()
    const second = await app.request('/api/tts?text=Hallo&persona=weiblich', {
      headers: { 'if-none-match': etag! },
    })
    expect(second.status).toBe(304)
    // 304 tidak boleh memanggil upstream lagi
    expect(synthesizeMock).not.toHaveBeenCalled()
  })

  it('mengembalikan 502 bila upstream gagal (klien pakai Web Speech)', async () => {
    synthesizeMock.mockRejectedValue(new Error('space down'))
    const res = await app.request('/api/tts?text=Hallo&persona=m%C3%A4nnlich-1')
    expect(res.status).toBe(502)
    expect(res.headers.get('content-type')).toContain('application/json')
    expect(res.headers.get('x-tts-error')).toBe('upstream_failed')
  })
})
