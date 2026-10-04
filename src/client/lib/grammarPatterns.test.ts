import { describe, it, expect } from 'vitest'
import { parseGrammarPatterns, segmentsCoverExample, coverSentence, type GrammarPattern } from './grammarPatterns'

const valid: GrammarPattern = {
  name: 'Aussagesatz',
  nameId: 'Kalimat Berita',
  formula: 'Subjekt – Prädikat – Objekt',
  exampleGerman: 'Der Mann trinkt Kaffee.',
  exampleIndonesian: 'Pria itu minum kopi.',
  segments: [
    { text: 'Der Mann ', role: 'subjekt' },
    { text: 'trinkt ', role: 'praedikat' },
    { text: 'Kaffee.', role: 'objekt' },
  ],
}

describe('parseGrammarPatterns', () => {
  it('mengembalikan array kosong untuk nilai kosong/rusak', () => {
    expect(parseGrammarPatterns(null)).toEqual([])
    expect(parseGrammarPatterns(undefined)).toEqual([])
    expect(parseGrammarPatterns('')).toEqual([])
    expect(parseGrammarPatterns('bukan json{')).toEqual([])
    expect(parseGrammarPatterns('{"a":1}')).toEqual([])
  })

  it('membaca JSON string berisi pola valid', () => {
    const parsed = parseGrammarPatterns(JSON.stringify([valid]))

    expect(parsed).toHaveLength(1)
    expect(parsed[0].name).toBe('Aussagesatz')
    expect(parsed[0].segments).toHaveLength(3)
  })

  it('membuang pola rusak tetapi menyisakan yang valid', () => {
    const broken = { name: 'X', nameId: 'Y' }
    const parsed = parseGrammarPatterns(JSON.stringify([valid, broken]))

    expect(parsed).toHaveLength(1)
    expect(parsed[0].name).toBe('Aussagesatz')
  })

  it('mengubah role tak dikenal menjadi other agar kalimat tetap bisa ditampilkan', () => {
    const odd = {
      ...valid,
      segments: [{ text: 'Der Mann', role: 'verb' }],
    }
    const parsed = parseGrammarPatterns(JSON.stringify([odd]))

    expect(parsed).toHaveLength(1)
    expect(parsed[0].segments[0].role).toBe('other')
  })

  it('tetap menyimpan pola walau gabungan segments tidak sama dengan contoh', () => {
    const mismatch = {
      ...valid,
      exampleGerman: 'Etwas ganz anderes.',
    }

    expect(parseGrammarPatterns(JSON.stringify([mismatch]))).toHaveLength(1)
  })
})

describe('segmentsCoverExample', () => {
  it('true bila gabungan segments sama dengan contoh', () => {
    expect(segmentsCoverExample(valid)).toBe(true)
  })

  it('false bila tidak sama', () => {
    expect(segmentsCoverExample({ ...valid, exampleGerman: 'Berbeda.' })).toBe(false)
  })
})

describe('coverSentence — pewarnaan toleran untuk soal latihan', () => {
  const segments = [
    { text: 'Ich ', role: 'subjekt' as const },
    { text: 'habe ', role: 'praedikat' as const },
    { text: 'geputzt.', role: 'objekt' as const },
  ]

  it('memberi role penuh saat segmen menyusun persis', () => {
    const spans = coverSentence('Ich habe geputzt.', segments)

    expect(spans.map((s) => s.text).join('')).toBe('Ich habe geputzt.')
    expect(spans.map((s) => s.role)).toEqual(['subjekt', 'praedikat', 'objekt'])
  })

  it('tetap cocok walau spasi berbeda', () => {
    const spans = coverSentence('Ich  habe   geputzt.', segments)

    expect(spans.map((s) => s.text).join('')).toBe('Ich  habe   geputzt.')
    expect(spans.filter((s) => s.role !== null).length).toBeGreaterThan(0)
  })

  it('tetap cocok walau beda huruf besar/kecil', () => {
    const spans = coverSentence('ich habe geputzt.', segments)

    expect(spans.map((s) => s.text).join('')).toBe('ich habe geputzt.')
    expect(spans.filter((s) => s.role !== null).length).toBeGreaterThan(0)
  })

  it('memberi warna sebagian saat satu segmen tidak ada, sisanya tetap utuh', () => {
    const partial = [
      { text: 'Ich ', role: 'subjekt' as const },
      { text: 'geputzt.', role: 'objekt' as const },
    ]
    const sentence = 'Ich habe geputzt.'
    const spans = coverSentence(sentence, partial)

    // Kalimat TIDAK boleh hilang.
    expect(spans.map((s) => s.text).join('')).toBe(sentence)
    expect(spans.some((s) => s.role === 'subjekt')).toBe(true)
  })

  it('mengembalikan satu span tanpa warna bila segmen sama sekali tidak nyambung', () => {
    const unrelated = [{ text: 'Völlig anders.', role: 'subjekt' as const }]
    const sentence = 'Ich habe geputzt.'
    const spans = coverSentence(sentence, unrelated)

    expect(spans).toHaveLength(1)
    expect(spans[0]).toEqual({ text: sentence, role: null })
  })

  it('memakai fallback polos bila cakupan segmen di bawah ambang', () => {
    // Hanya sebagian kecil kalimat yang tercakup; mewarnai sebagian kecil lalu
    // menyisakan mayoritas tanpa warna lebih membingungkan daripada polos.
    const sentence = 'Ich habe gestern die ganze Küche gründlich geputzt.'
    const sparse = [{ text: 'Ich', role: 'subjekt' as const }]
    const spans = coverSentence(sentence, sparse)

    expect(spans).toEqual([{ text: sentence, role: null }])
  })

  it('tetap mewarnai bila cakupannya cukup besar', () => {
    const sentence = 'Ich habe geputzt.'
    const mostly = [
      { text: 'Ich habe ', role: 'subjekt' as const },
      { text: 'geputzt.', role: 'objekt' as const },
    ]
    const spans = coverSentence(sentence, mostly)

    expect(spans.map((s) => s.text).join('')).toBe(sentence)
    expect(spans.filter((s) => s.role !== null).length).toBeGreaterThan(0)
  })

  it('mengembalikan satu span tanpa warna bila segmen kosong', () => {
    const sentence = 'Ich habe geputzt.'

    expect(coverSentence(sentence, [])).toEqual([{ text: sentence, role: null }])
  })

  it('tidak pernah kehilangan kalimat, apa pun inputnya', () => {
    const sentence = 'Früher war hier vieles ordentlicher.'
    const weird = [
      { text: '', role: 'other' as const },
      { text: 'xyz', role: 'other' as const },
    ]

    expect(coverSentence(sentence, weird).map((s) => s.text).join('')).toBe(sentence)
  })
})
