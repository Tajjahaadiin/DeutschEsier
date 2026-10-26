import { describe, it, expect } from 'vitest'
import {
  TTS_PERSONAS,
  SCENARIO_PERSONAS,
  GRUNDLAGEN_PERSONA_ID,
  getTtsPersona,
  resolveEdgeVoiceId,
} from './ttsPersonas'

describe('ttsPersonas — shared TTS persona registry', () => {
  it('mengekspos tepat 3 persona pilihan (2 pria + 1 wanita)', () => {
    expect(TTS_PERSONAS).toHaveLength(3)
    expect(TTS_PERSONAS.filter((p) => p.gender === 'male')).toHaveLength(2)
    expect(TTS_PERSONAS.filter((p) => p.gender === 'female')).toHaveLength(1)
  })

  it('tidak lagi memuat persona kode mati (male-3, female-2, female-3)', () => {
    for (const dead of ['male-3', 'female-2', 'female-3']) {
      expect(getTtsPersona(dead)).toBeUndefined()
    }
  })

  it('persona skenario tetap 3 dan semuanya bisa di-resolve', () => {
    expect(SCENARIO_PERSONAS).toHaveLength(3)
    for (const p of SCENARIO_PERSONAS) {
      expect(getTtsPersona(p.id)).toBeDefined()
    }
  })

  it('REGRESI: female-1 tetap resolvable walau bukan persona pilihan (dipakai Grundlagen)', () => {
    const katja = getTtsPersona(GRUNDLAGEN_PERSONA_ID)
    expect(katja?.voiceId).toBe('de-DE-KatjaNeural')
    // Bukan anggota daftar yang diekspos ke pemilih suara
    expect(TTS_PERSONAS.some((p) => p.id === 'female-1')).toBe(false)
  })

  it('getTtsPersona mengembalikan objek persona sesuai ID', () => {
    const conrad = getTtsPersona('male-1')
    expect(conrad?.name).toBe('Conrad')
    expect(conrad?.voiceId).toBe('de-DE-ConradNeural')

    const amala = getTtsPersona('weiblich')
    expect(amala?.name).toBe('Weiblich')
    expect(amala?.voiceId).toBe('de-DE-AmalaNeural')

    expect(getTtsPersona('tidak-ada')).toBeUndefined()
  })

  it('setiap persona menghasilkan voiceId yang unik (tanpa duplikat)', () => {
    const all = [...TTS_PERSONAS, ...SCENARIO_PERSONAS, getTtsPersona(GRUNDLAGEN_PERSONA_ID)!]
    const voices = new Set(all.map((p) => p.voiceId))
    // Amala dipakai `weiblich` dan dulu juga `female-2`; kini hanya satu.
    expect(voices.size).toBe(new Set(all.map((p) => p.id)).size)
  })

  it('resolveEdgeVoiceId memetakan persona ID ke voice ID Edge TTS', () => {
    expect(resolveEdgeVoiceId('male-2')).toBe('de-DE-KillianNeural')
    expect(resolveEdgeVoiceId('female-1')).toBe('de-DE-KatjaNeural')
  })

  it('resolveEdgeVoiceId menerima nama suara langsung secara case-insensitive', () => {
    expect(resolveEdgeVoiceId('de-de-conradneural')).toBe('de-DE-ConradNeural')
  })

  it('resolveEdgeVoiceId mendukung fallback gender lama (male/female)', () => {
    expect(resolveEdgeVoiceId('male')).toBe('de-DE-ConradNeural')
    expect(resolveEdgeVoiceId('female')).toBe('de-DE-KatjaNeural')
    expect(resolveEdgeVoiceId(undefined, 'male')).toBe('de-DE-ConradNeural')
    expect(resolveEdgeVoiceId(undefined, 'female')).toBe('de-DE-KatjaNeural')
  })
})
