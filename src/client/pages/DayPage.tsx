import { useState } from 'react'
import { ChevronLeft, ChevronRight, Volume2, CalendarDays, PartyPopper, Clock } from 'lucide-react'
import { playCalendarAudio, playAudioSequence } from '../lib/audio'
import { GRUNDLAGEN_PERSONA_ID } from '../../shared/ttsPersonas'
import {
  WEEKDAYS,
  MONTHS,
  TIME_CONTEXTS,
  HOLIDAY_LIST,
  buildMonthGrid,
  isHoliday,
  weekdayForDate,
  shiftMonth,
} from '../lib/calendar'

interface DayPageProps {
  navigate: (path: string) => void
  embedded?: boolean
}

export default function DayPage({ navigate, embedded = false }: DayPageProps) {
  const [cursor, setCursor] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })
  const currentPersonaId = GRUNDLAGEN_PERSONA_ID
  const [speechRate, setSpeechRate] = useState(1.0)
  const [playing, setPlaying] = useState<string | null>(null)

  const { year, month: monthIndex } = cursor

  const handlePlay = (text: string) => {
    setPlaying(text)
    playCalendarAudio(text, {
      personaId: currentPersonaId,
      rate: speechRate,
      onEnd: () => setPlaying(null),
    })
  }

  const handlePlayDate = (weekdayGerman: string, dayNumber: number, monthGerman: string) => {
    const fullText = `${weekdayGerman}, der ${dayNumber}. ${monthGerman}`
    setPlaying(fullText)

    // Bersihkan slug hari dan bulan
    const weekdaySlug = weekdayGerman.toLowerCase().trim().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
    const monthSlug = monthGerman.toLowerCase().trim().replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')

    // Rangkaian audio statis Martin: Hari -> Angka Tanggal -> Nama Bulan
    playAudioSequence([
      { url: `/audio/days/${weekdaySlug}.mp3`, fallbackText: weekdayGerman },
      { url: `/audio/numbers/${dayNumber}.mp3`, fallbackText: dayNumber.toString() },
      { url: `/audio/days/${monthSlug}.mp3`, fallbackText: monthGerman },
    ], {
      personaId: currentPersonaId,
      rate: speechRate,
      onEnd: () => setPlaying(null),
    })
  }

  const grid = buildMonthGrid(year, monthIndex)
  const month = MONTHS[monthIndex]

  const goPrev = () => setCursor((c) => shiftMonth(c.year, c.month, -1))
  const goNext = () => setCursor((c) => shiftMonth(c.year, c.month, 1))

  return (
    <div className={embedded ? 'space-y-6' : 'min-h-dvh bg-slate-50 pb-20'}>
      {!embedded && (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
          <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                aria-label="Kembali"
              >
                <ChevronLeft size={20} />
              </button>
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold text-slate-800">die Tage</h1>
                <p className="text-xs text-slate-500">Hari, tanggal & hari libur Jerman</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-lg text-xs">
                {[1.0, 0.75].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => setSpeechRate(rate)}
                    className={`px-2 py-1 rounded-md font-medium transition-all cursor-pointer ${
                      speechRate === rate ? 'bg-white text-blue-600 shadow-xs font-semibold' : 'text-slate-500'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </header>
      )}

      <main className={embedded ? '' : 'max-w-4xl mx-auto px-4 mt-6 space-y-6'}>
        {/* ============ KALENDER DINDING ============ */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
          {/* Kepala kalender */}
          <div className="bg-primary text-on-primary p-5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={goPrev}
                className="p-2 rounded-md bg-white/20 hover:bg-white/30 transition-colors cursor-pointer"
                aria-label="Bulan sebelumnya"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="text-center">
                <div className="flex items-center justify-center gap-2">
                  <CalendarDays size={18} />
                  <h2 className="text-xl sm:text-2xl font-extrabold">{month.german}</h2>
                </div>
                <p className="text-xs text-blue-200 mt-0.5">
                  {month.meaningId} {year}
                </p>
                <button
                  type="button"
                  onClick={() => handlePlay(month.german)}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/20 hover:bg-white/30 text-label font-semibold transition-colors cursor-pointer"
                >
                  <Volume2 size={12} className={playing === month.german ? 'animate-pulse' : ''} />
                  Dengarkan
                </button>
              </div>

              <button
                type="button"
                onClick={goNext}
                className="p-2 rounded-md bg-white/20 hover:bg-white/30 transition-colors cursor-pointer"
                aria-label="Bulan berikutnya"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Nama hari */}
          <div className="grid grid-cols-7 border-b border-slate-100">
            {WEEKDAYS.map((d) => (
              <div key={d.german} className="py-2 text-center">
                <p className="text-label sm:text-xs font-bold text-slate-700">{d.german}</p>
                <p className="text-label text-slate-400">{d.meaningId}</p>
              </div>
            ))}
          </div>

          {/* Grid tanggal */}
          <div className="grid grid-cols-7">
            {grid.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="aspect-square border-b border-r border-slate-50" />
              }
              const holiday = isHoliday(monthIndex, day)
              const info = weekdayForDate(year, monthIndex, day)
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handlePlayDate(info.german, day, month.german)}
                  className={`aspect-square border-b border-r border-slate-50 p-1 flex flex-col items-center justify-center transition-colors cursor-pointer ${
                    holiday ? 'bg-rose-50 hover:bg-rose-100' : 'hover:bg-slate-50'
                  }`}
                  title={holiday ? `${holiday.german} (${holiday.meaningId})` : `${info.german} (${info.meaningId})`}
                >
                  <span className={`text-sm font-bold ${holiday ? 'text-rose-700' : 'text-slate-700'}`}>
                    {day}
                  </span>
                  {holiday && <PartyPopper size={12} className="text-rose-600" aria-label="Hari libur" />}
                </button>
              )
            })}
          </div>

          {/* Legenda */}
          <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-4 flex-wrap">
            <span className="text-label text-slate-500">
              Klik tanggal untuk mendengar hari + tanggalnya dalam bahasa Jerman.
            </span>
            <span className="text-label text-rose-600 font-semibold flex items-center gap-1">
              <PartyPopper size={12} aria-hidden="true" /> = hari libur
            </span>
          </div>
        </div>

        {/* ============ BONUS: HARI LIBUR ============ */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <PartyPopper size={18} className="text-rose-500" />
            <h3 className="text-sm font-extrabold text-slate-800">Feiertage — Hari Libur Jerman</h3>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            {HOLIDAY_LIST.map((h) => (
              <button
                key={h.german}
                type="button"
                onClick={() => handlePlay(h.german)}
                className="bg-white rounded-md border border-slate-200 p-4 text-left hover:border-rose-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{h.german}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{h.meaningId}</p>
                    <p className="text-label text-slate-400 mt-1">
                      {h.day} {MONTHS[h.month].meaningId}
                    </p>
                  </div>
                  <Volume2
                    size={16}
                    className={playing === h.german ? 'animate-pulse text-rose-500' : 'text-slate-300'}
                  />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ============ BONUS: KONTEKS WAKTU ============ */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Clock size={18} className="text-slate-500" />
            <h3 className="text-sm font-extrabold text-slate-800">Zeitangaben — Konteks Waktu</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TIME_CONTEXTS.map((t) => (
              <button
                key={t.german}
                type="button"
                onClick={() => handlePlay(t.german)}
                className="bg-white rounded-md border border-slate-200 p-3 text-left hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{t.german}</p>
                    <p className="text-label text-slate-400">{t.pronunciation}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{t.meaningId}</p>
                  </div>
                  <Volume2
                    size={14}
                    className={playing === t.german ? 'animate-pulse text-blue-600' : 'text-slate-300'}
                  />
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
