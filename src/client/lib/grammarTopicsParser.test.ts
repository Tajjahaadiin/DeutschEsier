import { describe, it, expect } from 'vitest'
import { parseGrammarTopics, parseGrammarTopicIds } from './grammarTopicsParser'

const content = {
  topicId: 'passiv',
  name: 'Passiv',
  nameId: 'Passiv (Kalimat Pasif)',
  explanationId: 'Fokus ke kejadian.',
  formula: 'werden + Partizip II',
  examples: [{ german: 'Das Haus wird gebaut.', indonesian: 'Rumah itu dibangun.', note: '' }],
}

/** Bentuk kolom: { selected, content }. */
const stored = JSON.stringify({ selected: ['passiv'], content: [content] })

describe('parseGrammarTopicIds', () => {
  it('mengembalikan array kosong untuk nilai kosong/rusak', () => {
    expect(parseGrammarTopicIds(null)).toEqual([])
    expect(parseGrammarTopicIds(undefined)).toEqual([])
    expect(parseGrammarTopicIds('')).toEqual([])
    expect(parseGrammarTopicIds('bukan json{')).toEqual([])
  })

  it('membaca pilihan tersimpan', () => {
    expect(parseGrammarTopicIds(stored)).toEqual(['passiv'])
  })

  it('membuang ID yang tidak dikenal', () => {
    const raw = JSON.stringify({ selected: ['passiv', 'topik-karangan'], content: [] })

    expect(parseGrammarTopicIds(raw)).toEqual(['passiv'])
  })

  it('toleran terhadap bentuk lama berupa array ID saja', () => {
    expect(parseGrammarTopicIds(JSON.stringify(['passiv']))).toEqual(['passiv'])
  })
})

describe('parseGrammarTopics', () => {
  it('mengembalikan array kosong untuk nilai kosong/rusak', () => {
    expect(parseGrammarTopics(null)).toEqual([])
    expect(parseGrammarTopics(undefined)).toEqual([])
    expect(parseGrammarTopics('bukan json{')).toEqual([])
  })

  it('membaca konten materi tersimpan', () => {
    const parsed = parseGrammarTopics(stored)

    expect(parsed).toHaveLength(1)
    expect(parsed[0].name).toBe('Passiv')
    expect(parsed[0].examples[0].german).toBe('Das Haus wird gebaut.')
  })

  it('membuang entri dengan topicId tidak dikenal', () => {
    const raw = JSON.stringify({
      selected: [],
      content: [content, { ...content, topicId: 'topik-karangan' }],
    })

    expect(parseGrammarTopics(raw)).toHaveLength(1)
  })

  it('membuang entri yang tidak lengkap', () => {
    const raw = JSON.stringify({ selected: [], content: [content, { topicId: 'passiv' }] })

    expect(parseGrammarTopics(raw)).toHaveLength(1)
  })

  it('membuang contoh yang rusak dan memberi note kosong', () => {
    const raw = JSON.stringify({
      selected: [],
      content: [
        {
          ...content,
          examples: [{ german: 'Satz.', indonesian: 'Kalimat.' }, { german: 5 }],
        },
      ],
    })

    const parsed = parseGrammarTopics(raw)

    expect(parsed[0].examples).toHaveLength(1)
    expect(parsed[0].examples[0].note).toBe('')
  })
})
