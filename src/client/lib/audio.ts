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
  'weiblich': { pitch: 1.20, rate: 1.04 }, // Ceria & tinggi
  'männlich-1': { pitch: 0.75, rate: 1.06 }, // Tegas & berat
  'männlich-2': { pitch: 0.90, rate: 1.05 }, // Energik & santai
  'male-1': { pitch: 0.75, rate: 1.06 }, // Alias legacy untuk männlich-1
  'male-2': { pitch: 0.90, rate: 1.05 }, // Alias legacy untuk männlich-2
  'female-1': { pitch: 1.05, rate: 0.95 }, // Katja: Tutor hangat & artikulatif (Grundlagen)
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

let sharedAudioContext: AudioContext | null = null
const connectedAudioElements = new WeakSet<HTMLAudioElement>()

function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
  if (!AudioCtx) return null
  if (!sharedAudioContext) {
    sharedAudioContext = new AudioCtx()
  }
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {})
  }
  return sharedAudioContext
}

/**
 * Menerapkan Digital Signal Processing (DSP) Formant Reshaping:
 * Mengubah karakter vokal wanita (Google TTS fallback) menjadi berbobot pria:
 * - Low-shelf (+6 dB di 180 Hz): Memperkuat resonansi rongga dada pria (chest resonance).
 * - High-shelf (-8 dB di 3200 Hz): Meredam frekuensi melengking/desis pita suara wanita.
 */
export function applyMaleFormantFilter(audio: HTMLAudioElement): boolean {
  try {
    const ctx = getSharedAudioContext()
    if (!ctx) return false

    // MediaElementAudioSourceNode hanya boleh dibuat SEKALI per elemen HTMLAudioElement
    if (connectedAudioElements.has(audio)) return true

    const source = ctx.createMediaElementSource(audio)
    const lowShelf = ctx.createBiquadFilter()
    lowShelf.type = 'lowshelf'
    lowShelf.frequency.value = 180
    lowShelf.gain.value = 6 // +6 dB chest resonance boost

    const highShelf = ctx.createBiquadFilter()
    highShelf.type = 'highshelf'
    highShelf.frequency.value = 3200
    highShelf.gain.value = -8 // -8 dB vocal sibilance cut

    source.connect(lowShelf)
    lowShelf.connect(highShelf)
    highShelf.connect(ctx.destination)

    connectedAudioElements.add(audio)
    return true
  } catch (err) {
    console.warn('[Formant DSP Filter Warning]:', err)
    return false
  }
}

export function speakGerman(text: string, optionsOrOnEnd?: SpeakOptions | (() => void)) {
  stopSpeech()
  const options: SpeakOptions = typeof optionsOrOnEnd === 'function' ? { onEnd: optionsOrOnEnd } : (optionsOrOnEnd || {})

  const request = resolveTtsRequest({
    personaId: options.personaId,
    gender: options.gender,
    storedPersonaId: getStoredPersonaId(),
  })

  // JALUR UTAMA (Pria & Wanita): Remote /api/tts HTTP Audio Stream (CDN-Cached, Ringan, 0ms WASM Lag)
  // Backend menyintesis Pria via Kokoro Martin HuggingFace Space & Wanita via Google Translate Stream
  const audioUrl = `/api/tts?text=${encodeURIComponent(text)}&persona=${encodeURIComponent(request.personaId)}`
  const audio = new Audio(audioUrl)
  audio.crossOrigin = 'anonymous'
  
  // Modulasi playbackRate jika diminta atau ikuti profil persona
  const targetRate = options.rate !== undefined ? options.rate : (PERSONA_ACOUSTICS[request.personaId]?.rate || 1.0)
  audio.playbackRate = targetRate
  audio.defaultPlaybackRate = targetRate

  // Jika persona adalah pria, siapkan formant filter saat audio mulai diputar
  if (request.gender === 'male') {
    applyMaleFormantFilter(audio)
  }

  currentHtmlAudio = audio
  let fallbackExecuted = false

  const runFallback = () => {
    if (fallbackExecuted) return
    fallbackExecuted = true
    if (currentHtmlAudio !== audio) return
    currentHtmlAudio = null
    // Fallback cadangan ke Web Speech API jika jaringan terputus
    fallbackSpeechSynthesis(text, { ...options, gender: request.gender, personaId: request.personaId })
  }

  audio.onended = () => {
    if (currentHtmlAudio === audio) currentHtmlAudio = null
    if (options.onEnd) options.onEnd()
  }

  audio.onerror = () => runFallback()
  audio.play().catch(() => runFallback())
}

// Cache elemen HTMLAudioElement per URL agar tidak re-instantiasi berulang saat kartu diklik berkali-kali
const staticAudioCache = new Map<string, HTMLAudioElement>()

function getOrCreateAudio(url: string): HTMLAudioElement {
  let audio = staticAudioCache.get(url)
  if (!audio) {
    audio = new Audio(url)
    // Batasi cache maksimal 30 instance agar hemat memori peramban
    if (staticAudioCache.size >= 30) {
      const firstKey = staticAudioCache.keys().next().value
      if (firstKey) staticAudioCache.delete(firstKey)
    }
    staticAudioCache.set(url, audio)
  }
  return audio
}

// Helper internal: Memutar audio file statis MP3 dengan fallback mulus ke speakGerman bila file tidak ditemukan.
function playStaticAudioWithFallback(
  staticUrl: string,
  fallbackText: string,
  optionsOrOnEnd?: SpeakOptions | (() => void)
) {
  stopSpeech()
  const options: SpeakOptions = typeof optionsOrOnEnd === 'function' ? { onEnd: optionsOrOnEnd } : (optionsOrOnEnd || {})

  const audio = getOrCreateAudio(staticUrl)
  audio.currentTime = 0
  if (options.rate !== undefined) {
    audio.playbackRate = options.rate
    audio.defaultPlaybackRate = options.rate
  } else {
    audio.playbackRate = 1.0
    audio.defaultPlaybackRate = 1.0
  }
  currentHtmlAudio = audio

  let staticFailed = false
  const runFallback = () => {
    if (staticFailed) return
    staticFailed = true
    if (currentHtmlAudio === audio) currentHtmlAudio = null
    speakGerman(fallbackText, options)
  }

  audio.onended = () => {
    if (currentHtmlAudio === audio) currentHtmlAudio = null
    if (options.onEnd) options.onEnd()
  }

  audio.onerror = () => runFallback()
  audio.play().catch(() => runFallback())
}

/**
 * Memutar rangkaian audio secara berurutan (Sequential Stitching).
 * Berguna untuk merangkai audio statis: Hari -> Tanggal -> Bulan di kalender.
 */
export function playAudioSequence(
  items: Array<{ url: string; fallbackText: string }>,
  optionsOrOnEnd?: SpeakOptions | (() => void)
) {
  stopSpeech()
  const options: SpeakOptions = typeof optionsOrOnEnd === 'function' ? { onEnd: optionsOrOnEnd } : (optionsOrOnEnd || {})

  if (!items || items.length === 0) {
    options.onEnd?.()
    return
  }

  let currentIndex = 0
  let isCancelled = false

  const playNext = () => {
    if (isCancelled || currentIndex >= items.length) {
      if (options.onEnd) options.onEnd()
      return
    }

    const currentItem = items[currentIndex]
    currentIndex++

    playStaticAudioWithFallback(currentItem.url, currentItem.fallbackText, {
      ...options,
      onEnd: () => {
        // Beri jeda sangat singkat (120ms) antar kata agar terdengar natural
        setTimeout(playNext, 120)
      },
    })
  }

  playNext()
}

// Memutar audio kata benda Bank Kata.
// Memprioritaskan file statis Martin (/audio/words/{slug}.mp3), jika tidak ada fallback ke speakGerman.
export function playWordAudio(germanText: string, optionsOrOnEnd?: SpeakOptions | (() => void), article?: string) {
  const wordSlug = article
    ? `${article.toLowerCase().trim()}-${germanText.toLowerCase().trim().replace(/\s+/g, '-')}`
    : germanText.toLowerCase().trim().replace(/\s+/g, '-')
  const fullText = article ? `${article} ${germanText}` : germanText
  playStaticAudioWithFallback(`/audio/words/${wordSlug}.mp3`, fullText, optionsOrOnEnd)
}

// Memutar audio huruf atau contoh kata pada Das Alphabet.
// Memprioritaskan file statis Martin (/audio/alphabet/{letterId}-{type}.mp3), jika tidak ada fallback ke speakGerman.
export function playAlphabetAudio(
  letterId: string,
  type: 'letter' | 'word',
  fallbackText: string,
  optionsOrOnEnd?: SpeakOptions | (() => void)
) {
  playStaticAudioWithFallback(`/audio/alphabet/${letterId.toLowerCase().trim()}-${type}.mp3`, fallbackText, optionsOrOnEnd)
}

// Memutar audio angka pada die Nummer.
// Memprioritaskan file statis Martin (/audio/numbers/{value}.mp3), jika tidak ada fallback ke speakGerman.
export function playNumberAudio(
  value: number,
  fallbackText: string,
  optionsOrOnEnd?: SpeakOptions | (() => void)
) {
  playStaticAudioWithFallback(`/audio/numbers/${value}.mp3`, fallbackText, optionsOrOnEnd)
}

// Memutar audio kombinasi game hitung (angka + benda).
// Memprioritaskan file statis Martin (/audio/number-game/{n}-{noun}.mp3), jika tidak ada fallback ke speakGerman.
export function playNumberGameAudio(
  n: number,
  noun: string,
  fallbackText: string,
  optionsOrOnEnd?: SpeakOptions | (() => void)
) {
  playStaticAudioWithFallback(`/audio/number-game/${n}-${noun.toLowerCase().trim()}.mp3`, fallbackText, optionsOrOnEnd)
}

// Memutar audio konteks kalender pada die Tage (hari, bulan, waktu, hari libur).
// Memprioritaskan file statis Martin (/audio/days/{slug}.mp3), jika tidak ada fallback ke speakGerman.
export function playCalendarAudio(
  text: string,
  optionsOrOnEnd?: SpeakOptions | (() => void)
) {
  const slug = text
    .toLowerCase()
    .trim()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  playStaticAudioWithFallback(`/audio/days/${slug}.mp3`, text, optionsOrOnEnd)
}

/**
 * Melakukan pre-caching audio percakapan ke cache browser secara sekuensial (satu per satu dalam antrean).
 * Menggunakan retry loop (hingga 4x per baris) untuk memastikan setiap baris dialog berhasil ter-cache 100%.
 * Mengembalikan true bila seluruh baris lengkap terunduh, atau false jika dibatalkan/gagal.
 */
export async function warmUpDialogueCache(
  dialogue: Array<{ germanText: string; personaId?: string; speaker?: string }>,
  options: {
    speakerA?: string
    onProgress?: (completed: number, total: number) => void
    signal?: AbortSignal
    maxRetries?: number
  } = {}
): Promise<boolean> {
  if (!dialogue || dialogue.length === 0) return true

  const speakerA = options.speakerA || 'Sprecher A'
  const maxRetries = options.maxRetries ?? 4
  const validTurns = dialogue.filter((t) => t.germanText && t.germanText.trim())
  const total = validTurns.length

  if (total === 0) return true

  let completedCount = 0

  for (let i = 0; i < total; i++) {
    if (options.signal?.aborted) return false

    const turn = validTurns[i]
    const isA = turn.speaker === speakerA
    const turnPersonaId = turn.personaId || (isA ? 'weiblich' : 'männlich-1')
    const url = `/api/tts?text=${encodeURIComponent(turn.germanText.trim())}&persona=${encodeURIComponent(turnPersonaId)}`

    let success = false
    let attempts = 0

    // Retry loop per baris percakapan hingga berhasil
    while (!success && attempts < maxRetries) {
      if (options.signal?.aborted) return false
      attempts++

      try {
        const res = await fetch(url, { signal: options.signal, cache: 'force-cache' })
        if (res.ok) {
          success = true
        } else {
          console.warn(`[WarmUp] Turn ${i + 1} attempt ${attempts} returned status ${res.status}`)
        }
      } catch (err: any) {
        if (options.signal?.aborted) return false
        console.warn(`[WarmUp] Turn ${i + 1} attempt ${attempts} failed:`, err?.message || err)
      }

      if (!success && attempts < maxRetries) {
        // Jeda backoff sebelum mencoba lagi baris yang sama (600ms, 1200ms, dst.)
        await new Promise((r) => setTimeout(r, 600 * attempts))
      }
    }

    // Jika setelah maxRetries masih gagal, lanjutkan agar tidak memblokir selamanya,
    // tetapi baris tetap tercatat
    completedCount++
    if (options.onProgress) {
      options.onProgress(completedCount, total)
    }

    // Jeda wajar 300ms antar baris agar server HuggingFace tidak tertekan
    await new Promise((r) => setTimeout(r, 300))
  }

  return completedCount === total
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
