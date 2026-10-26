import React, { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Trash2, Plus, Volume2, ChevronLeft, Save, Sparkles, Play, Square, Loader2 } from 'lucide-react'
import { speakGerman, stopSpeech } from '../lib/audio'
import { nanoid } from 'nanoid'
import { getAuthHeaders } from '../lib/auth'
import { parseComprehensionQuestions, type ComprehensionQuestion } from '../lib/comprehension'
import { parseGrammarPatterns, type GrammarPattern } from '../lib/grammarPatterns'
import {
  parseGrammarTopics,
  parseGrammarTopicIds,
  type GrammarTopicContent,
} from '../lib/grammarTopicsParser'
import { parseGrammarQuestions, type AiGrammarQuestion } from '../lib/grammarQuestions'
import GrammarTopicPicker from '../components/generator/GrammarTopicPicker'
import { SCENARIO_PERSONAS, getTtsPersona, type TtsPersonaId } from '../../shared/ttsPersonas'

interface DialogTurn {
  speaker: string
  germanText: string
  indonesianText: string
  gender?: 'female' | 'male'
  personaId?: string
}

interface VocabClue {
  germanWord: string
  indonesianMeaning: string
  grammarTip: string
}

interface GeneratedLesson {
  title: string
  sceneDescription: string
  dialogue: DialogTurn[]
  vocabClues: VocabClue[]
  comprehensionQuestions?: ComprehensionQuestion[]
  grammarPatterns?: GrammarPattern[]
  grammarTopics?: GrammarTopicContent[]
  grammarQuestions?: AiGrammarQuestion[]
}

export default function GeneratorPage({ editId, navigate }: { editId?: string; navigate: (path: string) => void }) {
  const isEditMode = Boolean(editId)
  const [fetchingSession, setFetchingSession] = useState(false)
  const [prompt, setPrompt] = useState('Di sebuah kafe di Berlin, memesan kopi dan kue.')
  const [cefrLevel, setCefrLevel] = useState('A1')
  const [dialogueCount, setDialogueCount] = useState(8)
  const [speakerCount, setSpeakerCount] = useState(2)
  // Pilihan topik grammar B1. Disimpan di sini (bukan di dalam picker) supaya
  // tidak hilang saat level CEFR ditukar sementara.
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [lesson, setLesson] = useState<GeneratedLesson | null>(null)
  const [editedDialogue, setEditedDialogue] = useState<DialogTurn[]>([])
  const [editedVocab, setEditedVocab] = useState<VocabClue[]>([])
  const [editedTitle, setEditedTitle] = useState('')
  const [editedSceneDesc, setEditedSceneDesc] = useState('')
  const [audioPreloadReady, setAudioPreloadReady] = useState<boolean>(false)
  const [audioSynthesizing, setAudioSynthesizing] = useState<boolean>(false)
  const [scenarioAudioUrl, setScenarioAudioUrl] = useState<string>('')
  /** Milidetik mulai tiap baris, dari header X-TTS-Timings. */
  const scenarioTimingsRef = React.useRef<number[]>([])
  const scenarioAudioRef = React.useRef<HTMLAudioElement | null>(null)
  /** Ref tiap kartu dialog, dipakai untuk memposisikan baris yang diputar. */
  const turnRefs = React.useRef<(HTMLDivElement | null)[]>([])
  const [speakerPersonas, setSpeakerPersonas] = useState<Record<string, TtsPersonaId>>({
    'Sprecher A': 'weiblich',
    'Sprecher B': 'männlich-1',
    'Sprecher C': 'männlich-2',
  })
  const [isPlayingAll, setIsPlayingAll] = useState(false)
  const [playingIndex, setPlayingIndex] = useState<number | null>(null)
  const [playbackRate, setPlaybackRate] = useState<number>(1.0)
  const playbackRateRef = React.useRef(playbackRate)
  playbackRateRef.current = playbackRate
  const cancelledRef = React.useRef(false)
  const timeoutRef = React.useRef<any>(null)

  useEffect(() => {
    return () => {
      cancelledRef.current = true
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
      stopSpeech()
    }
  }, [])

  useEffect(() => {
    if (!editId) return
    setFetchingSession(true)
    fetch('/api/sessions/' + editId, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) throw new Error(data.error)
        const parsedDialogue: DialogTurn[] = typeof data.dialogueJson === 'string' ? JSON.parse(data.dialogueJson) : data.dialogueJson
        const parsedVocab: VocabClue[] = typeof data.vocabCluesJson === 'string' ? JSON.parse(data.vocabCluesJson) : data.vocabCluesJson

        setEditedTitle(data.title)
        setPrompt(data.scenarioPrompt || '')
        setEditedSceneDesc(data.sceneDescription || '')
        setCefrLevel(data.cefrLevel || 'A1')
        if (typeof data.dialogueCount === 'number') setDialogueCount(data.dialogueCount)
        setSelectedTopicIds(parseGrammarTopicIds(data.grammarTopicsJson))
        setEditedDialogue(parsedDialogue)
        setEditedVocab(parsedVocab)

        // Mode edit: dialog sudah ada tapi audionya belum. Tanpa ini tombol
        // "Putar Semua Dialog" tetap kosong sampai pengguna mengklik manual.
        const personaOf = (t: DialogTurn) =>
          t.personaId ||
          (t.gender === 'male' ? 'männlich-1' : t.gender === 'female' ? 'weiblich' : undefined) ||
          'weiblich'
        void buildScenarioAudio(
          parsedDialogue.map((t) => ({ ...t, personaId: personaOf(t) })),
        )

        const distinctSpeakers = [...new Set(parsedDialogue.map(t => t.speaker))]
        if (distinctSpeakers.length > 0) {
          setSpeakerCount(Math.min(6, Math.max(2, distinctSpeakers.length)))
          const updatedPersonas: Record<string, TtsPersonaId> = { ...speakerPersonas }
          for (const spk of distinctSpeakers) {
            const matchTurn = parsedDialogue.find(t => t.speaker === spk)
            if (matchTurn?.personaId) {
              updatedPersonas[spk] = matchTurn.personaId as TtsPersonaId
            }
          }
          setSpeakerPersonas(updatedPersonas)
        }
        setLesson({
          title: data.title,
          sceneDescription: data.sceneDescription || '',
          dialogue: parsedDialogue,
          vocabClues: parsedVocab,
          comprehensionQuestions: parseComprehensionQuestions(data.comprehensionQuestionsJson),
          grammarPatterns: parseGrammarPatterns(data.grammarPatternsJson),
          grammarTopics: parseGrammarTopics(data.grammarTopicsJson),
          grammarQuestions: parseGrammarQuestions(data.grammarQuestionsJson),
        })

        // Biarkan turnA/turnB gender lama tetap terbaca bila ada
        const turnA = parsedDialogue.find(t => t.speaker === 'Sprecher A')
        if (turnA?.gender) {
          setSpeakerPersonas(prev => ({ ...prev, 'Sprecher A': turnA.gender === 'male' ? 'männlich-1' : 'weiblich' }))
        }
        const turnB = parsedDialogue.find(t => t.speaker === 'Sprecher B')
        if (turnB?.gender) {
          setSpeakerPersonas(prev => ({ ...prev, 'Sprecher B': turnB.gender === 'male' ? 'männlich-1' : 'weiblich' }))
        }
      })
      .catch(err => {
        setError(err.message || 'Gagal memuat skenario')
      })
      .finally(() => {
        setFetchingSession(false)
      })
  }, [editId])

  const selectedWords: number[] = (() => { try { return JSON.parse(localStorage.getItem('selectedWords') || '[]') } catch { return [] } })()

  const handleGenerate = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          prompt,
          cefrLevel,
          wordIds: selectedWords,
          dialogueCount,
          speakerCount,
          // Topik hanya berlaku untuk B1; jangan kirim kunci sama sekali bila kosong.
          ...(cefrLevel === 'B1' && selectedTopicIds.length > 0
            ? { grammarTopics: selectedTopicIds }
            : {}),
        })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const generated: GeneratedLesson = data.lesson
      setLesson(generated)
      const turnsWithPersonas: DialogTurn[] = generated.dialogue.map(t => {
        const personaId = t.personaId || speakerPersonas[t.speaker] || (t.speaker === 'Sprecher A' ? 'weiblich' : 'männlich-1')
        const persona = getTtsPersona(personaId)
        const gender = persona ? persona.gender : (personaId.includes('male') || personaId.includes('männlich') ? 'male' : 'female')
        return {
          ...t,
          personaId,
          gender,
        }
      })
      setEditedDialogue(turnsWithPersonas)
      setEditedVocab([...generated.vocabClues])
      setEditedTitle(generated.title)
      setEditedSceneDesc(generated.sceneDescription)

      // Sintesis seluruh dialog jadi satu MP3 di latar belakang.
      // Skenario belum tersimpan (belum punya id), jadi pakai POST /api/tts-scenario.
      void buildScenarioAudio(turnsWithPersonas)
    } catch (err: any) {
      setError(err.message || 'Gagal menghubungi AI. Pastikan GEMINI_API_KEY sudah dikonfigurasi.')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!lesson) return
    setSaving(true)
    try {
      const id = editId || nanoid(10)
      const payload = {
        id,
        title: editedTitle,
        scenarioPrompt: prompt,
        sceneDescription: editedSceneDesc,
        cefrLevel,
        dialogueCount,
        dialogueJson: editedDialogue,
        vocabCluesJson: editedVocab,
        // Kirim array soal bila ada; selain itu null, supaya skenario A1/A2
        // menyimpan NULL (bukan string "[]") dan soal B1 tetap dipertahankan.
        comprehensionQuestions: lesson.comprehensionQuestions?.length
          ? lesson.comprehensionQuestions
          : null,
        // Kirim ulang pola kalimat agar mode edit tidak menghapusnya.
        grammarPatterns: lesson.grammarPatterns?.length ? lesson.grammarPatterns : null,
        // Pilihan topik + materi AI-nya dalam satu kolom.
        grammarTopics:
          cefrLevel === 'B1' && selectedTopicIds.length > 0
            ? { selected: selectedTopicIds, content: lesson.grammarTopics ?? [] }
            : null,
        // Soal latihan tata bahasa hasil AI, ikut disimpan agar tidak hilang.
        grammarQuestions:
          cefrLevel === 'B1' && selectedTopicIds.length > 0
            ? lesson.grammarQuestions ?? []
            : null,
      }

      const url = editId ? `/api/sessions/${id}` : '/api/sessions'
      const method = editId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        navigate('/view/' + id)
      } else {
        const errData = await res.json()
        throw new Error(errData.error || 'Failed to save')
      }
    } catch (err: any) {
      alert('Gagal menyimpan: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSpeakerPersonaChange = (speaker: string, personaId: TtsPersonaId) => {
    setSpeakerPersonas(prev => ({ ...prev, [speaker]: personaId }))
    const isMale = personaId.startsWith('male') || personaId.startsWith('männlich')
    setEditedDialogue(prev => prev.map(t => t.speaker === speaker ? {
      ...t,
      personaId,
      gender: isMale ? 'male' : 'female'
    } : t))
  }

  const handleStopAll = () => {
    cancelledRef.current = true
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    stopSpeech()
    const el = scenarioAudioRef.current
    if (el) {
      el.pause()
      el.ontimeupdate = null
    }
    setPlayingIndex(null)
    setIsPlayingAll(false)
  }

  /** Putar seluruh dialog dari satu file. Tidak ada loop per baris atau safetyTimer. */
  /**
   * Sintesis seluruh dialog jadi satu MP3 lewat POST /api/tts-scenario.
   *
   * Skenario di layar Generator belum tersimpan (belum punya id), jadi tidak
   * bisa memakai /api/sessions/:id/audio. Hasilnya disimpan sebagai blob URL
   * per versi dialog; mengubah teks akan membuang blob lama agar tidak
   * memutar audio basi.
   */
  const buildScenarioAudio = async (turns: DialogTurn[]): Promise<string> => {
    setAudioSynthesizing(true)
    setAudioPreloadReady(false)
    try {
      // Baris kosong dilewati, tapi indeks aslinya dicatat: server mengembalikan
      // timings sejajar `payload`, sedangkan UI memakai indeks `editedDialogue`.
      // Tanpa peta ini, satu baris kosong menggeser seluruh sorotan.
      const payload: Array<{ speaker: string; germanText: string; personaId: string }> = []
      const payloadToTurn: number[] = []
      turns.forEach((t, i) => {
        if (!t.germanText.trim()) return
        payloadToTurn.push(i)
        payload.push({
          speaker: t.speaker,
          germanText: t.germanText,
          personaId:
            t.personaId ||
            (t.gender === 'male' ? 'männlich-1' : t.gender === 'female' ? 'weiblich' : '') ||
            'weiblich',
        })
      })
      if (payload.length === 0) return ''

      const res = await fetch('/api/tts-scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turns: payload }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const raw = res.headers.get('x-tts-timings')
      const payloadTimings = raw
        ? raw.split(',').map((n) => Number(n)).filter((n) => Number.isFinite(n))
        : []
      // Sebar kembali ke ruang indeks dialog; baris kosong/gagal = -1.
      const aligned: number[] = turns.map(() => -1)
      payloadTimings.forEach((ms, i) => {
        const turnIdx = payloadToTurn[i]
        if (turnIdx !== undefined) aligned[turnIdx] = ms
      })
      scenarioTimingsRef.current = aligned

      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      setScenarioAudioUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return objectUrl
      })
      setAudioPreloadReady(true)
      return objectUrl
    } catch (err: any) {
      console.warn('[generator] sintesis skenario gagal:', err?.message || err)
      setAudioPreloadReady(false)
      return ''
    } finally {
      setAudioSynthesizing(false)
    }
  }

  const handlePlayAll = async () => {
    if (editedDialogue.length === 0) return
    if (isPlayingAll) {
      handleStopAll()
      return
    }
    let src = scenarioAudioUrl
    if (!src) {
      // Belum ada audio: sintesis dulu, lalu putar tanpa menuntut klik kedua.
      src = await buildScenarioAudio(editedDialogue)
      if (!src) return
    }
    stopSpeech()
    cancelledRef.current = false
    setIsPlayingAll(true)

    const el = scenarioAudioRef.current
    if (!el) return
    // State React belum tentu sudah ter-apply saat sintesis baru selesai,
    // jadi src dipasang langsung agar play() tidak memutar elemen kosong.
    if (el.src !== src) el.src = src

    el.onended = () => {
      setIsPlayingAll(false)
      setPlayingIndex(null)
    }
    el.onerror = () => {
      setIsPlayingAll(false)
      setPlayingIndex(null)
      setAudioPreloadReady(false)
    }
    // Sorot + posisikan kartu dari timings nyata (bukan proporsi panjang teks).
    let lastIdx = -1
    el.ontimeupdate = () => {
      const timings = scenarioTimingsRef.current
      if (cancelledRef.current || timings.length === 0) return
      const ms = el.currentTime * 1000
      // timings sejajar dialog; -1 = baris yang gagal disintesis.
      let idx = -1
      for (let i = 0; i < timings.length; i++) {
        const start = timings[i]
        if (start < 0) continue
        if (ms >= start) idx = i
        else break
      }
      if (idx < 0 || idx === lastIdx) return
      lastIdx = idx
      setPlayingIndex(idx)
      turnRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    el.currentTime = 0
    el.playbackRate = playbackRateRef.current
    try {
      await el.play()
    } catch (err: any) {
      console.warn('[generator audio] play gagal:', err?.message || err)
      setIsPlayingAll(false)
    }
  }

  /**
   * Buang audio hasil sintesis sebelumnya begitu dialog berubah.
   * Tanpa ini, "Putar Semua Dialog" akan memutar versi lama setelah diedit.
   */
  const invalidateScenarioAudio = () => {
    setAudioPreloadReady(false)
    scenarioTimingsRef.current = []
    setScenarioAudioUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev)
      return ''
    })
  }

  const updateTurn = (index: number, field: keyof DialogTurn, value: any) => {
    setEditedDialogue(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t))
    invalidateScenarioAudio()
  }

  const deleteTurn = (index: number) => {
    setEditedDialogue(prev => prev.filter((_, i) => i !== index))
    invalidateScenarioAudio()
  }

  const addTurn = () => {
    const letters = ['A', 'B', 'C', 'D', 'E', 'F']
    const lastTurn = editedDialogue[editedDialogue.length - 1]
    let nextIdx = 0
    if (lastTurn) {
      const match = lastTurn.speaker.match(/Sprecher ([A-F])/)
      if (match) {
        nextIdx = (letters.indexOf(match[1]) + 1) % speakerCount
      }
    }
    const nextSpeaker = `Sprecher ${letters[nextIdx]}`
    const personaId = speakerPersonas[nextSpeaker] || 'female-1'
    const isMale = personaId.startsWith('male')
    setEditedDialogue(prev => [...prev, {
      speaker: nextSpeaker,
      germanText: '',
      indonesianText: '',
      personaId,
      gender: isMale ? 'male' : 'female',
    }])
  }

  const updateVocab = (index: number, field: keyof VocabClue, value: string) => {
    setEditedVocab(prev => prev.map((v, i) => i === index ? { ...v, [field]: value } : v))
  }

  const deleteVocab = (index: number) => {
    setEditedVocab(prev => prev.filter((_, i) => i !== index))
  }

  const addVocab = () => {
    setEditedVocab(prev => [...prev, { germanWord: '', indonesianMeaning: '', grammarTip: '' }])
  }

  if (fetchingSession) {
    return (
      <div className="max-w-3xl mx-auto p-8 text-center mt-16">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-slate-500">Memuat skenario untuk diedit...</p>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-4 py-8 pb-24">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(isEditMode ? '/view/' + editId : '/')}
          className="p-2 hover:bg-slate-100 rounded-md transition-colors"
          aria-label="Kembali"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-display font-bold text-text tracking-tight">
            {isEditMode ? 'Edit Skenario Pembelajaran' : 'Buat Skenario Pembelajaran'}
          </h1>
          {isEditMode && (
            <span className="text-label bg-amber-50 text-amber-800 font-semibold px-2.5 py-0.5 rounded-sm border border-amber-200">
              Mode Edit
            </span>
          )}
        </div>
      </div>

      <Card className="p-5 sm:p-6 flex flex-col gap-4 mb-6 shadow-xs border-border">
        <div>
          <label className="block text-label font-bold text-text mb-1.5">
            Prompt Skenario
          </label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={3}
            placeholder="Contoh: Di sebuah kafe di Berlin, Andi memesan kopi dan strudel..."
            className="w-full p-3 border border-border rounded-md text-base bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none leading-relaxed"
          />
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <label className="block text-label font-bold text-text mb-1.5">Level CEFR</label>
            <select
              value={cefrLevel}
              onChange={e => setCefrLevel(e.target.value)}
              className="w-full p-2 border border-border rounded-md text-base bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="A1">A1 - Pemula</option>
              <option value="A2">A2 - Dasar</option>
              <option value="B1">B1 - Menengah</option>
            </select>
          </div>
          {cefrLevel === 'B1' && (
            <GrammarTopicPicker selected={selectedTopicIds} onChange={setSelectedTopicIds} />
          )}
          <div className="flex-1">
            <label className="block text-label font-bold text-text mb-1.5">
              Jumlah Dialog
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={dialogueCount}
              onChange={e => {
                const parsed = parseInt(e.target.value, 10)
                if (Number.isNaN(parsed)) return
                setDialogueCount(Math.min(20, Math.max(1, parsed)))
              }}
              className="w-full p-2 border border-border rounded-md text-base bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <p className="text-label text-text-muted mt-1">1 - 20 baris</p>
          </div>
          <div className="flex-1">
            <label className="block text-label font-bold text-text mb-1.5">
              Jumlah Karakter
            </label>
            <select
              value={speakerCount}
              onChange={e => setSpeakerCount(parseInt(e.target.value, 10))}
              className="w-full p-2 border border-border rounded-md text-base bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              {[2, 3].map(n => (
                <option key={n} value={n}>{n} Orang</option>
              ))}
            </select>
            <p className="text-label text-text-muted mt-1">2 atau 3 pembicara (1 Wanita + 2 Pria)</p>
          </div>
          <div className="text-body-sm text-text-muted mt-4">
            <span className="font-bold text-primary">{selectedWords.length}</span> kata Bank
          </div>
        </div>

        {error && (
          <div role="alert" aria-live="assertive" className="text-danger text-body-sm bg-danger/10 border border-danger/30 p-3 rounded-md">
            {error}
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="flex items-center justify-center gap-2 py-2.5"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
              Menghasilkan dialog dengan AI...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <Sparkles size={16} />
              {lesson ? 'Generate Ulang' : 'Generate dengan AI'}
            </span>
          )}
        </Button>
      </Card>

      {lesson && (
        <div className="space-y-6">
          <Card className="p-5 sm:p-6 shadow-xs border-border">
            <h2 className="text-heading font-bold text-text mb-3">Judul & Latar</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-label font-bold text-text mb-1">Judul Pelajaran</label>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={e => setEditedTitle(e.target.value)}
                  className="w-full p-2.5 border border-border rounded-md text-base font-semibold bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-label font-bold text-text mb-1">Deskripsi Latar</label>
                <textarea
                  value={editedSceneDesc}
                  onChange={e => setEditedSceneDesc(e.target.value)}
                  rows={2}
                  className="w-full p-2.5 border border-border rounded-md text-base bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary resize-none leading-relaxed"
                />
              </div>
            </div>
          </Card>

          <Card className="p-5 sm:p-6 shadow-xs border-border">
            <audio
              ref={scenarioAudioRef}
              src={scenarioAudioUrl || undefined}
              preload="auto"
              className="hidden"
            />
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-heading font-bold text-text">Dialog</h2>
                <span className="text-label text-text-muted">({editedDialogue.length} baris)</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Speed selector pills */}
                <div className="flex items-center bg-surface-muted p-0.5 rounded-md text-label border border-border" title="Kecepatan Audio">
                  {[1.0, 0.8, 0.75, 0.5].map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => {
                        setPlaybackRate(speed)
                        playbackRateRef.current = speed
                      }}
                      className={`px-2 py-1 rounded-sm font-semibold text-xs transition-colors cursor-pointer ${
                        playbackRate === speed
                          ? 'bg-surface text-primary shadow-xs font-bold'
                          : 'text-text-muted hover:text-text'
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
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-danger text-on-primary text-xs font-semibold hover:opacity-95 transition-opacity shadow-xs cursor-pointer"
                  >
                    <Square size={13} className="fill-white" />
                    <span>Hentikan Audio</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handlePlayAll}
                    disabled={editedDialogue.length === 0 || audioSynthesizing}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-semibold shadow-xs transition-all ${
                      audioPreloadReady
                        ? 'bg-primary text-on-primary hover:opacity-95 cursor-pointer'
                        : 'bg-surface-muted text-text-muted border border-border cursor-not-allowed opacity-75'
                    }`}
                    title={
                      audioSynthesizing
                        ? 'Menyintesis seluruh dialog jadi satu audio...'
                        : audioPreloadReady
                          ? 'Putar Semua Dialog'
                          : 'Klik untuk menyintesis audio dialog'
                    }
                  >
                    {audioSynthesizing ? (
                      <>
                        <Loader2 size={13} className="animate-spin text-primary shrink-0" />
                        <span>Menyiapkan Audio...</span>
                      </>
                    ) : audioPreloadReady ? (
                      <>
                        <Play size={13} className="fill-white" />
                        <span>Putar Semua Dialog</span>
                      </>
                    ) : (
                      <>
                        <Loader2 size={13} className="shrink-0" />
                        <span>Buat Audio Dialog</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-2 p-3 bg-surface-muted rounded-md border border-border mb-4">
              <span className="text-label font-bold text-text">Konfigurasi Persona Karakter ({speakerCount} Orang):</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                {['A', 'B', 'C'].slice(0, speakerCount).map(letter => {
                  const speaker = `Sprecher ${letter}`
                  const currentPersona = speakerPersonas[speaker] || (letter === 'A' ? 'weiblich' : letter === 'B' ? 'männlich-1' : 'männlich-2')
                  return (
                    <div key={speaker} className="flex items-center justify-between gap-1.5 bg-surface p-2 rounded-md border border-border">
                      <span className="font-semibold text-text shrink-0">{speaker}:</span>
                      <select
                        value={currentPersona}
                        onChange={e => handleSpeakerPersonaChange(speaker, e.target.value as TtsPersonaId)}
                        className="p-1 border border-border rounded-md text-base bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary max-w-[150px] truncate cursor-pointer"
                      >
                        {SCENARIO_PERSONAS.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.emoji} {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="space-y-3">
              {editedDialogue.map((turn, i) => (
                <div
                  key={i}
                  ref={(el) => (turnRefs.current[i] = el)}
                  className={`flex gap-3 items-start p-3 bg-surface rounded-md border transition-colors scroll-mt-24 ${
                    playingIndex === i ? 'ring-2 ring-primary border-primary shadow-xs' : 'border-border'
                  }`}
                >
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <select
                        value={turn.speaker}
                        onChange={e => {
                          const newSpeaker = e.target.value
                          const targetPersona = speakerPersonas[newSpeaker] || 'weiblich'
                          updateTurn(i, 'speaker', newSpeaker)
                          updateTurn(i, 'personaId', targetPersona)
                          updateTurn(i, 'gender', (targetPersona.startsWith('male') || targetPersona.startsWith('männlich')) ? 'male' : 'female')
                        }}
                        className="w-32 p-1.5 border border-border rounded-md text-base bg-surface text-text focus:ring-1 focus:ring-primary focus:outline-none font-semibold cursor-pointer"
                      >
                        {['A', 'B', 'C'].slice(0, speakerCount).map(l => (
                          <option key={l} value={`Sprecher ${l}`}>Sprecher {l}</option>
                        ))}
                      </select>
                      <select
                        value={turn.personaId || speakerPersonas[turn.speaker] || 'weiblich'}
                        onChange={e => {
                          const pId = e.target.value as TtsPersonaId
                          updateTurn(i, 'personaId', pId)
                          updateTurn(i, 'gender', (pId.startsWith('male') || pId.startsWith('männlich')) ? 'male' : 'female')
                        }}
                        className="p-1.5 border border-border rounded-md text-base bg-surface text-text focus:ring-1 focus:ring-primary focus:outline-none cursor-pointer"
                      >
                        {SCENARIO_PERSONAS.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.emoji} {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="text"
                      lang="de"
                      value={turn.germanText}
                      onChange={e => updateTurn(i, 'germanText', e.target.value)}
                      placeholder="Teks Jerman..."
                      className="w-full p-2 border border-border rounded-md text-base font-semibold bg-surface text-text focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="text"
                      value={turn.indonesianText}
                      onChange={e => updateTurn(i, 'indonesianText', e.target.value)}
                      placeholder="Terjemahan Indonesia..."
                      className="w-full p-2 border border-border rounded-md text-base text-text-muted bg-surface focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="flex flex-col gap-1 pt-8">
                    <button
                      type="button"
                      onClick={() => {
                        if (isPlayingAll) handleStopAll()
                        setPlayingIndex(i)
                        const pId = turn.personaId || speakerPersonas[turn.speaker] || 'weiblich'
                        const persona = getTtsPersona(pId)
                        const g = persona ? persona.gender : (pId.includes('male') || pId.includes('männlich') ? 'male' : 'female')
                        speakGerman(turn.germanText, {
                          personaId: pId,
                          gender: g,
                          rate: playbackRateRef.current,
                          onEnd: () => setPlayingIndex(null),
                        })
                      }}
                      disabled={!turn.germanText}
                      title="Putar baris ini"
                      className={`p-1.5 text-text-muted hover:text-primary disabled:opacity-30 transition-colors ${
                        !audioPreloadReady ? 'cursor-not-allowed' : 'cursor-pointer'
                      } ${
                        playingIndex === i ? 'text-primary' : ''
                      }`}
                    >
                      <Volume2 size={16} className={playingIndex === i ? 'animate-pulse text-primary' : ''} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (playingIndex === i && isPlayingAll) handleStopAll()
                        deleteTurn(i)
                      }}
                      title="Hapus baris"
                      className="p-1.5 text-text-muted hover:text-danger transition-colors cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addTurn}
              className="mt-3 w-full py-2.5 border border-dashed border-border rounded-md text-text-muted hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer"
            >
              <Plus size={16} /> Tambah Baris Dialog
            </button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-slate-400">Vocab Clues</h2>
              <span className="text-xs text-slate-400">{editedVocab.length} kata</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {editedVocab.map((clue, i) => (
                <div key={i} className="p-3 bg-blue-50 border border-blue-100 rounded-lg relative group">
                  <button
                    onClick={() => deleteVocab(i)}
                    title="Hapus vocab"
                    className="absolute top-2 right-2 p-1 text-blue-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                  <input
                    type="text"
                    lang="de"
                    value={clue.germanWord}
                    onChange={e => updateVocab(i, 'germanWord', e.target.value)}
                    placeholder="Kata Jerman..."
                    className="w-full bg-transparent font-bold text-text text-base mb-1 focus:outline-none border-b border-border pb-0.5"
                  />
                  <input
                    type="text"
                    value={clue.indonesianMeaning}
                    onChange={e => updateVocab(i, 'indonesianMeaning', e.target.value)}
                    placeholder="Arti Indonesia..."
                    className="w-full bg-transparent text-text-muted text-base mb-1 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={clue.grammarTip}
                    onChange={e => updateVocab(i, 'grammarTip', e.target.value)}
                    placeholder="Tips grammar..."
                    className="w-full bg-transparent text-primary text-body-sm italic focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={addVocab}
              className="mt-3 w-full py-2.5 border border-dashed border-border rounded-md text-text-muted hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2 text-sm font-semibold cursor-pointer"
            >
              <Plus size={16} /> Tambah Vocab Clue
            </button>
          </Card>

          <div className="flex gap-3">
            <Button
              onClick={() => {
                handleStopAll()
                setLesson(null)
                setError('')
              }}
              className="bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || editedDialogue.length === 0 || !editedTitle.trim()}
              className="flex-1 flex items-center justify-center gap-2"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                  Menyimpan...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save size={16} />
                  {isEditMode ? 'Simpan Perubahan' : 'Simpan & Publikasikan'}
                </span>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
