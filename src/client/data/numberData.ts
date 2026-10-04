import { numberWord } from '../lib/numberGame'

/**
 * Bank angka Jerman untuk fitur "die Nummer".
 *
 * Ejaan diambil dari numberWord() agar tidak ada dua sumber kebenaran, dan
 * pelafalan ditulis dalam pendekatan ejaan Indonesia supaya mudah dibaca siswa.
 */

export interface NumberItem {
  value: number
  /** Ejaan Jerman, mis. "einundzwanzig". */
  german: string
  /** Perkiraan pelafalan untuk pembaca Indonesia. */
  pronunciation: string
  /** Terjemahan Indonesia. */
  meaningId: string
}

const PRONUNCIATION: Record<number, string> = {
  0: 'nul',
  1: 'ains',
  2: 'tsvai',
  3: 'drai',
  4: 'fiir',
  5: 'fünf',
  6: 'zeks',
  7: 'ziiben',
  8: 'akht',
  9: 'noin',
  10: 'tseen',
  11: 'elf',
  12: 'tsvölf',
  13: 'DRAI-tseen',
  14: 'FIIR-tseen',
  15: 'FÜNF-tseen',
  16: 'ZEKS-tseen',
  17: 'ZIIP-tseen',
  18: 'AKHT-tseen',
  19: 'NOIN-tseen',
  20: 'TSVAN-tsikh',
  30: 'DRAI-sikh',
  40: 'FIIR-tsikh',
  50: 'FÜNF-tsikh',
  60: 'ZEKS-tsikh',
  70: 'ZIIP-tsikh',
  80: 'AKHT-tsikh',
  90: 'NOIN-tsikh',
  100: 'HUN-dert',
}

const MEANING: Record<number, string> = {
  0: 'nol',
  1: 'satu',
  2: 'dua',
  3: 'tiga',
  4: 'empat',
  5: 'lima',
  6: 'enam',
  7: 'tujuh',
  8: 'delapan',
  9: 'sembilan',
  10: 'sepuluh',
  11: 'sebelas',
  12: 'dua belas',
  13: 'tiga belas',
  14: 'empat belas',
  15: 'lima belas',
  16: 'enam belas',
  17: 'tujuh belas',
  18: 'delapan belas',
  19: 'sembilan belas',
  20: 'dua puluh',
  30: 'tiga puluh',
  40: 'empat puluh',
  50: 'lima puluh',
  60: 'enam puluh',
  70: 'tujuh puluh',
  80: 'delapan puluh',
  90: 'sembilan puluh',
  100: 'seratus',
}

const VALUES = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 30, 40, 50, 60, 70, 80,
  90, 100,
]

/** Daftar kartu angka, urut menaik. */
export const NUMBER_ITEMS: NumberItem[] = VALUES.map((value) => ({
  value,
  german: numberWord(value),
  pronunciation: PRONUNCIATION[value] ?? '',
  meaningId: MEANING[value] ?? String(value),
}))
