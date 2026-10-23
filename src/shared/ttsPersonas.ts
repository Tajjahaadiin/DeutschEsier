/**
 * Definisi terpusat persona Text-to-Speech (TTS) bahasa Jerman (Hochdeutsch).
 *
 * Menggunakan suara Microsoft Edge Neural TTS bawaan (msedge-tts) dengan
 * 6 persona vokal (3 pria + 3 wanita) untuk mendukung skenario percakapan
 * hingga 6 karakter pembicara yang berbeda usia, peran, dan gaya bicara.
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
  roleId: string
  descriptionId: string
  emoji: string
}

export const TTS_PERSONAS: readonly TtsPersona[] = [
  {
    id: 'male-1',
    name: 'Conrad',
    gender: 'male',
    voiceId: 'de-DE-ConradNeural',
    roleId: 'Guru Formal (Der Lehrer)',
    descriptionId: 'Dewasa matang, bariton tegas, artikulasi akademis',
    emoji: '👨‍🏫',
  },
  {
    id: 'male-2',
    name: 'Killian',
    gender: 'male',
    voiceId: 'de-DE-KillianNeural',
    roleId: 'Mahasiswa Santai (Der Student)',
    descriptionId: 'Muda, tenor luwes, percakapan sehari-hari',
    emoji: '🧑‍🎓',
  },
  {
    id: 'male-3',
    name: 'Florian',
    gender: 'male',
    voiceId: 'de-DE-FlorianMultilingualNeural',
    roleId: 'Rekan Kerja (Der Kollege)',
    descriptionId: 'Dewasa muda, modern, lugas & profesional',
    emoji: '👨‍💼',
  },
  {
    id: 'female-1',
    name: 'Katja',
    gender: 'female',
    voiceId: 'de-DE-KatjaNeural',
    roleId: 'Tutor Utama (Die Lehrerin)',
    descriptionId: 'Dewasa, vokal jernih, hangat & artikulatif',
    emoji: '👩‍🏫',
  },
  {
    id: 'female-2',
    name: 'Amala',
    gender: 'female',
    voiceId: 'de-DE-AmalaNeural',
    roleId: 'Rekan Belajar (Die Studentin)',
    descriptionId: 'Muda, ceria, energik & dinamis',
    emoji: '👧',
  },
  {
    id: 'female-3',
    name: 'Seraphina',
    gender: 'female',
    voiceId: 'de-DE-SeraphinaMultilingualNeural',
    roleId: 'Konsultan Ramah (Die Beraterin)',
    descriptionId: 'Dewasa muda, nada ramah, empatik & halus',
    emoji: '👩‍💼',
  },
] as const

export type TtsPersonaId =
  | 'male-1'
  | 'male-2'
  | 'male-3'
  | 'female-1'
  | 'female-2'
  | 'female-3'

export const DEFAULT_MALE_PERSONA: TtsPersonaId = 'male-1'
export const DEFAULT_FEMALE_PERSONA: TtsPersonaId = 'female-1'

const PERSONA_BY_ID = new Map<string, TtsPersona>(
  TTS_PERSONAS.map((p) => [p.id, p])
)

const PERSONA_BY_VOICE = new Map<string, TtsPersona>(
  TTS_PERSONAS.map((p) => [p.voiceId.toLowerCase(), p])
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

  // 1. Cek apakah cocok persona ID (misal: 'male-1', 'female-2')
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
