// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, fireEvent, screen, waitFor } from '@testing-library/react'
import GeneratorPage from './GeneratorPage'

const LESSON = {
  title: 'Im Café',
  sceneDescription: 'Dua orang memesan kopi.',
  dialogue: [
    { speaker: 'Sprecher A', germanText: 'Guten Tag!', indonesianText: 'Selamat siang!' },
  ],
  vocabClues: [{ germanWord: 'der Kaffee', indonesianMeaning: 'kopi', grammarTip: 'Maskulin.' }],
}

/** Body JSON dari panggilan POST /api/generate terakhir. */
function lastGenerateBody(): Record<string, unknown> {
  const call = (globalThis.fetch as unknown as ReturnType<typeof vi.fn>).mock.calls.find(
    (c) => String(c[0]).includes('/api/generate')
  )
  return JSON.parse(String(call?.[1]?.body ?? '{}'))
}

beforeEach(() => {
  localStorage.clear()
  globalThis.fetch = vi.fn(async (url: string | URL) => {
    if (String(url).includes('/api/generate')) {
      return new Response(JSON.stringify({ lesson: LESSON }), { status: 200 })
    }
    return new Response('{}', { status: 200 })
  }) as unknown as typeof fetch
})

describe('GeneratorPage — kontrol jumlah dialog', () => {
  it('membatasi input jumlah dialog ke maksimum 20', () => {
    render(<GeneratorPage navigate={() => {}} />)
    const input = document.querySelector('input[type="number"]') as HTMLInputElement

    fireEvent.change(input, { target: { value: '999' } })

    expect(input.value).toBe('20')
  })

  it('membatasi input jumlah dialog ke minimum 1', () => {
    render(<GeneratorPage navigate={() => {}} />)
    const input = document.querySelector('input[type="number"]') as HTMLInputElement

    fireEvent.change(input, { target: { value: '0' } })

    expect(input.value).toBe('1')
  })

  it('mengirim jumlah dialog yang dipilih ke server saat generate', async () => {
    render(<GeneratorPage navigate={() => {}} />)
    const input = document.querySelector('input[type="number"]') as HTMLInputElement

    fireEvent.change(input, { target: { value: '12' } })
    fireEvent.click(screen.getByText('Generate dengan AI'))

    await waitFor(() => expect(lastGenerateBody().dialogueCount).toBe(12))
  })

  it('memuat jumlah dialog tersimpan saat membuka skenario untuk diedit', async () => {    globalThis.fetch = vi.fn(async (url: string | URL) => {
      if (String(url).includes('/api/sessions/sess-14')) {
        return new Response(
          JSON.stringify({
            id: 'sess-14',
            title: 'Skenario Lama',
            scenarioPrompt: 'Di kafe Berlin',
            sceneDescription: 'Kafe',
            cefrLevel: 'A1',
            dialogueJson: '[]',
            vocabCluesJson: '[]',
            dialogueCount: 14,
          }),
          { status: 200 }
        )
      }
      return new Response('{}', { status: 200 })
    }) as unknown as typeof fetch

    render(<GeneratorPage editId="sess-14" navigate={() => {}} />)

    await waitFor(() => {
      const input = document.querySelector('input[type="number"]') as HTMLInputElement | null
      expect(input?.value).toBe('14')
    })
  })

  it('menyembunyikan pemilih topik grammar pada level A1', () => {
    render(<GeneratorPage navigate={() => {}} />)

    expect(screen.queryByText(/Topik Tata Bahasa/)).toBeNull()
  })

  it('menampilkan pemilih topik grammar saat level B1', () => {
    render(<GeneratorPage navigate={() => {}} />)

    fireEvent.change(document.querySelector('select') as HTMLSelectElement, {
      target: { value: 'B1' },
    })

    expect(screen.getByText(/Topik Tata Bahasa/)).toBeTruthy()
    // Daftar topik muncul setelah pemilih dibuka.
    fireEvent.click(screen.getByText('Pilih topik (opsional)'))
    expect(screen.getByText('Konjunktiv II')).toBeTruthy()
  })

  it('mengirim topik terpilih ke server saat generate di level B1', async () => {
    render(<GeneratorPage navigate={() => {}} />)
    fireEvent.change(document.querySelector('select') as HTMLSelectElement, {
      target: { value: 'B1' },
    })

    fireEvent.click(screen.getByText('Pilih topik (opsional)'))
    fireEvent.click(screen.getByTestId('topic-passiv'))
    fireEvent.click(screen.getByText('Generate dengan AI'))

    await waitFor(() => expect(lastGenerateBody().grammarTopics).toEqual(['passiv']))
  })

  it('mempertahankan pilihan topik saat level berpindah B1 -> A2 -> B1', () => {
    render(<GeneratorPage navigate={() => {}} />)
    const select = document.querySelector('select') as HTMLSelectElement

    fireEvent.change(select, { target: { value: 'B1' } })
    fireEvent.click(screen.getByText('Pilih topik (opsional)'))
    fireEvent.click(screen.getByTestId('topic-passiv'))

    fireEvent.change(select, { target: { value: 'A2' } })
    expect(screen.queryByText(/Topik Tata Bahasa/)).toBeNull()

    fireEvent.change(select, { target: { value: 'B1' } })
    fireEvent.click(screen.getByText('1 topik dipilih'))
    expect((screen.getByTestId('topic-passiv') as HTMLInputElement).checked).toBe(true)
  })

  it('tidak mengirim grammarTopics saat level bukan B1', async () => {
    render(<GeneratorPage navigate={() => {}} />)
    const select = document.querySelector('select') as HTMLSelectElement

    // Pilih topik di B1, lalu turunkan level ke A2.
    fireEvent.change(select, { target: { value: 'B1' } })
    fireEvent.click(screen.getByText('Pilih topik (opsional)'))
    fireEvent.click(screen.getByTestId('topic-passiv'))
    fireEvent.change(select, { target: { value: 'A2' } })

    fireEvent.click(screen.getByText('Generate dengan AI'))

    await waitFor(() => expect(globalThis.fetch).toHaveBeenCalled())
    expect(lastGenerateBody()).not.toHaveProperty('grammarTopics')
  })
})
