import React, { useState, useEffect, useCallback } from 'react'
import { Volume2, ChevronLeft, ChevronRight, Shuffle, RotateCw, Star, CheckCircle2 } from 'lucide-react'
import { speakGerman, stopSpeech } from '../../lib/audio'

export interface VocabClueItem {
  germanWord: string
  indonesianMeaning: string
  grammarTip: string
}

export interface ScenarioFlashcardsProps {
  vocabClues: VocabClueItem[]
}

export default function ScenarioFlashcards({ vocabClues }: ScenarioFlashcardsProps) {
  const [order, setOrder] = useState<number[]>(() =>
    vocabClues && vocabClues.length > 0 ? vocabClues.map((_, i) => i) : []
  )
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [masteredWords, setMasteredWords] = useState<Set<string>>(new Set())

  // Inisialisasi urutan kartu
  useEffect(() => {
    if (vocabClues && vocabClues.length > 0) {
      setOrder(vocabClues.map((_, i) => i))
      setCurrentIndex(0)
      setIsFlipped(false)
    }
  }, [vocabClues])

  const totalCards = order.length
  const currentVocabIndex = order[currentIndex] ?? 0
  const currentVocab = vocabClues[currentVocabIndex]

  const handleNext = useCallback(() => {
    stopSpeech()
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev < totalCards - 1 ? prev + 1 : 0))
  }, [totalCards])

  const handlePrev = useCallback(() => {
    stopSpeech()
    setIsFlipped(false)
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalCards - 1))
  }, [totalCards])

  const handleShuffle = () => {
    stopSpeech()
    const shuffled = [...order]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = shuffled[i]
      shuffled[i] = shuffled[j]
      shuffled[j] = temp
    }
    setOrder(shuffled)
    setCurrentIndex(0)
    setIsFlipped(false)
  }

  const toggleMastered = (germanWord: string) => {
    setMasteredWords((prev) => {
      const next = new Set(prev)
      if (next.has(germanWord)) {
        next.delete(germanWord)
      } else {
        next.add(germanWord)
      }
      return next
    })
  }

  // Keyboard navigation: Left/Right arrow & Space to flip
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return

      if (e.key === 'ArrowRight') {
        handleNext()
      } else if (e.key === 'ArrowLeft') {
        handlePrev()
      } else if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setIsFlipped((f) => !f)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNext, handlePrev])

  if (!vocabClues || vocabClues.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 max-w-xl mx-auto shadow-sm my-6">
        <p className="text-slate-500 font-medium">Belum ada kosakata untuk skenario ini.</p>
      </div>
    )
  }

  const isCurrentMastered = currentVocab ? masteredWords.has(currentVocab.germanWord) : false
  const progressPercent = Math.round(((currentIndex + 1) / totalCards) * 100)
  const masteredPercent = Math.round((masteredWords.size / totalCards) * 100)

  return (
    <div className="max-w-xl mx-auto w-full px-4 py-6">
      {/* Top Status & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
            🃏 Flashcard Kosakata
          </span>
          <p className="text-xs text-slate-500 mt-1.5">
            Kartu <span className="font-bold text-slate-800">{currentIndex + 1}</span> dari{' '}
            <span className="font-bold text-slate-800">{totalCards}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tombol Acak */}
          <button
            type="button"
            onClick={handleShuffle}
            title="Acak urutan kartu (Mischen)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs font-medium transition-all shadow-xs cursor-pointer active:scale-95"
          >
            <Shuffle size={14} className="text-indigo-600" />
            <span>Acak</span>
          </button>

          {/* Tombol Paham */}
          <button
            type="button"
            onClick={() => currentVocab && toggleMastered(currentVocab.germanWord)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs cursor-pointer active:scale-95 ${
              isCurrentMastered
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Star
              size={14}
              className={isCurrentMastered ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}
            />
            <span>{isCurrentMastered ? 'Sudah Paham' : 'Tandai Paham'}</span>
          </button>
        </div>
      </div>

      {/* Progress Bar Tipis */}
      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mb-6">
        <div
          className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-300 rounded-full"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* 3D Flip Card Container */}
      <div
        className="w-full h-80 sm:h-88 cursor-pointer select-none"
        style={{ perspective: '1200px' }}
        onClick={() => setIsFlipped((f) => !f)}
      >
        <div
          key={currentVocabIndex}
          className="relative w-full h-full rounded-3xl shadow-xl transition-transform duration-500"
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Bagian Depan (Vorderseite) */}
          <div
            className="absolute inset-0 w-full h-full bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-b from-white via-slate-50/50 to-blue-50/20"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            {/* Header Depan */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
                Vorderseite (Jerman)
              </span>
              {isCurrentMastered && (
                <span className="flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200 font-semibold">
                  <Star size={12} className="fill-amber-500 text-amber-500" />
                  Dikuasai
                </span>
              )}
            </div>

            {/* Konten Utama Depan */}
            <div className="text-center my-auto px-2">
              <h3 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
                {currentVocab?.germanWord}
              </h3>
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (currentVocab?.germanWord) {
                      speakGerman(currentVocab.germanWord)
                    }
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition-all border border-blue-200 active:scale-95 shadow-2xs"
                  title="Dengarkan pengucapan kata"
                >
                  <Volume2 size={16} className="text-blue-600" />
                  <span>Dengarkan Audio</span>
                </button>
              </div>
            </div>

            {/* Footer Depan */}
            <div className="text-center pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5 font-medium">
                <RotateCw size={13} className="text-slate-400" />
                👆 Klik untuk membalik kartu (Klick zum Umdrehen)
              </p>
            </div>
          </div>

          {/* Bagian Belakang (Rückseite) */}
          <div
            className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-900 via-blue-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl"
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            {/* Header Belakang */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-blue-200 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-xs">
                Rückseite (Arti & Tata Bahasa)
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  if (currentVocab?.germanWord) {
                    speakGerman(currentVocab.germanWord)
                  }
                }}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
                title="Dengarkan pengucapan kata"
              >
                <Volume2 size={15} />
              </button>
            </div>

            {/* Konten Utama Belakang */}
            <div className="text-center my-auto px-2">
              <div className="text-xs font-medium text-blue-200 uppercase tracking-wider mb-1">
                Arti Bahasa Indonesia:
              </div>
              <h4 className="text-2xl sm:text-3xl font-bold text-white mb-4 leading-snug">
                {currentVocab?.indonesianMeaning}
              </h4>

              {currentVocab?.grammarTip && (
                <div className="mt-3 bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/15 text-left max-w-md mx-auto">
                  <div className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider mb-1 flex items-center gap-1">
                    💡 Catatan Tata Bahasa / Kognat:
                  </div>
                  <p className="text-xs text-blue-100 leading-relaxed font-normal">
                    {currentVocab.grammarTip}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Belakang */}
            <div className="text-center pt-3 border-t border-white/10">
              <p className="text-xs text-blue-200/80 flex items-center justify-center gap-1.5 font-medium">
                <RotateCw size={13} />
                👆 Klik untuk membalik kartu kembali
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Kontrol Navigasi Bawah */}
      <div className="flex items-center justify-between mt-6 gap-3">
        <button
          type="button"
          onClick={handlePrev}
          disabled={totalCards <= 1}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white border border-slate-200 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed active:scale-98"
        >
          <ChevronLeft size={18} />
          <span>Sebelumnya (Zurück)</span>
        </button>

        <button
          type="button"
          onClick={handleNext}
          disabled={totalCards <= 1}
          className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed active:scale-98"
        >
          {currentIndex === totalCards - 1 ? (
            <>
              <span>Ulangi dari Awal (Noch einmal)</span>
              <RotateCw size={18} />
            </>
          ) : (
            <>
              <span>Berikutnya (Weiter)</span>
              <ChevronRight size={18} />
            </>
          )}
        </button>
      </div>

      {/* Rangkuman Penguasaan */}
      <div className="mt-6 bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 flex items-center justify-between text-xs text-slate-600">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-500" />
          <span>
            Kosakata dikuasai:{' '}
            <strong className="text-slate-800 font-bold">
              {masteredWords.size} dari {totalCards} kata
            </strong>{' '}
            ({masteredPercent}%)
          </span>
        </div>
        <span className="text-slate-400 hidden sm:inline text-[11px]">
          Tip: Gunakan tombol panah keyboard ← → dan Spasi
        </span>
      </div>
    </div>
  )
}
