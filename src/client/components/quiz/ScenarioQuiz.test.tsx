// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import ScenarioQuiz from './ScenarioQuiz'

const speakGerman = vi.fn()
vi.mock('../../lib/audio', () => ({
  speakGerman: (...args: unknown[]) => speakGerman(...args),
  stopSpeech: () => {},
}))

const session = {
  id: 'sess-1',
  title: 'Im Café',
  cefrLevel: 'A2',
  dialogue: [
    {
      speaker: 'Sprecher A',
      germanText: 'Guten Tag, ich möchte einen Kaffee bestellen.',
      indonesianText: 'Selamat siang, saya ingin memesan kopi.',
      gender: 'male',
      personaId: 'male-3',
    },
    {
      speaker: 'Sprecher B',
      germanText: 'Natürlich, möchten Sie auch ein Stück Kuchen?',
      indonesianText: 'Tentu, apakah Anda juga ingin sepotong kue?',
      gender: 'female',
      personaId: 'female-2',
    },
  ],
  vocabClues: [],
}

beforeEach(() => {
  speakGerman.mockClear()
  cleanup()
})

describe('ScenarioQuiz — audio mempertahankan persona pembicara', () => {
  it('tombol audio diktat mengirim personaId pembicara aslinya', () => {
    render(<ScenarioQuiz session={session} sessionId="sess-1" />)

    const playButtons = screen.getAllByRole('button', { name: 'Putar Audio' })
    fireEvent.click(playButtons[0])

    expect(speakGerman).toHaveBeenCalledTimes(1)
    const [, options] = speakGerman.mock.calls[0] as [string, { personaId?: string }]
    expect(options.personaId).toBe('male-3')
  })

  it('diktat pembicara kedua memakai persona pembicara kedua', () => {
    render(<ScenarioQuiz session={session} sessionId="sess-1" />)

    const playButtons = screen.getAllByRole('button', { name: 'Putar Audio' })
    fireEvent.click(playButtons[1])

    const [, options] = speakGerman.mock.calls[0] as [string, { personaId?: string }]
    expect(options.personaId).toBe('female-2')
  })

  it('sesi lama tanpa personaId tetap memutar audio lewat jalur yang sama', () => {
    const legacy = {
      ...session,
      dialogue: session.dialogue.map(({ personaId: _drop, ...turn }) => turn),
    }
    render(<ScenarioQuiz session={legacy} sessionId="sess-1" />)

    const playButtons = screen.getAllByRole('button', { name: 'Putar Audio' })
    fireEvent.click(playButtons[0])

    const [, options] = speakGerman.mock.calls[0] as [string, { personaId?: string; gender?: string }]
    expect(options.personaId).toBeUndefined()
    expect(options.gender).toBe('male')
  })
})
