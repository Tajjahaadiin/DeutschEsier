/**
 * Parser toleran untuk kolom `grammar_questions_json`.
 *
 * Kolom menyimpan array soal latihan tata bahasa yang dihasilkan AI: setiap soal
 * berisi satu kalimat Jerman yang harus dinilai benar/salah secara tata bahasa,
 * penjelasan aturannya dalam bahasa Indonesia, dan bentuk kalimat yang benar.
 *
 * Semua fungsi murni dan tidak pernah melempar; data rusak menghasilkan array
 * kosong supaya tab Latihan tetap bisa dibuka (pemanggil akan memakai soal lama
 * sebagai cadangan).
 */

import { isGrammarTopicId } from '../../shared/grammarTopics'
import { type GrammarSegmentRole } from './grammarPatterns'

export interface AiGrammarQuestionSegment {
  text: string
  role: GrammarSegmentRole
}

export interface AiGrammarQuestion {
  id: string
  /** Kalimat Jerman yang harus dinilai benar/salah tata bahasanya. */
  sentence: string
  /** true = kalimat itu benar secara tata bahasa. */
  isCorrect: boolean
  /** Penjelasan aturan dalam bahasa Indonesia. */
  explanationId: string
  /** Bentuk kalimat yang benar (sama dengan sentence bila isCorrect true). */
  correctedSentence: string
  /** Topik tata bahasa yang diuji. */
  topicId: string
  segments: AiGrammarQuestionSegment[]
  /** Teks yang layak dibacakan TTS Jerman. */
  audioText: string
}

const ROLES: readonly GrammarSegmentRole[] = ['subjekt', 'praedikat', 'objekt', 'other']

function normalizeRole(value: unknown): GrammarSegmentRole {
  return ROLES.includes(value as GrammarSegmentRole)
    ? (value as GrammarSegmentRole)
    : 'other'
}

function parseJson(raw: string | null | undefined): unknown {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function toSegment(value: unknown): AiGrammarQuestionSegment | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Record<string, unknown>
  if (typeof v.text !== 'string' || v.text === '') return null
  return { text: v.text, role: normalizeRole(v.role) }
}

function toQuestion(value: unknown, index: number): AiGrammarQuestion | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Record<string, unknown>

  if (
    typeof v.sentence !== 'string' ||
    v.sentence.trim() === '' ||
    typeof v.isCorrect !== 'boolean' ||
    typeof v.explanationId !== 'string' ||
    v.explanationId.trim() === '' ||
    !isGrammarTopicId(v.topicId)
  ) {
    return null
  }

  const corrected =
    typeof v.correctedSentence === 'string' && v.correctedSentence.trim() !== ''
      ? v.correctedSentence
      : // Soal yang benar tidak butuh koreksi; pakai kalimatnya sendiri.
        v.isCorrect
        ? v.sentence
        : ''

  return {
    id: `grammar-ai-${index}`,
    sentence: v.sentence,
    isCorrect: v.isCorrect,
    explanationId: v.explanationId,
    correctedSentence: corrected,
    topicId: v.topicId,
    segments: Array.isArray(v.segments)
      ? v.segments
          .map(toSegment)
          .filter((s): s is AiGrammarQuestionSegment => s !== null)
      : [],
    audioText: v.sentence,
  }
}

/**
 * Baca soal latihan dari kolom JSON. Soal yang tidak lengkap atau memakai topik
 * yang tidak dikenal dibuang, tetapi soal lain tetap dipertahankan.
 */
export function parseGrammarQuestions(
  raw: string | null | undefined
): AiGrammarQuestion[] {
  const parsed = parseJson(raw)
  if (!Array.isArray(parsed)) return []

  return parsed
    .map((entry, i) => toQuestion(entry, i))
    .filter((q): q is AiGrammarQuestion => q !== null)
}
