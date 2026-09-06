import React, { useEffect, useState } from 'react'
import { Card } from '../components/ui/card'
import { speakGerman, stopSpeech } from '../lib/audio'
import { isTeacherAuthenticated, getAuthHeaders } from '../lib/auth'
import KeyManagerModal from '../components/access/KeyManagerModal'
import SubmissionAnalyticsModal from '../components/analytics/SubmissionAnalyticsModal'
import ScenarioFlashcards from '../components/flashcard/ScenarioFlashcards'
import ScenarioQuiz from '../components/quiz/ScenarioQuiz'
import {
  Volume2,
  Share2,
  ChevronLeft,
  BookOpen,
  Pencil,
  Play,
  Square,
  Key,
  BarChart3,
  Lock,
  Clock,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react'

interface DialogTurn {
  speaker: string
  germanText: string
  indonesianText: string
  gender?: 'female' | 'male'
}

interface VocabClue {
  germanWord: string
  indonesianMeaning: string
  grammarTip: string
}

interface Session {
  id: string
  title: string
  cefrLevel: string
  sceneDescription: string
  scenarioPrompt: string
  dialogueJson: string
  vocabCluesJson: string
}

export default function ViewPage({ id, navigate }: { id: string; navigate: (path: string) => void }) {
  const isTeacher = isTeacherAuthenticated()

  const [session, setSession] = useState<(Session & { dialogue: DialogTurn[]; vocabClues: VocabClue[] }) | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [isPlayingAll, setIsPlayingAll] = useState(false)
  const [playbackRate, setPlaybackRate] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('preferred_dialog_speed')
      return saved ? parseFloat(saved) : 1.0
    } catch {
      return 1.0
    }
  })
  const playbackRateRef = React.useRef(playbackRate)
  playbackRateRef.current = playbackRate

  // Tab state: 'dialog' | 'flashcard' | 'quiz'
  const [activeTab, setActiveTab] = useState<'dialog' | 'flashcard' | 'quiz'>('dialog')

  // Access Gate states
  const [accessGranted, setAccessGranted] = useState<boolean>(isTeacher)
  const [validKey, setValidKey] = useState<string>('')
  const [verifyingKey, setVerifyingKey] = useState<boolean>(!isTeacher)
  const [accessError, setAccessError] = useState<'missing_key' | 'not_found' | 'expired' | ''>('')
  const [inputKey, setInputKey] = useState<string>('')
  const [gateSubmitting, setGateSubmitting] = useState(false)
  const [gateErrorMsg, setGateErrorMsg] = useState('')

  // Teacher Modals states
  const [showKeyManager, setShowKeyManager] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [submissionsCount, setSubmissionsCount] = useState<number>(0)

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate)
    playbackRateRef.current = rate
    try {
      localStorage.setItem('preferred_dialog_speed', rate.toString())
    } catch {}
  }

  const cancelledRef = React.useRef(false)
  const timeoutRef = React.useRef<any>(null)
  const turnRefs = React.useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    return () => {
      cancelledRef.current = true
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      stopSpeech()
    }
  }, [])

  // Fetch Session Data
  useEffect(() => {
    fetch('/api/sessions/' + id)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error)
        setSession({
          ...data,
          dialogue: JSON.parse(data.dialogueJson) as DialogTurn[],
          vocabClues: JSON.parse(data.vocabCluesJson) as VocabClue[],
        })
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id])

  // Verifikasi Kunci Akses Siswa atau Ambil Metrik Guru
  useEffect(() => {
    if (isTeacher) {
      setAccessGranted(true)
      setVerifyingKey(false)
      // Ambil jumlah submissions untuk badge guru
      fetch(`/api/sessions/${id}/submissions`, {
        headers: getAuthHeaders(),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.submissions) {
            setSubmissionsCount(data.submissions.length)
          }
        })
        .catch(() => {})
      return
    }

    // Jika murid (bukan guru): periksa query param ?key=
    const searchParams = new URLSearchParams(window.location.search)
    const rawUrlKey = searchParams.get('key')
    const urlKey = rawUrlKey ? rawUrlKey.trim().toUpperCase() : null

    if (!urlKey) {
      setAccessGranted(false)
      setAccessError('missing_key')
      setVerifyingKey(false)
      return
    }

    setVerifyingKey(true)
    fetch(`/api/sessions/${id}/verify-access?key=${encodeURIComponent(urlKey)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setAccessGranted(true)
          setValidKey(urlKey)
          setAccessError('')
        } else {
          setAccessGranted(false)
          setAccessError(data.reason === 'expired' ? 'expired' : 'not_found')
        }
      })
      .catch(() => {
        setAccessGranted(false)
        setAccessError('not_found')
      })
      .finally(() => {
        setVerifyingKey(false)
      })
  }, [id, isTeacher])

  const handleKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGateErrorMsg('')
    const enteredKey = inputKey
    const trimmed = enteredKey.trim().toUpperCase()
    if (!trimmed) {
      setGateErrorMsg('Silakan masukkan kunci akses.')
      return
    }

    try {
      setGateSubmitting(true)
      const res = await fetch(`/api/sessions/${id}/verify-access?key=${encodeURIComponent(trimmed)}`)
      const data = await res.json()

      if (data.valid) {
        setValidKey(trimmed)
        setAccessGranted(true)
        setAccessError('')
        // Update URL tanpa reload
        const newUrl = `${window.location.pathname}?key=${encodeURIComponent(trimmed)}`
        window.history.replaceState({}, '', newUrl)
      } else {
        if (data.reason === 'expired') {
          setAccessError('expired')
          setGateErrorMsg('Kunci akses ini sudah kedaluwarsa. Batas waktu belajar telah habis.')
        } else {
          setAccessError('not_found')
          setGateErrorMsg('Kunci akses tidak ditemukan atau salah. Periksa kembali kode Anda.')
        }
      }
    } catch {
      setGateErrorMsg('Gagal memverifikasi kunci akses. Coba lagi.')
    } finally {
      setGateSubmitting(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const speakers = session ? [...new Set(session.dialogue.map((d) => d.speaker))] : []
  const speakerA = speakers[0] || 'Sprecher A'

  const handleStopAll = () => {
    cancelledRef.current = true
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    stopSpeech()
    setPlayingIndex(null)
    setIsPlayingAll(false)
  }

  const handlePlayAll = async () => {
    if (!session || session.dialogue.length === 0) return
    if (isPlayingAll) {
      handleStopAll()
      return
    }
    stopSpeech()
    cancelledRef.current = false
    setIsPlayingAll(true)

    for (let i = 0; i < session.dialogue.length; i++) {
      if (cancelledRef.current) break
      const turn = session.dialogue[i]
      const isA = turn.speaker === speakerA
      const turnGender: 'male' | 'female' = turn.gender || (isA ? 'female' : 'male')

      setPlayingIndex(i)

      if (turnRefs.current[i]) {
        turnRefs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }

      await new Promise<void>((resolve) => {
        let finished = false
        let safetyTimer: any = null

        const done = () => {
          if (!finished) {
            finished = true
            if (safetyTimer) clearTimeout(safetyTimer)
            if (!cancelledRef.current) {
              timeoutRef.current = setTimeout(resolve, 650)
            } else {
              resolve()
            }
          }
        }

        // Safety timeout fallback jika browser engine men-drop event onend
        const estimatedDurationMs = Math.max(5000, Math.round((turn.germanText.length / 10) * 1000) + 4000)
        safetyTimer = setTimeout(() => {
          console.warn('Speech onEnd event timed out, auto-advancing turn...')
          done()
        }, estimatedDurationMs)

        speakGerman(turn.germanText, {
          gender: turnGender,
          rate: playbackRateRef.current,
          onEnd: done,
        })
      })
    }

    if (!cancelledRef.current) {
      setPlayingIndex(null)
      setIsPlayingAll(false)
    }
  }

  const handlePlayTurn = (index: number, germanText: string, gender: 'male' | 'female') => {
    if (isPlayingAll) {
      handleStopAll()
    }
    setPlayingIndex(index)
    speakGerman(germanText, {
      gender,
      rate: playbackRateRef.current,
      onEnd: () => setPlayingIndex(null),
    })
  }

  if (loading || verifyingKey) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-slate-500">
            {verifyingKey ? 'Memverifikasi kunci akses skenario...' : 'Memuat skenario...'}
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <div className="text-center p-8">
          <BookOpen size={48} className="mx-auto mb-4 text-slate-300" />
          <h2 className="text-xl font-bold text-slate-600 mb-2">Skenario Tidak Ditemukan</h2>
          <p className="text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:underline flex items-center gap-1 mx-auto"
          >
            <ChevronLeft size={16} /> Kembali ke Beranda
          </button>
        </div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Hero banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6 shadow-lg">
        <div className="max-w-3xl mx-auto">
          {isTeacher && (
            <button
              onClick={() => navigate('/')}
              className="flex items-center gap-1 text-blue-200 hover:text-white text-sm mb-4 transition-colors"
            >
              <ChevronLeft size={16} /> Beranda
            </button>
          )}

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="inline-block bg-white/20 text-white text-xs px-2.5 py-1 rounded-full font-medium">
                  Level {session.cefrLevel}
                </span>
                {isTeacher ? (
                  <span className="inline-flex items-center gap-1 bg-amber-400/30 text-amber-200 text-xs px-2.5 py-0.5 rounded-full font-semibold border border-amber-300/40">
                    <ShieldCheck size={13} />
                    Mode Guru (Akses Penuh)
                  </span>
                ) : (
                  <>
                    <span className="inline-flex items-center gap-1 bg-white/20 text-white text-xs px-2.5 py-0.5 rounded-full font-medium border border-white/30">
                      🧑🎓 Ruang Belajar Siswa
                    </span>
                    {validKey ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-400/20 text-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-mono font-medium border border-emerald-300/30">
                        🔑 Kunci: {validKey}
                      </span>
                    ) : null}
                  </>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold mb-2 leading-snug">
                {session.title}
              </h1>

              {session.sceneDescription && (
                <p className="text-blue-100 text-sm leading-relaxed mt-2 opacity-90">
                  {session.sceneDescription}
                </p>
              )}
            </div>

            {/* Tombol Aksi Header */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              {isTeacher ? (
                <>
                  {/* Kunci Akses Siswa */}
                  <button
                    type="button"
                    onClick={() => setShowKeyManager(true)}
                    title="Kelola Kunci Akses Siswa"
                    className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    <Key size={14} />
                    <span>Kunci Akses Siswa</span>
                  </button>

                  {/* Analitik & Kuis */}
                  <button
                    type="button"
                    onClick={() => setShowAnalytics(true)}
                    title="Lihat Analitik & Rapor Kuis Siswa"
                    className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white px-3 py-2 rounded-xl text-xs font-semibold transition-all shadow-xs active:scale-95 cursor-pointer"
                  >
                    <BarChart3 size={14} />
                    <span>Analitik & Kuis ({submissionsCount})</span>
                  </button>

                  {/* Edit Skenario */}
                  <button
                    type="button"
                    onClick={() => navigate('/edit/' + id)}
                    title="Edit skenario ini"
                    className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl text-xs transition-colors text-white font-medium"
                  >
                    <Pencil size={14} />
                    <span>Edit Skenario</span>
                  </button>
                </>
              ) : null}

              {/* Bagikan Link */}
              {isTeacher && (
                <button
                  type="button"
                  onClick={handleCopyLink}
                  title="Salin link skenario ini"
                  className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-xl text-xs transition-colors text-white font-medium cursor-pointer"
                >
                  <Share2 size={14} />
                  <span>{copied ? 'Tersalin!' : 'Bagikan Link'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* GATE AKSES MURID: JIKA AKSES BELUM TERBUKA */}
      {!accessGranted ? (
        <div className="flex-1 max-w-lg w-full mx-auto p-4 flex items-center justify-center my-8">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xl w-full text-center space-y-5">
            {accessError === 'expired' || accessError === 'not_found' ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
                  <Clock size={32} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Kunci Akses Kedaluwarsa / Tidak Valid
                  </h2>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {accessError === 'expired'
                      ? 'Batas waktu belajar untuk kunci akses ini telah habis (kedaluwarsa). Silakan hubungi guru Anda untuk mendapatkan kunci baru atau masukkan kode lain di bawah ini.'
                      : 'Kunci akses yang Anda masukkan tidak cocok atau tidak aktif. Periksa kembali format kode kunci Anda.'}
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 mx-auto flex items-center justify-center">
                  <Lock size={32} />
                </div>

                <div>
                  <h2 className="text-xl font-bold text-slate-800">
                    Masukkan Kunci Akses Skenario
                  </h2>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Skenario pembelajaran ini dilindungi. Masukkan kode kunci akses yang diberikan
                    oleh guru Anda untuk membuka materi dan kuis.
                  </p>
                </div>
              </>
            )}

            {gateErrorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 text-left">
                <AlertCircle size={16} className="shrink-0" />
                <span>{gateErrorMsg}</span>
              </div>
            )}

            {/* Form Masukkan Kunci */}
            <form onSubmit={handleKeySubmit} className="space-y-3 pt-2">
              <div>
                <input
                  type="text"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value.toUpperCase())}
                  placeholder="Contoh: DE-ABC12"
                  className="w-full text-center font-mono text-base font-bold tracking-widest px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:bg-white focus:outline-none transition-all placeholder-slate-400 uppercase"
                />
              </div>

              <button
                type="submit"
                disabled={gateSubmitting}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                <Key size={16} />
                <span>{gateSubmitting ? 'Memverifikasi...' : 'Buka Akses Pembelajaran'}</span>
              </button>
            </form>

            {isTeacher && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors inline-flex items-center gap-1"
                >
                  <ChevronLeft size={14} />
                  <span>Kembali ke Beranda</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* KONTEN UTAMA DENGAN 3 TAB KETIKA AKSES TERBUKA */
        <>
          {/* TAB BAR HEADER */}
          <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
            <div className="max-w-3xl mx-auto px-4 flex items-center justify-between">
              <div className="flex items-center gap-1.5 sm:gap-2 py-2.5 overflow-x-auto w-full">
                {/* Tab 1: Dialog Percakapan */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('dialog')
                    stopSpeech()
                  }}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                    activeTab === 'dialog'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>💬 Dialog Percakapan</span>
                </button>

                {/* Tab 2: Flashcard Kosakata */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('flashcard')
                    stopSpeech()
                  }}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                    activeTab === 'flashcard'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>🃏 Flashcard Kata</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      activeTab === 'flashcard'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {session.vocabClues.length}
                  </span>
                </button>

                {/* Tab 3: Kuis Pemahaman */}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('quiz')
                    stopSpeech()
                  }}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                    activeTab === 'quiz'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <span>📝 Kuis Pemahaman</span>
                </button>
              </div>
            </div>
          </div>

          {/* TAB 1: DIALOG & VOCAB CLUES */}
          {activeTab === 'dialog' && (
            <>
              <div className="flex-1 max-w-2xl w-full mx-auto p-4 space-y-4 mt-4">
                <div className="flex items-center justify-between px-1 mb-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Dialog
                    </h2>
                    <span className="text-xs text-slate-400">
                      ({session.dialogue.length} Baris)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Speed selector pills */}
                    <div
                      className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-xs"
                      title="Kecepatan Audio"
                    >
                      {[1.0, 0.8, 0.75, 0.5].map((speed) => (
                        <button
                          key={speed}
                          type="button"
                          onClick={() => handleSpeedChange(speed)}
                          className={`px-2 py-1 rounded-md font-medium text-xs transition-all ${
                            playbackRate === speed
                              ? 'bg-white text-blue-600 shadow-xs font-bold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {speed}x
                        </button>
                      ))}
                    </div>

                    {isPlayingAll ? (
                      <button
                        type="button"
                        onClick={handleStopAll}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold border border-rose-200 transition-all shadow-xs cursor-pointer"
                      >
                        <Square size={13} className="fill-rose-700" />
                        <span>Hentikan Audio</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handlePlayAll}
                        disabled={session.dialogue.length === 0}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-xs hover:shadow cursor-pointer disabled:opacity-50"
                      >
                        <Play size={13} className="fill-white" />
                        <span>Putar Seluruh Dialog</span>
                      </button>
                    )}
                  </div>
                </div>

                {session.dialogue.map((turn, i) => {
                  const isA = turn.speaker === speakerA
                  const turnGender: 'male' | 'female' =
                    turn.gender || (isA ? 'female' : 'male')
                  return (
                    <div
                      key={i}
                      className={'flex w-full ' + (isA ? 'justify-start' : 'justify-end')}
                    >
                      <div
                        ref={(el) => (turnRefs.current[i] = el)}
                        className={
                          'max-w-[88%] rounded-2xl p-4 shadow-sm transition-all ' +
                          (playingIndex === i
                            ? 'ring-2 ring-blue-400 ring-offset-2 shadow-md '
                            : '') +
                          (isA
                            ? 'bg-white rounded-tl-sm'
                            : 'bg-blue-500 text-white rounded-tr-sm')
                        }
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span
                            className={
                              'text-xs font-semibold ' +
                              (isA ? 'text-slate-400' : 'text-blue-200')
                            }
                          >
                            {turn.speaker}
                          </span>
                          <span
                            className={
                              'text-xs px-2 py-0.5 rounded-full font-medium ' +
                              (turnGender === 'female'
                                ? 'bg-rose-100 text-rose-700'
                                : 'bg-sky-100 text-sky-700')
                            }
                          >
                            {turnGender === 'female' ? '👩 Wanita' : '👨 Pria'}
                          </span>
                        </div>
                        <p
                          className={
                            'text-base font-semibold leading-snug mb-1 ' +
                            (isA ? 'text-slate-800' : 'text-white')
                          }
                        >
                          {turn.germanText}
                        </p>
                        <p
                          className={
                            'text-sm leading-relaxed mb-2 ' +
                            (isA ? 'text-slate-400' : 'text-blue-100')
                          }
                        >
                          {turn.indonesianText}
                        </p>
                        <button
                          type="button"
                          onClick={() => handlePlayTurn(i, turn.germanText, turnGender)}
                          className={
                            'flex items-center gap-1 text-xs px-2.5 py-1 rounded-full transition-colors ' +
                            (isA
                              ? 'bg-slate-100 hover:bg-blue-100 text-slate-500 hover:text-blue-600'
                              : 'bg-white/20 hover:bg-white/30 text-blue-100 hover:text-white')
                          }
                          disabled={playingIndex === i}
                        >
                          <Volume2
                            size={13}
                            className={playingIndex === i ? 'animate-pulse' : ''}
                          />
                          {playingIndex === i ? 'Sedang Memutar...' : 'Putar'}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Vocab Clues */}
              <div className="bg-white border-t mt-8 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)]">
                <div className="max-w-2xl mx-auto p-6">
                  <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                    Vocab Clues
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {session.vocabClues.map((clue, i) => (
                      <Card key={i} className="p-3 bg-slate-50 border-slate-100">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-slate-800 text-sm">
                              {clue.germanWord}
                            </p>
                            <p className="text-sm text-slate-600 mt-0.5">
                              {clue.indonesianMeaning}
                            </p>
                            <p className="text-xs text-slate-400 italic mt-1 leading-tight">
                              {clue.grammarTip}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => speakGerman(clue.germanWord)}
                            className="flex-shrink-0 p-1.5 text-slate-300 hover:text-blue-500 rounded-lg hover:bg-blue-50 transition-colors"
                            title="Putar pengucapan"
                          >
                            <Volume2 size={15} />
                          </button>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Share footer */}
                  {isTeacher && (
                    <div className="mt-6 pt-4 border-t text-center">
                      <p className="text-xs text-slate-400 mb-2">Bagikan skenario ini ke siswa</p>
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                      >
                        <Share2 size={14} />
                        {copied ? 'Link disalin!' : 'Salin Link'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* TAB 2: FLASHCARD INTERAKTIF */}
          {activeTab === 'flashcard' && (
            <div className="flex-1 py-4">
              <ScenarioFlashcards vocabClues={session.vocabClues} />
            </div>
          )}

          {/* TAB 3: KUIS INTERAKTIF */}
          {activeTab === 'quiz' && (
            <div className="flex-1 py-4">
              <ScenarioQuiz
                session={session}
                sessionId={id}
                accessKey={validKey}
                isTeacher={isTeacher}
              />
            </div>
          )}
        </>
      )}

      {/* MODAL GURU: KELOLA KUNCI AKSES */}
      {isTeacher && (
        <KeyManagerModal
          sessionId={id}
          sessionTitle={session.title}
          isOpen={showKeyManager}
          onClose={() => setShowKeyManager(false)}
        />
      )}

      {/* MODAL GURU: ANALITIK KUIS SISWA */}
      {isTeacher && (
        <SubmissionAnalyticsModal
          sessionId={id}
          sessionTitle={session.title}
          isOpen={showAnalytics}
          onClose={() => {
            setShowAnalytics(false)
            // Segarkan jumlah submission
            fetch(`/api/sessions/${id}/submissions`, {
              headers: getAuthHeaders(),
            })
              .then((res) => res.json())
              .then((d) => {
                if (d.submissions) setSubmissionsCount(d.submissions.length)
              })
              .catch(() => {})
          }}
        />
      )}
    </div>
  )
}
