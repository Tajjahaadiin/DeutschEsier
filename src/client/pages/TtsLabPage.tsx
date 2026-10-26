/**
 * PROTOTIPE — Lab skenario: kirim SELURUH dialog, terima satu MP3.
 *
 * Berbeda dari /tts-lab yang memutar per baris, di sini klien hanya punya satu
 * <audio>. Tidak ada retry per baris, tidak ada timer antar baris, tidak ada
 * onend yang bisa tidak terpicu.
 */
import { useCallback, useEffect, useRef, useState } from 'react'

interface Turn {
  speaker: string
  personaId: string
  germanText: string
}

interface Scenario {
  id: string
  title: string
  scene: string
  turns: Turn[]
}

const SCENARIOS: Scenario[] = [
  {
    id: 'berlin-kennenlernen',
    title: 'Sich kennenlernen in Berlin',
    scene: 'Anna trifft Bernd und Jonas im Sprachkurs.',
    turns: [
      { speaker: 'Anna', personaId: 'weiblich', germanText: 'Guten Tag! Ich heiße Anna. Wie heißt du?' },
      { speaker: 'Bernd', personaId: 'männlich-1', germanText: 'Hallo Anna. Ich bin Bernd. Freut mich, dich kennenzulernen.' },
      { speaker: 'Jonas', personaId: 'männlich-2', germanText: 'Und ich bin Jonas. Wohnst du auch hier in Berlin?' },
      { speaker: 'Anna', personaId: 'weiblich', germanText: 'Ja, ich wohne seit zwei Jahren in Kreuzberg.' },
      { speaker: 'Bernd', personaId: 'männlich-1', germanText: 'Das ist praktisch. Wie fährst du zur Arbeit?' },
      { speaker: 'Jonas', personaId: 'männlich-2', germanText: 'Ich nehme meistens die U-Bahn, das geht schneller.' },
      { speaker: 'Bernd', personaId: 'männlich-1', germanText: 'Am Wochenende fahre ich aber lieber mit dem Fahrrad.' },
      { speaker: 'Anna', personaId: 'weiblich', germanText: 'Gute Idee! Berlin ist wirklich eine Fahrradstadt.' },
    ],
  },
  {
    id: 'arzt-termin',
    title: 'Beim Arzt',
    scene: 'Bernd hat Halsweh und ruft in der Praxis an.',
    turns: [
      { speaker: 'Anna', personaId: 'weiblich', germanText: 'Praxis Doktor Weber, guten Morgen. Was kann ich für Sie tun?' },
      { speaker: 'Bernd', personaId: 'männlich-1', germanText: 'Guten Morgen. Ich möchte einen Termin machen, ich habe starke Halsschmerzen.' },
      { speaker: 'Anna', personaId: 'weiblich', germanText: 'Seit wann haben Sie die Beschwerden?' },
      { speaker: 'Bernd', personaId: 'männlich-1', germanText: 'Seit drei Tagen. Gestern kam noch Fieber dazu.' },
      { speaker: 'Anna', personaId: 'weiblich', germanText: 'Dann kommen Sie heute um vierzehn Uhr vorbei.' },
      { speaker: 'Bernd', personaId: 'männlich-1', germanText: 'Vielen Dank. Soll ich etwas mitbringen?' },
      { speaker: 'Anna', personaId: 'weiblich', germanText: 'Nur Ihre Versichertenkarte, bitte. Bis später.' },
    ],
  },
]

const PERSONA_LABEL: Record<string, string> = {
  weiblich: 'W',
  'männlich-1': 'P1',
  'männlich-2': 'P2',
}

export default function TtsLabPage() {
  const [selected, setSelected] = useState(0)
  const [buffers, setBuffers] = useState<Record<string, string>>({})
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [meta, setMeta] = useState<string>('')
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const scenario = SCENARIOS[selected]

  useEffect(
    () => () => {
      audioRef.current?.pause()
      Object.values(buffers).forEach((u) => URL.revokeObjectURL(u))
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  )

  const build = useCallback(
    async (sc: Scenario) => {
      setLoading(true)
      setStatus(`Menyintesis ${sc.turns.length} baris "${sc.title}"...`)
      setMeta('')
      const t0 = performance.now()
      try {
        const res = await fetch('/api/tts-scenario', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ turns: sc.turns }),
        })
        const ms = Math.round(performance.now() - t0)

        if (!res.ok) {
          const body = await res.text()
          setStatus(`GAGAL HTTP ${res.status}: ${body.slice(0, 200)}`)
          return
        }

        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        setBuffers((prev) => {
          if (prev[sc.id]) URL.revokeObjectURL(prev[sc.id])
          return { ...prev, [sc.id]: url }
        })
        setMeta(
          [
            `${res.headers.get('x-tts-turns')} baris`,
            `${res.headers.get('x-tts-turns-ok')} ok`,
            `${(blob.size / 1024).toFixed(0)} KB`,
            `server ${res.headers.get('x-tts-elapsed-ms')} ms`,
            `total ${ms} ms`,
            `gap ${res.headers.get('x-tts-gap-ms')} ms`,
          ].join(' · '),
        )
        setStatus('')
      } catch (e: any) {
        setStatus(`ERROR: ${e.message}`)
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  const play = () => {
    const url = buffers[scenario.id]
    if (!url) return
    const audio = audioRef.current ?? new Audio()
    audioRef.current = audio
    if (audio.src !== url) audio.src = url
    audio.currentTime = 0
    audio.onended = () => setPlaying(false)
    audio.play().then(() => setPlaying(true)).catch(() => setPlaying(false))
  }

  const stop = () => {
    audioRef.current?.pause()
    setPlaying(false)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Lab skenario — satu audio per skenario</h1>
        <p className="text-sm text-muted-foreground">
          Klien mengirim <b>seluruh dialog sekaligus</b> ke <code>POST /api/tts-scenario</code>,
          server menyintesis per baris lewat HF Edge-TTS lalu menggabungkannya jadi satu MP3.
          Suara pria asli (Conrad / Killian), bukan pitch.
        </p>
      </header>

      <section className="space-y-3 rounded-lg border p-4">
        <div className="flex flex-wrap gap-2">
          {SCENARIOS.map((sc, i) => (
            <button
              key={sc.id}
              onClick={() => setSelected(i)}
              className={`rounded border px-3 py-1 text-xs ${i === selected ? 'border-primary bg-accent' : ''}`}
            >
              {sc.title}
            </button>
          ))}
        </div>

        <div className="text-sm text-muted-foreground">{scenario.scene}</div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => build(scenario)}
            disabled={loading}
            className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-50"
          >
            {loading ? 'Menyintesis...' : buffers[scenario.id] ? 'Sintesis ulang' : 'Sintesis skenario'}
          </button>
          <button
            onClick={play}
            disabled={!buffers[scenario.id]}
            className="rounded border px-4 py-2 text-sm disabled:opacity-50"
          >
            {playing ? 'Putar ulang' : 'Putar'}
          </button>
          <button onClick={stop} disabled={!playing} className="rounded border px-4 py-2 text-sm disabled:opacity-50">
            Stop
          </button>
        </div>

        {meta && <div className="font-mono text-xs text-muted-foreground">{meta}</div>}
        {status && <div className="text-xs">{status}</div>}
      </section>

      <section className="space-y-2">
        {scenario.turns.map((t, i) => (
          <div key={i} className="flex items-start gap-3 rounded border p-3">
            <span className="mt-0.5 rounded border px-2 py-0.5 font-mono text-xs">
              {PERSONA_LABEL[t.personaId] ?? '?'}
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-muted-foreground">
                {t.speaker} · {t.personaId}
              </div>
              <div className="text-sm">{t.germanText}</div>
            </div>
          </div>
        ))}
      </section>

      <footer className="text-xs text-muted-foreground">
        Jeda antar baris {`~450 ms`}. Bila ffmpeg tidak tersedia di server, audio tetap gabung tanpa jeda.
      </footer>
    </div>
  )
}
