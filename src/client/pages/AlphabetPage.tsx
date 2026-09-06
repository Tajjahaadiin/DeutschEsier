import React, { useState } from 'react'
import {
  ArrowLeft,
  Search,
  BookOpen,
  Sparkles,
  AlertTriangle,
  RotateCcw,
  Gauge
} from 'lucide-react'
import { GERMAN_ALPHABET, GermanAlphabetItem } from '../data/alphabetData'
import { AlphabetCard } from '../components/alphabet/AlphabetCard'
import { AlphabetDetailModal } from '../components/alphabet/AlphabetDetailModal'
import { SpellingTrainer } from '../components/alphabet/SpellingTrainer'
import {
  getStoredVoiceGender,
  setStoredVoiceGender,
  type VoiceGender
} from '../lib/audio'

interface AlphabetPageProps {
  navigate: (path: string) => void
}

type FilterType = 'all' | 'vowel' | 'consonant' | 'special' | 'critical'

export default function AlphabetPage({ navigate }: AlphabetPageProps) {
  const [activeTab, setActiveTab] = useState<'cards' | 'trainer'>('cards')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [voiceGender, setVoiceGender] = useState<VoiceGender>(() => getStoredVoiceGender())
  const [speechRate, setSpeechRate] = useState<number>(1.0)
  const [selectedItem, setSelectedItem] = useState<GermanAlphabetItem | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleGenderChange = (gender: VoiceGender) => {
    setVoiceGender(gender)
    setStoredVoiceGender(gender)
  }

  const counts = {
    all: GERMAN_ALPHABET.length,
    vowel: GERMAN_ALPHABET.filter((i) => i.category === 'vowel').length,
    consonant: GERMAN_ALPHABET.filter((i) => i.category === 'consonant').length,
    special: GERMAN_ALPHABET.filter((i) => i.category === 'special').length,
    critical: GERMAN_ALPHABET.filter((i) => i.isCriticalForId).length,
  }

  const filteredItems = GERMAN_ALPHABET.filter((item) => {
    if (filterType === 'vowel' && item.category !== 'vowel') return false
    if (filterType === 'consonant' && item.category !== 'consonant') return false
    if (filterType === 'special' && item.category !== 'special') return false
    if (filterType === 'critical' && !item.isCriticalForId) return false

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      const matchLetter =
        item.letter.toLowerCase().includes(q) || item.lowercase.toLowerCase().includes(q)
      const matchName = item.name.toLowerCase().includes(q)
      const matchAnchor =
        item.anchor.word.toLowerCase().includes(q) || item.anchor.analogy.toLowerCase().includes(q)
      const matchExample =
        item.example.word.toLowerCase().includes(q) ||
        item.example.meaningId.toLowerCase().includes(q)
      return matchLetter || matchName || matchAnchor || matchExample
    }

    return true
  })

  const openDetail = (item: GermanAlphabetItem) => {
    setSelectedItem(item)
    setIsModalOpen(true)
  }

  const closeDetail = () => {
    setIsModalOpen(false)
  }

  return (
    <div className="min-h-screen pb-24 bg-slate-50">
      {/* Sticky Top Header */}
      <header className="bg-white border-b sticky top-0 z-30 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Kembali ke Beranda"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                Das Deutsche Alphabet
              </h1>
              <p className="text-xs text-slate-500 hidden sm:block">
                30 Karakter dengan Kata Jangkar Indonesia & Buchstabier-Trainer
              </p>
            </div>
          </div>

          {/* Voice & Speed Controls */}
          <div className="flex items-center gap-2">
            {/* Gender Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => handleGenderChange('female')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  voiceGender === 'female'
                    ? 'bg-white text-rose-600 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                👩 Katja
              </button>
              <button
                type="button"
                onClick={() => handleGenderChange('male')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
                  voiceGender === 'male'
                    ? 'bg-white text-sky-600 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                👨 Conrad
              </button>
            </div>

            {/* Speed Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setSpeechRate(1.0)}
                className={`px-2 py-1 rounded-lg font-medium transition-all ${
                  speechRate === 1.0
                    ? 'bg-white text-blue-600 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Kecepatan Normal"
              >
                1.0x
              </button>
              <button
                type="button"
                onClick={() => setSpeechRate(0.75)}
                className={`px-2 py-1 rounded-lg font-medium transition-all ${
                  speechRate === 0.75
                    ? 'bg-white text-blue-600 shadow-xs font-semibold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Kecepatan Lambat"
              >
                0.75x
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 mt-6">
        {/* Mode Switcher Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-200/70 rounded-2xl w-fit mb-6">
          <button
            onClick={() => setActiveTab('cards')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'cards'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen size={16} />
            <span>🔤 Kartu Alfabet (30)</span>
          </button>
          <button
            onClick={() => setActiveTab('trainer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'trainer'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles size={16} />
            <span>🗣️ Buchstabier-Trainer</span>
          </button>
        </div>

        {activeTab === 'cards' ? (
          <div>
            {/* Search and Filters Bar */}
            <div className="space-y-3 mb-6">
              {/* Search Box */}
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Cari huruf, nama Jerman, kata jangkar (cth: Yoyo, Pizza), atau contoh kata..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                    filterType === 'all'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Semua ({counts.all})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('vowel')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                    filterType === 'vowel'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  Vokal ({counts.vowel})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('consonant')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                    filterType === 'consonant'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100'
                  }`}
                >
                  Konsonan ({counts.consonant})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('special')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 ${
                    filterType === 'special'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-purple-50 border border-purple-200 text-purple-800 hover:bg-purple-100'
                  }`}
                >
                  Umlaut & ß ({counts.special})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('critical')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all shrink-0 flex items-center gap-1.5 ${
                    filterType === 'critical'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-amber-50 border border-amber-300 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  <AlertTriangle size={13} />
                  <span>⚠️ 7 Kritis Lidah RI ({counts.critical})</span>
                </button>
              </div>
            </div>

            {/* Quick Helper Banner */}
            <div className="mb-6 p-4 rounded-2xl bg-linear-to-r from-blue-50 via-sky-50 to-indigo-50 border border-blue-200/80 flex items-center justify-between gap-4">
              <div className="text-xs text-slate-700 space-y-1">
                <p className="font-semibold text-blue-900 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-blue-600" />
                  Metode Fonetik Kata Jangkar Bahasa Indonesia
                </p>
                <p className="text-slate-600">
                  Klik tombol <strong>Eja</strong> untuk mendengarkan nama huruf, atau klik kartu untuk melihat tips posisi lidah dan jebakan bunyi untuk penutur Indonesia.
                </p>
              </div>
              <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-slate-600 bg-white/80 px-3 py-1.5 rounded-xl border border-blue-200 shrink-0">
                <Gauge size={14} className="text-blue-600" />
                <span>Audio: {voiceGender === 'female' ? 'Katja' : 'Conrad'} ({speechRate}x)</span>
              </div>
            </div>

            {/* Grid of Alphabet Cards */}
            {filteredItems.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 text-slate-400">
                <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-base font-semibold text-slate-700">Tidak ada huruf ditemukan</p>
                <p className="text-xs text-slate-400 mt-1">Coba bersihkan pencarian atau ganti filter kategori.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredItems.map((item) => (
                  <AlphabetCard
                    key={item.id}
                    item={item}
                    onOpenDetail={openDetail}
                    voiceGender={voiceGender}
                    speechRate={speechRate}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Trainer Mode */
          <div>
            <SpellingTrainer voiceGender={voiceGender} speechRate={speechRate} />
          </div>
        )}
      </main>

      {/* Detail Modal */}
      <AlphabetDetailModal
        item={selectedItem}
        isOpen={isModalOpen}
        onClose={closeDetail}
        voiceGender={voiceGender}
        speechRate={speechRate}
      />
    </div>
  )
}
