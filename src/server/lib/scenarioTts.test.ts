import { describe, it, expect } from 'vitest'
import { synthesizeScenario } from '../lib/scenarioTts'
import type { EdgeTtsSpace } from '../lib/hfEdgeTts'

/**
 * Space tiruan: mengembalikan MP3 dummy per baris dan mencatat voice yang dipakai.
 * Jeda memakai Buffer kecil agar penggabungan bisa diuji tanpa ffmpeg.
 */
function fakeSpace(opts: { failOn?: number[] } = {}) {
  const calls: Array<{ text: string; voice: string }> = []
  const space = {
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

const turns = [
  { speaker: 'A', germanText: 'Guten Tag!', personaId: 'weiblich' },
  { speaker: 'B', germanText: 'Hallo Anna.', personaId: 'männlich-1' },
  { speaker: 'C', germanText: 'Und ich bin Jonas.', personaId: 'männlich-2' },
]

describe('synthesizeScenario', () => {
  it('memetakan persona ke voice pria/wanita yang benar', async () => {
    const { space, calls } = fakeSpace()
    await synthesizeScenario(turns, space)

    expect(calls).toHaveLength(3)
    expect(calls[0].voice).toContain('AmalaNeural')
    expect(calls[0].voice).toContain('(Female)')
    // REGRESI: persona pria tidak boleh jatuh ke suara wanita
    expect(calls[1].voice).toContain('ConradNeural')
    expect(calls[2].voice).toContain('KillianNeural')
    for (const c of calls.slice(1)) expect(c.voice).toContain('(Male)')
  })

  it('menggabungkan hasil sesuai urutan dialog walau sintesis paralel', async () => {
    const { space } = fakeSpace()
    const result = await synthesizeScenario(turns, space)

    // Tiap baris 1024 byte, tiap jeda 64 byte → 3*1024 + 2*64
    expect(result.bytes).toBe(3 * 1024 + 2 * 64)
    expect(result.audio.length).toBe(result.bytes)
    // Byte pertama tiap blok menandai index baris (1,2,3) → urutan terjaga
    expect(result.audio[0]).toBe(1)
    expect(result.audio[1024 + 64]).toBe(2)
  })

  it('tetap menghasilkan audio bila sebagian baris gagal', async () => {
    const { space } = fakeSpace({ failOn: [1] })
    const result = await synthesizeScenario(turns, space)

    expect(result.turns).toBe(3)
    expect(result.perTurn.filter((t) => t.ok)).toHaveLength(2)
    expect(result.perTurn[1].ok).toBe(false)
    expect(result.bytes).toBeGreaterThan(1024)
  })

  it('melempar bila semua baris gagal (tidak mengirim audio kosong)', async () => {
    const { space } = fakeSpace({ failOn: [0, 1, 2] })
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

  it('REGRESI: baris gagal ditandai -1 tapi timings tetap sejajar dialog', async () => {
    const { space } = fakeSpace({ failOn: [1] })
    const result = await synthesizeScenario(turns, space)

    // Panjang harus sama dengan jumlah baris dialog, bukan jumlah baris sukses.
    // Kalau dipadatkan, indeks timings bergeser dan klien menyorot baris salah.
    expect(result.timings).toHaveLength(3)
    expect(result.timings[0]).toBe(0)
    expect(result.timings[1]).toBe(-1)
    expect(result.timings[2]).toBeGreaterThan(0)
  })

  it('memakai persona default selang-seling bila personaId tidak diberikan', async () => {
    const { space, calls } = fakeSpace()
    await synthesizeScenario(
      [{ speaker: 'A', germanText: 'eins' }, { speaker: 'B', germanText: 'zwei' }],
      space,
    )
    expect(calls[0].voice).toContain('AmalaNeural')
    expect(calls[1].voice).toContain('ConradNeural')
  })
})
