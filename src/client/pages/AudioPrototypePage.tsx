import { useState } from 'react'
import { Card } from '../components/ui/card'
import { Play, Square, ArrowLeft, CheckCircle2 } from 'lucide-react'

interface SampleItem {
  de: string
  id: string
  slug: string
}

const SAMPLES: SampleItem[] = [
  { de: 'Die Lampe', id: 'Lampu', slug: 'die-lampe' },
  { de: 'Der Kaffee', id: 'Kopi', slug: 'der-kaffee' },
  { de: 'Das Brot', id: 'Roti', slug: 'das-brot' },
  { de: 'Die Apotheke', id: 'Apotek', slug: 'die-apotheke' },
  { de: 'Guten Tag! Wie geht es Ihnen?', id: 'Selamat siang! Apa kabar?', slug: 'guten-tag-wie-geht-es-ihnen' },
]

export default function AudioPrototypePage({ navigate }: { navigate: (path: string) => void }) {
  const [playingKey, setPlayingKey] = useState<string | null>(null)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)

  const playAudio = (fileUrl: string, key: string) => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
    }

    if (playingKey === key) {
      setPlayingKey(null)
      setCurrentAudio(null)
      return
    }

    const audio = new Audio(fileUrl)
    setCurrentAudio(audio)
    setPlayingKey(key)

    audio.onended = () => {
      setPlayingKey(null)
      setCurrentAudio(null)
    }

    audio.onerror = () => {
      alert('File audio belum ada atau gagal diputar: ' + fileUrl)
      setPlayingKey(null)
      setCurrentAudio(null)
    }

    audio.play().catch(e => {
      console.error(e)
      setPlayingKey(null)
    })
  }

  return (
    <div className="min-h-dvh bg-neutral p-4 sm:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
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
              <h1 className="text-heading font-bold text-text">Prototype Audio: Bank Kata (Offline Piper/Kokoro)</h1>
              <p className="text-body-sm text-text-muted mt-0.5">
                Evaluasi perbandingan suara asli <strong>Martin / Thorsten (Pria)</strong> vs <strong>Victoria / Kerstin (Wanita)</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-lg flex items-start gap-3 text-body-sm text-text">
          <CheckCircle2 size={18} className="text-primary shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-primary">Audio Statis Tanpa Serverless / Bebas Kuota</p>
            <p className="text-text-muted text-xs mt-0.5">
              File WAV di bawah di-generate langsung dari neural model lokal di laptop Anda dan disimpan ke direktori <code>public/audio/test-preview/</code>. Memutar audio ini beroperasi 0 ms latensi dan 100% offline.
            </p>
          </div>
        </div>

        {/* Sample List */}
        <div className="space-y-3">
          {SAMPLES.map((item, idx) => {
            const maleKey = `${item.slug}-male`
            const femaleKey = `${item.slug}-female`
            const maleUrl = `/audio/test-preview/${item.slug}-male.wav`
            const femaleUrl = `/audio/test-preview/${item.slug}-female.wav`

            return (
              <Card key={idx} className="p-4 border border-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-sm bg-neutral text-text-muted border border-border">
                    Sample #{idx + 1}
                  </span>
                  <h3 className="text-lg font-bold text-text mt-1" lang="de">{item.de}</h3>
                  <p className="text-body-sm text-text-muted">{item.id}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Tombol Suara Pria (Martin/Thorsten) */}
                  <button
                    type="button"
                    onClick={() => playAudio(maleUrl, maleKey)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md font-semibold text-xs border transition-colors cursor-pointer ${
                      playingKey === maleKey
                        ? 'bg-primary text-on-primary border-primary shadow-xs'
                        : 'bg-surface hover:bg-surface-muted text-text border-border'
                    }`}
                  >
                    {playingKey === maleKey ? <Square size={14} className="fill-white" /> : <Play size={14} />}
                    <span>👨 Martin (Pria)</span>
                  </button>

                  {/* Tombol Suara Wanita (Victoria/Kerstin) */}
                  <button
                    type="button"
                    onClick={() => playAudio(femaleUrl, femaleKey)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md font-semibold text-xs border transition-colors cursor-pointer ${
                      playingKey === femaleKey
                        ? 'bg-primary text-on-primary border-primary shadow-xs'
                        : 'bg-surface hover:bg-surface-muted text-text border-border'
                    }`}
                  >
                    {playingKey === femaleKey ? <Square size={14} className="fill-white" /> : <Play size={14} />}
                    <span>👩 Victoria (Wanita)</span>
                  </button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
