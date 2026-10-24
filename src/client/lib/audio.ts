import {
  type TtsPersona,
  type TtsPersonaId,
  getTtsPersona,
  TTS_PERSONAS,
  DEFAULT_FEMALE_PERSONA,
  DEFAULT_MALE_PERSONA,
} from '../../shared/ttsPersonas'

export type VoiceGender = 'male' | 'female'
export type { TtsPersonaId }

interface ResolvedVoiceConfig {
  voice: SpeechSynthesisVoice | null
  pitch: number
  rate: number
}

// ponytail: fallback akustik 6 persona untuk browser speechSynthesis saat backend/cloud TTS offline.
// Ceiling: variasi nada per persona; upgrade path: REST API resmi Azure Speech atau pre-generated audio files.
const PERSONA_ACOUSTICS: Record<TtsPersonaId, { pitch: number; rate: number }> = {
  'male-1': { pitch: 0.75, rate: 0.92 }, // Conrad: Bariton berat & tegas
  'male-2': { pitch: 0.90, rate: 1.05 }, // Killian: Tenor santai & cepat
  'male-3': { pitch: 1.00, rate: 1.00 }, // Florian: Pria netral
  'female-1': { pitch: 1.05, rate: 0.95 }, // Katja: Tutor hangat & artikulatif
  'female-2': { pitch: 1.20, rate: 1.05 }, // Amala: Ceria & tinggi
  'female-3': { pitch: 0.95, rate: 0.95 }, // Seraphina: Tenang & lembut
}

// Regex deteksi gender suara bahasa Jerman (de-*)
const MALE_VOICE_REGEX = /\b(conrad|kilian|killian|florian|stefan|markus|yannick|viktor|martin|jonas|jan|bernd|christoph|ralf|michael|karsten)\b|#male|\bmale\b/i
const FEMALE_VOICE_REGEX = /\b(katja|hedda|amala|seraphina|anna|petra|helena|marlene|ingrid|leni|maja|lou|gisela)\b|#female|\bfemale\b|google deutsch/i

let germanVoices: SpeechSynthesisVoice[] = []

export async function initGermanVoice() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  const loadVoices = () => {
    const allVoices = window.speechSynthesis.getVoices()
    germanVoices = allVoices.filter(v => v.lang.toLowerCase().startsWith('de'))
  }

  loadVoices()
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = loadVoices
  }
}

export function resolveVoice(gender: VoiceGender, personaId?: TtsPersonaId): ResolvedVoiceConfig {
  if (germanVoices.length === 0 && typeof window !== 'undefined' && window.speechSynthesis) {
    germanVoices = window.speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith('de'))
  }

  const defaultVoice = germanVoices[0] || null
  const acoustic = personaId ? PERSONA_ACOUSTICS[personaId] : undefined
  const pitch = acoustic ? acoustic.pitch : 1.0
  const rate = acoustic ? acoustic.rate : 1.0

  if (gender === 'male') {
    const nativeMale = germanVoices.find(v => MALE_VOICE_REGEX.test(v.name) || MALE_VOICE_REGEX.test(v.voiceURI))
    if (nativeMale) {
      return { voice: nativeMale, pitch, rate }
    }
  } else {
    const nativeFemale = germanVoices.find(v => FEMALE_VOICE_REGEX.test(v.name) || FEMALE_VOICE_REGEX.test(v.voiceURI))
    if (nativeFemale) {
      return { voice: nativeFemale, pitch, rate }
    }
  }

  return { voice: defaultVoice, pitch, rate }
}

/**
 * Menentukan persona dan voiceId untuk satu permintaan audio.
 *
 * Fungsi murni (tanpa window/localStorage) supaya aturan prioritas bisa diuji:
 * persona eksplisit > persona tersimpan (bila gender cocok) > persona default gender.
 * Hasilnya selalu persona neural nyata, tidak pernah "suara browser + pitch".
 */
export function resolveTtsRequest(
  options: { personaId?: string; gender?: VoiceGender; storedPersonaId?: string } = {}
): { voiceId: string; personaId: TtsPersonaId; gender: VoiceGender } {
  // 1. Pemanggil tahu persis siapa yang bicara (dialog turn, pilihan persona di UI).
  const explicit = getTtsPersona(options.personaId)
  if (explicit) {
    return { voiceId: explicit.voiceId, personaId: explicit.id, gender: explicit.gender }
  }

  // 2. Persona tersimpan dipakai selama gender-nya cocok dengan permintaan.
  const stored = getTtsPersona(options.storedPersonaId)
  if (stored && (!options.gender || stored.gender === options.gender)) {
    return { voiceId: stored.voiceId, personaId: stored.id, gender: stored.gender }
  }

  // 3. Hanya gender yang diketahui: pilih persona neural default untuk gender itu.
  const gender: VoiceGender = options.gender || stored?.gender || 'female'
  const fallback: TtsPersona = getTtsPersona(
    gender === 'male' ? DEFAULT_MALE_PERSONA : DEFAULT_FEMALE_PERSONA
  ) || TTS_PERSONAS[0]

  return { voiceId: fallback.voiceId, personaId: fallback.id, gender: fallback.gender }
}

export type SpeakOptions = {
  gender?: VoiceGender
  personaId?: TtsPersonaId | string
  rate?: number
  onEnd?: () => void
}

let currentUtterance: SpeechSynthesisUtterance | null = null
let currentHtmlAudio: HTMLAudioElement | null = null

export function stopSpeech() {
  if (typeof window !== 'undefined') {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
  }
  if (currentUtterance) {
    currentUtterance.onend = null
    currentUtterance.onerror = null
    currentUtterance = null
  }
  if (currentHtmlAudio) {
    currentHtmlAudio.onended = null
    currentHtmlAudio.onerror = null
    currentHtmlAudio.pause()
    currentHtmlAudio.currentTime = 0
    currentHtmlAudio.src = ''
    try {
      currentHtmlAudio.load()
    } catch {}
    currentHtmlAudio = null
  }
}

function fallbackSpeechSynthesis(text: string, options: SpeakOptions) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    options.onEnd?.()
    return
  }

  window.speechSynthesis.cancel()

  const gender = options.gender || 'female'
  const config = resolveVoice(gender, options.personaId as TtsPersonaId | undefined)

  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'de-DE'
  if (config.voice) {
    utterance.voice = config.voice
  }
  utterance.pitch = config.pitch
  utterance.rate = options.rate !== undefined ? options.rate : config.rate

  if (options.onEnd) {
    utterance.onend = options.onEnd
    utterance.onerror = options.onEnd
  }

  currentUtterance = utterance
  window.speechSynthesis.speak(utterance)
}

export function speakGerman(text: string, optionsOrOnEnd?: SpeakOptions | (() => void)) {
  stopSpeech()
  const options: SpeakOptions = typeof optionsOrOnEnd === 'function' ? { onEnd: optionsOrOnEnd } : (optionsOrOnEnd || {})

  // Satu sumber audio untuk bahasa Jerman: persona neural dari /api/tts.
  // Web Speech hanya dipakai saat permintaan gagal, bukan sebagai jalur normal.
  const request = resolveTtsRequest({
    personaId: options.personaId,
    gender: options.gender,
    storedPersonaId: getStoredPersonaId(),
  })

  const audioUrl = `/api/tts?text=${encodeURIComponent(text)}&persona=${encodeURIComponent(request.personaId)}`
  const audio = new Audio(audioUrl)
  if (options.rate !== undefined) {
    audio.playbackRate = options.rate
    audio.defaultPlaybackRate = options.rate
  }
  currentHtmlAudio = audio
  let fallbackExecuted = false
  const safeFallback = () => {
    if (fallbackExecuted) return
    // Jika audio sudah di-stop atau digantikan permintaan lain, batalkan fallback
    if (currentHtmlAudio !== audio) return
    fallbackExecuted = true
    currentHtmlAudio = null
    // Sadar-diri: fallback akustik persona berbasis pitch & rate saat endpoint /api/tts terkendala
    fallbackSpeechSynthesis(text, { ...options, gender: request.gender, personaId: request.personaId })
  }
  audio.onended = () => {
    if (currentHtmlAudio === audio) currentHtmlAudio = null
    if (options.onEnd) options.onEnd()
  }
  audio.onerror = () => safeFallback()
  audio.play().catch(() => safeFallback())
}

// Memutar audio satu kata. Saat ini selalu melalui TTS (Web Speech API / Edge TTS),
// karena bank audio statis (.mp3) tidak lagi disertakan dalam proyek.
export function playWordAudio(germanText: string, optionsOrOnEnd?: SpeakOptions | (() => void)) {
  speakGerman(germanText, optionsOrOnEnd)
}

export function getStoredPersonaId(): TtsPersonaId {
  if (typeof window === 'undefined') return DEFAULT_FEMALE_PERSONA
  try {
    const saved = localStorage.getItem('preferredPersonaId')
    if (saved && getTtsPersona(saved)) return saved as TtsPersonaId
    // Migrasi dari preferredVoiceGender lama
    const oldGender = localStorage.getItem('preferredVoiceGender')
    return oldGender === 'male' ? 'male-1' : DEFAULT_FEMALE_PERSONA
  } catch {
    return DEFAULT_FEMALE_PERSONA
  }
}

export function setStoredPersonaId(personaId: TtsPersonaId): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('preferredPersonaId', personaId)
    const persona = getTtsPersona(personaId)
    if (persona) {
      localStorage.setItem('preferredVoiceGender', persona.gender)
    }
    // Siarkan event agar komponen lain yang membaca persona ikut menyelaraskan state
    window.dispatchEvent(new Event('persona-change'))
  } catch {}
}
