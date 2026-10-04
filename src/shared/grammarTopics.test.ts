import { describe, it, expect } from 'vitest'
import {
  GRAMMAR_TOPICS,
  GRAMMAR_TOPIC_IDS,
  SECTIONS,
  MAX_GRAMMAR_TOPICS,
  isGrammarTopicId,
  topicsBySection,
  validateTopicIds,
} from './grammarTopics'

describe('GRAMMAR_TOPICS', () => {
  it('punya ID unik dan format ASCII stabil', () => {
    const ids = GRAMMAR_TOPICS.map((t) => t.id)

    expect(new Set(ids).size).toBe(ids.length)
    for (const id of ids) {
      expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
    }
  })

  it('setiap topik punya seksi yang dikenal dan label lengkap', () => {
    for (const t of GRAMMAR_TOPICS) {
      expect(SECTIONS).toContain(t.section)
      expect(t.german.length).toBeGreaterThan(0)
      expect(t.nameId.length).toBeGreaterThan(0)
      expect(t.descriptionId.length).toBeGreaterThan(0)
    }
  })

  it('mencakup kesepuluh seksi taksonomi B1', () => {
    const used = new Set(GRAMMAR_TOPICS.map((t) => t.section))

    expect(used.size).toBe(SECTIONS.length)
    for (const s of SECTIONS) expect(used).toContain(s)
  })

  it('hanya memakai kategori latihan yang dikenal', () => {
    const allowed = ['Verb', 'Nomen', 'Adjektiv', 'Konjunktion', 'Präposition']
    for (const t of GRAMMAR_TOPICS) {
      if (t.latihanCategory !== undefined) expect(allowed).toContain(t.latihanCategory)
    }
  })
})

describe('isGrammarTopicId', () => {
  it('mengenali ID yang ada dan menolak yang lain', () => {
    expect(isGrammarTopicId('passiv')).toBe(true)
    expect(isGrammarTopicId('hacked-topic')).toBe(false)
    expect(isGrammarTopicId(123)).toBe(false)
    expect(isGrammarTopicId(null)).toBe(false)
  })
})

describe('topicsBySection', () => {
  it('mengelompokkan semua topik tanpa kehilangan satu pun', () => {
    const grouped = topicsBySection()
    let total = 0
    for (const list of grouped.values()) total += list.length

    expect(total).toBe(GRAMMAR_TOPICS.length)
  })

  it('mempertahankan urutan seksi sesuai taksonomi', () => {
    expect([...topicsBySection().keys()]).toEqual([...SECTIONS])
  })
})

describe('GRAMMAR_TOPIC_IDS', () => {
  it('berisi seluruh ID taksonomi', () => {
    expect(GRAMMAR_TOPIC_IDS.size).toBe(GRAMMAR_TOPICS.length)
  })
})

describe('validateTopicIds (ketat, untuk request klien)', () => {
  it('menerima array ID yang semuanya dikenal', () => {
    expect(validateTopicIds(['passiv', 'relativsatz'])).toEqual(['passiv', 'relativsatz'])
  })

  it('menerima array kosong', () => {
    expect(validateTopicIds([])).toEqual([])
  })

  it('MENOLAK bila ada ID tak dikenal, bukan membuangnya', () => {
    expect(validateTopicIds(['passiv', 'tidak-ada'])).toBeNull()
  })

  it('menolak elemen bukan string', () => {
    expect(validateTopicIds(['passiv', 7])).toBeNull()
  })

  it('menolak bukan array', () => {
    expect(validateTopicIds('passiv')).toBeNull()
    expect(validateTopicIds(null)).toBeNull()
  })

  it('menolak melebihi batas maksimum', () => {
    const tooMany = GRAMMAR_TOPICS.slice(0, MAX_GRAMMAR_TOPICS + 1).map((t) => t.id)

    expect(validateTopicIds(tooMany)).toBeNull()
  })

  it('membuang duplikat', () => {
    expect(validateTopicIds(['passiv', 'passiv'])).toEqual(['passiv'])
  })
})
