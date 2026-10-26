/**
 * Definisi terpusat persona Text-to-Speech (TTS) bahasa Jerman (Hochdeutsch).
 *
 * Menggunakan arsitektur Zero-Vendor dengan 6 persona vokal (3 pria + 3 wanita):
 * - Backend: Gemini 2.5 Flash TTS (@google/genai) via prebuilt voice config
 * - Fallback Client: Web Speech API (window.speechSynthesis) dengan profil akustik pitch/rate
 *
 * ATURAN IMPORT:
 * - Klien dapat mengimpor via `@/shared/ttsPersonas` atau jalur relatif.
 * - Sisi server dan file tes WAJIB mengimpor via jalur relatif (`../../shared/ttsPersonas`).
 */

export interface TtsPersona {
  id: TtsPersonaId
  name: string
  gender: 'male' | 'female'
  voiceId: string
  geminiVoiceName: string
  roleId: string
  descriptionId: string
  emoji: string
}

/**
 * Tiga persona yang diekspos ke UI pemilih suara — sama dengan
 * `SCENARIO_PERSONAS` di bawah.
 *
 * `male-3`, `female-2`, dan `female-3` dihapus: ketiganya tidak pernah dipilih
 * oleh UI maupun logika (`female-2` bahkan duplikat persis `weiblich` — voiceId
 * Amala yang sama). `male-1`/`male-2` juga hilang dari daftar ini; keduanya
 * tetap hidup sebagai alias legacy di `getTtsPersona()`.
 *
 * `female-1` (Katja) TIDAK lagi di daftar ini tetapi tetap resolvable lewat
 * `getTtsPersona()` karena `GRUNDLAGEN_PERSONA_ID` memakainya sebagai tujuan
 * fallback dinamis Die Grundlagen.
 */
export const TTS_PERSONAS: readonly TtsPersona[] = [
  {
    id: 'weiblich',
    name: 'Weiblich',
    gender: 'female',
    voiceId: 'de-DE-AmalaNeural',
    geminiVoiceName: 'Zephyr',
    roleId: 'Karakter Wanita (Die Sprecherin)',
    descriptionId: 'Suara wanita ceria, artikulatif, nada ramah',
    emoji: '👩',
  },
  {
    id: 'männlich-1',
    name: 'Männlich 1',
    gender: 'male',
    voiceId: 'de-DE-ConradNeural',
    geminiVoiceName: 'Charon',
    roleId: 'Karakter Pria 1 (Der Sprecher 1)',
    descriptionId: 'Suara pria dewasa, tegas & berwibawa (timbre kontras)',
    emoji: '👨',
  },
  {
    id: 'männlich-2',
    name: 'Männlich 2',
    gender: 'male',
    voiceId: 'de-DE-KillianNeural',
    geminiVoiceName: 'Puck',
    roleId: 'Karakter Pria 2 (Der Sprecher 2)',
    descriptionId: 'Suara pria muda, energik & luwes',
    emoji: '🧑',
  },
] as const

export const CANONICAL_SCENARIO_PERSONAS: readonly TtsPersona[] = TTS_PERSONAS

export type TtsPersonaId = 'weiblich' | 'männlich-1' | 'männlich-2' | 'male-1' | 'male-2' | 'female-1'

export const DEFAULT_MALE_PERSONA: TtsPersonaId = 'male-1'
export const DEFAULT_FEMALE_PERSONA: TtsPersonaId = 'female-1'

/**
 * Suara tunggal permanen untuk seluruh materi dasar (Die Grundlagen).
 * Katja: Vokal jernih, hangat & artikulatif untuk drill fonetik dan kosakata.
 */
export const GRUNDLAGEN_PERSONA_ID: TtsPersonaId = 'female-1'

/**
 * 3 Persona terkurasi untuk Scenario Generator (1 Wanita + 2 Pria).
 * Format kanonikal: weiblich, männlich-1, männlich-2.
 */
export const SCENARIO_PERSONAS: readonly TtsPersona[] = CANONICAL_SCENARIO_PERSONAS

/**
 * Katja (female-1) tidak lagi diekspos sebagai persona pilihan, tetapi tetap
 * harus bisa di-resolve: `GRUNDLAGEN_PERSONA_ID` memakainya sebagai tujuan
 * fallback dinamis Die Grundlagen saat aset statis gagal dimuat.
 */
const GRUNDLAGEN_PERSONA: TtsPersona = {
  id: 'female-1',
  name: 'Katja',
  gender: 'female',
  voiceId: 'de-DE-KatjaNeural',
  geminiVoiceName: 'Kore',
  roleId: 'Tutor Utama (Die Lehrerin)',
  descriptionId: 'Dewasa, vokal jernih, hangat & artikulatif (Grundlagen)',
  emoji: '👩‍🏫',
}

/** Alias legacy yang masih diterima dari localStorage/sesi lama. */
const LEGACY_ALIASES: readonly TtsPersona[] = [
  { ...GRUNDLAGEN_PERSONA, id: 'male-1', name: 'Conrad', gender: 'male', voiceId: 'de-DE-ConradNeural', emoji: '👨‍🏫' },
  { ...GRUNDLAGEN_PERSONA, id: 'male-2', name: 'Killian', gender: 'male', voiceId: 'de-DE-KillianNeural', emoji: '🧑‍🎓' },
]

const ALL_LOOKUP_PERSONAS = [
  ...TTS_PERSONAS,
  ...CANONICAL_SCENARIO_PERSONAS,
  GRUNDLAGEN_PERSONA,
  ...LEGACY_ALIASES,
]

const PERSONA_BY_ID = new Map<string, TtsPersona>(
  ALL_LOOKUP_PERSONAS.map((p) => [p.id, p])
)

const PERSONA_BY_VOICE = new Map<string, TtsPersona>(
  ALL_LOOKUP_PERSONAS.map((p) => [p.voiceId.toLowerCase(), p])
)

export function getTtsPersona(id: unknown): TtsPersona | undefined {
  if (typeof id !== 'string') return undefined
  return PERSONA_BY_ID.get(id)
}

/**
 * Resolusi voiceId Microsoft Edge TTS berdasarkan personaId atau voiceId langsung,
 * dengan fallback ke gender bila tidak ditemukan.
 */
export function resolveEdgeVoiceId(
  voiceOrPersona: string | undefined | null,
  fallbackGender: 'male' | 'female' = 'female'
): string {
  if (!voiceOrPersona) {
    return fallbackGender === 'male' ? 'de-DE-ConradNeural' : 'de-DE-KatjaNeural'
  }

  // 1. Cek apakah cocok persona ID (misal: 'männlich-1', 'female-1')
  const byId = PERSONA_BY_ID.get(voiceOrPersona)
  if (byId) return byId.voiceId

  // 2. Cek apakah cocok nama suara langsung (misal: 'de-DE-KillianNeural')
  const byVoice = PERSONA_BY_VOICE.get(voiceOrPersona.toLowerCase())
  if (byVoice) return byVoice.voiceId

  // 3. Fallback gender string
  if (voiceOrPersona.toLowerCase() === 'male') return 'de-DE-ConradNeural'
  if (voiceOrPersona.toLowerCase() === 'female') return 'de-DE-KatjaNeural'

  // Default aman
  return 'de-DE-KatjaNeural'
}

/**
 * Resolusi nama suara Gemini TTS berdasarkan personaId atau nama suara langsung.
 */
export function resolveGeminiVoiceName(
  voiceOrPersona: string | undefined | null,
  fallbackGender: 'male' | 'female' = 'female'
): string {
  if (!voiceOrPersona) {
    return fallbackGender === 'male' ? 'Charon' : 'Kore'
  }

  const byId = PERSONA_BY_ID.get(voiceOrPersona)
  if (byId) return byId.geminiVoiceName

  const byVoice = PERSONA_BY_VOICE.get(voiceOrPersona.toLowerCase())
  if (byVoice) return byVoice.geminiVoiceName

  if (voiceOrPersona.toLowerCase() === 'male') return 'Charon'
  if (voiceOrPersona.toLowerCase() === 'female') return 'Kore'

  return 'Kore'
}
