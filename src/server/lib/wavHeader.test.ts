import { describe, it, expect } from 'vitest'
import { wrapPcmInWav } from './wavHeader'

describe('wrapPcmInWav', () => {
  it('menambahkan header RIFF WAV 44-byte yang valid pada buffer PCM', () => {
    const fakePcm = Buffer.from([0, 1, 2, 3, 4, 5, 6, 7])
    const wav = wrapPcmInWav(fakePcm, 24000, 1, 16)

    expect(wav.length).toBe(44 + fakePcm.length)
    expect(wav.subarray(0, 4).toString('ascii')).toBe('RIFF')
    expect(wav.readUInt32LE(4)).toBe(36 + fakePcm.length)
    expect(wav.subarray(8, 12).toString('ascii')).toBe('WAVE')
    expect(wav.subarray(12, 16).toString('ascii')).toBe('fmt ')
    expect(wav.readUInt16LE(20)).toBe(1) // PCM format
    expect(wav.readUInt16LE(22)).toBe(1) // 1 channel
    expect(wav.readUInt32LE(24)).toBe(24000) // 24kHz sample rate
    expect(wav.readUInt16LE(34)).toBe(16) // 16 bits per sample
    expect(wav.subarray(36, 40).toString('ascii')).toBe('data')
    expect(wav.readUInt32LE(40)).toBe(fakePcm.length)
    expect(wav.subarray(44)).toEqual(fakePcm)
  })
})
