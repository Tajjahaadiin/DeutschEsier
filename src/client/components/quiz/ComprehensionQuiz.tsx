import React, { useState } from 'react'
import { Volume2, Award, RotateCcw, Send, AlertCircle, User, CheckCircle2, XCircle } from 'lucide-react'
import { speakGerman } from '../../lib/audio'
import {
  isCorrectAnswer,
  type ComprehensionQuestion,
  type ComprehensionAnswer,
} from '../../lib/comprehension'

export interface ComprehensionQuizProps {
  questions: ComprehensionQuestion[]
  sessionId: string
  sessionTitle?: string
  accessKey?: string
  isTeacher?: boolean
  cefrLevel?: string
}

/**
 * Kuis Pemahaman level B1: soal Richtig/Falsch (Benar/Salah) hasil AI.
 *
 * Menggantikan kuis Hörverstehen/Lückentext pada level B1. Soal sudah tersedia
 * dari hasil generate, jadi tidak ada panggilan AI saat siswa mengerjakan.
 * Hasil dikirim sebagai submission berjenis 'quiz' dengan tipe jawaban
 * 'comprehension' agar tetap masuk analitik guru yang sama.
 */
export default function ComprehensionQuiz({
  questions,
  sessionId,
  sessionTitle,
  accessKey = '',
  isTeacher = false,
  cefrLevel = 'B1',
}: ComprehensionQuizProps) {
  const [studentName, setStudentName] = useState('')
  const [answers, setAnswers] = useState<Record<number, ComprehensionAnswer>>({})
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [result, setResult] = useState<{ score: number; correctCount: number; total: number } | null>(null)

  const answeredCount = Object.keys(answers).length

  const handlePlay = (index: number, text: string) => {
    setPlayingIndex(index)
    speakGerman(text, { onEnd: () => setPlayingIndex(null) })
  }

  const handleAnswer = (index: number, value: ComprehensionAnswer) => {
    setAnswers((prev) => ({ ...prev, [index]: value }))
  }

  const handleReset = () => {
    setAnswers({})
    setResult(null)
    setErrorMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!studentName.trim()) {
      setErrorMessage('Silakan masukkan Nama Lengkap Siswa terlebih dahulu.')
      return
    }
    if (answeredCount < questions.length) {
      setErrorMessage(`Masih ada ${questions.length - answeredCount} soal yang belum dijawab.`)
      return
    }

    setSubmitting(true)
    try {
      const graded = questions.map((q, idx) => {
        const answer = answers[idx]
        const correct = isCorrectAnswer(q, answer)
        return {
          questionId: `comprehension-${idx}`,
          type: 'comprehension',
          title: 'Richtig oder Falsch',
          prompt: q.statement,
          studentAnswer: answer === 'richtig' ? 'Richtig' : 'Falsch',
          correctAnswer: q.isCorrect ? 'Richtig' : 'Falsch',
          isCorrect: correct,
          indonesianHint: q.indonesianText,
          grammarTip: q.explanation,
          audioText: q.statement,
        }
      })

      const correctCount = graded.filter((g) => g.isCorrect).length
      const total = questions.length
      const score = total > 0 ? Math.round((correctCount / total) * 100) : 0

      const res = await fetch(`/api/sessions/${sessionId}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentName: studentName.trim(),
          accessKey: accessKey || (isTeacher ? 'TEACHER-PREVIEW' : ''),
          score,
          totalQuestions: total,
          correctAnswers: correctCount,
          answers: graded,
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Gagal menyimpan hasil kuis.')

      setResult({ score, correctCount, total })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan saat mengumpulkan kuis.')
    } finally {
      setSubmitting(false)
    }
  }

  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 max-w-2xl mx-auto shadow-sm my-6">
        <AlertCircle size={40} className="mx-auto text-slate-300 mb-3" />
        <p className="text-slate-600 font-medium">Skenario ini belum memiliki soal Richtig/Falsch.</p>
      </div>
    )
  }

  // Rapor hasil
  if (result) {
    const praise =
      result.score >= 90
        ? 'Ausgezeichnet! Sempurna sekali! 🌟'
        : result.score >= 70
        ? 'Sehr gut! Kerja bagus! 👍'
        : 'Weiter üben! Terus berlatih! 💪'
    return (
      <div className="max-w-2xl mx-auto w-full px-4 py-6 space-y-5">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-4">
            <Award size={15} className="text-amber-500" />
            <span>Rapor Kuis Richtig/Falsch</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-1">{studentName}</h2>
          <p className="text-sm text-slate-500 mb-4">{praise}</p>
          <p className="text-5xl font-extrabold text-slate-900">{result.score}</p>
          <p className="text-xs text-slate-600 mt-1">
            {result.correctCount} dari {result.total} soal benar
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="mt-5 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            <RotateCcw size={14} />
            <span>Ulangi Kuis</span>
          </button>
        </div>

        {/* Pembahasan */}
        <div className="space-y-3">
          {questions.map((q, idx) => {
            const correct = isCorrectAnswer(q, answers[idx])
            return (
              <div
                key={idx}
                className={`bg-white rounded-2xl border-2 p-4 ${correct ? 'border-emerald-200' : 'border-rose-200'}`}
              >
                <div className="flex items-start gap-2">
                  {correct ? (
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{q.statement}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{q.indonesianText}</p>
                    <p className="text-xs mt-1.5 font-semibold text-slate-700">
                      Kunci: {q.isCorrect ? 'Richtig (Benar)' : 'Falsch (Salah)'}
                    </p>
                    <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-2 mt-1.5">
                      💡 {q.explanation}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // Form pengerjaan
  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-gradient-to-r from-violet-600 to-indigo-700 text-white p-5 sm:p-6 rounded-3xl shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold">
              ✅ Richtig oder Falsch
            </span>
            <span className="text-xs text-indigo-100 font-medium">
              Level {cefrLevel} · {questions.length} soal
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold mb-1">Kuis Pemahaman Skenario</h2>
          <p className="text-xs sm:text-sm text-indigo-100 leading-relaxed opacity-90">
            Nilai apakah setiap pernyataan <strong>sesuai (Richtig)</strong> atau{' '}
            <strong>tidak sesuai (Falsch)</strong> dengan dialog.
          </p>
          {sessionTitle && (
            <p className="text-[11px] text-indigo-200/80 mt-2">Skenario: {sessionTitle}</p>
          )}
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <User size={15} className="text-indigo-600" />
            Nama Lengkap Siswa <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Masukkan nama lengkap Anda..."
            className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all placeholder-slate-400 font-medium"
          />
        </div>

        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="space-y-4">
          {questions.map((q, idx) => {
            const chosen = answers[idx]
            return (
              <div
                key={idx}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs"
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="w-6 h-6 shrink-0 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 leading-snug">
                        {q.statement}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">{q.indonesianText}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePlay(idx, q.statement)}
                    className="shrink-0 p-1.5 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                    title="Dengarkan pernyataan"
                  >
                    <Volume2
                      size={16}
                      className={playingIndex === idx ? 'animate-pulse text-indigo-600' : ''}
                    />
                  </button>
                </div>

                <div className="flex gap-2">
                  {(['richtig', 'falsch'] as const).map((value) => {
                    const active = chosen === value
                    const isRight = value === 'richtig'
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleAnswer(idx, value)}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold border-2 transition-all cursor-pointer ${
                          active
                            ? isRight
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-rose-600 border-rose-600 text-white'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {isRight ? '✅ Richtig (Benar)' : '❌ Falsch (Salah)'}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md transition-all disabled:opacity-50 cursor-pointer"
          >
            <Send size={16} />
            <span>{submitting ? 'Memeriksa & Mengirim Jawaban...' : 'Kumpulkan Jawaban Kuis'}</span>
          </button>
          <p className="text-center text-xs text-slate-400 mt-2">
            {answeredCount}/{questions.length} soal terjawab · dikoreksi otomatis.
          </p>
        </div>
      </form>
    </div>
  )
}
