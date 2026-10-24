import { useState } from 'react'
import { Card } from '../components/ui/card'
import { Play, Square, ArrowLeft, Volume2, Sparkles, Loader2, Sliders } from 'lucide-react'
import * as tts from '@diffusionstudio/vits-web'

interface CandidateOption {
  id: string
  name: string
  gender: 'female' | 'male'
  model: tts.VoiceId
  initialDetune: number
  initialRate: number
  role: string
  note: string
}

const CANDIDATES: CandidateOption[] = [
  {
    id: 'male-1-candidate',
    name: 'Kandidat Pria A: Conrad (Bariton Tenang)',
    gender: 'male',
    model: 'de_DE-thorsten-medium',
    initialDetune: -90,
    initialRate: 0.96,
    role: 'Pria Dewasa / Narator',
    note: 'Kontras natural dengan Killian (male-2 yang lebih tinggi +160 cents). Tidak terlalu berat agar tidak muffled.',
  },
  {
    id: 'male-3-candidate',
    name: 'Kandidat Pria B: Florian (Thorsten Asli)',
    gender: 'male',
    model: 'de_DE-thorsten-medium',
    initialDetune: 0,
    initialRate: 1.0,
    role: 'Pria Natural (Pitch 0)',
    note: 'Suara asli Thorsten tanpa pitch shifting. Sangat jernih dan netral.',
  },
  {
    id: 'female-1-candidate',
    name: 'Kandidat Wanita: Katja (Natural Standar)',
    gender: 'female',
    model: 'de_DE-kerstin-low',
    initialDetune: 0,
    initialRate: 0.98,
    role: 'Wanita Dewasa / Guru',
    note: 'Suara asli Kerstin tanpa manipulasi pitch. Komplementer dengan Amala (female-2 yang ceria +180 cents).',
  },
]

const SAMPLE_SENTENCES = [
  'Guten Tag! Wie geht es Ihnen heute?',
  'Ich möchte einen Kaffee und ein Croissant bestellen, bitte.',
  'Entschuldigung, wo ist hier der nächste Bahnhof?',
  'Das ist eine hervorragende Idee für unser Deutsch-Projekt!',
]

// Audio context singleton
let audioCtx: AudioContext | null = null
let currentSource: AudioBufferSourceNode | null = null
const wavCache = new Map<string, ArrayBuffer>()

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    audioCtx = new AudioContextClass()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

function stopAudio() {
  if (currentSource) {
    try {
      currentSource.stop()
    } catch {}
    currentSource.disconnect()
    currentSource = null
  }
}

export default function AudioPrototypePage({ navigate }: { navigate: (path: string) => void }) {
  const [selectedText, setSelectedText] = useState(SAMPLE_SENTENCES[0])
  const [customText, setCustomText] = useState('')
  const [playingKey, setPlayingKey] = useState<string | null>(null)
  const [loadingKey, setLoadingKey] = useState<string | null>(null)

  // Live tuning state per candidate
  const [tuning, setTuning] = useState<Record<string, { detune: number; rate: number }>>({
    'male-1-candidate': { detune: -90, rate: 0.96 },
    'male-3-candidate': { detune: 0, rate: 1.0 },
    'female-1-candidate': { detune: 0, rate: 0.98 },
  })

  const activeText = customText.trim() ? customText.trim() : selectedText

  const playSynthesized = async (
    key: string,
    modelId: tts.VoiceId,
    detuneCents: number,
    playbackRate: number
  ) => {
    if (playingKey === key) {
      stopAudio()
      setPlayingKey(null)
      setLoadingKey(null)
      return
    }

    stopAudio()
    setPlayingKey(key)
    setLoadingKey(key)

    try {
      const cacheKey = `${modelId}:${activeText.trim()}`
      let rawWav = wavCache.get(cacheKey)

      if (!rawWav) {
        const blob = await tts.predict({
          text: activeText.trim(),
          voiceId: modelId,
        })
        rawWav = await blob.arrayBuffer()
        wavCache.set(cacheKey, rawWav)
      }

      setLoadingKey(null)

      const ctx = getAudioContext()
      const audioBuffer = await ctx.decodeAudioData(rawWav.slice(0))

      const source = ctx.createBufferSource()
      source.buffer = audioBuffer
      source.playbackRate.value = playbackRate
      if (source.detune) {
        source.detune.value = detuneCents
      }

      source.connect(ctx.destination)
      currentSource = source

      source.onended = () => {
        if (currentSource === source) {
          currentSource = null
          setPlayingKey(null)
        }
      }

      source.start(0)
    } catch (err) {
      console.error(err)
      alert('Gagal mensintesis audio. Pastikan koneksi/browser mendukung WASM.')
      setLoadingKey(null)
      setPlayingKey(null)
    }
  }

  const updateTuning = (id: string, field: 'detune' | 'rate', val: number) => {
    setTuning((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: val,
      },
    }))
  }

  return (
    <div className="min-h-dvh bg-neutral p-4 sm:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between bg-surface border border-border p-4 sm:p-6 rounded-lg shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/grundlagen')}
              className="p-2 rounded-md hover:bg-surface-muted transition-colors text-text-muted hover:text-text cursor-pointer"
              title="Kembali ke Grundlagen"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-heading font-bold text-text flex items-center gap-2">
                <Sparkles size={20} className="text-primary" />
                Live Tuning Studio: Memilih Persona Ke-3
              </h1>
              <p className="text-body-sm text-text-muted mt-0.5">
                <strong>Amala (female-2)</strong> & <strong>Killian (male-2)</strong> sudah APPROVED ✅. Sekarang mari tuning persona ke-3!
              </p>
            </div>
          </div>
          {playingKey && (
            <button
              type="button"
              onClick={() => {
                stopAudio()
                setPlayingKey(null)
              }}
              className="px-3 py-1.5 rounded-md bg-danger text-on-danger text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Square size={14} className="fill-white" /> Stop
            </button>
          )}
        </div>

        {/* Status Persona yang sudah disetujui */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-green-600 text-white font-bold px-2 py-0.5 rounded-full">APPROVED</span>
                <span className="font-extrabold text-text">Amala (female-2)</span>
              </div>
              <p className="text-xs text-text-muted mt-1">Pitch +180 cents | Speed 1.04x | Ceria</p>
            </div>
            <button
              type="button"
              onClick={() => playSynthesized('approved-female-2', 'de_DE-kerstin-low', 180, 1.04)}
              className="p-2 rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors cursor-pointer"
              title="Dengarkan Amala"
            >
              {playingKey === 'approved-female-2' ? <Square size={16} className="fill-white" /> : <Play size={16} />}
            </button>
          </div>

          <div className="p-3.5 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-green-600 text-white font-bold px-2 py-0.5 rounded-full">APPROVED</span>
                <span className="font-extrabold text-text">Killian (male-2)</span>
              </div>
              <p className="text-xs text-text-muted mt-1">Pitch +160 cents | Speed 1.05x | Energik</p>
            </div>
            <button
              type="button"
              onClick={() => playSynthesized('approved-male-2', 'de_DE-thorsten-medium', 160, 1.05)}
              className="p-2 rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors cursor-pointer"
              title="Dengarkan Killian"
            >
              {playingKey === 'approved-male-2' ? <Square size={16} className="fill-white" /> : <Play size={16} />}
            </button>
          </div>
        </div>

        {/* Input Teks Kalimat */}
        <Card className="p-5 border border-border space-y-4">
          <h2 className="text-sm font-bold text-text flex items-center gap-2">
            <Volume2 size={16} className="text-primary" />
            Pilih atau Tulis Kalimat Uji:
          </h2>
          <div className="flex flex-wrap gap-2">
            {SAMPLE_SENTENCES.map((s, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedText(s)
                  setCustomText('')
                }}
                className={`text-xs px-3 py-1.5 rounded-md border text-left transition-colors cursor-pointer ${
                  selectedText === s && !customText.trim()
                    ? 'bg-primary text-on-primary border-primary font-semibold'
                    : 'bg-surface text-text-muted border-border hover:bg-surface-muted'
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <input
            type="text"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            placeholder="Atau ketik teks Jerman sendiri..."
            className="w-full text-base px-3 py-2 rounded-md border border-border bg-surface text-text focus:outline-none focus:border-primary"
          />
        </Card>

        {/* Daftar Kandidat dengan Live Slider Tuning */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-text flex items-center gap-2">
            <Sliders size={16} className="text-primary" />
            Opsi Kandidat Persona Ke-3 (Geser Slider untuk Live Tuning):
          </h2>

          {CANDIDATES.map((cand) => {
            const currentTuning = tuning[cand.id] || { detune: cand.initialDetune, rate: cand.initialRate }
            const isPlaying = playingKey === cand.id
            const isBusy = loadingKey === cand.id

            return (
              <Card key={cand.id} className={`p-5 border space-y-4 transition-all ${isPlaying ? 'border-primary shadow-sm bg-primary/5' : 'border-border'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-extrabold text-text">{cand.name}</h3>
                    <p className="text-xs font-semibold text-primary mt-0.5">{cand.role}</p>
                    <p className="text-xs text-text-muted mt-1">{cand.note}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => playSynthesized(cand.id, cand.model, currentTuning.detune, currentTuning.rate)}
                    disabled={loadingKey !== null && !isPlaying}
                    className={`shrink-0 px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all cursor-pointer ${
                      isPlaying
                        ? 'bg-danger text-on-danger hover:bg-danger/90'
                        : isBusy
                        ? 'bg-primary/20 text-primary'
                        : 'bg-primary text-on-primary hover:bg-primary-hover shadow-xs'
                    } disabled:opacity-50`}
                  >
                    {isBusy ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : isPlaying ? (
                      <Square size={16} className="fill-white" />
                    ) : (
                      <Play size={16} />
                    )}
                    <span>{isPlaying ? 'Stop' : 'Dengarkan'}</span>
                  </button>
                </div>

                {/* Slider Detune & Speed */}
                <div className="p-4 bg-neutral rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Detune Cents */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-text">Pitch / Detune:</span>
                      <strong className="text-primary">{currentTuning.detune > 0 ? `+${currentTuning.detune}` : currentTuning.detune} cents</strong>
                    </div>
                    <input
                      type="range"
                      min="-250"
                      max="250"
                      step="10"
                      value={currentTuning.detune}
                      onChange={(e) => updateTuning(cand.id, 'detune', parseInt(e.target.value))}
                      className="w-full accent-primary cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-text-muted">
                      <span>-250 (Lebih berat/ngebass)</span>
                      <span>0 (Asli)</span>
                      <span>+250 (Lebih tinggi)</span>
                    </div>
                  </div>

                  {/* Playback Rate */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-text">Kecepatan (Rate):</span>
                      <strong className="text-primary">{currentTuning.rate.toFixed(2)}x</strong>
                    </div>
                    <input
                      type="range"
                      min="0.80"
                      max="1.20"
                      step="0.02"
                      value={currentTuning.rate}
                      onChange={(e) => updateTuning(cand.id, 'rate', parseFloat(e.target.value))}
                      className="w-full accent-primary cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-text-muted">
                      <span>0.80x (Lambat)</span>
                      <span>1.00x (Normal)</span>
                      <span>1.20x (Cepat)</span>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
