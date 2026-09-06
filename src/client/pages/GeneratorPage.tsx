import React, { useState, useEffect } from 'react'
import { Button } from '../components/ui/button'
import { Card } from '../components/ui/card'
import { Trash2, Plus, Volume2, ChevronLeft, Save, Sparkles, Play, Square } from 'lucide-react'
import { speakGerman, stopSpeech } from '../lib/audio'
import { nanoid } from 'nanoid'
import { getAuthHeaders } from '../lib/auth'

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

interface GeneratedLesson {
  title: string
  sceneDescription: string
  dialogue: DialogTurn[]
  vocabClues: VocabClue[]
}

export default function GeneratorPage({ editId, navigate }: { editId?: string; navigate: (path: string) => void }) {
  const isEditMode = Boolean(editId)
  const [fetchingSession, setFetchingSession] = useState(false)
  const [prompt, setPrompt] = useState('Di sebuah kafe di Berlin, memesan kopi dan kue.')
  const [cefrLevel, setCefrLevel] = useState('A1')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [lesson, setLesson] = useState<GeneratedLesson | null>(null)
  const [editedDialogue, setEditedDialogue] = useState<DialogTurn[]>([])
  const [editedVocab, setEditedVocab] = useState<VocabClue[]>([])
  const [editedTitle, setEditedTitle] = useState('')
  const [editedSceneDesc, setEditedSceneDesc] = useState('')
  const [speakerAGender, setSpeakerAGender] = useState<'female' | 'male'>('female')
  const [speakerBGender, setSpeakerBGender] = useState<'female' | 'male'>('male')
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
        setEditedDialogue(parsedDialogue)
        setEditedVocab(parsedVocab)
        setLesson({
          title: data.title,
          sceneDescription: data.sceneDescription || '',
          dialogue: parsedDialogue,
          vocabClues: parsedVocab,
        })

        const turnA = parsedDialogue.find(t => t.speaker === 'Sprecher A')
        if (turnA?.gender) setSpeakerAGender(turnA.gender)
        const turnB = parsedDialogue.find(t => t.speaker === 'Sprecher B')
        if (turnB?.gender) setSpeakerBGender(turnB.gender)
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
        body: JSON.stringify({ prompt, cefrLevel, wordIds: selectedWords })
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const generated: GeneratedLesson = data.lesson
      setLesson(generated)
      const turnsWithGender = generated.dialogue.map(t => ({
        ...t,
        gender: t.speaker === 'Sprecher A' ? speakerAGender : speakerBGender
      }))
      setEditedDialogue(turnsWithGender)
      setEditedVocab([...generated.vocabClues])
      setEditedTitle(generated.title)
      setEditedSceneDesc(generated.sceneDescription)
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
        dialogueJson: editedDialogue,
        vocabCluesJson: editedVocab,
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

  const handleSpeakerAGenderChange = (gender: 'female' | 'male') => {
    setSpeakerAGender(gender)
    setEditedDialogue(prev => prev.map(t => t.speaker === 'Sprecher A' ? { ...t, gender } : t))
  }

  const handleSpeakerBGenderChange = (gender: 'female' | 'male') => {
    setSpeakerBGender(gender)
    setEditedDialogue(prev => prev.map(t => t.speaker === 'Sprecher B' ? { ...t, gender } : t))
  }

  const handleStopAll = () => {
    cancelledRef.current = true
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    stopSpeech()
    setPlayingIndex(null)
    setIsPlayingAll(false)
  }

  const handlePlayAll = async () => {
    if (editedDialogue.length === 0) return
    if (isPlayingAll) {
      handleStopAll()
      return
    }
    stopSpeech()
    cancelledRef.current = false
    setIsPlayingAll(true)

    for (let i = 0; i < editedDialogue.length; i++) {
      if (cancelledRef.current) break
      const turn = editedDialogue[i]
      if (!turn.germanText.trim()) continue
      const turnGender: 'male' | 'female' = turn.gender || (turn.speaker === 'Sprecher A' ? speakerAGender : speakerBGender)

      setPlayingIndex(i)

      await new Promise<void>((resolve) => {
        let finished = false
        const done = () => {
          if (!finished) {
            finished = true
            if (!cancelledRef.current) {
              timeoutRef.current = setTimeout(resolve, 650)
            } else {
              resolve()
            }
          }
        }
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

  const updateTurn = (index: number, field: keyof DialogTurn, value: any) => {
    setEditedDialogue(prev => prev.map((t, i) => i === index ? { ...t, [field]: value } : t))
  }

  const deleteTurn = (index: number) => {
    setEditedDialogue(prev => prev.filter((_, i) => i !== index))
  }

  const addTurn = () => {
    const lastTurn = editedDialogue[editedDialogue.length - 1]
    const nextSpeaker = lastTurn?.speaker === 'Sprecher A' ? 'Sprecher B' : 'Sprecher A'
    const nextGender = nextSpeaker === 'Sprecher A' ? speakerAGender : speakerBGender
    setEditedDialogue(prev => [...prev, { speaker: nextSpeaker, germanText: '', indonesianText: '', gender: nextGender }])
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
          className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          aria-label="Kembali"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-800">
            {isEditMode ? 'Edit Skenario Pembelajaran' : 'Buat Skenario Pembelajaran'}
          </h1>
          {isEditMode && (
            <span className="text-xs bg-amber-100 text-amber-800 font-semibold px-2.5 py-0.5 rounded-full border border-amber-200">
              Mode Edit
            </span>
          )}
        </div>
      </div>

      <Card className="p-6 flex flex-col gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Prompt Skenario
          </label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            rows={3}
            placeholder="Contoh: Di sebuah kafe di Berlin, Andi memesan kopi dan strudel..."
            className="w-full p-3 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-slate-700 mb-1">Level CEFR</label>
            <select
              value={cefrLevel}
              onChange={e => setCefrLevel(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="A1">A1 - Pemula</option>
              <option value="A2">A2 - Dasar</option>
              <option value="B1">B1 - Menengah</option>
            </select>
          </div>
          <div className="text-sm text-slate-500 mt-5">
            <span className="font-medium text-blue-600">{selectedWords.length}</span> kata dari Bank Kata
          </div>
        </div>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 border border-red-200 p-3 rounded-lg">
            {error}
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={loading || !prompt.trim()}
          className="flex items-center justify-center gap-2"
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
          <Card className="p-6">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Judul & Latar</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Judul Pelajaran</label>
                <input
                  type="text"
                  value={editedTitle}
                  onChange={e => setEditedTitle(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Deskripsi Latar</label>
                <textarea
                  value={editedSceneDesc}
                  onChange={e => setEditedSceneDesc(e.target.value)}
                  rows={2}
                  className="w-full p-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Dialog</h2>
                <span className="text-xs text-slate-400">({editedDialogue.length} baris)</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Speed selector pills */}
                <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg text-xs" title="Kecepatan Audio">
                  {[1.0, 0.8, 0.75, 0.5].map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => {
                        setPlaybackRate(speed)
                        playbackRateRef.current = speed
                      }}
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
                    disabled={editedDialogue.length === 0}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-xs hover:shadow cursor-pointer disabled:opacity-50"
                  >
                    <Play size={13} className="fill-white" />
                    <span>Putar Semua Dialog</span>
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 p-3 bg-blue-50/60 rounded-xl border border-blue-100 mb-4 items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Suara Sprecher A:</span>
                <div className="flex gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => handleSpeakerAGenderChange('female')}
                    className={`px-2 py-1 rounded font-medium transition-all ${speakerAGender === 'female' ? 'bg-rose-100 text-rose-700' : 'text-slate-500'}`}
                  >
                    👩 Wanita
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSpeakerAGenderChange('male')}
                    className={`px-2 py-1 rounded font-medium transition-all ${speakerAGender === 'male' ? 'bg-sky-100 text-sky-700' : 'text-slate-500'}`}
                  >
                    👨 Pria
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Suara Sprecher B:</span>
                <div className="flex gap-1 bg-white p-0.5 rounded-lg border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => handleSpeakerBGenderChange('female')}
                    className={`px-2 py-1 rounded font-medium transition-all ${speakerBGender === 'female' ? 'bg-rose-100 text-rose-700' : 'text-slate-500'}`}
                  >
                    👩 Wanita
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSpeakerBGenderChange('male')}
                    className={`px-2 py-1 rounded font-medium transition-all ${speakerBGender === 'male' ? 'bg-sky-100 text-sky-700' : 'text-slate-500'}`}
                  >
                    👨 Pria
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {editedDialogue.map((turn, i) => (
                <div
                  key={i}
                  className={`flex gap-3 items-start p-3 bg-slate-50 rounded-xl border border-slate-200 transition-all ${
                    playingIndex === i ? 'ring-2 ring-blue-400 ring-offset-2 shadow-md' : ''
                  }`}
                >
                  <div className="flex flex-col gap-2 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <select
                        value={turn.speaker}
                        onChange={e => {
                          const newSpeaker = e.target.value
                          updateTurn(i, 'speaker', newSpeaker)
                          updateTurn(i, 'gender', newSpeaker === 'Sprecher A' ? speakerAGender : speakerBGender)
                        }}
                        className="w-32 p-1.5 border border-slate-300 rounded text-xs bg-white focus:ring-1 focus:ring-blue-400 focus:outline-none font-medium"
                      >
                        <option value="Sprecher A">Sprecher A</option>
                        <option value="Sprecher B">Sprecher B</option>
                      </select>
                      <select
                        value={turn.gender || (turn.speaker === 'Sprecher A' ? speakerAGender : speakerBGender)}
                        onChange={e => updateTurn(i, 'gender', e.target.value)}
                        className="p-1.5 border border-slate-300 rounded text-xs bg-white focus:ring-1 focus:ring-blue-400 focus:outline-none"
                      >
                        <option value="female">👩 Wanita</option>
                        <option value="male">👨 Pria</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      value={turn.germanText}
                      onChange={e => updateTurn(i, 'germanText', e.target.value)}
                      placeholder="Teks Jerman..."
                      className="w-full p-2 border border-slate-300 rounded text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                    <input
                      type="text"
                      value={turn.indonesianText}
                      onChange={e => updateTurn(i, 'indonesianText', e.target.value)}
                      placeholder="Terjemahan Indonesia..."
                      className="w-full p-2 border border-slate-200 rounded text-sm text-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </div>
                  <div className="flex flex-col gap-1 pt-8">
                    <button
                      type="button"
                      onClick={() => {
                        if (isPlayingAll) handleStopAll()
                        setPlayingIndex(i)
                        speakGerman(turn.germanText, {
                          gender: turn.gender || (turn.speaker === 'Sprecher A' ? speakerAGender : speakerBGender),
                          rate: playbackRateRef.current,
                          onEnd: () => setPlayingIndex(null),
                        })
                      }}
                      disabled={!turn.germanText}
                      title="Putar audio"
                      className={`p-1.5 text-slate-400 hover:text-blue-500 disabled:opacity-30 transition-colors ${
                        playingIndex === i ? 'text-blue-600' : ''
                      }`}
                    >
                      <Volume2 size={16} className={playingIndex === i ? 'animate-pulse text-blue-600' : ''} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (playingIndex === i && isPlayingAll) handleStopAll()
                        deleteTurn(i)
                      }}
                      title="Hapus baris"
                      className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addTurn}
              className="mt-3 w-full py-2 border-2 border-dashed border-slate-300 rounded-xl text-slate-400 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <Plus size={16} /> Tambah Baris Dialog
            </button>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vocab Clues</h2>
              <span className="text-xs text-slate-400">{editedVocab.length} kata</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {editedVocab.map((clue, i) => (
                <div key={i} className="p-3 bg-blue-50 border border-blue-100 rounded-xl relative group">
                  <button
                    onClick={() => deleteVocab(i)}
                    title="Hapus vocab"
                    className="absolute top-2 right-2 p-1 text-blue-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                  <input
                    type="text"
                    value={clue.germanWord}
                    onChange={e => updateVocab(i, 'germanWord', e.target.value)}
                    placeholder="Kata Jerman..."
                    className="w-full bg-transparent font-bold text-blue-900 text-sm mb-1 focus:outline-none border-b border-blue-200 pb-0.5"
                  />
                  <input
                    type="text"
                    value={clue.indonesianMeaning}
                    onChange={e => updateVocab(i, 'indonesianMeaning', e.target.value)}
                    placeholder="Arti Indonesia..."
                    className="w-full bg-transparent text-blue-800 text-xs mb-1 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={clue.grammarTip}
                    onChange={e => updateVocab(i, 'grammarTip', e.target.value)}
                    placeholder="Tips grammar..."
                    className="w-full bg-transparent text-blue-600 text-xs italic focus:outline-none"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={addVocab}
              className="mt-3 w-full py-2 border-2 border-dashed border-blue-200 rounded-xl text-blue-400 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2 text-sm"
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
