// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import GrammarPanel from './GrammarPanel'
import type { GrammarPattern } from '../../lib/grammarPatterns'

const pattern: GrammarPattern = {
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

beforeEach(() => {
  window.scrollTo = vi.fn()
  globalThis.fetch = vi.fn(async () => new Response('{}', { status: 200 })) as unknown as typeof fetch
})

describe('GrammarPanel — tab Materi (pola kalimat)', () => {
  it('menampilkan pola, formula, dan terjemahannya', () => {
    render(<GrammarPanel vocabClues={[]} grammarPatterns={[pattern]} />)

    expect(screen.getByText('Aussagesatz')).toBeTruthy()
    expect(screen.getByText('Kalimat Berita')).toBeTruthy()
    expect(screen.getByText('Subjekt – Prädikat – Objekt')).toBeTruthy()
    expect(screen.getByText('Pria itu minum kopi.')).toBeTruthy()
  })

  it('memecah contoh menjadi potongan berperan saat segments cocok', () => {
    render(<GrammarPanel vocabClues={[]} grammarPatterns={[pattern]} />)

    // Testing Library menormalkan spasi, jadi cocokkan per potongan.
    expect(screen.getByText('Der Mann')).toBeTruthy()
    expect(screen.getByText('trinkt')).toBeTruthy()
    expect(screen.getByText('Kaffee.')).toBeTruthy()
  })

  it('menampilkan contoh apa adanya bila segments tidak menyusun kalimatnya', () => {
    const mismatch = { ...pattern, exampleGerman: 'Etwas ganz anderes.' }
    render(<GrammarPanel vocabClues={[]} grammarPatterns={[mismatch]} />)

    expect(screen.getByText('„Etwas ganz anderes.“')).toBeTruthy()
  })

  it('menampilkan empty state Materi bila belum ada pola tapi latihan tetap ada', () => {    // vocabClues diisi agar panel tidak jatuh ke guard "belum ada materi" secara
    // keseluruhan; yang diuji adalah empty state khusus tab Materi.
    const vocabClues = [
      { germanWord: 'der Kaffee', indonesianMeaning: 'kopi', grammarTip: 'Kata benda maskulin.' },
    ]
    render(<GrammarPanel vocabClues={vocabClues} grammarPatterns={[]} />)

    expect(screen.getByText(/belum memiliki pola kalimat/)).toBeTruthy()
  })
})

describe('GrammarPanel — topik tata bahasa terpilih', () => {
  const topic = {
    topicId: 'passiv',
    name: 'Passiv',
    nameId: 'Passiv (Kalimat Pasif)',
    explanationId: 'Fokus ke kejadian, bukan pelaku.',
    formula: 'werden + Partizip II',
    examples: [
      {
        german: 'Das Haus wird gebaut.',
        indonesian: 'Rumah itu dibangun.',
        note: 'Pelaku tidak disebutkan.',
      },
    ],
  }

  it('menampilkan kartu materi topik di bawah pola kalimat', () => {
    render(
      <GrammarPanel vocabClues={[]} grammarPatterns={[pattern]} grammarTopics={[topic]} />
    )

    // Pola lama tetap ada (additive).
    expect(screen.getByText('Aussagesatz')).toBeTruthy()
    // Seksi topik baru ikut tampil.
    expect(screen.getByText('Topik Tata Bahasa Pilihan')).toBeTruthy()
    expect(screen.getByText('Passiv')).toBeTruthy()
    expect(screen.getByText('Fokus ke kejadian, bukan pelaku.')).toBeTruthy()
    expect(screen.getByText('werden + Partizip II')).toBeTruthy()
    expect(screen.getByText('Das Haus wird gebaut.')).toBeTruthy()
    expect(screen.getByText('Rumah itu dibangun.')).toBeTruthy()
  })

  it('tidak menampilkan seksi topik bila tidak ada topik dipilih', () => {
    render(<GrammarPanel vocabClues={[]} grammarPatterns={[pattern]} />)

    expect(screen.queryByText('Topik Tata Bahasa Pilihan')).toBeNull()
  })

  it('tidak menampilkan empty state utama bila hanya ada topik tanpa pola', () => {
    render(<GrammarPanel vocabClues={[]} grammarPatterns={[]} grammarTopics={[topic]} />)

    // Panel tidak boleh menampilkan empty state tingkat halaman...
    expect(screen.queryByText(/belum memiliki materi grammatik/)).toBeNull()
    // ...dan materi topik tetap dirender.
    expect(screen.getByText('Passiv')).toBeTruthy()
    expect(screen.getByText('Topik Tata Bahasa Pilihan')).toBeTruthy()
  })
})
