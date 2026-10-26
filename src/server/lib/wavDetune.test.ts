import { describe, it, expect } from 'vitest'
import { detuneWavBuffer } from './wavDetune'
import { wrapPcmInWav } from './wavHeader'

describe('wavDetune', () => {
  it('menurunkan sampleRate saat semitone negatif (-2.0 / Bariton)', () => {
    const dummyPcm = Buffer.alloc(48000)
    const wav = wrapPcmInWav(dummyPcm, 24000, 1, 16)
    
    expect(wav.readUInt32LE(24)).toBe(24000)

    const detuned = detuneWavBuffer(wav, -2.0)
    const newSr = detuned.readUInt32LE(24)

    // 24000 * 2^(-2/12) ~= 21382 Hz
    expect(newSr).toBeLessThan(24000)
    expect(newSr).toBe(21382)
  })

  it('menaikkan sampleRate saat semitone positif (+1.8 / Tenor)', () => {
    const dummyPcm = Buffer.alloc(48000)
    const wav = wrapPcmInWav(dummyPcm, 24000, 1, 16)

    const detuned = detuneWavBuffer(wav, 1.8)
    const newSr = detuned.readUInt32LE(24)

    // 24000 * 2^(1.8/12) ~= 26630 Hz
    expect(newSr).toBeGreaterThan(24000)
    expect(newSr).toBe(26630)
  })

  it('mengembalikan buffer asli jika semitone 0', () => {
    const dummyPcm = Buffer.alloc(48000)
    const wav = wrapPcmInWav(dummyPcm, 24000, 1, 16)

    const detuned = detuneWavBuffer(wav, 0)
    expect(detuned.readUInt32LE(24)).toBe(24000)
  })
})
