import { Card } from '../ui/card'
import { playWordAudio, type TtsPersonaId } from '../../lib/audio'
import { Volume2 } from 'lucide-react'

export function WordCard({
  word,
  isSelected,
  onToggle,
  personaId,
  selectable = true,
}: {
  word: any
  isSelected?: boolean
  onToggle?: () => void
  personaId?: TtsPersonaId
  selectable?: boolean
}) {
  const getArticleColor = (article: string) => {
    if (article === 'der') return 'bg-sky-100 text-sky-800 border-sky-300'
    if (article === 'die') return 'bg-rose-100 text-rose-800 border-rose-300'
    if (article === 'das') return 'bg-emerald-100 text-emerald-800 border-emerald-300'
    return 'bg-gray-100 text-gray-800 border-gray-300'
  }

  return (
    <Card className={`p-4 flex flex-col gap-2 relative transition-all ${selectable && isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:border-border'}`}>
      {selectable && onToggle && (
        <div className="absolute top-4 right-4">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggle}
            aria-label={`Pilih kata ${word.germanWord}`}
            className="w-5 h-5 text-primary rounded-sm border-border focus:ring-primary cursor-pointer"
          />
        </div>
      )}
      <div className={`flex items-center gap-2 ${selectable ? 'pr-8' : ''}`}>
        {word.article && (
          <span className={`text-xs px-2 py-0.5 rounded-sm border ${getArticleColor(word.article)} font-medium`}>
            {word.article}
          </span>
        )}
        <h3 lang="de" className="text-xl font-bold text-slate-800">{word.germanWord}</h3>
        <button 
          onClick={(e) => { 
            e.stopPropagation(); 
            playWordAudio(word.germanWord, { personaId }) 
          }} 
          className="text-gray-400 hover:text-blue-500 transition-colors"
          aria-label={`Putar pengucapan ${word.germanWord}`}
        >
          <Volume2 size={18} />
        </button>
      </div>
      <p className="text-slate-600 font-medium">{word.indonesianWord}</p>
      {word.phoneticSimilarity && (
        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs text-slate-400">Fonetik:</span>
          <span className="text-xs font-medium text-amber-500">
            {'\u2605'.repeat(word.phoneticSimilarity)}{'\u2606'.repeat(5 - word.phoneticSimilarity)}
          </span>
        </div>
      )}
      
      <div className="mt-2 text-sm text-slate-500">
        <p lang="de" className="italic">"{word.exampleSentenceDe}"</p>
        <p>"{word.exampleSentenceId}"</p>
      </div>
    </Card>
  )
}
