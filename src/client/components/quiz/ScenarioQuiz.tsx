import React, { useState, useMemo } from 'react'
import { Volume2, CheckCircle2, XCircle, Award, RotateCcw, Send, AlertCircle, HelpCircle, User, Headphones, FileEdit } from 'lucide-react'
import { speakGerman } from '../../lib/audio'

export interface DialogTurn {
  speaker: string
  germanText: string
  indonesianText: string
  gender?: 'female' | 'male'
}

export interface VocabClue {
  germanWord: string
  indonesianMeaning: string
  grammarTip: string
}

export interface ScenarioQuizProps {
  session: any
  sessionId: string
  accessKey?: string
  isTeacher?: boolean
}

interface Question {
  id: string
  type: 'dictation' | 'cloze'
  title: string
  prompt: string
  displayPrompt?: string
  audioText: string
  gender: 'female' | 'male'
  indonesianHint: string
  grammarTip?: string
  correctAnswer: string
  acceptableAnswers?: string[]
}

interface GradedAnswer {
  questionId: string
  type: 'dictation' | 'cloze'
  title: string
  prompt: string
  displayPrompt?: string
  studentAnswer: string
  correctAnswer: string
  isCorrect: boolean
  indonesianHint: string
  grammarTip?: string
  audioText: string
  gender: 'female' | 'male'
}

function transliterateGerman(str: string): string {
  return str
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
}

function normalizeText(text: string): string {
  return transliterateGerman(
    (text || '')
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'„“”«»!]/g, '')
      .replace(/\s+/g, ' ')
      .trim()
  )
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

const STOP_WORDS = new Set([
  'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'und', 'aber', 'oder', 'denn',
  'weil', 'dass', 'wenn', 'als', 'wie', 'der', 'die', 'das', 'den', 'dem', 'des',
  'ein', 'eine', 'einen', 'einem', 'einer', 'eines', 'nicht', 'kein', 'keine',
  'keinen', 'keinem', 'keiner', 'sehr', 'auch', 'hier', 'dort', 'dann', 'mal',
  'noch', 'schon', 'nur', 'ja', 'nein', 'doch', 'mit', 'bei', 'nach', 'von',
  'zu', 'aus', 'in', 'im', 'an', 'am', 'auf', 'für', 'über', 'unter', 'vor',
  'hinter', 'neben', 'zwischen', 'man', 'sich', 'mir', 'dir', 'ihm', 'ihr',
  'uns', 'euch', 'ihnen', 'mein', 'meine', 'meinen', 'meinem', 'dein', 'deine',
  'sein', 'seine', 'ist', 'sind', 'war', 'haben', 'hat', 'hatte', 'wird',
  'werden', 'kann', 'können', 'muss', 'müssen', 'sag'
])

export default function ScenarioQuiz({
  session,
  sessionId,
  accessKey = '',
  isTeacher = false,
}: ScenarioQuizProps) {
  // Parse dialogue & vocab clues from session safely
  const dialogue: DialogTurn[] = useMemo(() => {
    if (!session) return []
    if (Array.isArray(session.dialogue)) return session.dialogue
    if (session.dialogueJson) {
      try {
        return JSON.parse(session.dialogueJson)
      } catch {
        return []
      }
    }
    return []
  }, [session])

  const vocabClues: VocabClue[] = useMemo(() => {
    if (!session) return []
    if (Array.isArray(session.vocabClues)) return session.vocabClues
    if (session.vocabCluesJson) {
      try {
        return JSON.parse(session.vocabCluesJson)
      } catch {
        return []
      }
    }
    return []
  }, [session])

  // Bangun daftar soal kuis 2 tipe otomatis
  const questions: Question[] = useMemo(() => {
    const list: Question[] = []

    // Tipe 1: Hörverstehen Diktat (2 - 3 baris percakapan)
    const dictationTurns = dialogue.slice(0, Math.min(3, dialogue.length))
    dictationTurns.forEach((turn, idx) => {
      const isFemale = turn.gender ? turn.gender === 'female' : !turn.speaker.toLowerCase().includes('b')
      const gender: 'female' | 'male' = turn.gender || (isFemale ? 'female' : 'male')

      list.push({
        id: `dictation-${idx}`,
        type: 'dictation',
        title: `Hörverstehen (Dikte Mendengarkan) #${idx + 1}`,
        prompt: `Dengarkan ucapan ${turn.speaker}, lalu ketik kalimat lengkap dalam bahasa Jerman yang Anda dengar:`,
        audioText: turn.germanText,
        gender,
        indonesianHint: turn.indonesianText,
        correctAnswer: turn.germanText,
      })
    })

    // Tipe 2: Lückentext (Soal kalimat rumpang berbasis kalimat otentik dialog)
    const usedSentences = new Set<number>()
    const usedWords = new Set<string>()

    // Prioritas 1: Cocokkan Vocab Clues ke baris dialog
    for (const vocab of vocabClues) {
      if (list.filter((q) => q.type === 'cloze').length >= 3) break

      const rawClean = vocab.germanWord
        .replace(/^(der|die|das|den|dem|des|ein|eine|einen|einem|einer)\s+/i, '')
        .trim()

      const searchTokens: string[] = [rawClean]
      const parts = rawClean.split(/[\s\/\.\,\-]+/).filter((p) => p.length >= 3)
      for (const p of parts) {
        if (!searchTokens.includes(p)) searchTokens.push(p)
      }

      // Deteksi trennbare Verben (cth: schwerfallen -> 'schwer' dan 'fallen')
      const separableMatch = rawClean.match(
        /^([a-zäöüß]+)(fallen|stehen|sehen|kommen|gehen|machen|nehmen|geben|bringen|fahren|lassen)$/i
      )
      if (separableMatch) {
        const prefix = separableMatch[1]
        const baseVerb = separableMatch[2]
        if (prefix.length >= 3 && !searchTokens.includes(prefix)) searchTokens.push(prefix)
        if (baseVerb.length >= 3 && !searchTokens.includes(baseVerb)) searchTokens.push(baseVerb)
      }

      let matchFound: {
        turnIdx: number
        turn: DialogTurn
        matchedWord: string
        vocab: VocabClue
      } | null = null

      for (let turnIdx = 0; turnIdx < dialogue.length; turnIdx++) {
        if (usedSentences.has(turnIdx)) continue
        const turn = dialogue[turnIdx]

        for (const token of searchTokens) {
          const regex = new RegExp(`\\b${escapeRegExp(token)}\\b`, 'i')
          const m = turn.germanText.match(regex)
          if (m) {
            const matchedWord = m[0]
            if (usedWords.has(matchedWord.toLowerCase())) continue
            if (STOP_WORDS.has(matchedWord.toLowerCase())) continue

            matchFound = {
              turnIdx,
              turn,
              matchedWord,
              vocab,
            }
            break
          }
        }
        if (matchFound) break
      }

      if (matchFound) {
        const { turnIdx, turn, matchedWord, vocab } = matchFound
        const regex = new RegExp(`\\b${escapeRegExp(matchedWord)}\\b`)
        const maskedSentence = turn.germanText.replace(regex, '[ ________ ]')

        usedSentences.add(turnIdx)
        usedWords.add(matchedWord.toLowerCase())

        // Sanitasi petunjuk (hint) agar tidak membocorkan target word
        let sanitizedGrammarTip = vocab.grammarTip
        if (sanitizedGrammarTip) {
          const wordRegex = new RegExp(
            `(?<![\\p{L}\\p{N}_])(${escapeRegExp(matchedWord)}|${escapeRegExp(rawClean)})(?![\\p{L}\\p{N}_])`,
            'giu'
          )
          sanitizedGrammarTip = sanitizedGrammarTip.replace(wordRegex, '[kata ini]')
        }

        const clozeIndex = list.filter((q) => q.type === 'cloze').length + 1
        list.push({
          id: `cloze-${clozeIndex - 1}`,
          type: 'cloze',
          title: `Lückentext (Melengkapi Kosakata) #${clozeIndex}`,
          prompt: `Lengkapi kalimat rumpang di bawah ini dengan kosakata bahasa Jerman yang sesuai:`,
          displayPrompt: maskedSentence,
          audioText: matchedWord,
          gender: 'female',
          indonesianHint: `Konteks Kalimat: "${turn.indonesianText}" (Makna kata yang hilang: ${vocab.indonesianMeaning})`,
          grammarTip: sanitizedGrammarTip || 'Perhatikan kelas kata dan bentuk dalam kalimat.',
          correctAnswer: matchedWord,
          acceptableAnswers: [matchedWord, rawClean, vocab.germanWord],
        })
      }
    }

    // Prioritas 2: Jika belum cukup 3 soal cloze, ambil kalimat dialog lain dan pilih kata penting (Noun/Adjective)
    for (let turnIdx = 0; turnIdx < dialogue.length; turnIdx++) {
      if (list.filter((q) => q.type === 'cloze').length >= 3) break
      if (usedSentences.has(turnIdx)) continue

      const turn = dialogue[turnIdx]
      const words = turn.germanText
        .replace(/[.,\/#!$%\^&\*;:{}=\-_'"?„“”«»]/g, '')
        .split(/\s+/)

      let bestWord: string | null = null
      for (let wIdx = 0; wIdx < words.length; wIdx++) {
        const w = words[wIdx]
        if (w.length < 4) continue
        const lower = w.toLowerCase()
        if (STOP_WORDS.has(lower)) continue
        if (usedWords.has(lower)) continue

        if (/^[A-ZÄÖÜ]/.test(w) && wIdx > 0) {
          bestWord = w
          break
        }
        if (!bestWord && w.length >= 5) {
          bestWord = w
        }
      }

      if (bestWord) {
        const regex = new RegExp(`\\b${escapeRegExp(bestWord)}\\b`)
        const maskedSentence = turn.germanText.replace(regex, '[ ________ ]')
        usedSentences.add(turnIdx)
        usedWords.add(bestWord.toLowerCase())

        const isNoun = /^[A-ZÄÖÜ]/.test(bestWord)
        const clozeIndex = list.filter((q) => q.type === 'cloze').length + 1
        list.push({
          id: `cloze-${clozeIndex - 1}`,
          type: 'cloze',
          title: `Lückentext (Melengkapi Kosakata) #${clozeIndex}`,
          prompt: `Lengkapi kalimat rumpang di bawah ini dengan kosakata bahasa Jerman yang sesuai:`,
          displayPrompt: maskedSentence,
          audioText: bestWord,
          gender: 'female',
          indonesianHint: `Konteks Kalimat: "${turn.indonesianText}"`,
          grammarTip: isNoun
            ? 'Kata benda (Substantiv) dalam bahasa Jerman selalu diawali huruf kapital.'
            : 'Perhatikan arti kalimat untuk menentukan kata yang tepat.',
          correctAnswer: bestWord,
          acceptableAnswers: [bestWord],
        })
      }
    }

    return list
  }, [dialogue, vocabClues])

  // Form states
  const [studentName, setStudentName] = useState('')
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [playbackSpeed, setPlaybackSpeed] = useState<Record<string, number>>({})
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)

  // Submitting states
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [resultFilter, setResultFilter] = useState<'all' | 'wrong' | 'correct'>('all')
  const [result, setResult] = useState<{
    score: number
    correctCount: number
    totalCount: number
    gradedAnswers: GradedAnswer[]
  } | null>(null)

  const handlePlayAudio = (qId: string, text: string, gender: 'female' | 'male') => {
    const speed = playbackSpeed[qId] ?? 1.0
    setPlayingAudioId(qId)
    speakGerman(text, {
      gender,
      rate: speed,
      onEnd: () => setPlayingAudioId(null),
    })
  }

  const handleSpeedToggle = (qId: string) => {
    setPlaybackSpeed((prev) => {
      const current = prev[qId] ?? 1.0
      return { ...prev, [qId]: current === 1.0 ? 0.8 : 1.0 }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage('')

    if (!studentName.trim()) {
      setErrorMessage('Silakan masukkan Nama Lengkap Siswa terlebih dahulu.')
      return
    }

    setSubmitting(true)

    try {
      // Auto-grading evaluasi
      const gradedAnswers: GradedAnswer[] = questions.map((q) => {
        const studentAns = answers[q.id] || ''
        const normStudent = normalizeText(studentAns)

        let isCorrect = false
        if (normStudent !== '') {
          if (normStudent === normalizeText(q.correctAnswer)) {
            isCorrect = true
          } else if (
            q.acceptableAnswers &&
            q.acceptableAnswers.some((a) => normalizeText(a) === normStudent)
          ) {
            isCorrect = true
          }
        }

        return {
          questionId: q.id,
          type: q.type,
          title: q.title,
          prompt: q.displayPrompt || q.prompt,
          studentAnswer: studentAns,
          correctAnswer: q.correctAnswer,
          isCorrect,
          indonesianHint: q.indonesianHint,
          grammarTip: q.grammarTip,
          audioText: q.audioText,
          gender: q.gender,
        }
      })

      const correctCount = gradedAnswers.filter((a) => a.isCorrect).length
      const totalCount = questions.length
      const score = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0

      // POST ke server
      const payload = {
        studentName: studentName.trim(),
        accessKey: accessKey || (isTeacher ? 'TEACHER-PREVIEW' : ''),
        score,
        totalQuestions: totalCount,
        correctAnswers: correctCount,
        answers: gradedAnswers,
      }

      const res = await fetch(`/api/sessions/${sessionId}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Gagal menyimpan hasil kuis.')
      }

      setResult({
        score,
        correctCount,
        totalCount,
        gradedAnswers,
      })
      setIsSubmitted(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat mengumpulkan kuis.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResetQuiz = () => {
    setAnswers({})
    setIsSubmitted(false)
    setResult(null)
    setResultFilter('all')
    setErrorMessage('')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 max-w-2xl mx-auto shadow-sm my-6">
        <HelpCircle size={40} className="mx-auto text-slate-300 mb-3" />
        <p className="text-slate-600 font-medium">Skenario ini belum memiliki soal kuis.</p>
      </div>
    )
  }

  // TAMPILAN RAPOR HASIL KUIS
  if (isSubmitted && result) {
    const isPassing = result.score >= 70
    let praiseMessage = 'Ausgezeichnet! Luar Biasa! 🌟'
    let badgeColor = 'bg-emerald-500 text-white'
    if (result.score >= 90) {
      praiseMessage = 'Ausgezeichnet! Sempurna sekali! 🌟'
      badgeColor = 'bg-emerald-600 text-white'
    } else if (result.score >= 80) {
      praiseMessage = 'Sehr Gut! Kerja yang sangat bagus! 🏆'
      badgeColor = 'bg-emerald-500 text-white'
    } else if (result.score >= 70) {
      praiseMessage = 'Gut gemacht! Kamu berhasil lulus! 👍'
      badgeColor = 'bg-blue-600 text-white'
    } else if (result.score >= 50) {
      praiseMessage = 'Cukup Baik, teruslah berlatih! 💪'
      badgeColor = 'bg-amber-500 text-white'
    } else {
      praiseMessage = 'Jangan berkecil hati, ayo pelajari lagi! 📖'
      badgeColor = 'bg-rose-500 text-white'
    }

    const filteredGradedAnswers = result.gradedAnswers.filter((ans) => {
      if (resultFilter === 'wrong') return !ans.isCorrect
      if (resultFilter === 'correct') return ans.isCorrect
      return true
    })

    return (
      <div className="max-w-2xl mx-auto w-full px-4 py-6 space-y-6">
        {/* Banner Rapor Siswa */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl text-center relative overflow-hidden">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-4">
            <Award size={15} className="text-amber-500" />
            <span>Rapor Hasil Kuis Siswa</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
            {studentName}
          </h2>
          <p className="text-sm text-slate-500 mb-6">{praiseMessage}</p>

          {/* Badge Skor Besar */}
          <div className="inline-flex flex-col items-center justify-center w-36 h-36 rounded-3xl shadow-lg border-4 border-white mb-6 mx-auto transition-transform hover:scale-105 duration-200 bg-gradient-to-br from-blue-600 via-indigo-600 to-indigo-700 text-white">
            <span className="text-xs uppercase font-bold tracking-wider text-blue-200">
              Nilai Akhir
            </span>
            <span className="text-4xl sm:text-5xl font-extrabold tracking-tight my-1">
              {result.score}
            </span>
            <span className="text-xs text-blue-100 font-medium">
              {result.correctCount} dari {result.totalCount} Soal Benar
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <div
              className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-xs ${badgeColor}`}
            >
              {isPassing ? '✓ Lulus KKM (>= 70)' : '✕ Perlu Remedial (< 70)'}
            </div>
            {accessKey && (
              <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full font-mono font-medium">
                Kunci: {accessKey}
              </span>
            )}
          </div>
        </div>

        {/* Rincian Koreksi Per Soal */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-1">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                Rincian Jawaban ({result.gradedAnswers.length} Soal)
              </h3>
              <span className="text-xs text-slate-400">Tinjau koreksi untuk refleksi belajar</span>
            </div>

            {/* Tab Filter di Atas Rincian Jawaban */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setResultFilter('all')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  resultFilter === 'all'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                Semua Soal ({result.totalCount})
              </button>

              <button
                type="button"
                onClick={() => setResultFilter('wrong')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  resultFilter === 'wrong'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                }`}
              >
                ❌ Salah ({result.totalCount - result.correctCount})
              </button>

              <button
                type="button"
                onClick={() => setResultFilter('correct')}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  resultFilter === 'correct'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                }`}
              >
                ✅ Benar ({result.correctCount})
              </button>
            </div>
          </div>

          {filteredGradedAnswers.length === 0 && (
            <div className="bg-white rounded-2xl p-6 text-center border border-slate-200 text-slate-500 text-xs">
              {resultFilter === 'wrong'
                ? 'Luar biasa! Tidak ada jawaban yang salah. 🎉'
                : 'Belum ada jawaban yang benar. Tetap semangat! 💪'}
            </div>
          )}

          {filteredGradedAnswers.map((ans) => {
            const originalIndex = result.gradedAnswers.findIndex((a) => a.questionId === ans.questionId)
            const qNum = originalIndex !== -1 ? originalIndex + 1 : 1
            const isPlayingAudio = playingAudioId === ans.questionId

            return (
              <div
                key={ans.questionId}
                className={`rounded-2xl p-5 border-2 transition-all shadow-xs ${
                  ans.isCorrect
                    ? 'border-emerald-300 bg-emerald-50/70 text-slate-800'
                    : 'border-rose-300 bg-rose-50/80 text-slate-800'
                }`}
              >
                {/* Header Soal & Badge Status Besar di Kiri Atas */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    {ans.isCorrect ? (
                      <span className="inline-flex items-center px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold tracking-wide shadow-xs">
                        ✅ JAWABAN BENAR
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-3 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold tracking-wide shadow-xs">
                        ❌ JAWABAN SALAH
                      </span>
                    )}
                    <span className="text-xs font-bold text-slate-700">
                      Nomor {qNum}: {ans.title}
                    </span>
                  </div>
                </div>

                {/* Teks Soal */}
                <p className="text-xs text-slate-600 mb-3 italic">
                  {ans.type === 'dictation' ? ans.prompt : 'Lengkapi kalimat rumpang di bawah ini:'}
                </p>

                {/* Tampilan Kalimat Rumpang (jika cloze) */}
                {ans.type === 'cloze' && (
                  <div className="bg-white/80 p-3 rounded-xl border border-slate-200 font-mono text-xs sm:text-sm font-bold text-slate-800 mb-3">
                    {ans.prompt}
                  </div>
                )}

                {/* Perbandingan Jawaban Siswa vs Kunci */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {ans.isCorrect ? (
                    <>
                      <div className="p-3.5 rounded-xl border bg-emerald-100/70 border-emerald-200 text-emerald-950">
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-1">
                          Jawaban Kamu:
                        </span>
                        <p className="font-bold text-sm flex items-center gap-1.5 text-emerald-900">
                          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                          <span>{ans.studentAnswer}</span>
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl border bg-emerald-100/70 border-emerald-200 text-slate-800">
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-1">
                          Kunci Jawaban yang Benar:
                        </span>
                        <p className="font-bold text-sm text-emerald-900">{ans.correctAnswer}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="p-3.5 rounded-xl border bg-rose-100/70 border-rose-200 text-rose-950">
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-rose-800 mb-1">
                          Jawaban Kamu:
                        </span>
                        <p className="font-semibold text-sm">
                          {ans.studentAnswer && ans.studentAnswer.trim() ? (
                            <span>{ans.studentAnswer}</span>
                          ) : (
                            <em className="text-rose-500 font-normal">(Tidak dijawab / Kosong)</em>
                          )}
                        </p>
                      </div>

                      <div className="p-3.5 rounded-xl border bg-emerald-100/70 border-emerald-200 text-slate-800">
                        <span className="block text-[11px] font-bold uppercase tracking-wider text-emerald-800 mb-1">
                          Kunci Jawaban yang Benar:
                        </span>
                        <p className="font-bold text-sm text-emerald-900">{ans.correctAnswer}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Petunjuk & Tips */}
                {(ans.indonesianHint || ans.grammarTip) && (
                  <div className="mt-3 pt-2.5 border-t border-slate-200/60 text-[11px] text-slate-600 flex flex-col gap-0.5">
                    {ans.indonesianHint && (
                      <span>
                        🇮🇩 <strong>Arti:</strong> {ans.indonesianHint}
                      </span>
                    )}
                    {ans.grammarTip && (
                      <span className="text-amber-800 font-medium">
                        💡 <strong>Tip Grammar:</strong> {ans.grammarTip}
                      </span>
                    )}
                  </div>
                )}

                {/* Tombol Audio Refleksi di Bagian Bawah Kartu */}
                <div className="mt-3.5 pt-3 border-t border-slate-200/70 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => handlePlayAudio(ans.questionId, ans.audioText, ans.gender)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                      isPlayingAudio
                        ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse'
                        : 'bg-white hover:bg-slate-50 text-blue-700 border border-blue-200 active:scale-95'
                    }`}
                    title="Dengarkan pengucapan yang tepat untuk bahan evaluasi belajar"
                  >
                    <Volume2 size={14} className={isPlayingAudio ? 'animate-bounce' : 'text-blue-600'} />
                    <span>{isPlayingAudio ? 'Memutar...' : '🔊 Dengar Pelafalan Benar'}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Tombol Ulangi Kuis */}
        <div className="pt-4 flex justify-center">
          <button
            type="button"
            onClick={handleResetQuiz}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-md active:scale-98 cursor-pointer"
          >
            <RotateCcw size={16} />
            <span>Ulangi Kuis (Noch einmal versuchen)</span>
          </button>
        </div>
      </div>
    )
  }

  // TAMPILAN FORM PENGERJAAN KUIS
  return (
    <div className="max-w-2xl mx-auto w-full px-4 py-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Banner Info Kuis */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-5 sm:p-6 rounded-3xl shadow-lg">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-semibold">
              📝 Kuis Interaktif
            </span>
            <span className="text-xs text-blue-200 font-medium">
              {questions.length} Soal Auto-Grading
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold mb-1">Kuis Pemahaman Skenario</h2>
          <p className="text-xs sm:text-sm text-blue-100 leading-relaxed opacity-90">
            Uji kemampuan mendengar (Hörverstehen) dan penguasaan kosakata (Lückentext) dari skenario ini.
          </p>
        </div>

        {/* Input Nama Siswa */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <User size={15} className="text-blue-600" />
            Nama Lengkap Siswa <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            placeholder="Masukkan nama lengkap Anda..."
            className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder-slate-400 font-medium"
          />
          {accessKey && (
            <p className="text-[11px] text-slate-400 mt-2 font-mono">
              Kunci Akses Terverifikasi: <strong>{accessKey}</strong>
            </p>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Daftar Soal */}
        <div className="space-y-5">
          {questions.map((q, idx) => {
            const isPlaying = playingAudioId === q.id
            const currentSpeed = playbackSpeed[q.id] ?? 1.0

            return (
              <div
                key={q.id}
                className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-200 transition-colors"
              >
                {/* Header Soal */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      {q.type === 'dictation' ? (
                        <span className="flex items-center gap-1 text-indigo-600">
                          <Headphones size={13} /> Hörverstehen
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-emerald-600">
                          <FileEdit size={13} /> Lückentext
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Audio Controls atau Badge Murni Teks */}
                  {q.type === 'dictation' ? (
                    <div className="flex items-center gap-1.5">
                      {/* Speed Toggle */}
                      <button
                        type="button"
                        onClick={() => handleSpeedToggle(q.id)}
                        className="text-[11px] px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 font-semibold transition-colors cursor-pointer"
                        title="Ubah kecepatan audio (1.0x / 0.8x)"
                      >
                        {currentSpeed}x
                      </button>

                      {/* Tombol Play Audio */}
                      <button
                        type="button"
                        onClick={() => handlePlayAudio(q.id, q.audioText, q.gender)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all shadow-2xs cursor-pointer ${
                          isPlaying
                            ? 'bg-rose-100 text-rose-700 border border-rose-300 animate-pulse'
                            : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 active:scale-95'
                        }`}
                      >
                        <Volume2 size={14} className={isPlaying ? 'animate-bounce' : ''} />
                        <span>{isPlaying ? 'Memutar...' : '🔊 Putar Audio'}</span>
                      </button>
                    </div>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium border border-slate-200">
                      ✍️ Murni Teks (Tanpa Audio)
                    </span>
                  )}
                </div>

                {/* Prompt Instruksi */}
                <p className="text-xs text-slate-600 mb-3">{q.prompt}</p>

                {/* Tampilan Khusus Tipe 2 (Lückentext Sentence) */}
                {q.type === 'cloze' && q.displayPrompt && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 mb-3 font-mono text-sm font-semibold text-slate-800 leading-relaxed">
                    {q.displayPrompt}
                  </div>
                )}

                {/* Kolom Jawaban Siswa */}
                <div className="mb-2">
                  <input
                    type="text"
                    value={answers[q.id] || ''}
                    onChange={(e) =>
                      setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
                    }
                    placeholder={
                      q.type === 'dictation'
                        ? 'Ketik kalimat bahasa Jerman yang didengar...'
                        : 'Ketik kata yang hilang di sini...'
                    }
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder-slate-400 font-medium"
                  />
                </div>

                {/* Petunjuk Arti & Tip */}
                <div className="text-[11px] text-slate-500 space-y-0.5 pt-1">
                  {q.indonesianHint && (
                    <p>
                      🇮🇩 <strong>Arti / Konteks:</strong> {q.indonesianHint}
                    </p>
                  )}
                  {q.grammarTip && (
                    <p className="text-amber-700 font-medium">
                      💡 <strong>Tip Grammar:</strong> {q.grammarTip}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Tombol Submit Kuis */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-500/25 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            <Send size={16} />
            <span>{submitting ? 'Memeriksa & Mengirim Jawaban...' : 'Kumpulkan Jawaban Kuis'}</span>
          </button>
          <p className="text-center text-xs text-slate-400 mt-2">
            Jawaban akan otomatis dikoreksi dan skor langsung ditampilkan.
          </p>
        </div>
      </form>
    </div>
  )
}
