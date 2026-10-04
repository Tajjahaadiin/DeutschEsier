import { describe, it, expect } from 'vitest'
import {
  WEEKDAYS,
  MONTHS,
  buildMonthGrid,
  isHoliday,
  weekdayForDate,
  shiftMonth,
} from './calendar'

describe('WEEKDAYS', () => {
  it('berisi 7 hari Jerman dimulai Senin', () => {
    expect(WEEKDAYS).toHaveLength(7)
    expect(WEEKDAYS[0].german).toBe('Montag')
    expect(WEEKDAYS[6].german).toBe('Sonntag')
  })

  it('setiap hari punya pelafalan dan arti Indonesia', () => {
    for (const day of WEEKDAYS) {
      expect(day.pronunciation.length).toBeGreaterThan(0)
      expect(day.meaningId.length).toBeGreaterThan(0)
    }
  })
})

describe('MONTHS', () => {
  it('berisi 12 bulan Jerman', () => {
    expect(MONTHS).toHaveLength(12)
    expect(MONTHS[0].german).toBe('Januar')
    expect(MONTHS[11].german).toBe('Dezember')
  })
})

describe('buildMonthGrid', () => {
  it('menghasilkan 42 sel (6 minggu x 7 hari)', () => {
    const grid = buildMonthGrid(2026, 0)

    expect(grid).toHaveLength(42)
  })

  it('mengisi hari bulan sebelumnya dengan null di awal', () => {
    // 1 Januari 2026 jatuh pada hari Kamis -> 3 sel kosong (Sen, Sel, Rab).
    const grid = buildMonthGrid(2026, 0)

    expect(grid[0]).toBeNull()
    expect(grid[1]).toBeNull()
    expect(grid[2]).toBeNull()
    expect(grid[3]).toBe(1)
  })

  it('menempatkan jumlah hari yang benar untuk Februari kabisat', () => {
    const feb2028 = buildMonthGrid(2028, 1)
    const days = feb2028.filter((d): d is number => d !== null)

    expect(days).toHaveLength(29)
    expect(Math.max(...days)).toBe(29)
  })

  it('menempatkan jumlah hari yang benar untuk Februari bukan kabisat', () => {
    const feb2026 = buildMonthGrid(2026, 1)
    const days = feb2026.filter((d): d is number => d !== null)

    expect(days).toHaveLength(28)
  })
})

describe('weekdayForDate', () => {
  it('mengembalikan nama hari Jerman yang benar', () => {
    // 1 Januari 2026 = Kamis
    expect(weekdayForDate(2026, 0, 1).german).toBe('Donnerstag')
    // 4 Januari 2026 = Minggu
    expect(weekdayForDate(2026, 0, 4).german).toBe('Sonntag')
  })
})

describe('isHoliday', () => {
  it('mengenali hari libur tetap Jerman', () => {
    expect(isHoliday(0, 1)?.german).toBe('Neujahr')
    expect(isHoliday(9, 3)?.german).toBe('Tag der Deutschen Einheit')
    expect(isHoliday(11, 25)?.german).toBe('Weihnachten')
  })

  it('mengembalikan undefined untuk hari biasa', () => {
    expect(isHoliday(0, 15)).toBeUndefined()
  })

  it('tidak menandai Silvester sebagai hari libur umum', () => {
    // 31 Desember bukan gesetzlicher Feiertag di Jerman; jangan diajarkan salah.
    expect(isHoliday(11, 31)).toBeUndefined()
  })
})

describe('shiftMonth', () => {
  it('maju satu bulan dalam tahun yang sama', () => {
    expect(shiftMonth(2026, 0, 1)).toEqual({ year: 2026, month: 1 })
  })

  it('mundur dari Januari ke Desember tahun sebelumnya', () => {
    expect(shiftMonth(2026, 0, -1)).toEqual({ year: 2025, month: 11 })
  })

  it('maju dari Desember ke Januari tahun berikutnya', () => {
    expect(shiftMonth(2026, 11, 1)).toEqual({ year: 2027, month: 0 })
  })
})
