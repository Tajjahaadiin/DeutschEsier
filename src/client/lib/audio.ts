export type VoiceGender = 'male' | 'female'

interface ResolvedVoiceConfig {
  voice: SpeechSynthesisVoice | null
  pitch: number
  rate: number
}

// Regex deteksi gender suara bahasa Jerman (de-*)
const MALE_VOICE_REGEX = /\b(conrad|kilian|killian|florian|stefan|markus|yannick|viktor|martin|jonas|jan|bernd|christoph|ralf|michael|karsten)\b|#male|\bmale\b/i
const FEMALE_VOICE_REGEX = /\b(katja|hedda|amala|seraphina|anna|petra|helena|marlene|ingrid|leni|maja|lou|gisela)\b|#female|\bfemale\b|google deutsch/i

export function hasNativeMaleVoice(): boolean {
  if (typeof window === 'undefined' || !window.speechSynthesis) return false
  const voices = window.speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith('de'))
  return voices.some(v => MALE_VOICE_REGEX.test(v.name) || MALE_VOICE_REGEX.test(v.voiceURI))
}

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

export function resolveVoice(gender: VoiceGender): ResolvedVoiceConfig {
  if (germanVoices.length === 0 && typeof window !== 'undefined' && window.speechSynthesis) {
    germanVoices = window.speechSynthesis.getVoices().filter(v => v.lang.toLowerCase().startsWith('de'))
  }

  const defaultVoice = germanVoices[0] || null

  if (gender === 'male') {
    // 1. Coba cari suara pria native
    const nativeMale = germanVoices.find(v => MALE_VOICE_REGEX.test(v.name) || MALE_VOICE_REGEX.test(v.voiceURI))
    if (nativeMale) {
      return { voice: nativeMale, pitch: 1.0, rate: 1.0 }
    }
    // 2. Fallback akustik: pitch bariton 0.80, rate 0.90
    return { voice: defaultVoice, pitch: 0.80, rate: 0.90 }
  }

  // Gender 'female'
  const nativeFemale = germanVoices.find(v => FEMALE_VOICE_REGEX.test(v.name) || FEMALE_VOICE_REGEX.test(v.voiceURI))
  if (nativeFemale) {
    return { voice: nativeFemale, pitch: 1.0, rate: 1.0 }
  }
  // Fallback akustik: nada jernih 1.05, rate 1.0
  return { voice: defaultVoice, pitch: 1.05, rate: 1.0 }
}

export type SpeakOptions = {
  gender?: VoiceGender
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
  if (typeof window === 'undefined' || !window.speechSynthesis) return

  window.speechSynthesis.cancel()

  const gender = options.gender || 'female'
  const config = resolveVoice(gender)

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
  const gender = options.gender || 'female'

  if (gender === 'male' && !hasNativeMaleVoice()) {
    const audioUrl = `/api/tts?text=${encodeURIComponent(text)}&gender=male`
    const audio = new Audio(audioUrl)
    if (options.rate !== undefined) {
      audio.playbackRate = options.rate
      audio.defaultPlaybackRate = options.rate
    }
    currentHtmlAudio = audio
    let fallbackExecuted = false
    const safeFallback = () => {
      if (fallbackExecuted) return
      fallbackExecuted = true
      if (currentHtmlAudio === audio) currentHtmlAudio = null
      fallbackSpeechSynthesis(text, options)
    }
    audio.onended = () => {
      if (currentHtmlAudio === audio) currentHtmlAudio = null
      if (options.onEnd) options.onEnd()
    }
    audio.onerror = () => safeFallback()
    audio.play().catch(() => safeFallback())
    return
  }

  fallbackSpeechSynthesis(text, options)
}

export function playAudioFile(filename: string, onEnd?: () => void) {
  stopSpeech()
  const audio = new Audio(`/audio/${filename}`)
  currentHtmlAudio = audio
  audio.onended = () => {
    if (currentHtmlAudio === audio) currentHtmlAudio = null
    if (onEnd) onEnd()
  }
  audio.onerror = () => {
    if (currentHtmlAudio === audio) currentHtmlAudio = null
    if (onEnd) onEnd()
  }
  audio.play().catch(e => {
    console.error('Failed to play audio file', e)
    if (currentHtmlAudio === audio) currentHtmlAudio = null
    if (onEnd) onEnd()
  })
}

export function playWordAudio(audioFilename: string, germanText: string, optionsOrOnEnd?: SpeakOptions | (() => void)) {
  stopSpeech()
  const options: SpeakOptions = typeof optionsOrOnEnd === 'function' ? { onEnd: optionsOrOnEnd } : (optionsOrOnEnd || {})

  if (options.gender === 'male' || !audioFilename || audioFilename === '') {
    speakGerman(germanText, options)
    return
  }

  const audio = new Audio('/audio/' + audioFilename)
  currentHtmlAudio = audio
  let fallbackHandled = false
  const safeFallback = () => {
    if (fallbackHandled) return
    fallbackHandled = true
    if (currentHtmlAudio === audio) currentHtmlAudio = null
    speakGerman(germanText, options)
  }

  audio.onended = () => {
    if (currentHtmlAudio === audio) currentHtmlAudio = null
    if (options.onEnd) options.onEnd()
  }
  audio.onerror = () => safeFallback()
  audio.play().catch(() => safeFallback())
}

export function getStoredVoiceGender(): VoiceGender {
  if (typeof window === 'undefined') return 'female'
  try {
    const saved = localStorage.getItem('preferredVoiceGender')
    return saved === 'male' ? 'male' : 'female'
  } catch {
    return 'female'
  }
}

export function setStoredVoiceGender(gender: VoiceGender): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem('preferredVoiceGender', gender)
  } catch {}
}
