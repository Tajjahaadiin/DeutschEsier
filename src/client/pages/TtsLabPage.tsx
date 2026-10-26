/**
 * PROTOTIPE — Lab TTS: uji pitch + formant realtime.
 *
 * Memutar audio /api/tts-prototype melewati FormantCorrectionNode
 * (@soundtouchjs/formant-correction-worklet, LPC). Dua AudioParam bisa diubah
 * langsung saat audio berbunyi:
 *   - pitchSemitones : -12..0  (0 = asli, -5 ≈ pria dewasa)
 *   - formantStrength: 0..1    (0 = formant ikut turun/raksasa, 1 = timbre asli)
 *
 * Kenapa bukan playbackRate: itu time-stretch, nada tidak berubah sama sekali.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { FormantCorrectionNode } from '@soundtouchjs/formant-correction-worklet'
import processorUrl from '@soundtouchjs/formant-correction-worklet/processor?url'

interface Turn {
  speaker: string
  persona: string
  label: string
  germanText: string
}

const DIALOGUE: Turn[] = [
  { speaker: 'Sprecher A', persona: 'weiblich', label: 'Wanita', germanText: 'Guten Tag! Ich heiße Anna und wohne in Berlin.' },
  { speaker: 'Sprecher B', persona: 'männlich-1', label: 'Pria 1', germanText: 'Hallo Anna. Ich bin Bernd. Freut mich, dich kennenzulernen.' },
  { speaker: 'Sprecher C', persona: 'männlich-2', label: 'Pria 2', germanText: 'Guten Morgen. Wohnst du auch in der Nähe vom Zentrum?' },
  { speaker: 'Sprecher A', persona: 'weiblich', label: 'Wanita', germanText: 'Ja, ich wohne seit zwei Jahren in Kreuzberg.' },
  { speaker: 'Sprecher B', persona: 'männlich-1', label: 'Pria 1', germanText: 'Das ist praktisch. Wie fährst du zur Arbeit?' },
  { speaker: 'Sprecher C', persona: 'männlich-2', label: 'Pria 2', germanText: 'Ich nehme meistens die U-Bahn, das geht schneller.' },
  { speaker: 'Sprecher B', persona: 'männlich-1', label: 'Pria 1', germanText: 'Am Wochenende fahre ich aber lieber mit dem Fahrrad.' },
  { speaker: 'Sprecher A', persona: 'weiblich', label: 'Wanita', germanText: 'Gute Idee! Berlin ist wirklich eine Fahrradstadt.' },
]

/**
 * Setting final per persona untuk dialog dummy.
 * weiblich = suara asli Google tanpa olahan.
 */
interface VoiceConfig {
  semitones: number
  formant: number
}

const PERSONA_CONFIG: Record<string, VoiceConfig> = {
  weiblich: { semitones: 0, formant: 1 },
  'männlich-1': { semitones: -3, formant: 0.3 },
  'männlich-2': { semitones: -7, formant: 0.1 },
}

const PRESETS: Record<string, VoiceConfig> = {
  'Wanita (asli)': { semitones: 0, formant: 1 },
  'Pria 1 (−3 / 0.30)': { semitones: -3, formant: 0.3 },
  'Pria 2 (−7 / 0.10)': { semitones: -7, formant: 0.1 },
  Raksasa: { semitones: -9, formant: 0 },
}

async function fetchAudioBuffer(
  ctx: AudioContext,
  url: string,
  signal: AbortSignal,
): Promise<AudioBuffer> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return ctx.decodeAudioData(await res.arrayBuffer())
}

export default function TtsLabPage() {
  const [semitones, setSemitones] = useState(-3)
  const [formant, setFormant] = useState(0.3)
  /** true = tiap baris pakai PERSONA_CONFIG; false = pakai slider manual */
  const [perPersona, setPerPersona] = useState(true)
  const [playing, setPlaying] = useState<number | null>(null)
  const [status, setStatus] = useState<string>('')
  const [autoApply, setAutoApply] = useState(true)

  const ctxRef = useRef<AudioContext | null>(null)
  const nodeRef = useRef<FormantCorrectionNode | null>(null)
  const srcRef = useRef<AudioBufferSourceNode | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const cacheRef = useRef<Map<string, AudioBuffer>>(new Map())
  const readyRef = useRef(false)

  // Siapkan AudioContext + node sekali, saat user pertama kali berinteraksi.
  const ensureAudio = useCallback(async () => {
    if (readyRef.current && ctxRef.current && nodeRef.current) return
    const AC = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new AC({ latencyHint: 'interactive' })
    await FormantCorrectionNode.register(ctx, processorUrl)
    const node = new FormantCorrectionNode({ context: ctx, outputChannelCount: 1 })
    node.connect(ctx.destination)
    ctxRef.current = ctx
    nodeRef.current = node
    readyRef.current = true
  }, [])

  // Slider → AudioParam secara realtime (kalau autoApply aktif dan mode manual).
  useEffect(() => {
    const node = nodeRef.current
    if (!node || !autoApply || perPersona) return
    node.pitchSemitones.value = semitones
    node.formantStrength.value = formant
  }, [semitones, formant, autoApply, perPersona])

  const stopAll = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    try {
      srcRef.current?.stop()
    } catch {}
    srcRef.current = null
    setPlaying(null)
  }, [])

  useEffect(() => () => stopAll(), [stopAll])

  const playIndex = useCallback(
    async (index: number, opts: { chain?: boolean } = {}) => {
      await ensureAudio()
      const ctx = ctxRef.current!
      const node = nodeRef.current!
      if (ctx.state === 'suspended') await ctx.resume()

      const ac = new AbortController()
      abortRef.current = ac

      const turn = DIALOGUE[index]
      const cfg = perPersona
        ? (PERSONA_CONFIG[turn.persona] ?? { semitones: 0, formant: 1 })
        : { semitones, formant }
      node.pitchSemitones.value = cfg.semitones
      node.formantStrength.value = cfg.formant

      const url = `/api/tts-prototype?text=${encodeURIComponent(turn.germanText)}&persona=${encodeURIComponent(turn.persona)}`

      setPlaying(index)
      try {
        let buf = cacheRef.current.get(url)
        if (!buf) {
          setStatus(`memuat ${turn.label}...`)
          buf = await fetchAudioBuffer(ctx, url, ac.signal)
          cacheRef.current.set(url, buf)
        }
        if (ac.signal.aborted) return

        await new Promise<void>((resolve, reject) => {
          const src = ctx.createBufferSource()
          src.buffer = buf!
          src.connect(node)
          srcRef.current = src
          src.onended = () => resolve()
          try {
            src.start()
          } catch (e) {
            reject(e)
          }
        })

        if (!ac.signal.aborted && opts.chain && index + 1 < DIALOGUE.length) {
          await playIndex(index + 1, { chain: true })
          return
        }
      } catch (e: any) {
        if (e?.name !== 'AbortError') setStatus(`gagal: ${e.message}`)
      } finally {
        if (!ac.signal.aborted) {
          setStatus('')
          if (!opts.chain) setPlaying(null)
        }
      }
    },
    [ensureAudio, semitones, formant, perPersona],
  )

  const playAll = () => {
    stopAll()
    playIndex(0, { chain: true })
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">TTS Lab — pitch &amp; formant realtime</h1>
        <p className="text-sm text-muted-foreground">
          Audio dari <code>/api/tts-prototype</code> dilewatkan <code>FormantCorrectionNode</code> (LPC).
          Dialog memakai 3 config: wanita asli, männlich-1 −3st/0.30, männlich-2 −7st/0.10.
        </p>
      </header>

      <section className="space-y-4 rounded-lg border p-4">
        <div className="space-y-1">
          <div className="flex items-baseline justify-between text-sm">
            <label htmlFor="pitch">Pitch (semitone)</label>
            <span className="font-mono">{semitones > 0 ? '+' : ''}{semitones}</span>
          </div>
          <input
            id="pitch"
            type="range"
            min={-12}
            max={0}
            step={0.5}
            value={semitones}
            onChange={(e) => setSemitones(Number(e.target.value))}
            className="w-full"
          />
          <div className="text-xs text-muted-foreground">0 = asli · −5 ≈ pria dewasa · −12 = oktaf penuh</div>
        </div>

        <div className="space-y-1">
          <div className="flex items-baseline justify-between text-sm">
            <label htmlFor="formant">Formant strength</label>
            <span className="font-mono">{formant.toFixed(2)}</span>
          </div>
          <input
            id="formant"
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={formant}
            onChange={(e) => setFormant(Number(e.target.value))}
            className="w-full"
          />
          <div className="text-xs text-muted-foreground">
            0 = formant ikut turun (raksasa) · 1 = timbre asli dipertahankan
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={perPersona} onChange={(e) => setPerPersona(e.target.checked)} />
            Tiap baris pakai config persona
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={autoApply}
              disabled={perPersona}
              onChange={(e) => setAutoApply(e.target.checked)}
            />
            Terapkan slider langsung
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={playAll} className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground">
            Putar semua
          </button>
          <button onClick={stopAll} className="rounded border px-4 py-2 text-sm">Stop</button>
        </div>

        <div className="flex flex-wrap gap-2">
          {Object.entries(PRESETS).map(([name, p]) => (
            <button
              key={name}
              onClick={() => {
                setPerPersona(false)
                setSemitones(p.semitones)
                setFormant(p.formant)
              }}
              className="rounded border px-3 py-1 text-xs"
            >
              {name}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        {DIALOGUE.map((turn, i) => {
          const cfg = perPersona ? (PERSONA_CONFIG[turn.persona] ?? { semitones: 0, formant: 1 }) : { semitones, formant }
          return (
            <div
              key={i}
              className={`flex items-start gap-3 rounded border p-3 ${playing === i ? 'border-primary bg-accent' : ''}`}
            >
              <button onClick={() => playIndex(i)} className="mt-0.5 rounded border px-2 py-1 text-xs">▶</button>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-muted-foreground">
                  {turn.speaker} · {turn.label} · {turn.persona} ·{' '}
                  <span className="font-mono">
                    {cfg.semitones}st / formant {cfg.formant}
                  </span>
                </div>
                <div className="text-sm">{turn.germanText}</div>
              </div>
            </div>
          )
        })}
      </section>

      {status && <div className="text-xs text-muted-foreground">{status}</div>}

      <footer className="text-xs text-muted-foreground">
        Catatan: suara sumber Google TTS hanya satu (wanita). Pitch + formant di sini bertujuan membuatnya
        terdengar sebagai pria. Kalau hasilnya belum meyakinkan, itu batas sumbernya, bukan efeknya.
      </footer>
    </div>
  )
}
