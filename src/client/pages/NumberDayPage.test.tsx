// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import NumberPage from './NumberPage'
import DayPage from './DayPage'

beforeEach(() => {
  window.scrollTo = vi.fn()
  globalThis.fetch = vi.fn(async () => new Response('{}', { status: 200 })) as unknown as typeof fetch
})

describe('NumberPage', () => {
  it('menampilkan kartu angka beserta pelafalannya', () => {
    render(<NumberPage navigate={() => {}} />)

    expect(screen.getByText('die Nummer')).toBeTruthy()
    expect(screen.getByText('zwanzig')).toBeTruthy()
    expect(screen.getByText('dreißig')).toBeTruthy()
  })

  it('menghasilkan frasa Jerman yang benar dari angka + benda', () => {
    render(<NumberPage navigate={() => {}} />)

    fireEvent.click(screen.getByText('Game Hitung'))
    // Pilih angka 2 dan benda Tomate, lalu Generate.
    fireEvent.click(screen.getByRole('button', { name: '2' }))
    fireEvent.click(screen.getByRole('button', { name: /Tomate/ }))
    fireEvent.click(screen.getByText('Generate'))

    expect(screen.getByText('zwei Tomaten')).toBeTruthy()
  })

  it('memakai artikel yang benar saat angka 1', () => {
    render(<NumberPage navigate={() => {}} />)

    fireEvent.click(screen.getByText('Game Hitung'))
    fireEvent.click(screen.getByRole('button', { name: '1' }))
    fireEvent.click(screen.getByRole('button', { name: /Tomate/ }))
    fireEvent.click(screen.getByText('Generate'))

    expect(screen.getByText('eine Tomate')).toBeTruthy()
  })
})

describe('DayPage', () => {
  it('menampilkan kalender dengan nama hari Jerman', () => {
    render(<DayPage navigate={() => {}} />)

    expect(screen.getByText('die Tage')).toBeTruthy()
    expect(screen.getByText('Montag')).toBeTruthy()
    expect(screen.getByText('Sonntag')).toBeTruthy()
  })

  it('berpindah bulan lewat tombol next', () => {
    const { container } = render(<DayPage navigate={() => {}} />)

    const before = container.querySelector('h2')?.textContent
    fireEvent.click(screen.getAllByRole('button', { name: 'Bulan berikutnya' })[0])
    const after = container.querySelector('h2')?.textContent

    // Nama bulan pada kepala kalender harus berubah setelah next.
    expect(after).not.toBe(before)
  })

  it('menyesuaikan tahun saat mundur/maju melewati batas tahun', () => {
    render(<DayPage navigate={() => {}} />)

    const prev = screen.getAllByRole('button', { name: 'Bulan sebelumnya' })[0]
    const next = screen.getAllByRole('button', { name: 'Bulan berikutnya' })[0]
    const read = () => screen.getByText(/^\w+ \d{4}$/).textContent
    const start = read()!

    // Mundur 12 bulan = tepat satu tahun lebih awal (bulan sama).
    for (let i = 0; i < 12; i++) fireEvent.click(prev)
    const [startMonthName, startYear] = start.split(' ')
    expect(read()).toBe(`${startMonthName} ${Number(startYear) - 1}`)

    // Maju 12 bulan kembali ke titik awal.
    for (let i = 0; i < 12; i++) fireEvent.click(next)
    expect(read()).toBe(start)
  })

  it('tidak menandai 31 Desember sebagai hari libur', () => {
    render(<DayPage navigate={() => {}} />)

    // Silvester bukan hari libur resmi Jerman.
    expect(screen.queryByText('Silvester')).toBeNull()
  })

  it('menampilkan bagian bonus hari libur dan konteks waktu', () => {
    render(<DayPage navigate={() => {}} />)

    expect(screen.getByText(/Hari Libur Jerman/)).toBeTruthy()
    expect(screen.getByText('Neujahr')).toBeTruthy()
    expect(screen.getByText(/Konteks Waktu/)).toBeTruthy()
    expect(screen.getByText('heute')).toBeTruthy()
  })
})
