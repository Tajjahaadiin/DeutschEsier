/**
 * Logika pembelajaran & latihan grammatik.
 *
 * Sumber data: `vocabClues` yang sudah dihasilkan AI per skenario
 * (germanWord, indonesianMeaning, grammarTip). Tidak ada panggilan AI tambahan
 * dan tidak ada perubahan skema database — semua diturunkan saat runtime.
 *
 * Semua fungsi di sini murni (pure) agar mudah diuji.
 */

export type GrammarCategory =
  | 'Verb'
  | 'Nomen'
  | 'Adjektiv'
  | 'Konjunktion'
  | 'Präposition'
  | 'Sonstiges'

export interface GrammarVocabItem {
  germanWord: string
  indonesianMeaning: string
  grammarTip: string
  category: GrammarCategory
  /** 'der' | 'die' | 'das' bila kata diawali artikel. */
  article?: string
  /** Kata benda tanpa artikel, mis. 'Missverständnis'. */
  noun?: string
  /** Kalimat asli dari dialog yang memuat kata ini (untuk latihan mendengar). */
  exampleSentence?: string
}

export interface GrammarTopic {
  category: GrammarCategory
  /** Label kategori dalam bahasa Indonesia. */
  label: string
  /** Penjelasan singkat kategori. */
  description: string
  items: GrammarVocabItem[]
}

export type GrammarQuestionKind = 'sentence' | 'concept'

export interface GrammarQuestion {
  id: string
  kind: GrammarQuestionKind
  /** Pernyataan yang harus dinilai Richtig / Falsch. */
  statement: string
  /** true = pernyataan benar (Richtig). */
  isCorrect: boolean
  /** Penjelasan dari grammarTip aslinya. */
  explanation: string
  /** Kata kunci sumber soal. */
  source: string
  /**
   * Teks yang layak dibacakan TTS Jerman.
   * Sengaja dipisah dari `statement` karena sebagian pernyataan memuat
   * terjemahan Indonesia yang akan salah diucapkan mesin TTS Jerman.
   */
  audioText: string
}

const CATEGORY_META: Record<GrammarCategory, { label: string; description: string }> = {
  Verb: {
    label: 'Kata Kerja (Verb)',
    description: 'Konjugasi, kata kerja terpisah, dan penggunaan dalam kalimat.',
  },
  Nomen: {
    label: 'Kata Benda (Nomen)',
    description: 'Artikel (der/die/das) dan bentuk jamak.',
  },
  Adjektiv: {
    label: 'Kata Sifat (Adjektiv)',
    description: 'Penggunaan sifat dan kata depan yang menyertainya.',
  },
  Konjunktion: {
    label: 'Kata Sambung (Konjunktion)',
    description: 'Penghubung klausa dan pengaruhnya pada susunan kalimat.',
  },
  Präposition: {
    label: 'Kata Depan (Präposition)',
    description: 'Kata depan dan kasus yang diwajibkannya.',
  },
  Sonstiges: {
    label: 'Ungkapan & Lainnya',
    description: 'Frasa dan catatan bahasa lain dari skenario ini.',
  },
}

const ARTICLES = ['der', 'die', 'das'] as const

/** Artikel lain yang pasti salah untuk sebuah kata benda. */
const WRONG_ARTICLE: Record<string, string> = {
  der: 'die',
  die: 'das',
  das: 'der',
}

const OTHER_CATEGORY: Record<GrammarCategory, GrammarCategory> = {
  Verb: 'Nomen',
  Nomen: 'Verb',
  Adjektiv: 'Konjunktion',
  Konjunktion: 'Adjektiv',
  Präposition: 'Nomen',
  Sonstiges: 'Nomen',
}

/**
 * Artikel yang tepat untuk tiap nama kategori saat dipakai dalam kalimat Jerman.
 * Konjunktion dan Präposition feminin (die), sisanya netral (das).
 */
const CATEGORY_ARTICLE: Record<GrammarCategory, string> = {
  Verb: 'ein',
  Nomen: 'ein',
  Adjektiv: 'ein',
  Konjunktion: 'eine',
  Präposition: 'eine',
  Sonstiges: 'ein',
}

/**
 * Deteksi kategori grammar dari grammarTip.
 *
 * Sengaja konservatif: bila tidak ada kata kunci yang jelas, hasilnya
 * 'Sonstiges'. Lebih baik tidak membuat soal daripada membuat soal salah.
 * Catatan: tip AI memakai istilah Indonesia ("preposisi", "kata kerja")
 * maupun Jerman ("Präposition", "Verb"), jadi keduanya harus dikenali.
 */
export function detectCategory(grammarTip: string, germanWord = ''): GrammarCategory {
  const t = (grammarTip || '').toLowerCase()

  if (/kata sambung|subjunktion|konjunktion/.test(t)) return 'Konjunktion'
  if (/kata depan|preposisi|praposition|präposition/.test(t)) return 'Präposition'
  if (/kata benda|substantiv|nomen|jamaknya/.test(t)) return 'Nomen'
  if (/kata sifat|adjektiv/.test(t)) return 'Adjektiv'
  if (/kata kerja|verb\b|verben|konjugasi|trennbare|regelmassig|regelmäßig/.test(t)) return 'Verb'

  // Fallback: kata berhuruf kecil yang berakhiran -en/-n hampir pasti infinitif
  // verba, karena semua kata benda Jerman ditulis dengan huruf kapital.
  const w = (germanWord || '').trim()
  if (/^[a-zäöüß]/.test(w) && /(en|n)$/.test(w)) return 'Verb'

  return 'Sonstiges'
}

/** Pisahkan artikel dari kata benda, mis. 'das Missverständnis' -> { article:'das', noun:'Missverständnis' }. */
export function splitArticle(germanWord: string): { article?: string; noun: string } {
  const trimmed = (germanWord || '').trim()
  for (const a of ARTICLES) {
    const prefix = a + ' '
    if (trimmed.toLowerCase().startsWith(prefix)) {
      return { article: a, noun: trimmed.slice(prefix.length).trim() }
    }
  }
  return { noun: trimmed }
}

export function toVocabItem(
  v: { germanWord: string; indonesianMeaning: string; grammarTip: string },
  sentences: string[] = []
): GrammarVocabItem {
  const { article, noun } = splitArticle(v.germanWord)
  return {
    germanWord: v.germanWord,
    indonesianMeaning: v.indonesianMeaning,
    grammarTip: v.grammarTip,
    category: detectCategory(v.grammarTip, v.germanWord),
    article,
    noun,
    exampleSentence: findExampleSentence(v.germanWord, sentences),
  }
}

/**
 * Akar kata yang cukup khas untuk pencarian.
 *
 * Dialog memakai bentuk terkonjugasi ("ich heiße", "ich komme"), sedangkan
 * vocabClues menyimpan bentuk dasar ("heißen", "kommen aus"). Karena itu
 * pencocokan kata persis selalu gagal; kita cocokkan pada akarnya.
 */
function stemsOf(germanWord: string): string[] {
  const clean = (germanWord || '').replace(/^(der|die|das)\s+/i, '').trim()
  const tokens = clean.split(/[\s/,]+/).filter((t) => t.length >= 3)
  const out = new Set<string>()

  for (const token of tokens) {
    out.add(token)
    // Buang akhiran infleksi umum bahasa Jerman.
    const stem = token.replace(/(ungen|ung|ern|est|et|en|st|te|n|e|t)$/i, '')
    if (stem.length >= 4) out.add(stem)
  }

  return [...out].sort((a, b) => b.length - a.length)
}

/** Cari kalimat dialog pertama yang memuat kata ini (atau bentuk infleksinya). */
export function findExampleSentence(germanWord: string, sentences: string[]): string | undefined {
  const stems = stemsOf(germanWord)
  for (const stem of stems) {
    const found = (sentences || []).find((s) =>
      new RegExp(escapeRegExp(stem), 'i').test(s)
    )
    if (found) return found
  }
  return undefined
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** Kelompokkan vocab menjadi topik-topik grammar, hanya kategori yang terisi. */
export function buildTopics(
  vocabClues: { germanWord: string; indonesianMeaning: string; grammarTip: string }[],
  dialogue: { germanText: string }[] = []
): GrammarTopic[] {
  const sentences = (dialogue || []).map((d) => d.germanText || '')
  const items = (vocabClues || []).map((v) => toVocabItem(v, sentences))
  const order: GrammarCategory[] = [
    'Verb',
    'Nomen',
    'Adjektiv',
    'Konjunktion',
    'Präposition',
    'Sonstiges',
  ]

  return order
    .map((category) => ({
      category,
      label: CATEGORY_META[category].label,
      description: CATEGORY_META[category].description,
      items: items.filter((i) => i.category === category),
    }))
    .filter((topic) => topic.items.length > 0)
}

/**
 * Buat soal Richtig/Falsch dari kalimat dialog + pernyataan konsep.
 *
 * Dua gaya soal (sesuai permintaan: "campur keduanya"):
 *  - 'sentence' : kalimat asli dari dialog (benar) vs kalimat dengan artikel
 *                 yang ditukar (salah). Hanya dibuat bila artikel kata benda
 *                 diketahui, sehingga kesalahannya pasti.
 *  - 'concept'  : pernyataan tentang kategori kata atau artikelnya.
 *
 * Jawaban benar/salah dibuat bergantian agar tidak berat sebelah.
 */
export function buildQuestions(
  vocabClues: { germanWord: string; indonesianMeaning: string; grammarTip: string }[],
  dialogue: { germanText: string }[]
): GrammarQuestion[] {
  const sentences = (dialogue || []).map((d) => d.germanText || '')
  const items = (vocabClues || []).map((v) => toVocabItem(v, sentences))
  const questions: GrammarQuestion[] = []

  let flip = false
  const nextIsCorrect = () => {
    flip = !flip
    return flip
  }

  for (const item of items) {
    // --- Gaya 1: soal kalimat (mutasi artikel pada kalimat dialog asli) ---
    if (item.article && item.noun) {
      const original = item.article + ' ' + item.noun
      const mutated = WRONG_ARTICLE[item.article] + ' ' + item.noun
      const sentence = sentences.find((s) => s.includes(original))

      if (sentence) {
        const askCorrect = nextIsCorrect()
        const statement = askCorrect
          ? sentence
          : sentence.replace(original, mutated)

        // Jangan buat soal bila mutasi tidak mengubah apa pun.
        if (statement !== sentence || askCorrect) {
          questions.push({
            id: `grammar-sentence-${questions.length}`,
            kind: 'sentence',
            statement,
            isCorrect: askCorrect,
            explanation: item.grammarTip,
            source: item.germanWord,
            // Kalimat utuh — aman dibacakan TTS Jerman.
            audioText: statement,
          })
          continue
        }
      }
    }

    // --- Gaya 2: soal konsep ---
    const askCorrect = nextIsCorrect()

    if (item.article && item.noun) {
      const shown = askCorrect ? item.article : WRONG_ARTICLE[item.article]
      questions.push({
        id: `grammar-concept-${questions.length}`,
        kind: 'concept',
        statement: `Das Wort „${item.noun}“ hat den Artikel „${shown}“.`,
        isCorrect: askCorrect,
        explanation: item.grammarTip,
        source: item.germanWord,
        // Hanya frasa Jermannya yang dibacakan, bukan kalimat penuh.
        audioText: `${shown} ${item.noun}`,
      })
      continue
    }

    if (item.category !== 'Sonstiges') {
      const shown = askCorrect ? item.category : OTHER_CATEGORY[item.category]
      const art = CATEGORY_ARTICLE[shown]
      questions.push({
        id: `grammar-concept-${questions.length}`,
        kind: 'concept',
        statement: `„${item.germanWord}“ ist ${art} ${shown}.`,
        isCorrect: askCorrect,
        explanation: item.grammarTip,
        source: item.germanWord,
        audioText: item.germanWord,
      })
      continue
    }

    // Gaya 3: kategori tidak terdeteksi — tanyakan arti katanya (selalu ada).
    const askMeaning = nextIsCorrect()
    questions.push({
      id: `grammar-meaning-${questions.length}`,
      kind: 'concept',
      statement: `„${item.germanWord}“ bedeutet „${askMeaning ? item.indonesianMeaning : 'etwas anderes'}“.`,
      isCorrect: askMeaning,
      explanation: item.grammarTip,
      source: item.germanWord,
      // Hanya kata Jermannya; terjemahan Indonesia tidak dibacakan.
      audioText: item.germanWord,
    })
  }

  return questions
}

/** Nilai jawaban siswa: 'richtig' benar bila soal memang benar, dan sebaliknya. */
export function isAnswerCorrect(question: GrammarQuestion, answer: 'richtig' | 'falsch'): boolean {
  return (answer === 'richtig') === question.isCorrect
}
