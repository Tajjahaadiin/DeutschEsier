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

  it('memuat jumlah dialog tersimpan saat membuka skenario untuk diedit', async () => {
    globalThis.fetch = vi.fn(async (url: string | URL) => {
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
})
