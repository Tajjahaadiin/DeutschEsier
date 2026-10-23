import { describe, it, expect } from 'vitest'
import {
  TTS_PERSONAS,
  getTtsPersona,
  resolveEdgeVoiceId,
} from './ttsPersonas'

describe('ttsPersonas — shared TTS persona registry', () => {
  it('mendefinisikan 6 persona vokal Jerman (3 pria + 3 wanita)', () => {
    expect(TTS_PERSONAS).toHaveLength(6)
    const males = TTS_PERSONAS.filter((p) => p.gender === 'male')
    const females = TTS_PERSONAS.filter((p) => p.gender === 'female')
    expect(males).toHaveLength(3)
    expect(females).toHaveLength(3)
  })

  it('getTtsPersona mengembalikan objek persona sesuai ID', () => {
    const conrad = getTtsPersona('male-1')
    expect(conrad?.name).toBe('Conrad')
    expect(conrad?.voiceId).toBe('de-DE-ConradNeural')

    const amala = getTtsPersona('female-2')
    expect(amala?.name).toBe('Amala')
    expect(amala?.voiceId).toBe('de-DE-AmalaNeural')

    expect(getTtsPersona('tidak-ada')).toBeUndefined()
  })

  it('resolveEdgeVoiceId memetakan persona ID ke voice ID Edge TTS', () => {
    expect(resolveEdgeVoiceId('male-2')).toBe('de-DE-KillianNeural')
    expect(resolveEdgeVoiceId('female-3')).toBe('de-DE-SeraphinaMultilingualNeural')
  })

  it('resolveEdgeVoiceId menerima nama suara langsung secara case-insensitive', () => {
    expect(resolveEdgeVoiceId('de-de-florianmultilingualneural')).toBe(
      'de-DE-FlorianMultilingualNeural'
    )
  })

  it('resolveEdgeVoiceId mendukung fallback gender lama (male/female)', () => {
    expect(resolveEdgeVoiceId('male')).toBe('de-DE-ConradNeural')
    expect(resolveEdgeVoiceId('female')).toBe('de-DE-KatjaNeural')
    expect(resolveEdgeVoiceId(undefined, 'male')).toBe('de-DE-ConradNeural')
    expect(resolveEdgeVoiceId(undefined, 'female')).toBe('de-DE-KatjaNeural')
  })
})
