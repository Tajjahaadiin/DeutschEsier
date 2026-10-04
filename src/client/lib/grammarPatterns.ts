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

/** Satu potongan kalimat beserta perannya; role null = tanpa warna. */
export interface CoveredSpan {
  text: string
  role: GrammarSegmentRole | null
}

/** Minimal 60% karakter non-spasi harus tercakup agar pewarnaan dianggap layak. */
const MIN_COVERAGE = 0.6

function nonSpaceLength(text: string): number {
  return text.replace(/\s+/g, '').length
}

/** Satu span polos yang memuat seluruh kalimat (tidak pernah kehilangan teks). */
function plainSpan(sentence: string): CoveredSpan[] {
  return [{ text: sentence, role: null }]
}

/**
 * Pecah kalimat menjadi potongan berwarna memakai `segments`, secara TOLERAN.
 *
 * Berbeda dari segmentsCoverExample yang menuntut kesamaan persis, fungsi ini
 * dipakai untuk soal latihan yang teksnya ditulis AI sehingga sering meleset
 * sedikit. Kontrak utamanya: gabungan span yang dikembalikan SELALU sama persis
 * dengan `sentence`, jadi kalimat tidak pernah hilang.
 *
 * Urutan usaha:
 * 1. Gabungan segmen sama persis.
 * 2. Sama setelah dinormalisasi (huruf kecil, spasi dirapikan).
 * 3. Pencocokan berurutan per segmen; celah diberi role null; dipakai hanya
 *    bila cakupannya minimal MIN_COVERAGE.
 * 4. Satu span polos.
 */
export function coverSentence(
  sentence: string,
  segments: { text: string; role: GrammarSegmentRole }[]
): CoveredSpan[] {
  if (!sentence) return []
  if (!Array.isArray(segments) || segments.length === 0) return plainSpan(sentence)

  const usable = segments.filter((s) => typeof s.text === 'string' && s.text !== '')
  if (usable.length === 0) return plainSpan(sentence)

  // 1: kesamaan persis (jalur cepat).
  const joined = usable.map((s) => s.text).join('')
  if (joined === sentence) {
    return usable.map((s) => ({ text: s.text, role: s.role }))
  }

  // 2 & 3: pencocokan berurutan dengan cursor pada kalimat asli. Ini juga
  // menangani perbedaan spasi/huruf besar-kecil, dan karena span diambil dari
  // `sentence` sendiri, hasilnya selalu menyusun ulang kalimat aslinya.
  const haystack = sentence.toLowerCase()
  const spans: CoveredSpan[] = []
  let cursor = 0
  let covered = 0

  for (const seg of usable) {
    const needle = seg.text.toLowerCase().trim()
    if (needle === '') continue

    const found = haystack.indexOf(needle, cursor)
    if (found === -1) continue

    if (found > cursor) {
      spans.push({ text: sentence.slice(cursor, found), role: null })
    }
    spans.push({ text: sentence.slice(found, found + needle.length), role: seg.role })
    covered += needle.replace(/\s+/g, '').length
    cursor = found + needle.length
  }

  if (cursor < sentence.length) {
    spans.push({ text: sentence.slice(cursor), role: null })
  }

  const total = nonSpaceLength(sentence)
  if (total === 0 || covered / total < MIN_COVERAGE) return plainSpan(sentence)

  return spans
}
