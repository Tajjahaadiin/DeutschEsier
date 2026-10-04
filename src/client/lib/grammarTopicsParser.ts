/**
 * Parser toleran untuk kolom `grammar_topics_json`.
 *
 * Kolom menyimpan satu objek JSON: { selected: string[], content: [...] }.
 * `selected` adalah pilihan guru (dipakai mengisi ulang dropdown), `content`
 * adalah materi hasil AI (dipakai tab Materi). Bentuk lama berupa array ID saja
 * tetap dibaca agar data yang sudah tersimpan tidak rusak.
 *
 * Semua fungsi murni dan tidak pernah melempar; data rusak menghasilkan array
 * kosong supaya halaman tetap bisa dibuka.
 */

import { isGrammarTopicId } from '../../shared/grammarTopics'

export interface GrammarTopicExample {
  german: string
  indonesian: string
  note: string
}

export interface GrammarTopicContent {
  topicId: string
  name: string
  nameId: string
  explanationId: string
  formula: string
  examples: GrammarTopicExample[]
}

function parseJson(raw: string | null | undefined): unknown {
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function toExample(value: unknown): GrammarTopicExample | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Record<string, unknown>
  if (typeof v.german !== 'string' || typeof v.indonesian !== 'string') return null
  return {
    german: v.german,
    indonesian: v.indonesian,
    // AI kadang tidak mengisi note; itu bukan alasan membuang contohnya.
    note: typeof v.note === 'string' ? v.note : '',
  }
}

function toContent(value: unknown): GrammarTopicContent | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Record<string, unknown>
  if (
    !isGrammarTopicId(v.topicId) ||
    typeof v.name !== 'string' ||
    typeof v.nameId !== 'string' ||
    typeof v.explanationId !== 'string' ||
    typeof v.formula !== 'string' ||
    !Array.isArray(v.examples)
  ) {
    return null
  }

  return {
    topicId: v.topicId,
    name: v.name,
    nameId: v.nameId,
    explanationId: v.explanationId,
    formula: v.formula,
    examples: v.examples.map(toExample).filter((e): e is GrammarTopicExample => e !== null),
  }
}

/** Ambil daftar ID topik yang dipilih guru dari kolom JSON. */
export function parseGrammarTopicIds(raw: string | null | undefined): string[] {
  const parsed = parseJson(raw)
  if (parsed === null) return []

  // Bentuk lama: array ID saja.
  const selected = Array.isArray(parsed)
    ? parsed
    : typeof parsed === 'object' && Array.isArray((parsed as any).selected)
    ? (parsed as any).selected
    : null

  if (!Array.isArray(selected)) return []
  return selected.filter((v): v is string => isGrammarTopicId(v))
}

/** Ambil materi topik hasil AI dari kolom JSON. */
export function parseGrammarTopics(raw: string | null | undefined): GrammarTopicContent[] {
  const parsed = parseJson(raw)
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return []

  const content = (parsed as any).content
  if (!Array.isArray(content)) return []

  return content.map(toContent).filter((c): c is GrammarTopicContent => c !== null)
}
