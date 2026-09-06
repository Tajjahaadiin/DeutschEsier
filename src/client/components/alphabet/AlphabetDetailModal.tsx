import React, { useEffect, useState } from 'react'
import { X, Volume2, Anchor, AlertTriangle, Sparkles, Speech, Lightbulb } from 'lucide-react'
import { GermanAlphabetItem } from '../../data/alphabetData'
import { speakGerman, type VoiceGender } from '../../lib/audio'

interface AlphabetDetailModalProps {
  item: GermanAlphabetItem | null
  isOpen: boolean
  onClose: () => void
  voiceGender?: VoiceGender
  speechRate?: number
}

export const AlphabetDetailModal: React.FC<AlphabetDetailModalProps> = ({
  item,
  isOpen,
  onClose,
  voiceGender = 'female',
  speechRate = 1.0,
}) => {
  const [playingTarget, setPlayingTarget] = useState<'letter' | 'example' | null>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen || !item) return null

  const playSound = (target: 'letter' | 'example') => {
    const text = target === 'letter' ? item.audioText.letterOnly : item.audioText.exampleWord
    setPlayingTarget(target)
    speakGerman(text, {
      gender: voiceGender,
      rate: speechRate,
      onEnd: () => setPlayingTarget(null),
    })
  }

  const categoryLabel = {
    vowel: 'Vokal',
    consonant: 'Konsonan',
    special: 'Huruf Khusus (Umlaut/ß)',
  }[item.category]

  const categoryColor = {
    vowel: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    consonant: 'bg-blue-100 text-blue-800 border-blue-300',
    special: 'bg-purple-100 text-purple-800 border-purple-300',
  }[item.category]

  const articleColor = {
    der: 'bg-blue-100 text-blue-700 border-blue-200',
    die: 'bg-rose-100 text-rose-700 border-rose-200',
    das: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative px-6 pt-6 pb-4 bg-linear-to-b from-slate-50 to-white border-b border-slate-100">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            aria-label="Tutup modal"
          >
            <X size={20} />
          </button>

          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-slate-900 text-white shadow-lg">
              <span className="text-4xl font-extrabold tracking-tight">
                {item.letter}
              </span>
              <span className="text-2xl font-light text-slate-400 ml-1">
                {item.lowercase}
              </span>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${categoryColor}`}>
                  {categoryLabel}
                </span>
                {item.isCriticalForId && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                    <AlertTriangle size={12} />
                    Kritis Lidah RI
                  </span>
                )}
              </div>
              <h2 className="text-2xl font-bold text-slate-800 flex items-baseline gap-2">
                <span>{item.name}</span>
                <span className="text-base font-mono font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {item.ipa}
                </span>
              </h2>
            </div>
          </div>

          {/* Quick Audio Triggers */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={() => playSound('letter')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-medium text-sm transition-all shadow-xs ${
                playingTarget === 'letter'
                  ? 'bg-blue-600 text-white scale-[0.98]'
                  : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
              }`}
            >
              <Volume2 size={16} className={playingTarget === 'letter' ? 'animate-pulse' : ''} />
              Eja: &quot;{item.name}&quot;
            </button>
            <button
              onClick={() => playSound('example')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl font-medium text-sm transition-all shadow-xs ${
                playingTarget === 'example'
                  ? 'bg-slate-800 text-white scale-[0.98]'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Speech size={16} className={playingTarget === 'example' ? 'animate-pulse' : ''} />
              Contoh: {item.example.word}
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto px-6 py-4 space-y-4 text-slate-700 text-sm">
          {/* Kata Jangkar Indonesia */}
          <div className="p-3.5 rounded-xl bg-sky-50/80 border border-sky-200">
            <div className="flex items-center gap-2 text-sky-800 font-semibold mb-1 text-xs tracking-wider uppercase">
              <Anchor size={15} />
              <span>Kata Jangkar Indonesia</span>
            </div>
            <p className="text-base font-bold text-sky-950">
              {item.anchor.word}
            </p>
            <p className="text-xs text-sky-800 mt-0.5">
              {item.anchor.analogy}
            </p>
          </div>

          {/* Posisi Mulut & Lidah */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center gap-2 text-slate-700 font-semibold mb-1 text-xs tracking-wider uppercase">
              <span>👄</span>
              <span>Posisi Mulut & Lidah</span>
            </div>
            <p className="text-slate-800 leading-relaxed text-xs sm:text-sm">
              {item.phoneticTip.mouthPosition}
            </p>
          </div>

          {/* Perangkap Lidah Indonesia */}
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200">
            <div className="flex items-center gap-2 text-amber-800 font-semibold mb-1 text-xs tracking-wider uppercase">
              <AlertTriangle size={15} />
              <span>Perangkap Lidah Indonesia</span>
            </div>
            <p className="text-amber-950 leading-relaxed text-xs sm:text-sm font-medium">
              {item.phoneticTip.commonMistakeId}
            </p>
          </div>

          {/* Trik Rahasia Sensomotorik */}
          <div className="p-3.5 rounded-xl bg-purple-50/80 border border-purple-200">
            <div className="flex items-center gap-2 text-purple-800 font-semibold mb-1 text-xs tracking-wider uppercase">
              <Sparkles size={15} />
              <span>Trik Rahasia Sensomotorik</span>
            </div>
            <p className="text-purple-950 leading-relaxed text-xs sm:text-sm font-medium">
              {item.phoneticTip.secretTrick}
            </p>
          </div>

          {/* Contoh Kata dalam Bahasa Jerman */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Lightbulb size={14} /> Contoh Kata A1
              </span>
              {item.example.isCognate && (
                <span className="text-[11px] font-medium bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                  Kognat (Mirip Indonesia)
                </span>
              )}
            </div>
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                {item.example.article && (
                  <span className={`text-xs px-2 py-0.5 rounded-md font-semibold border ${articleColor[item.example.article]}`}>
                    {item.example.article}
                  </span>
                )}
                <span className="text-base font-bold text-slate-800">{item.example.word}</span>
                <span className="text-xs font-mono text-slate-400">/{item.example.ipa}/</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-600 font-medium">{item.example.meaningId}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold rounded-xl bg-slate-800 text-white hover:bg-slate-900 transition-colors"
          >
            Mengerti, Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
