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

  it('menampilkan empty state Materi bila belum ada pola tapi latihan tetap ada', () => {
    // vocabClues diisi agar panel tidak jatuh ke guard "belum ada materi" secara
    // keseluruhan; yang diuji adalah empty state khusus tab Materi.
    const vocabClues = [
      { germanWord: 'der Kaffee', indonesianMeaning: 'kopi', grammarTip: 'Kata benda maskulin.' },
    ]
    render(<GrammarPanel vocabClues={vocabClues} grammarPatterns={[]} />)

    expect(screen.getByText(/belum memiliki pola kalimat/)).toBeTruthy()
  })
})
