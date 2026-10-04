// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
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

describe('GrammarPanel — tab Latihan (soal tata bahasa AI)', () => {
  const aiQuestion = {
    sentence: 'Ich bin gestern die Küche geputzt.',
    isCorrect: false,
    explanationId: 'Putzen memakai haben, bukan sein.',
    correctedSentence: 'Ich habe gestern die Küche geputzt.',
    topicId: 'tempus-perfekt',
    segments: [
      { text: 'Ich ', role: 'subjekt' },
      { text: 'bin ', role: 'praedikat' },
      { text: 'gestern die Küche geputzt.', role: 'objekt' },
    ],
  }

  const openLatihan = () => {
    // Klik elemen <button> yang sesungguhnya, bukan node teks di dalamnya.
    fireEvent.click(screen.getByRole('button', { name: /Latihan/ }))
  }

  it('menampilkan soal AI sebagai pertanyaan apakah kalimat ini gramatikal', () => {
    render(
      <GrammarPanel
        vocabClues={[]}
        grammarQuestionsJson={JSON.stringify([aiQuestion])}
        cefrLevel="B1"
      />
    )
    openLatihan()

    expect(screen.getByText(/gramatikal/i)).toBeTruthy()
    // Kalimat dipecah jadi potongan berwarna.
    expect(screen.getByText('Ich')).toBeTruthy()
    expect(screen.getByText('bin')).toBeTruthy()
  })

  it('menampilkan penjelasan DAN bentuk kalimat yang benar setelah submit', () => {
    render(
      <GrammarPanel
        vocabClues={[]}
        grammarQuestionsJson={JSON.stringify([aiQuestion])}
        cefrLevel="B1"
      />
    )
    openLatihan()

    fireEvent.click(screen.getByRole('button', { name: '✓ Richtig' }))
    fireEvent.click(screen.getByRole('button', { name: /Periksa Jawaban/ }))

    expect(screen.getByText(/Putzen memakai haben/)).toBeTruthy()
    expect(screen.getByText(/Ich habe gestern die Küche geputzt\./)).toBeTruthy()
  })

  it('jatuh kembali ke soal lama bila kolom soal AI kosong', () => {
    const vocabClues = [
      { germanWord: 'der Kaffee', indonesianMeaning: 'kopi', grammarTip: 'Kata benda maskulin.' },
    ]
    render(<GrammarPanel vocabClues={vocabClues} grammarQuestionsJson={null} cefrLevel="B1" />)
    openLatihan()

    // Soal lama (konsep/arti) tetap muncul sehingga halaman tidak kosong.
    expect(
      screen.getAllByText((_, el) => (el?.textContent ?? '').includes('Kaffee')).length
    ).toBeGreaterThan(0)
  })

  it('tidak crash bila JSON soal rusak dan memakai soal lama', () => {
    const vocabClues = [
      { germanWord: 'der Kaffee', indonesianMeaning: 'kopi', grammarTip: 'Kata benda maskulin.' },
    ]
    render(
      <GrammarPanel vocabClues={vocabClues} grammarQuestionsJson="bukan json{" cefrLevel="B1" />
    )
    openLatihan()

    expect(screen.getByRole('button', { name: /Latihan/ })).toBeTruthy()
    // Ada beberapa soal, jadi tombol Richtig muncul lebih dari satu.
    expect(screen.getAllByRole('button', { name: '✓ Richtig' }).length).toBeGreaterThan(0)
  })

  it('tetap berfungsi tanpa prop cefrLevel', () => {
    render(
      <GrammarPanel
        vocabClues={[]}
        grammarQuestionsJson={JSON.stringify([aiQuestion])}
      />
    )
    openLatihan()

    expect(screen.getByText('Ich')).toBeTruthy()
  })
})
