import React, { useState, useRef, useEffect } from 'react'
import { Play, Square, Sparkles, Volume2, RotateCcw, Plus, Pencil, Trash2, Settings, X } from 'lucide-react'
import { GERMAN_ALPHABET, GermanAlphabetItem } from '../../data/alphabetData'
import { speakGerman, type VoiceGender } from '../../lib/audio'

interface SpellingTrainerProps {
  voiceGender?: VoiceGender
  speechRate?: number
}

export interface SpellingWordItem {
  id: string
  word: string
  meaning?: string
  isDefault?: boolean
}

const DEFAULT_PRESET_ITEMS: SpellingWordItem[] = [
  { id: '1', word: 'KAFFEE', meaning: 'Kopi', isDefault: true },
  { id: '2', word: 'MUSIK', meaning: 'Musik', isDefault: true },
  { id: '3', word: 'TAXI', meaning: 'Taksi', isDefault: true },
  { id: '4', word: 'PIZZA', meaning: 'Pizza', isDefault: true },
  { id: '5', word: 'STRASSE', meaning: 'Jalan', isDefault: true },
  { id: '6', word: 'HOTEL', meaning: 'Hotel', isDefault: true },
  { id: '7', word: 'AUTO', meaning: 'Mobil', isDefault: true },
]

// Lookup map for fast character search
const ALPHABET_MAP = new Map<string, GermanAlphabetItem>()
GERMAN_ALPHABET.forEach((item) => {
  ALPHABET_MAP.set(item.letter.toUpperCase(), item)
  ALPHABET_MAP.set(item.lowercase.toUpperCase(), item)
})

export const SpellingTrainer: React.FC<SpellingTrainerProps> = ({
  voiceGender = 'female',
  speechRate = 1.0,
}) => {
  const [wordList, setWordList] = useState<SpellingWordItem[]>(() => {
    try {
      const saved = localStorage.getItem('de_spelling_words')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (e) {
      console.error(e)
    }
    return DEFAULT_PRESET_ITEMS
  })

  const [inputText, setInputText] = useState('KAFFEE')
  const [isPlaying, setIsPlaying] = useState(false)
  const [activeIndex, setActiveIndex] = useState<number>(-1)
  const [isFullWordActive, setIsFullWordActive] = useState(false)

  const [isManageMode, setIsManageMode] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingWordId, setEditingWordId] = useState<string | null>(null)
  const [modalWord, setModalWord] = useState('')
  const [modalMeaning, setModalMeaning] = useState('')
  const [modalError, setModalError] = useState('')

  const isCancelledRef = useRef(false)
  const timerRef = useRef<any>(null)

  const saveWordList = (newList: SpellingWordItem[]) => {
    setWordList(newList)
    try {
      localStorage.setItem('de_spelling_words', JSON.stringify(newList))
    } catch (e) {
      console.error(e)
    }
  }

  const handleResetToDefault = () => {
    if (confirm('Kembalikan daftar kata ke pengaturan bawaan?')) {
      saveWordList(DEFAULT_PRESET_ITEMS)
    }
  }

  const isModified = JSON.stringify(wordList) !== JSON.stringify(DEFAULT_PRESET_ITEMS)

  const sanitizeWord = (str: string) => {
    return str.toUpperCase().replace(/[^A-ZÄÖÜß\s-]/gi, '')
  }

  const trimmedInput = inputText.trim().toUpperCase()
  const isInputInWordList = trimmedInput.length > 0 && wordList.some(item => item.word.toUpperCase() === trimmedInput)

  const handleSaveInstantWord = () => {
    const cleanWord = sanitizeWord(inputText).trim()
    if (!cleanWord || wordList.some(item => item.word.toUpperCase() === cleanWord)) return

    const newItem: SpellingWordItem = {
      id: Date.now().toString(),
      word: cleanWord,
      meaning: '',
      isDefault: false
    }
    saveWordList([...wordList, newItem])
  }

  const handleOpenAddModal = () => {
    setEditingWordId(null)
    setModalWord('')
    setModalMeaning('')
    setModalError('')
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (item: SpellingWordItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setEditingWordId(item.id)
    setModalWord(item.word)
    setModalMeaning(item.meaning || '')
    setModalError('')
    setIsModalOpen(true)
  }

  const handleDeleteWord = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    saveWordList(wordList.filter(item => item.id !== id))
  }

  const handleSaveModal = () => {
    const clean = sanitizeWord(modalWord).trim()
    if (!clean) {
      setModalError('Kata Jerman tidak boleh kosong')
      return
    }

    const duplicate = wordList.some(item => item.id !== editingWordId && item.word.toUpperCase() === clean)
    if (duplicate) {
      setModalError('Kata ini sudah ada di daftar')
      return
    }

    if (editingWordId) {
      const updated = wordList.map(item => item.id === editingWordId ? {
        ...item,
        word: clean,
        meaning: modalMeaning.trim() || undefined
      } : item)
      saveWordList(updated)
    } else {
      const newItem: SpellingWordItem = {
        id: Date.now().toString(),
        word: clean,
        meaning: modalMeaning.trim() || undefined,
        isDefault: false
      }
      saveWordList([...wordList, newItem])
    }
    setIsModalOpen(false)
  }

  useEffect(() => {
    return () => {
      // Clean up audio & timeouts when unmounting
      isCancelledRef.current = true
      if (timerRef.current) clearTimeout(timerRef.current)
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  const stopPlayback = () => {
    isCancelledRef.current = true
    if (timerRef.current) clearTimeout(timerRef.current)
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setIsPlaying(false)
    setActiveIndex(-1)
    setIsFullWordActive(false)
  }

  // Parse text into individual characters
  const characters = inputText.split('').map((char) => {
    const upper = char.toUpperCase()
    const item = ALPHABET_MAP.get(upper)
    return {
      raw: char,
      upper,
      item: item || null,
      name: item ? item.name : char === ' ' ? 'Spasi' : char,
    }
  })

  const playSingleLetter = (item: GermanAlphabetItem | null, index: number) => {
    if (isPlaying) stopPlayback()
    if (!item) return
    setActiveIndex(index)
    speakGerman(item.audioText.letterOnly, {
      gender: voiceGender,
      rate: speechRate,
      onEnd: () => setActiveIndex(-1),
    })
  }

  const handleStartPlayback = async () => {
    if (isPlaying) {
      stopPlayback()
      return
    }

    if (!inputText.trim()) return

    isCancelledRef.current = false
    setIsPlaying(true)
    setIsFullWordActive(false)

    for (let i = 0; i < characters.length; i++) {
      if (isCancelledRef.current) break

      setActiveIndex(i)
      const current = characters[i]

      await new Promise<void>((resolve) => {
        let hasResolved = false
        const done = () => {
          if (!hasResolved) {
            hasResolved = true
            timerRef.current = setTimeout(resolve, 350)
          }
        }

        if (current.item) {
          speakGerman(current.item.audioText.letterOnly, {
            gender: voiceGender,
            rate: speechRate,
            onEnd: done,
          })
          // Safety timeout in case onEnd is not triggered
          timerRef.current = setTimeout(done, 900)
        } else {
          // Non-alphabet character delay
          timerRef.current = setTimeout(resolve, 400)
        }
      })
    }

    // Play whole word at the finish
    if (!isCancelledRef.current && inputText.trim()) {
      setActiveIndex(-1)
      setIsFullWordActive(true)

      await new Promise<void>((resolve) => {
        let hasResolved = false
        const done = () => {
          if (!hasResolved) {
            hasResolved = true
            timerRef.current = setTimeout(resolve, 400)
          }
        }

        speakGerman(inputText.trim(), {
          gender: voiceGender,
          rate: speechRate,
          onEnd: done,
        })
        timerRef.current = setTimeout(done, 1400)
      })
    }

    if (!isCancelledRef.current) {
      setIsPlaying(false)
      setActiveIndex(-1)
      setIsFullWordActive(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
      {/* Trainer Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-2">
            <Sparkles size={14} />
            <span>Buchstabier-Trainer (Simulator Ejaan)</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">
            Eja Kata atau Namamu dalam Bahasa Jerman
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Ketik kata atau nama apapun untuk mendengarkan pelafalan huruf demi huruf (buchstabieren).
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {isPlaying ? (
            <button
              onClick={stopPlayback}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-sm transition-all"
            >
              <Square size={16} />
              <span>Berhenti</span>
            </button>
          ) : (
            <button
              onClick={handleStartPlayback}
              disabled={!inputText.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm shadow-sm transition-all"
            >
              <Play size={16} fill="currentColor" />
              <span>Mainkan Ejaan Lengkap</span>
            </button>
          )}

          {inputText && (
            <button
              onClick={() => {
                stopPlayback()
                setInputText('')
              }}
              className="p-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors"
              title="Kosongkan teks"
            >
              <RotateCcw size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Input Form */}
      <div className="my-6">
        <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
          Ketik Kata / Nama:
        </label>
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch">
          <input
            type="text"
            value={inputText}
            onChange={(e) => {
              if (isPlaying) stopPlayback()
              setInputText(e.target.value.toUpperCase())
            }}
            placeholder="Ketik kata, misal: AUTO, BECAK, ATAU NAMAMU..."
            className="flex-1 text-lg sm:text-2xl font-mono uppercase font-bold tracking-wider px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
          {trimmedInput.length > 0 && !isInputInWordList && (
            <button
              type="button"
              onClick={handleSaveInstantWord}
              className="flex-shrink-0 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs sm:text-sm font-semibold transition-all shadow-xs cursor-pointer"
              title="Simpan ke Daftar Kata"
            >
              <span>⭐ Simpan ke Daftar Kata</span>
            </button>
          )}
        </div>

        {/* Word Chips & Management */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-2">
          <div className="flex items-center flex-wrap gap-1.5">
            <span className="text-xs font-medium text-slate-400 mr-1">Daftar Kata:</span>
            {wordList.map((item) => (
              <div
                key={item.id}
                className={`inline-flex items-center rounded-lg text-xs transition-colors border ${
                  inputText === item.word
                    ? 'bg-blue-600 text-white font-bold border-blue-600'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    if (isPlaying) stopPlayback()
                    setInputText(item.word)
                  }}
                  className="px-2.5 py-1 flex items-center gap-1 cursor-pointer"
                >
                  <span>{item.word}</span>
                  {item.meaning && (
                    <span className={`text-[10px] ${inputText === item.word ? 'text-blue-100' : 'text-slate-500'}`}>
                      ({item.meaning})
                    </span>
                  )}
                </button>
                {isManageMode && !item.isDefault && (
                  <div className="flex items-center pr-1 gap-0.5 border-l border-slate-300/40 ml-0.5 pl-1">
                    <button
                      type="button"
                      onClick={(e) => handleOpenEditModal(item, e)}
                      title="Edit kata"
                      className={`p-1 rounded hover:bg-black/10 cursor-pointer ${
                        inputText === item.word ? 'text-white' : 'text-slate-500 hover:text-blue-600'
                      }`}
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeleteWord(item.id, e)}
                      title="Hapus kata"
                      className={`p-1 rounded hover:bg-black/10 cursor-pointer ${
                        inputText === item.word ? 'text-white' : 'text-slate-500 hover:text-red-600'
                      }`}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="text-xs px-2.5 py-1 rounded-lg font-medium bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>+ Tambah Kata</span>
            </button>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setIsManageMode(!isManageMode)}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1.5 transition-colors border cursor-pointer ${
                isManageMode
                  ? 'bg-amber-100 text-amber-900 border-amber-300 font-semibold'
                  : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
              }`}
              title="Kelola daftar kata"
            >
              <Settings size={13} />
              <span>{isManageMode ? 'Selesai Kelola' : 'Kelola Kata'}</span>
            </button>
            {isModified && (
              <button
                type="button"
                onClick={handleResetToDefault}
                className="text-xs px-2.5 py-1 rounded-lg font-medium text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                title="Reset daftar kata ke bawaan awal"
              >
                Reset ke Bawaan
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Letter Visual Cards Row */}
      <div className="mt-6 pt-6 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Urutan Ejaan ({characters.filter((c) => c.item).length} Huruf)
          </span>
          <span className="text-xs text-slate-400">
            Tip: Klik salah satu huruf untuk mengeja secara langsung
          </span>
        </div>

        {characters.length === 0 ? (
          <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            Ketik kata di atas untuk melihat deretan ejaan huruf Jerman
          </div>
        ) : (
          <div className="flex flex-wrap gap-2.5 items-center justify-start min-h-[100px] p-4 bg-slate-50 rounded-2xl border border-slate-200">
            {characters.map((char, index) => {
              const isActive = activeIndex === index
              const isSpacer = char.raw === ' '

              if (isSpacer) {
                return (
                  <div
                    key={index}
                    className="w-4 h-16 flex items-center justify-center text-slate-300"
                  >
                    •
                  </div>
                )
              }

              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => playSingleLetter(char.item, index)}
                  className={`relative flex flex-col items-center justify-center min-w-[56px] h-20 px-2 rounded-xl transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white scale-110 shadow-lg ring-4 ring-blue-300 z-10'
                      : isFullWordActive
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-xs'
                  }`}
                >
                  <span
                    className={`text-2xl font-extrabold tracking-tight ${
                      isActive ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    {char.upper}
                  </span>
                  <span
                    className={`text-[11px] font-medium tracking-tight mt-0.5 truncate max-w-[64px] ${
                      isActive ? 'text-blue-100 font-bold' : 'text-slate-500'
                    }`}
                  >
                    {char.name}
                  </span>
                  {isActive && (
                    <Volume2
                      size={12}
                      className="absolute top-1 right-1 text-white animate-bounce"
                    />
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Full word playback feedback */}
        {isFullWordActive && (
          <div className="mt-4 p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 flex items-center justify-center gap-2 text-sm font-semibold animate-pulse">
            <Volume2 size={18} />
            <span>Membunyikan kata utuh: &quot;{inputText}&quot;</span>
          </div>
        )}
      </div>

      {/* Modal / Dialog Tambah & Edit Kata */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                {editingWordId ? 'Edit Kata' : 'Tambah Kata Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Kata Jerman
                </label>
                <input
                  type="text"
                  value={modalWord}
                  onChange={(e) => {
                    setModalWord(e.target.value.toUpperCase().replace(/[^A-ZÄÖÜß\s-]/gi, ''))
                    setModalError('')
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveModal()
                  }}
                  placeholder="Misal: FLUGHAFEN"
                  className="w-full text-base font-mono uppercase font-bold tracking-wide px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Arti Bahasa Indonesia (Opsional)
                </label>
                <input
                  type="text"
                  value={modalMeaning}
                  onChange={(e) => setModalMeaning(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSaveModal()
                  }}
                  placeholder="Misal: Bandara"
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {modalError && (
                <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                  {modalError}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-3.5 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
