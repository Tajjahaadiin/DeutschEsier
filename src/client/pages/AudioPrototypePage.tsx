import { useState } from 'react'
import { Card } from '../components/ui/card'
import { Play, Square, ArrowLeft, Volume2, Sparkles, Loader2 } from 'lucide-react'
import { synthesizeAndPlayWasm, stopWasmAudio, PERSONA_WASM_MAP } from '../lib/vitsEngine'

interface PersonaItem {
  id: string
  name: string
  gender: 'female' | 'male'
  role: string
  description: string
  model: string
  detune: number
  rate: number
}

const ALL_PERSONAS: PersonaItem[] = [
  // WANITA
  {
    id: 'female-1',
    name: 'Katja',
    gender: 'female',
    role: 'Naratris & Guru Utama',
    description: 'Suara wanita natural Jerman, artikulasi jelas, pitch standar (0 semitone).',
    model: 'de_DE-kerstin-low',
    detune: PERSONA_WASM_MAP['female-1'].detuneCents,
    rate: PERSONA_WASM_MAP['female-1'].playbackRate,
  },
  {
    id: 'female-2',
    name: 'Amala',
    gender: 'female',
    role: 'Karakter Muda / Ceria',
    description: 'Suara wanita lebih tinggi (+180 cents) dan energik, cocok untuk peran mahasiswi / rekan kasual.',
    model: 'de_DE-kerstin-low',
    detune: PERSONA_WASM_MAP['female-2'].detuneCents,
    rate: PERSONA_WASM_MAP['female-2'].playbackRate,
  },
  {
    id: 'female-3',
    name: 'Seraphina',
    gender: 'female',
    role: 'Karakter Tenang / Dewasa',
    description: 'Suara wanita lebih berat (-120 cents) dan tenang, cocok untuk situasi profesional atau formal.',
    model: 'de_DE-kerstin-low',
    detune: PERSONA_WASM_MAP['female-3'].detuneCents,
    rate: PERSONA_WASM_MAP['female-3'].playbackRate,
  },
  // PRIA
  {
    id: 'male-1',
    name: 'Conrad',
    gender: 'male',
    role: 'Pria Dewasa / Bariton',
    description: 'Suara pria bariton dalam (-150 cents), artikulasi tenang, cocok untuk karakter rekan senior / narator.',
    model: 'de_DE-thorsten-medium',
    detune: PERSONA_WASM_MAP['male-1'].detuneCents,
    rate: PERSONA_WASM_MAP['male-1'].playbackRate,
  },
  {
    id: 'male-2',
    name: 'Killian',
    gender: 'male',
    role: 'Pria Muda / Energik',
    description: 'Suara pria lebih tinggi (+160 cents) dan lebih cepat, kontras kuat dengan Conrad untuk percakapan 2 pria.',
    model: 'de_DE-thorsten-medium',
    detune: PERSONA_WASM_MAP['male-2'].detuneCents,
    rate: PERSONA_WASM_MAP['male-2'].playbackRate,
  },
  {
    id: 'male-3',
    name: 'Florian',
    gender: 'male',
    role: 'Pria Standar (Thorsten Asli)',
    description: 'Suara pria natural Jerman (pitch standar 0 semitone), nada khas penutur asli Hochdeutsch.',
    model: 'de_DE-thorsten-medium',
    detune: PERSONA_WASM_MAP['male-3'].detuneCents,
    rate: PERSONA_WASM_MAP['male-3'].playbackRate,
  },
]

const SAMPLE_SENTENCES = [
  'Guten Tag! Wie geht es Ihnen heute?',
  'Ich möchte einen Kaffee und ein Croissant bestellen, bitte.',
  'Entschuldigung, wo ist hier der nächste Bahnhof?',
  'Das ist eine hervorragende Idee für unser Deutsch-Projekt!',
]

export default function AudioPrototypePage({ navigate }: { navigate: (path: string) => void }) {
  const [selectedText, setSelectedText] = useState(SAMPLE_SENTENCES[0])
  const [customText, setCustomText] = useState('')
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const activeText = customText.trim() ? customText.trim() : selectedText

  const handleTestPersona = async (personaId: string) => {
    if (playingId === personaId) {
      stopWasmAudio()
      setPlayingId(null)
      setIsLoading(null)
      return
    }

    stopWasmAudio()
    setPlayingId(personaId)
    setIsLoading(personaId)

    try {
      await synthesizeAndPlayWasm(activeText, personaId)
    } catch (err) {
      console.error('WASM speech error:', err)
      alert('Gagal mensintesis audio Piper WASM. Pastikan browser mendukung WebAssembly & Web Audio.')
    } finally {
      setIsLoading(null)
      setPlayingId(null)
    }
  }

  const handleStopAll = () => {
    stopWasmAudio()
    setPlayingId(null)
    setIsLoading(null)
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
                Audisi Persona Piper WASM (Client-Side)
              </h1>
              <p className="text-body-sm text-text-muted mt-0.5">
                Coba dan dengarkan langsung karakter suara 6 persona (3 Wanita + 3 Pria) secara deterministik di browser Anda.
              </p>
            </div>
          </div>
          {playingId && (
            <button
              type="button"
              onClick={handleStopAll}
              className="px-3 py-1.5 rounded-md bg-danger text-on-danger text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            >
              <Square size={14} className="fill-white" /> Stop Audio
            </button>
          )}
        </div>

        {/* Input Teks Kalimat */}
        <Card className="p-5 border border-border space-y-4">
          <h2 className="text-sm font-bold text-text flex items-center gap-2">
            <Volume2 size={16} className="text-primary" />
            Pilih atau Tulis Kalimat Uji (Bahasa Jerman):
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

          <div className="space-y-1">
            <label className="text-xs text-text-muted font-medium">Atau ketik kalimat bebas sendiri:</label>
            <input
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              placeholder="Ketik teks Jerman di sini..."
              className="w-full text-base px-3 py-2 rounded-md border border-border bg-surface text-text focus:outline-none focus:border-primary"
            />
          </div>

          <div className="p-3 bg-neutral rounded-md text-xs text-text-muted flex items-center justify-between">
            <span>
              Kalimat aktif: <strong className="text-text font-semibold">"{activeText}"</strong>
            </span>
            <span className="text-primary font-medium">Sintesis murni di browser (OPFS + WASM)</span>
          </div>
        </Card>

        {/* Grid 6 Persona */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ALL_PERSONAS.map((persona) => {
            const isPlaying = playingId === persona.id
            const isBusy = isLoading === persona.id
            const isFemale = persona.gender === 'female'

            return (
              <Card
                key={persona.id}
                className={`p-5 border transition-all ${
                  isPlaying ? 'border-primary shadow-sm bg-primary/5' : 'border-border'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-extrabold text-text">{persona.name}</span>
                      <span
                        className={`text-label px-2 py-0.5 rounded-full font-semibold border ${
                          isFemale
                            ? 'bg-rose-50 text-rose-700 border-rose-200'
                            : 'bg-blue-50 text-blue-700 border-blue-200'
                        }`}
                      >
                        {isFemale ? '👩 Wanita' : '👨 Pria'} ({persona.id})
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-primary">{persona.role}</p>
                    <p className="text-xs text-text-muted leading-relaxed mt-1">{persona.description}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleTestPersona(persona.id)}
                    disabled={isLoading !== null && !isPlaying}
                    className={`shrink-0 p-3 rounded-full transition-all cursor-pointer ${
                      isPlaying
                        ? 'bg-danger text-on-danger hover:bg-danger/90'
                        : isBusy
                        ? 'bg-primary/20 text-primary'
                        : 'bg-primary text-on-primary hover:bg-primary-hover shadow-xs'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                    title={isPlaying ? 'Stop' : `Dengarkan suara ${persona.name}`}
                  >
                    {isBusy ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : isPlaying ? (
                      <Square size={18} className="fill-white" />
                    ) : (
                      <Play size={18} />
                    )}
                  </button>
                </div>

                {/* Technical specs */}
                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-label text-text-muted">
                  <span>Model: <code>{persona.model}</code></span>
                  <span>Detune: <strong>{persona.detune > 0 ? `+${persona.detune}` : persona.detune} cents</strong></span>
                  <span>Speed: <strong>{persona.rate}x</strong></span>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
