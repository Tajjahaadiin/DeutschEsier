import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { EdgeTtsSpace } from '../lib/hfEdgeTts'

const googleMock = vi.fn()
vi.mock('../lib/googleTtsFallback', () => ({
  synthesizeGoogleTts: googleMock,
}))

// Skenario memakai `synthesizeLine` bersama; urutan engine diuji terpisah di
// ttsChain.test.ts. Di sini tiruan disetel agar perilakunya bisa dikendalikan.
const lineMock = vi.fn()
vi.mock('../lib/ttsChain', () => ({
  synthesizeLine: lineMock,
}))

const { synthesizeScenario } = await import('../lib/scenarioTts')

/**
 * Space tiruan: mengembalikan MP3 dummy per baris dan mencatat voice yang dipakai.
 * Jeda memakai Buffer kecil agar penggabungan bisa diuji tanpa ffmpeg.
 */
function fakeSpace(opts: { failOn?: number[]; healthy?: boolean } = {}) {
  const calls: Array<{ text: string; voice: string }> = []
  const space = {
    async isHealthy() {
      return opts.healthy ?? true
    },
    async synthesize(text: string, voice: string) {
      const idx = calls.length
      calls.push({ text, voice })
      if (opts.failOn?.includes(idx)) throw new Error('upstream down')
      return Buffer.alloc(1024, idx + 1)
    },
    silence() {
      return Buffer.alloc(64, 0)
    },
  } as unknown as EdgeTtsSpace
  return { space, calls }
}

beforeEach(() => {
  googleMock.mockReset()
  googleMock.mockResolvedValue(Buffer.alloc(1500, 9))
  // Default: rantai menjawab lewat edge-tts dengan audio ukuran wajar.
  lineMock.mockReset()
  lineMock.mockImplementation(async () => ({
    audio: Buffer.alloc(1024, 7),
    engine: 'edge-tts' as const,
  }))
})

const turns = [
  { speaker: 'A', germanText: 'Guten Tag!', personaId: 'weiblich' },
  { speaker: 'B', germanText: 'Hallo Anna.', personaId: 'männlich-1' },
  { speaker: 'C', germanText: 'Und ich bin Jonas.', personaId: 'männlich-2' },
]

describe('synthesizeScenario', () => {
  it('memetakan persona ke voiceId pria/wanita yang benar', async () => {
    const { space } = fakeSpace()
    await synthesizeScenario(turns, space)

    const voices = lineMock.mock.calls.map((c) => c[1])
    expect(voices).toEqual(['de-DE-AmalaNeural', 'de-DE-ConradNeural', 'de-DE-KillianNeural'])
  })

  it('menggabungkan hasil sesuai urutan dialog walau sintesis paralel', async () => {
    // Byte pertama tiap blok menandai index baris (1,2,3).
    let n = 0
    lineMock.mockImplementation(async () => ({
      audio: Buffer.alloc(1024, ++n),
      engine: 'edge-tts' as const,
    }))
    const { space } = fakeSpace()
    const result = await synthesizeScenario(turns, space)

    // Tiap baris 1024 byte, tiap jeda 64 byte → 3*1024 + 2*64
    expect(result.bytes).toBe(3 * 1024 + 2 * 64)
    expect(result.audio.length).toBe(result.bytes)
    // Byte pertama tiap blok menandai index baris (1,2,3) → urutan terjaga
    expect(result.audio[0]).toBe(1)
    expect(result.audio[1024 + 64]).toBe(2)
  })

  it('baris yang gagal di rantai tidak menghilangkan baris lain', async () => {
    let call = 0
    lineMock.mockImplementation(async () => {
      if (++call === 2) throw new Error('semua engine gagal')
      return { audio: Buffer.alloc(1024, 5), engine: 'edge-tts' as const }
    })
    const { space } = fakeSpace()
    const result = await synthesizeScenario(turns, space)

    expect(result.turns).toBe(3)
    expect(result.perTurn.filter((t) => t.ok)).toHaveLength(2)
    expect(result.perTurn[1].ok).toBe(false)
    expect(result.bytes).toBeGreaterThan(1024)
  })

  it('melempar bila rantai gagal di semua baris (tidak mengirim audio kosong)', async () => {
    lineMock.mockRejectedValue(new Error('semua engine gagal'))
    const { space } = fakeSpace()
    await expect(synthesizeScenario(turns, space)).rejects.toThrow(/tidak ada baris/)
  })

  it('timings menandai awal tiap baris, termasuk jeda sebelumnya', async () => {
    // Baris 1024B @48kbps ≈ 171ms; jeda 64B ≈ 11ms
    const { space } = fakeSpace()
    const result = await synthesizeScenario(turns, space)

    const lineMs = Math.round((1024 * 8) / 48)
    const gapMs = Math.round((64 * 8) / 48)
    expect(result.timings).toHaveLength(3)
    expect(result.timings[0]).toBe(0)
    expect(result.timings[1]).toBe(lineMs + gapMs)
    expect(result.timings[2]).toBe(2 * (lineMs + gapMs))
  })

  it('timings tidak linear terhadap panjang teks (alasan estimasi proporsional dibuang)', async () => {
    // Baris pendek dan panjang sama-sama 1024B di tiruan ini, jadi timings
    // harus mengikuti ukuran byte, bukan jumlah karakter.
    const uneven = [
      { speaker: 'A', germanText: 'Ja.', personaId: 'weiblich' },
      { speaker: 'B', germanText: 'x'.repeat(500), personaId: 'männlich-1' },
    ]
    const { space } = fakeSpace()
    const result = await synthesizeScenario(uneven, space)
    expect(result.timings[1]).toBe(Math.round((1024 * 8) / 48) + Math.round((64 * 8) / 48))
  })

  it('REGRESI: baris gagal total ditandai -1 tapi timings tetap sejajar dialog', async () => {
    let call = 0
    lineMock.mockImplementation(async () => {
      if (++call === 2) throw new Error('semua engine gagal')
      return { audio: Buffer.alloc(1024, 3), engine: 'edge-tts' as const }
    })
    const { space } = fakeSpace()
    const result = await synthesizeScenario(turns, space)

    // Panjang harus sama dengan jumlah baris dialog, bukan jumlah baris sukses.
    // Kalau dipadatkan, indeks timings bergeser dan klien menyorot baris salah.
    expect(result.timings).toHaveLength(3)
    expect(result.timings[0]).toBe(0)
    expect(result.timings[1]).toBe(-1)
    expect(result.timings[2]).toBeGreaterThan(0)
  })

  it('mendelegasikan ke rantai bersama untuk setiap baris', async () => {
    const { space } = fakeSpace()
    await synthesizeScenario(turns, space)
    expect(lineMock).toHaveBeenCalledTimes(3)
  })

  it('melaporkan engine dominan yang dipakai rantai', async () => {
    // 2 baris lewat hf-space, 1 lewat edge-tts → hf-space dominan.
    let n = 0
    lineMock.mockImplementation(async () => {
      const engine = ++n <= 2 ? ('hf-space' as const) : ('edge-tts' as const)
      return { audio: Buffer.alloc(1024, n), engine }
    })
    const { space } = fakeSpace()
    const result = await synthesizeScenario(turns, space)
    expect(result.engine).toBe('hf-space')
  })

  it('memeriksa kesehatan Space sekali di depan, bukan per baris', async () => {
    let healthCalls = 0
    const space = {
      async isHealthy() {
        healthCalls++
        return false
      },
      async synthesize() {
        throw new Error('tidak boleh dipanggil')
      },
      silence: () => Buffer.alloc(64, 0),
    }
    await synthesizeScenario(turns, space as unknown as EdgeTtsSpace)
    expect(healthCalls).toBe(1)
  })

  it('memakai persona default selang-seling bila personaId tidak diberikan', async () => {
    const { space } = fakeSpace()
    await synthesizeScenario(
      [{ speaker: 'A', germanText: 'eins' }, { speaker: 'B', germanText: 'zwei' }],
      space,
    )
    const voices = lineMock.mock.calls.map((c) => c[1])
    expect(voices).toEqual(['de-DE-AmalaNeural', 'de-DE-ConradNeural'])
  })
})
