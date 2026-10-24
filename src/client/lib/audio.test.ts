// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { resolveTtsRequest, speakGerman, stopSpeech, resolveVoice } from './audio'
import { TTS_PERSONAS, getTtsPersona } from '../../shared/ttsPersonas'

class FakeUtterance {
  text: string
  lang = ''
  voice: unknown = null
  pitch = 1
  rate = 1
  onend: (() => void) | null = null
  onerror: (() => void) | null = null
  constructor(text: string) {
    this.text = text
  }
}

class FakeAudio {
  static instances: FakeAudio[] = []
  src: string
  playbackRate = 1
  defaultPlaybackRate = 1
  played = false
  onended: (() => void) | null = null
  onerror: (() => void) | null = null
  constructor(src?: string) {
    this.src = src || ''
    FakeAudio.instances.push(this)
  }
  play() {
    this.played = true
    return Promise.resolve()
  }
  pause() {}
  load() {}
}

let spoken: FakeUtterance[] = []

beforeEach(() => {
  FakeAudio.instances = []
  spoken = []
  vi.stubGlobal('Audio', FakeAudio)
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance)
  vi.stubGlobal('speechSynthesis', {
    cancel: () => {},
    speak: (u: FakeUtterance) => {
      spoken.push(u)
    },
    getVoices: () => [],
    onvoiceschanged: undefined,
  })
  window.speechSynthesis = globalThis.speechSynthesis
})

describe('resolveTtsRequest — persona selalu menang atas gender', () => {
  it('setiap persona dipetakan ke voiceId-nya sendiri dan unik (ADR-0003: 6 suara berbeda)', () => {
    const voiceIds = TTS_PERSONAS.map((p) => {
      const req = resolveTtsRequest({ personaId: p.id })
      expect(req.voiceId).toBe(p.voiceId)
      expect(req.personaId).toBe(p.id)
      expect(req.gender).toBe(p.gender)
      return req.voiceId
    })
    expect(new Set(voiceIds).size).toBe(6)
  })

  it('gender saja tetap menghasilkan persona neural nyata, bukan suara browser', () => {
    expect(resolveTtsRequest({ gender: 'female' }).voiceId).toBe('de-DE-KatjaNeural')
    expect(resolveTtsRequest({ gender: 'male' }).voiceId).toBe('de-DE-ConradNeural')
  })

  it('persona tersimpan dipakai bila tidak ada persona eksplisit', () => {
    const req = resolveTtsRequest({ storedPersonaId: 'male-2' })
    expect(req.voiceId).toBe('de-DE-KillianNeural')
  })

  it('persona tersimpan menang atas gender yang cocok', () => {
    const req = resolveTtsRequest({ gender: 'male', storedPersonaId: 'male-2' })
    expect(req.voiceId).toBe('de-DE-KillianNeural')
  })

  it('persona tersimpan diabaikan bila gender-nya tidak cocok dengan permintaan', () => {
    const req = resolveTtsRequest({ gender: 'female', storedPersonaId: 'male-2' })
    expect(req.voiceId).toBe('de-DE-KatjaNeural')
    expect(req.gender).toBe('female')
  })

  it('personaId tak dikenal jatuh ke persona default sesuai gender', () => {
    expect(resolveTtsRequest({ personaId: 'male-9', gender: 'male' }).voiceId).toBe('de-DE-ConradNeural')
    expect(resolveTtsRequest({ personaId: 'nope' }).voiceId).toBe('de-DE-KatjaNeural')
  })

  it('tanpa argumen memakai persona tersimpan, atau default wanita', () => {
    expect(resolveTtsRequest({ storedPersonaId: 'female-3' }).voiceId).toBe('de-DE-SeraphinaMultilingualNeural')
    expect(resolveTtsRequest({}).voiceId).toBe('de-DE-KatjaNeural')
  })

  it('voiceId yang dihasilkan selalu voice neural de-DE yang dikenal', () => {
    const known = new Set(TTS_PERSONAS.map((p) => p.voiceId))
    for (const p of TTS_PERSONAS) {
      const { voiceId } = resolveTtsRequest({ personaId: p.id })
      expect(voiceId.startsWith('de-DE-')).toBe(true)
      expect(known.has(voiceId)).toBe(true)
    }
  })
})

describe('speakGerman — audio Jerman selalu lewat /api/tts', () => {
  it('REGRESI: gender saja tidak boleh jatuh ke Web Speech API', () => {
    speakGerman('Hallo', { gender: 'female' })

    expect(spoken).toHaveLength(0)
    expect(FakeAudio.instances).toHaveLength(1)
    expect(FakeAudio.instances[0].src).toBe('/api/tts?text=Hallo&persona=female-1')
    expect(FakeAudio.instances[0].played).toBe(true)
  })

  it('gender pria memakai persona pria default', () => {
    speakGerman('Guten Tag', { gender: 'male' })

    expect(spoken).toHaveLength(0)
    expect(FakeAudio.instances[0].src).toBe('/api/tts?text=Guten%20Tag&persona=male-1')
  })

  it('personaId eksplisit memilih suara persona tersebut', () => {
    speakGerman('Hallo', { personaId: 'male-3', gender: 'male' })

    expect(FakeAudio.instances[0].src).toBe('/api/tts?text=Hallo&persona=male-3')
  })

  it('persona tersimpan dipakai bila tidak ada opsi persona/gender', () => {
    localStorage.setItem('preferredPersonaId', 'female-2')
    speakGerman('Hallo')

    expect(FakeAudio.instances[0].src).toBe('/api/tts?text=Hallo&persona=female-2')
    localStorage.clear()
  })

  it('rate diteruskan sebagai playbackRate (time-stretch, bukan ubah nada)', () => {
    speakGerman('Hallo', { personaId: 'female-1', rate: 0.75 })

    expect(FakeAudio.instances[0].playbackRate).toBe(0.75)
  })

  it('fallback memetakan personaId ke profil akustik pitch & rate saat jaringan gagal', () => {
    speakGerman('Hallo', { personaId: 'male-2' })

    const audio = FakeAudio.instances[0]
    audio.onerror?.()

    expect(spoken).toHaveLength(1)
    expect(spoken[0].text).toBe('Hallo')
    // male-2 (Killian): pitch 0.90, rate 1.05
    expect(spoken[0].pitch).toBe(0.9)
    expect(spoken[0].rate).toBe(1.05)
  })

  it('safeFallback tidak dijalankan jika audio sudah di-stop via stopSpeech', () => {
    speakGerman('Hallo', { personaId: 'male-1' })
    const audio = FakeAudio.instances[0]

    stopSpeech()
    audio.onerror?.()

    expect(spoken).toHaveLength(0)
  })

  it('safeFallback audio lama diabaikan saat audio baru sudah mulai diputar', () => {
    speakGerman('Hallo A', { personaId: 'male-1' })
    const audioA = FakeAudio.instances[0]

    speakGerman('Hallo B', { personaId: 'female-1' })
    const audioB = FakeAudio.instances[1]

    audioA.onerror?.()
    expect(spoken).toHaveLength(0)
    expect(audioB.played).toBe(true)
  })

  it('fallback memanggil onEnd bila window.speechSynthesis tidak tersedia', () => {
    const onEnd = vi.fn()
    const origSynthesis = window.speechSynthesis
    // @ts-expect-error simulasi browser tanpa speechSynthesis
    window.speechSynthesis = undefined

    try {
      speakGerman('Hallo', { onEnd })
      const audio = FakeAudio.instances[0]
      audio.onerror?.()

      expect(onEnd).toHaveBeenCalledTimes(1)
      expect(spoken).toHaveLength(0)
    } finally {
      window.speechSynthesis = origSynthesis
    }
  })

  it('resolveVoice mengembalikan pitch & rate 1.0 tanpa personaId, atau profil akustik jika personaId ada', () => {
    expect(resolveVoice('male').pitch).toBe(1)
    expect(resolveVoice('female').pitch).toBe(1)
    expect(resolveVoice('male', 'male-1').pitch).toBe(0.75)
    expect(resolveVoice('female', 'female-2').pitch).toBe(1.20)
  })

  it('stopSpeech menghentikan audio yang sedang diputar', () => {
    speakGerman('Hallo', { personaId: 'female-1' })
    const audio = FakeAudio.instances[0]

    stopSpeech()

    expect(audio.src).toBe('')
  })
})

describe('sanitas data persona', () => {
  it('setiap persona punya voiceId dan gender yang konsisten', () => {
    for (const p of TTS_PERSONAS) {
      expect(getTtsPersona(p.id)).toBeDefined()
      expect(p.voiceId.endsWith('Neural')).toBe(true)
      expect(['male', 'female']).toContain(p.gender)
    }
  })
})
