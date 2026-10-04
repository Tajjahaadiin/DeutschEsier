/**
 * Logika kalender untuk fitur "die Tage": nama hari/bulan Jerman, grid bulan,
 * dan penanda hari libur.
 *
 * Fungsi di sini murni (pure) agar mudah diuji. Penamaan hari memakai indeks
 * JavaScript (0 = Minggu) agar bisa langsung dipakai dengan Date.getDay(),
 * lalu dipetakan ke urutan Jerman yang dimulai Senin.
 */

export interface DayInfo {
  german: string
  pronunciation: string
  meaningId: string
}

export interface MonthInfo {
  german: string
  meaningId: string
}

export interface HolidayInfo {
  german: string
  meaningId: string
  /** true bila tanggalnya berubah tiap tahun (mis. Paskah). */
  movable?: boolean
}

/** Senin sampai Minggu, sesuai urutan kalender Jerman. */
export const WEEKDAYS: DayInfo[] = [
  { german: 'Montag', pronunciation: 'MON-tak', meaningId: 'Senin' },
  { german: 'Dienstag', pronunciation: 'DIINS-tak', meaningId: 'Selasa' },
  { german: 'Mittwoch', pronunciation: 'MIT-vokh', meaningId: 'Rabu' },
  { german: 'Donnerstag', pronunciation: 'DON-ners-tak', meaningId: 'Kamis' },
  { german: 'Freitag', pronunciation: 'FRAI-tak', meaningId: 'Jumat' },
  { german: 'Samstag', pronunciation: 'ZAMS-tak', meaningId: 'Sabtu' },
  { german: 'Sonntag', pronunciation: 'ZON-tak', meaningId: 'Minggu' },
]

export const MONTHS: MonthInfo[] = [
  { german: 'Januar', meaningId: 'Januari' },
  { german: 'Februar', meaningId: 'Februari' },
  { german: 'März', meaningId: 'Maret' },
  { german: 'April', meaningId: 'April' },
  { german: 'Mai', meaningId: 'Mei' },
  { german: 'Juni', meaningId: 'Juni' },
  { german: 'Juli', meaningId: 'Juli' },
  { german: 'August', meaningId: 'Agustus' },
  { german: 'September', meaningId: 'September' },
  { german: 'Oktober', meaningId: 'Oktober' },
  { german: 'November', meaningId: 'November' },
  { german: 'Dezember', meaningId: 'Desember' },
]

/** Konteks waktu relatif untuk latihan percakapan. */
export const TIME_CONTEXTS: DayInfo[] = [
  { german: 'heute', pronunciation: 'HOI-te', meaningId: 'hari ini' },
  { german: 'morgen', pronunciation: 'MOR-gen', meaningId: 'besok' },
  { german: 'gestern', pronunciation: 'GES-tern', meaningId: 'kemarin' },
  { german: 'übermorgen', pronunciation: 'ü-ber-MOR-gen', meaningId: 'lusa' },
  { german: 'vorgestern', pronunciation: 'for-GES-tern', meaningId: 'kemarin lusa' },
  { german: 'das Wochenende', pronunciation: 'VO-khen-en-de', meaningId: 'akhir pekan' },
  { german: 'die Woche', pronunciation: 'VO-khe', meaningId: 'minggu (pekan)' },
  { german: 'der Monat', pronunciation: 'MO-nat', meaningId: 'bulan' },
  { german: 'das Jahr', pronunciation: 'yaar', meaningId: 'tahun' },
]

/**
 * Hari libur nasional Jerman, dikunci "bulan-tanggal" (bulan 0-index).
 * Hanya tanggal tetap; yang berpindah tiap tahun (Paskah dll.) ditandai movable.
 */
const HOLIDAYS: Record<string, HolidayInfo> = {
  '0-1': { german: 'Neujahr', meaningId: 'Tahun Baru' },
  '4-1': { german: 'Tag der Arbeit', meaningId: 'Hari Buruh' },
  '9-3': { german: 'Tag der Deutschen Einheit', meaningId: 'Hari Persatuan Jerman' },
  '11-25': { german: 'Weihnachten', meaningId: 'Natal' },
  '11-26': { german: 'Zweiter Weihnachtstag', meaningId: 'Hari Natal Kedua' },
  '11-31': { german: 'Silvester', meaningId: 'Malam Tahun Baru' },
}

/** Cari hari libur tetap berdasarkan bulan (0-index) dan tanggal. */
export function isHoliday(month: number, day: number): HolidayInfo | undefined {
  return HOLIDAYS[`${month}-${day}`]
}

/**
 * Grid kalender untuk satu bulan: 42 sel (6 baris x 7 kolom) dimulai Senin.
 * Sel di luar bulan bernilai null.
 */
export function buildMonthGrid(year: number, month: number): (number | null)[] {
  const firstWeekday = new Date(year, month, 1).getDay() // 0 = Minggu
  // Geser agar minggu dimulai Senin: Minggu (0) menjadi indeks 6.
  const leading = (firstWeekday + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (number | null)[] = []
  for (let i = 0; i < leading; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length < 42) cells.push(null)

  return cells
}

/** Nama hari Jerman untuk tanggal tertentu. */
export function weekdayForDate(year: number, month: number, day: number): DayInfo {
  const jsDay = new Date(year, month, day).getDay() // 0 = Minggu
  return WEEKDAYS[(jsDay + 6) % 7]
}
