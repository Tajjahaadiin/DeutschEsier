/**
 * Pola kalimat (S-P-O dll.) untuk tab Materi grammatik.
 *
 * Pola dihasilkan AI saat generate dan disimpan sebagai JSON di
 * `learning_session.grammar_patterns_json`. Berkas ini hanya membaca dan
 * menormalkan data tersebut; tidak ada panggilan AI di sisi klien.
 *
 * Fungsi di sini murni (pure) agar mudah diuji.
 */

/** Peran gramatikal satu potongan kalimat, dipakai untuk pewarnaan. */
export type GrammarSegmentRole = 'subjekt' | 'praedikat' | 'objekt' | 'other'

export interface GrammarSegment {
  text: string
  role: GrammarSegmentRole
}

export interface GrammarPattern {
  /** Nama Jerman, mis. "Aussagesatz". */
  name: string
  /** Padanan Indonesia, mis. "Kalimat Berita". */
  nameId: string
  /** Rumus singkat, mis. "Subjekt – Prädikat – Objekt". */
  formula: string
  exampleGerman: string
  exampleIndonesian: string
  segments: GrammarSegment[]
}

const ROLES: readonly GrammarSegmentRole[] = ['subjekt', 'praedikat', 'objekt', 'other']

/**
 * Role yang tidak dikenal diubah menjadi 'other' (bukan dibuang), supaya
 * kalimatnya tetap bisa ditampilkan utuh walaupun AI memakai istilah lain.
 */
function normalizeRole(value: unknown): GrammarSegmentRole {
  return ROLES.includes(value as GrammarSegmentRole)
    ? (value as GrammarSegmentRole)
    : 'other'
}

function toSegment(value: unknown): GrammarSegment | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Record<string, unknown>
  if (typeof v.text !== 'string') return null
  return { text: v.text, role: normalizeRole(v.role) }
}

function toPattern(value: unknown): GrammarPattern | null {
  if (typeof value !== 'object' || value === null) return null
  const v = value as Record<string, unknown>
  if (
    typeof v.name !== 'string' ||
    typeof v.nameId !== 'string' ||
    typeof v.formula !== 'string' ||
    typeof v.exampleGerman !== 'string' ||
    typeof v.exampleIndonesian !== 'string' ||
    !Array.isArray(v.segments)
  ) {
    return null
  }

  return {
    name: v.name,
    nameId: v.nameId,
    formula: v.formula,
    exampleGerman: v.exampleGerman,
    exampleIndonesian: v.exampleIndonesian,
    segments: v.segments
      .map(toSegment)
      .filter((s): s is GrammarSegment => s !== null),
  }
}

/**
 * Baca pola kalimat dari kolom JSON. Toleran terhadap data kosong/rusak:
 * apa pun yang tidak bisa dibaca menghasilkan array kosong, dan pola yang
 * bentuknya tidak lengkap dibuang tanpa menggagalkan sisanya.
 */
export function parseGrammarPatterns(raw: string | null | undefined): GrammarPattern[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .map(toPattern)
      .filter((p): p is GrammarPattern => p !== null)
  } catch {
    return []
  }
}

/**
 * Apakah potongan `segments` menyusun persis `exampleGerman`.
 * Bila tidak, UI menampilkan kalimat apa adanya tanpa pewarnaan peran.
 */
export function segmentsCoverExample(pattern: GrammarPattern): boolean {
  const joined = pattern.segments.map((s) => s.text).join('')
  return joined === pattern.exampleGerman
}
