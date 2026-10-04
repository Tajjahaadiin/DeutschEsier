// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ComprehensionQuiz from './ComprehensionQuiz'

const questions = [
  {
    statement: 'Sprecher A trinkt Tee.',
    indonesianText: 'Pembicara A minum teh.',
    isCorrect: false,
    explanation: 'Ia memesan kopi, bukan teh.',
  },
  {
    statement: 'Sprecher A bestellt Kaffee.',
    indonesianText: 'Pembicara A memesan kopi.',
    isCorrect: true,
    explanation: 'Sesuai dialog.',
  },
]

beforeEach(() => {
  window.scrollTo = vi.fn()
  globalThis.fetch = vi.fn(
    async () => new Response(JSON.stringify({ success: true }), { status: 200 })
  ) as unknown as typeof fetch
})

describe('ComprehensionQuiz — soal Richtig/Falsch level B1', () => {
  it('menampilkan setiap pernyataan yang harus dinilai', () => {
    render(<ComprehensionQuiz questions={questions} sessionId="s1" />)

    expect(screen.getByText('Sprecher A trinkt Tee.')).toBeTruthy()
    expect(screen.getByText('Sprecher A bestellt Kaffee.')).toBeTruthy()
  })

  it('menolak mengirim bila masih ada soal yang belum dijawab', async () => {
    render(<ComprehensionQuiz questions={questions} sessionId="s1" />)
    fireEvent.change(screen.getByPlaceholderText('Masukkan nama lengkap Anda...'), {
      target: { value: 'Andi' },
    })

    fireEvent.click(screen.getByText('Kumpulkan Jawaban Kuis'))

    await waitFor(() => expect(screen.getByText(/belum dijawab/)).toBeTruthy())
    expect(globalThis.fetch).not.toHaveBeenCalled()
  })

  it('mengirim skor 100 saat semua jawaban benar', async () => {
    render(<ComprehensionQuiz questions={questions} sessionId="s1" />)
    fireEvent.change(screen.getByPlaceholderText('Masukkan nama lengkap Anda...'), {
      target: { value: 'Andi' },
    })

    // Soal 1 kuncinya Falsch, soal 2 kuncinya Richtig.
    fireEvent.click(screen.getAllByText('❌ Falsch (Salah)')[0])
    fireEvent.click(screen.getAllByText('✅ Richtig (Benar)')[1])
    fireEvent.click(screen.getByText('Kumpulkan Jawaban Kuis'))

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled())
    const body = JSON.parse(
      (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].body
    )
    expect(body.score).toBe(100)
    expect(body.correctAnswers).toBe(2)
    expect(body.answers).toHaveLength(2)
    expect(body.answers[0].type).toBe('comprehension')
  })

  it('menghitung skor 50 saat separuh jawaban salah', async () => {
    render(<ComprehensionQuiz questions={questions} sessionId="s1" />)
    fireEvent.change(screen.getByPlaceholderText('Masukkan nama lengkap Anda...'), {
      target: { value: 'Andi' },
    })

    // Soal 1 dijawab SALAH (kuncinya Falsch, tapi pilih Richtig).
    // Soal 2 dijawab BENAR (kuncinya Richtig).
    fireEvent.click(screen.getAllByText('✅ Richtig (Benar)')[0])
    fireEvent.click(screen.getAllByText('✅ Richtig (Benar)')[1])
    fireEvent.click(screen.getByText('Kumpulkan Jawaban Kuis'))

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled())
    const body = JSON.parse(
      (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0][1].body
    )
    expect(body.score).toBe(50)
    expect(body.correctAnswers).toBe(1)
  })
})
