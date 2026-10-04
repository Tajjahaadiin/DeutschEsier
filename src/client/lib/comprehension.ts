/**
 * Logika soal Richtig/Falsch (Benar/Salah) level B1.
 *
 * Soal dihasilkan AI saat generate dan disimpan sebagai JSON di
 * `learning_session.comprehension_questions_json`. Berkas ini hanya membaca
 * dan menilai data tersebut; tidak ada panggilan AI di sisi klien.
 *
 * Fungsi di sini murni (pure) agar mudah diuji.
 */

export type ComprehensionAnswer = 'richtig' | 'falsch'

export interface ComprehensionQuestion {
  /** Pernyataan bahasa Jerman yang harus dinilai Benar/Salah. */
  statement: string
  /** Terjemahan Indonesia dari statement. */
  indonesianText: string
  /** Kunci jawaban: true = pernyataan sesuai dialog. */
  isCorrect: boolean
  /** Penjelasan singkat berdasarkan konteks dialog. */
  explanation: string
}

function isQuestion(value: unknown): value is ComprehensionQuestion {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.statement === 'string' &&
    typeof v.indonesianText === 'string' &&
    typeof v.isCorrect === 'boolean' &&
    typeof v.explanation === 'string'
  )
}

/**
 * Baca soal dari kolom JSON. Toleran terhadap data kosong/rusak: apa pun yang
 * tidak bisa dibaca menghasilkan array kosong, dan soal yang bentuknya tidak
 * lengkap dibuang tanpa menggagalkan sisanya.
 */
export function parseComprehensionQuestions(raw: string | null | undefined): ComprehensionQuestion[] {
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isQuestion)
  } catch {
    return []
  }
}

/**
 * Nilai jawaban siswa terhadap kunci soal.
 *
 * Jawaban yang bukan 'richtig'/'falsch' (mis. belum dijawab) dianggap salah,
 * supaya soal berkunci Falsch tidak otomatis dinilai benar.
 */
export function isCorrectAnswer(
  question: ComprehensionQuestion,
  answer: ComprehensionAnswer
): boolean {
  if (answer !== 'richtig' && answer !== 'falsch') return false
  return (answer === 'richtig') === question.isCorrect
}
