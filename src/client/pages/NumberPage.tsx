import { useMemo, useState } from 'react'
import { ChevronLeft, Volume2, RotateCcw, Sparkles, Hash, Gamepad2 } from 'lucide-react'
import { speakGerman, getStoredVoiceGender, setStoredVoiceGender, type VoiceGender } from '../lib/audio'
import { combineNumberAndNoun } from '../lib/numberGame'
import { NUMBER_ITEMS } from '../data/numberData'
import { OBJECT_ITEMS, OBJECT_CATEGORIES, type ObjectItem } from '../data/objectData'

interface NumberPageProps {
  navigate: (path: string) => void
}

type Tab = 'cards' | 'game'

/** Kartu angka yang dipakai di game (biar tidak terlalu banyak). */
const GAME_NUMBERS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

export default function NumberPage({ navigate }: NumberPageProps) {
  const [activeTab, setActiveTab] = useState<Tab>('cards')
  const [voiceGender, setVoiceGender] = useState<VoiceGender>(() => getStoredVoiceGender())
  const [speechRate, setSpeechRate] = useState(1.0)
  const [playing, setPlaying] = useState<string | null>(null)

  // --- State game ---
  const [numberSlot, setNumberSlot] = useState<number | null>(null)
  const [objectSlot, setObjectSlot] = useState<ObjectItem | null>(null)
  const [generated, setGenerated] = useState<string | null>(null)
  const [category, setCategory] = useState<string>('Semua')

  const handleGenderChange = (gender: VoiceGender) => {
    setVoiceGender(gender)
    setStoredVoiceGender(gender)
  }

  const handlePlay = (text: string) => {
    setPlaying(text)
    speakGerman(text, { gender: voiceGender, rate: speechRate, onEnd: () => setPlaying(null) })
  }

  const gameObjects = useMemo(
    () => (category === 'Semua' ? OBJECT_ITEMS : OBJECT_ITEMS.filter((o) => o.category === category)),
    [category]
  )

  const handleGenerate = () => {
    if (numberSlot === null || !objectSlot) return
    setGenerated(combineNumberAndNoun(numberSlot, objectSlot).german)
  }

  const handleReset = () => {
    setNumberSlot(null)
    setObjectSlot(null)
    setGenerated(null)
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              aria-label="Kembali"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-800">die Nummer</h1>
              <p className="text-xs text-slate-500">Belajar angka & menghitung benda</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => handleGenderChange('female')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  voiceGender === 'female' ? 'bg-white text-rose-600 shadow-xs font-semibold' : 'text-slate-500'
                }`}
              >
                👩 Katja
              </button>
              <button
                type="button"
                onClick={() => handleGenderChange('male')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                  voiceGender === 'male' ? 'bg-white text-sky-600 shadow-xs font-semibold' : 'text-slate-500'
                }`}
              >
                👨 Conrad
              </button>
            </div>
            <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl text-xs">
              {[1.0, 0.75].map((rate) => (
                <button
                  key={rate}
                  type="button"
                  onClick={() => setSpeechRate(rate)}
                  className={`px-2 py-1 rounded-lg font-medium transition-all cursor-pointer ${
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

      <main className="max-w-6xl mx-auto px-4 mt-6">
        {/* Tab */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-2xl w-fit mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('cards')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'cards' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            <Hash size={15} /> Kartu Angka
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('game')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeTab === 'game' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
            }`}
          >
            <Gamepad2 size={15} /> Game Hitung
          </button>
        </div>

        {/* ============ TAB: KARTU ANGKA ============ */}
        {activeTab === 'cards' && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {NUMBER_ITEMS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => handlePlay(item.german)}
                className="bg-white rounded-2xl border border-slate-200 p-4 text-left hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <span className="text-3xl font-extrabold text-slate-800">{item.value}</span>
                  <Volume2
                    size={16}
                    className={playing === item.german ? 'animate-pulse text-blue-600' : 'text-slate-300'}
                  />
                </div>
                <p className="text-sm font-bold text-blue-700 mt-1">{item.german}</p>
                <p className="text-[11px] text-slate-400">{item.pronunciation}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">{item.meaningId}</p>
              </button>
            ))}
          </div>
        )}

        {/* ============ TAB: GAME ============ */}
        {activeTab === 'game' && (
          <div className="space-y-6">
            {/* Papan permainan */}
            <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6">
              <h2 className="text-sm font-bold text-slate-700 mb-1">Susun frasa angka + benda</h2>
              <p className="text-xs text-slate-500 mb-4">
                Letakkan satu kartu angka dan satu kartu benda ke kotak, lalu tekan Generate.
                Bisa juga diklik langsung (untuk layar sentuh).
              </p>

              <div className="flex items-center justify-center gap-3 flex-wrap">
                <DropSlot
                  label="Angka"
                  filled={numberSlot !== null}
                  onClear={() => {
                    setNumberSlot(null)
                    setGenerated(null)
                  }}
                  onDropItem={(text) => {
                    const value = parseInt(text, 10)
                    if (!Number.isNaN(value)) {
                      setNumberSlot(value)
                      setGenerated(null)
                    }
                  }}
                >
                  {numberSlot !== null && (
                    <span className="text-2xl font-extrabold text-slate-800">{numberSlot}</span>
                  )}
                </DropSlot>

                <span className="text-xl font-bold text-slate-300">+</span>

                <DropSlot
                  label="Benda"
                  filled={objectSlot !== null}
                  onClear={() => {
                    setObjectSlot(null)
                    setGenerated(null)
                  }}
                  onDropItem={(text) => {
                    const found = OBJECT_ITEMS.find((o) => o.noun === text)
                    if (found) {
                      setObjectSlot(found)
                      setGenerated(null)
                    }
                  }}
                >
                  {objectSlot && (
                    <div className="text-center">
                      <div className="text-3xl">{objectSlot.emoji}</div>
                      <div className="text-[11px] font-bold text-slate-600">{objectSlot.noun}</div>
                    </div>
                  )}
                </DropSlot>

                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={numberSlot === null || !objectSlot}
                  className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  <Sparkles size={16} /> Generate
                </button>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-bold transition-all cursor-pointer"
                >
                  <RotateCcw size={15} /> Reset
                </button>
              </div>

              {/* Hasil */}
              {generated && (
                <div className="mt-5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-blue-600 mb-1">
                    Hasil
                  </p>
                  <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">{generated}</p>
                  <button
                    type="button"
                    onClick={() => handlePlay(generated)}
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-blue-300 text-blue-700 text-xs font-bold hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <Volume2 size={14} className={playing === generated ? 'animate-pulse' : ''} />
                    Dengarkan
                  </button>
                </div>
              )}
            </div>

            {/* Kartu angka */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Kartu Angka
              </h3>
              <div className="flex flex-wrap gap-2">
                {GAME_NUMBERS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', String(n))}
                    onClick={() => {
                      setNumberSlot(n)
                      setGenerated(null)
                    }}
                    className={`w-14 h-14 rounded-2xl border-2 font-extrabold text-lg transition-all cursor-grab active:cursor-grabbing ${
                      numberSlot === n
                        ? 'bg-blue-600 border-blue-600 text-white'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Kartu benda */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Kartu Benda
                </h3>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="text-xs px-2 py-1 border border-slate-300 rounded-lg bg-white cursor-pointer"
                >
                  <option value="Semua">Semua kategori</option>
                  {OBJECT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {gameObjects.map((obj) => (
                  <button
                    key={obj.noun}
                    type="button"
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData('text/plain', obj.noun)}
                    onClick={() => {
                      setObjectSlot(obj)
                      setGenerated(null)
                    }}
                    className={`rounded-2xl border-2 p-3 text-center transition-all cursor-grab active:cursor-grabbing ${
                      objectSlot?.noun === obj.noun
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : 'bg-white border-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="text-2xl">{obj.emoji}</div>
                    <div
                      className={`text-[11px] font-bold mt-1 ${
                        objectSlot?.noun === obj.noun ? 'text-white' : 'text-slate-700'
                      }`}
                    >
                      {obj.noun}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

/** Kotak tujuan drag & drop. */
function DropSlot({
  label,
  filled,
  onDropItem,
  onClear,
  children,
}: {
  label: string
  filled: boolean
  onDropItem: (text: string) => void
  onClear: () => void
  children?: React.ReactNode
}) {
  const [over, setOver] = useState(false)

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setOver(false)
        onDropItem(e.dataTransfer.getData('text/plain'))
      }}
      onClick={filled ? onClear : undefined}
      className={`w-32 h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all ${
        over
          ? 'border-blue-500 bg-blue-50 scale-105'
          : filled
          ? 'border-solid border-slate-300 bg-slate-50 cursor-pointer'
          : 'border-slate-300 bg-white'
      }`}
      title={filled ? 'Klik untuk mengosongkan' : undefined}
    >
      {filled ? (
        children
      ) : (
        <span className="text-xs font-semibold text-slate-400">{label}</span>
      )}
    </div>
  )
}
