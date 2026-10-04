import { describe, it, expect } from 'vitest'
import { parseGrammarPatterns, segmentsCoverExample, type GrammarPattern } from './grammarPatterns'

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
