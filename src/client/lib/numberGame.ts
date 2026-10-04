/**
 * Mesin latihan angka Jerman: ejaan angka + penggabungan angka dengan kata benda.
 *
 * Semua fungsi murni (pure) agar mudah diuji. Tidak ada panggilan AI maupun
 * akses jaringan; data kata benda disuplai pemanggil.
 */

export type GrammaticalGender = 'der' | 'die' | 'das'

/** Kata benda yang bisa dipakai di game angka + benda. */
export interface NumberObject {
  noun: string
  article: GrammaticalGender
  plural: string
  emoji: string
  meaningId: string
}

export interface CombinedPhrase {
  /** Frasa Jerman lengkap, mis. "zwei Tomaten". */
  german: string
  /** Teks yang layak dibacakan TTS Jerman. */
  audioText: string
  /** Terjemahan Indonesia, mis. "2 tomat". */
  indonesian: string
  emoji: string
}

const UNITS = [
  'null',
  'eins',
  'zwei',
  'drei',
  'vier',
  'fünf',
  'sechs',
  'sieben',
  'acht',
  'neun',
  'zehn',
  'elf',
  'zwölf',
]

/** 13-19 memakai akar khusus: sech -> sechzehn, sieben -> siebzehn. */
const TEENS: Record<number, string> = {
  13: 'dreizehn',
  14: 'vierzehn',
  15: 'fünfzehn',
  16: 'sechzehn',
  17: 'siebzehn',
  18: 'achtzehn',
  19: 'neunzehn',
}

const TENS: Record<number, string> = {
  20: 'zwanzig',
  30: 'dreißig',
  40: 'vierzig',
  50: 'fünfzig',
  60: 'sechzig',
  70: 'siebzig',
  80: 'achtzig',
  90: 'neunzig',
}

/**
 * Ejaan angka Jerman untuk 0-100 (batas latihan).
 *
 * Di atas 20 angka disusun "satuan + und + puluhan" dan ditulis menyatu,
 * mis. 21 -> einundzwanzig. Satuan 1 memakai "ein" (bukan "eins").
 */
export function numberWord(n: number): string {
  if (!Number.isFinite(n) || n < 0) return ''
  const value = Math.floor(n)
  if (value > 100) return String(value)
  if (value === 100) return 'hundert'
  if (value <= 12) return UNITS[value]
  if (value < 20) return TEENS[value]
  if (value % 10 === 0) return TENS[value]

  const tens = Math.floor(value / 10) * 10
  const unit = value % 10
  const unitWord = unit === 1 ? 'ein' : UNITS[unit]
  return `${unitWord}und${TENS[tens]}`
}

/** Artikel tak tentu sesuai jenis kelamin: die -> eine, der/das -> ein. */
function indefiniteArticle(article: GrammaticalGender): string {
  return article === 'die' ? 'eine' : 'ein'
}

/**
 * Gabungkan angka dengan kata benda memakai bentuk yang benar secara tata bahasa.
 *
 * Angka 1 memakai bentuk tunggal dengan artikel tak tentu (eine Tomate,
 * ein Apfel). Angka lain memakai bentuk jamak (zwei Tomaten, null Tomaten).
 */
export function combineNumberAndNoun(n: number, object: NumberObject): CombinedPhrase {
  const word = numberWord(n)
  const german =
    n === 1
      ? `${indefiniteArticle(object.article)} ${object.noun}`
      : `${word} ${object.plural}`

  return {
    german,
    audioText: german,
    indonesian: `${n} ${object.meaningId}`,
    emoji: object.emoji,
  }
}
