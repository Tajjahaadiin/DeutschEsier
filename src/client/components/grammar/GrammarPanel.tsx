import { useMemo, useState } from 'react'
import {
  BookOpen,
  CheckCircle2,
  XCircle,
  Volume2,
  RotateCcw,
  Award,
  Lightbulb,
  GraduationCap,
} from 'lucide-react'
import { speakGerman } from '../../lib/audio'
import {
  buildTopics,
  buildQuestions,
  isAnswerCorrect,
  type GrammarTopic,
  type GrammarQuestion,
} from '../../lib/grammar'

export interface GrammarPanelProps {
  vocabClues: { germanWord: string; indonesianMeaning: string; grammarTip: string }[]
  dialogue?: { germanText: string }[]
  sessionTitle?: string
}

type Tab = 'materi' | 'latihan'

/**
 * Tab pembelajaran grammatik: materi terkelompok + latihan Richtig/Falsch.
 *
 * Semua soal diturunkan dari vocabClues skenario, jadi tidak ada panggilan AI
 * tambahan. Latihan ini bersifat mandiri (tidak mengirim nilai ke guru).
 */
export default function GrammarPanel({ vocabClues, dialogue = [], sessionTitle }: GrammarPanelProps) {
  const [tab, setTab] = useState<Tab>('materi')
  const [openTopic, setOpenTopic] = useState<string | null>(null)

  // Jawaban siswa per id soal: 'richtig' | 'falsch'
  const [answers, setAnswers] = useState<Record<string, 'richtig' | 'falsch'>>({})
  const [submitted, setSubmitted] = useState(false)
  const [playingWord, setPlayingWord] = useState<string | null>(null)

  const topics: GrammarTopic[] = useMemo(
    () => buildTopics(vocabClues, dialogue),
    [vocabClues, dialogue]
  )
  const questions: GrammarQuestion[] = useMemo(
    () => buildQuestions(vocabClues, dialogue),
    [vocabClues, dialogue]
  )

  const answeredCount = Object.keys(answers).length
  const correctCount = questions.filter(
    (q) => answers[q.id] && isAnswerCorrect(q, answers[q.id])
  ).length
  const score = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0

  const handlePlay = (text: string) => {
    setPlayingWord(text)
    speakGerman(text, { onEnd: () => setPlayingWord(null) })
  }

  const handleReset = () => {
    setAnswers({})
    setSubmitted(false)
  }

  if (topics.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 text-center">
        <GraduationCap size={40} className="mx-auto text-slate-300 mb-3" />
        <p className="text-slate-600 font-medium">Skenario ini belum memiliki catatan grammatik.</p>
        <p className="text-sm text-slate-400 mt-1">
          Grammatik diambil dari catatan tata bahasa pada kosakata skenario.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-6 space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-700 text-white p-5 sm:p-6 rounded-3xl shadow-lg">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold">
            📚 Grammatik
          </span>
          <span className="text-xs text-indigo-200 font-medium">
            {topics.length} topik · {vocabClues.length} kosakata
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold mb-1">Belajar Tata Bahasa Skenario</h2>
        <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed opacity-90">
          Pelajari catatan tata bahasa dari kosakata skenario ini, lalu uji pemahamanmu dengan
          latihan <strong>Richtig oder Falsch</strong> (benar atau salah).
        </p>
        {sessionTitle && (
          <p className="text-[11px] text-indigo-200/80 mt-2">Skenario: {sessionTitle}</p>
        )}
      </div>

      {/* Tab: Materi / Latihan */}
      <div className="flex gap-1.5 bg-slate-100 p-1 rounded-xl w-fit">
        <button
          type="button"
          onClick={() => setTab('materi')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
            tab === 'materi' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          📖 Materi
        </button>
        <button
          type="button"
          onClick={() => setTab('latihan')}
          className={`px-4 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all cursor-pointer ${
            tab === 'latihan' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          ✍️ Latihan ({questions.length})
        </button>
      </div>

      {/* ============ MATERI ============ */}
      {tab === 'materi' && (
        <div className="space-y-3">
          {topics.map((topic) => {
            const isOpen = openTopic === topic.category
            return (
              <div key={topic.category} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <button
                  type="button"
                  onClick={() => setOpenTopic(isOpen ? null : topic.category)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-800 text-sm sm:text-base">{topic.label}</h3>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                        {topic.items.length}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{topic.description}</p>
                  </div>
                  <span className={`text-slate-400 text-xs font-bold shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </button>

                {isOpen && (
                  <div className="border-t border-slate-100 divide-y divide-slate-100">
                    {topic.items.map((item) => (
                      <div key={item.germanWord} className="p-4 bg-slate-50/50">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              {item.article && (
                                <span className="text-[11px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200 font-bold">
                                  {item.article}
                                </span>
                              )}
                              <span className="font-bold text-slate-800 text-sm">{item.noun || item.germanWord}</span>
                              <button
                                type="button"
                                onClick={() => handlePlay(item.germanWord)}
                                className="p-1 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                                title="Dengarkan pengucapan"
                              >
                                <Volume2 size={14} className={playingWord === item.germanWord ? 'animate-pulse text-indigo-600' : ''} />
                              </button>
                            </div>
                            <p className="text-xs text-slate-600 mt-1">{item.indonesianMeaning}</p>
                          </div>
                        </div>

                        {/* Contoh pemakaian dari dialog + audio kalimat utuh */}
                        {item.exampleSentence && (
                          <div className="mt-2.5 bg-white border border-slate-200 rounded-xl p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                  Contoh dalam Skenario
                                </p>
                                <p className="text-xs text-slate-700 italic leading-relaxed">
                                  „{item.exampleSentence}“
                                </p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handlePlay(item.exampleSentence!)}
                                className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-semibold transition-colors cursor-pointer"
                                title="Dengarkan kalimat contoh"
                              >
                                <Volume2 size={12} className={playingWord === item.exampleSentence ? 'animate-pulse' : ''} />
                                <span>Kalimat</span>
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="mt-2.5 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                          <Lightbulb size={14} className="text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-900 leading-relaxed">{item.grammarTip}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ============ LATIHAN ============ */}
      {tab === 'latihan' && (
        <div className="space-y-4">
          {/* Banner hasil */}
          {submitted && (
            <div
              className={`rounded-2xl p-5 border-2 text-center ${
                score >= 70 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
              }`}
            >
              <Award className={`mx-auto mb-2 ${score >= 70 ? 'text-emerald-600' : 'text-amber-600'}`} size={28} />
              <p className="text-2xl font-extrabold text-slate-900">{score}</p>
              <p className="text-xs text-slate-600 mt-1">
                {correctCount} dari {questions.length} soal benar
              </p>
              <p className="text-xs font-semibold mt-2 text-slate-700">
                {score >= 90
                  ? 'Ausgezeichnet! Luar biasa! 🌟'
                  : score >= 70
                  ? 'Sehr gut! Kerja bagus! 👍'
                  : 'Weiter üben! Terus berlatih! 💪'}
              </p>
              <button
                type="button"
                onClick={handleReset}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all cursor-pointer"
              >
                <RotateCcw size={14} />
                <span>Ulangi Latihan</span>
              </button>
            </div>
          )}

          {/* Daftar soal */}
          {questions.map((q, idx) => {
            const answer = answers[q.id]
            const answered = Boolean(answer)
            const isRight = answered ? isAnswerCorrect(q, answer) : false

            return (
              <div
                key={q.id}
                className={`bg-white rounded-2xl border-2 p-4 sm:p-5 transition-all ${
                  !submitted
                    ? 'border-slate-200'
                    : isRight
                    ? 'border-emerald-300 bg-emerald-50/50'
                    : 'border-rose-300 bg-rose-50/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                      {q.kind === 'sentence' ? 'Kalimat Skenario' : 'Konsep Tata Bahasa'}
                    </span>
                  </div>
                  {submitted && (
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        isRight ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
                      }`}
                    >
                      {isRight ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                      {isRight ? 'BENAR' : 'SALAH'}
                    </span>
                  )}
                </div>

                {/* Pernyataan */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-3">
                  <p className="text-sm font-semibold text-slate-800 leading-relaxed">{q.statement}</p>
                  {/* Audio tersedia untuk SEMUA soal: kalimat utuh atau frasa Jermannya. */}
                  <button
                    type="button"
                    onClick={() => handlePlay(q.audioText)}
                    className="mt-2 inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-semibold transition-colors cursor-pointer"
                    title="Dengarkan bagian bahasa Jerman"
                  >
                    <Volume2 size={12} className={playingWord === q.audioText ? 'animate-pulse' : ''} />
                    <span>{playingWord === q.audioText ? 'Memutar...' : 'Dengarkan'}</span>
                  </button>
                </div>

                {/* Tombol Richtig / Falsch */}
                <div className="grid grid-cols-2 gap-2.5">
                  {(['richtig', 'falsch'] as const).map((choice) => {
                    const selected = answer === choice
                    const showAsCorrect = submitted && isAnswerCorrect(q, choice)
                    const showAsWrong = submitted && selected && !isAnswerCorrect(q, choice)

                    return (
                      <button
                        key={choice}
                        type="button"
                        disabled={submitted}
                        onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: choice }))}
                        className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold border-2 transition-all cursor-pointer disabled:cursor-default ${
                          showAsCorrect
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : showAsWrong
                            ? 'bg-rose-600 border-rose-600 text-white'
                            : selected
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-white border-slate-300 text-slate-700 hover:border-indigo-400 hover:bg-indigo-50'
                        }`}
                      >
                        {choice === 'richtig' ? '✓ Richtig' : '✕ Falsch'}
                      </button>
                    )
                  })}
                </div>

                {/* Penjelasan setelah submit */}
                {submitted && (
                  <div className="mt-3 pt-3 border-t border-slate-200/70">
                    <p className="text-[11px] text-slate-600">
                      <strong className="text-slate-700">Kunci:</strong>{' '}
                      {q.isCorrect ? 'Richtig (benar)' : 'Falsch (salah)'} · <em>{q.source}</em>
                    </p>
                    <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                      💡 {q.explanation}
                    </p>
                  </div>
                )}
              </div>
            )
          })}

          {/* Tombol submit */}
          {!submitted && (
            <div className="pt-2">
              <button
                type="button"
                disabled={answeredCount === 0}
                onClick={() => {
                  setSubmitted(true)
                  window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <BookOpen size={16} />
                <span>
                  Periksa Jawaban ({answeredCount}/{questions.length})
                </span>
              </button>
              <p className="text-center text-xs text-slate-400 mt-2">
                Latihan mandiri — tidak memengaruhi nilai kuis.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
