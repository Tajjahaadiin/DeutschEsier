import React, { useState } from 'react'
import { Volume2, BookOpen, Info, AlertTriangle, Anchor } from 'lucide-react'
import { GermanAlphabetItem } from '../../data/alphabetData'
import { speakGerman, type VoiceGender } from '../../lib/audio'

interface AlphabetCardProps {
  item: GermanAlphabetItem
  onOpenDetail: (item: GermanAlphabetItem) => void
  voiceGender?: VoiceGender
  speechRate?: number
}

export const AlphabetCard: React.FC<AlphabetCardProps> = ({
  item,
  onOpenDetail,
  voiceGender = 'female',
  speechRate = 1.0,
}) => {
  const [activeAudio, setActiveAudio] = useState<'letter' | 'word' | null>(null)

  const handlePlayLetter = (e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveAudio('letter')
    speakGerman(item.audioText.letterOnly, {
      gender: voiceGender,
      rate: speechRate,
      onEnd: () => setActiveAudio(null),
    })
  }

  const handlePlayWord = (e: React.MouseEvent) => {
    e.stopPropagation()
    setActiveAudio('word')
    speakGerman(item.audioText.exampleWord, {
      gender: voiceGender,
      rate: speechRate,
      onEnd: () => setActiveAudio(null),
    })
  }

  const categoryBadgeClass = {
    vowel: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    consonant: 'bg-blue-100 text-blue-800 border-blue-200',
    special: 'bg-purple-100 text-purple-800 border-purple-200',
  }[item.category]

  const categoryName = {
    vowel: 'Vokal',
    consonant: 'Konsonan',
    special: 'Umlaut / ß',
  }[item.category]

  return (
    <div
      onClick={() => onOpenDetail(item)}
      className={`group relative flex flex-col justify-between bg-white rounded-2xl border transition-all duration-200 p-4 cursor-pointer hover:shadow-md ${
        activeAudio
          ? 'border-blue-500 ring-2 ring-blue-400/40 shadow-md'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* Top Badges */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${categoryBadgeClass}`}>
          {categoryName}
        </span>
        {item.isCriticalForId && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1"
            title="Sering salah diucapkan lidah Indonesia"
          >
            <AlertTriangle size={11} />
            ⚠️ Kritis
          </span>
        )}
      </div>

      {/* Main Letter Display */}
      <div className="text-center my-2">
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight transition-transform group-hover:scale-105">
            {item.letter}
          </span>
          <span className="text-2xl sm:text-3xl font-light text-slate-400">
            {item.lowercase}
          </span>
        </div>

        {/* German Name & IPA */}
        <div className="mt-1 flex items-center justify-center gap-2">
          <span className="font-bold text-slate-700 text-base">
            &quot;{item.name}&quot;
          </span>
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
            {item.ipa}
          </span>
        </div>

        {/* Anchor Word Indonesia */}
        <div className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 text-sky-800 text-xs font-medium border border-sky-100 max-w-full truncate">
          <Anchor size={12} className="shrink-0 text-sky-600" />
          <span className="truncate">⚓ {item.anchor.word}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={handlePlayLetter}
            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
              activeAudio === 'letter'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
            }`}
            title="Dengarkan cara mengeja huruf"
          >
            <Volume2 size={13} className={activeAudio === 'letter' ? 'animate-pulse' : ''} />
            <span>Eja</span>
          </button>

          <button
            type="button"
            onClick={handlePlayWord}
            className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all truncate ${
              activeAudio === 'word'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
            }`}
            title={`Contoh kata: ${item.example.word}`}
          >
            <BookOpen size={13} className={activeAudio === 'word' ? 'animate-pulse' : ''} />
            <span className="truncate">{item.example.word}</span>
          </button>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onOpenDetail(item)
          }}
          className="w-full flex items-center justify-center gap-1 py-1 text-[11px] font-medium text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-md transition-colors"
        >
          <Info size={12} />
          <span>Detail Fonetik & Tips</span>
        </button>
      </div>
    </div>
  )
}
