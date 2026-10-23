/**
 * Taksonomi peran gramatikal potongan kalimat (Satzbau).
 *
 * Satu sumber kebenaran tunggal yang dipakai bersama oleh klien dan server
 * untuk menentukan klasifikasi sintaksis potongan kata pada kalimat Jerman:
 * - subjekt: Subjek pelaku/topik kalimat
 * - praedikat: Kata kerja (verba inti atau verba bantu)
 * - objekt: Objek langsung (Akkusativ) atau tidak langsung (Dativ)
 * - other: Keterangan waktu/tempat, kata tanya, negasi, atau partikel
 *
 * ATURAN IMPORT:
 * - Sisi klien boleh memakai alias `@/shared/grammarRoles`.
 * - Sisi server dan file tes WAJIB memakai jalur relatif (`../../shared/grammarRoles`
 *   atau `../shared/grammarRoles`) karena esbuild bundler tidak membaca paths tsconfig.
 */

export const GRAMMAR_ROLES = ['subjekt', 'praedikat', 'objekt', 'other'] as const

export type GrammarSegmentRole = (typeof GRAMMAR_ROLES)[number]

export const GRAMMAR_ROLE_SET: ReadonlySet<string> = new Set(GRAMMAR_ROLES)

/** Cek apakah nilai adalah salah satu peran gramatikal yang sah. */
export function isGrammarRole(value: unknown): value is GrammarSegmentRole {
  return typeof value === 'string' && GRAMMAR_ROLE_SET.has(value)
}

/**
 * Normalisasi peran: bila nilai tidak dikenal atau kosong, fallback ke 'other'
 * agar kalimat tetap dapat ditampilkan utuh tanpa membuang teks.
 */
export function normalizeRole(value: unknown): GrammarSegmentRole {
  return isGrammarRole(value) ? value : 'other'
}
