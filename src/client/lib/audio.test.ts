// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'

import { resolveTtsRequest, speakGerman, stopSpeech, resolveVoice, warmUpDialogueCache } from './audio'
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

describe('speakGerman — audio Jerman selalu lewat /api/tts HTTP Stream', () => {
  it('REGRESI: gender female tetap lewat /api/tts', () => {
    speakGerman('Hallo', { gender: 'female' })

    expect(spoken).toHaveLength(0)
    expect(FakeAudio.instances).toHaveLength(1)
    expect(FakeAudio.instances[0].src).toBe('/api/tts?text=Hallo&persona=female-1')
    expect(FakeAudio.instances[0].played).toBe(true)
  })

  it('gender pria diteruskan ke /api/tts (Kokoro Martin di server)', () => {
    speakGerman('Guten Tag', { gender: 'male' })

    expect(spoken).toHaveLength(0)
    expect(FakeAudio.instances[0].src).toBe('/api/tts?text=Guten%20Tag&persona=male-1')
  })

  it('personaId pria eksplisit diteruskan ke /api/tts', () => {
    speakGerman('Hallo', { personaId: 'männlich-2', gender: 'male' })

    expect(FakeAudio.instances[0].src).toBe('/api/tts?text=Hallo&persona=m%C3%A4nnlich-2')
  })

  it('persona tersimpan dipakai bila tidak ada opsi persona/gender', () => {
    localStorage.setItem('preferredPersonaId', 'female-2')
    speakGerman('Hallo')

    expect(FakeAudio.instances[0].src).toBe('/api/tts?text=Hallo&persona=female-2')
    localStorage.clear()
  })

  it('rate diteruskan sebagai playbackRate', () => {
    speakGerman('Hallo', { personaId: 'female-1', rate: 0.75 })

    expect(FakeAudio.instances[0].playbackRate).toBe(0.75)
  })

  it('fallback memetakan personaId ke profil akustik pitch & rate saat jaringan gagal', () => {
    speakGerman('Hallo', { personaId: 'female-3' })

    const audio = FakeAudio.instances[0]
    audio.onerror?.()

    expect(spoken).toHaveLength(1)
    expect(spoken[0].text).toBe('Hallo')
    expect(spoken[0].pitch).toBe(0.95)
  })

  it('safeFallback tidak dijalankan jika audio sudah di-stop via stopSpeech', () => {
    speakGerman('Hallo', { personaId: 'female-1' })
    const audio = FakeAudio.instances[0]

    stopSpeech()
    audio.onerror?.()

    expect(spoken).toHaveLength(0)
  })

  it('safeFallback audio lama diabaikan saat audio baru sudah mulai diputar', () => {
    speakGerman('Hallo A', { personaId: 'female-1' })
    const audioA = FakeAudio.instances[0]

    speakGerman('Hallo B', { personaId: 'female-2' })
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

  it('warmUpDialogueCache mengambil URL audio baris dialog secara berurutan', async () => {
    const origFetch = globalThis.fetch
    const fetchedUrls: string[] = []
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      fetchedUrls.push(url)
      return Promise.resolve({ ok: true } as any)
    })

    const sampleDialogue = [
      { speaker: 'Sprecher A', germanText: 'Hallo!' },
      { speaker: 'Sprecher B', germanText: 'Guten Tag!' },
    ]

    const onProgress = vi.fn()
    try {
      await warmUpDialogueCache(sampleDialogue, { onProgress })
      expect(fetchedUrls).toHaveLength(2)
      expect(fetchedUrls[0]).toContain('/api/tts?text=Hallo!&persona=weiblich')
      expect(fetchedUrls[1]).toContain('/api/tts?text=Guten%20Tag!&persona=m%C3%A4nnlich-1')
      expect(onProgress).toHaveBeenCalledTimes(2)
    } finally {
      globalThis.fetch = origFetch
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
