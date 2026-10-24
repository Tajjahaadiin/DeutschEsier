import { useState, useEffect } from 'react'
import {
  BookOpen,
  Languages,
  Hash,
  Calendar,
  Key,
  ShieldCheck,
  Lock,
  Clock,
  AlertCircle,
  Layers,
  Volume2,
} from 'lucide-react'
import { isTeacherAuthenticated } from '../lib/auth'
import KeyManagerModal from '../components/access/KeyManagerModal'
import { WordCard } from '../components/word-bank/WordCard'
import { SelectionBasket } from '../components/word-bank/SelectionBasket'
import AlphabetPage from './AlphabetPage'
import NumberPage from './NumberPage'
import DayPage from './DayPage'
import {
  getStoredPersonaId,
  setStoredPersonaId,
  type TtsPersonaId,
} from '../lib/audio'
import { GRUNDLAGEN_PERSONA_ID } from '../../shared/ttsPersonas'

export type GrundlagenTab = 'words' | 'alphabet' | 'nummer' | 'tage'

export interface GrundlagenPageProps {
  navigate: (path: string) => void
  initialTab?: GrundlagenTab
}

/**
 * Portal Terpadu "Die Grundlagen" (Fondasi Dasar).
 *
 * Menyatukan 4 modul dasar bahasa Jerman:
 * 1. Bank Kata Kognat (Wortschatz)
 * 2. Das Alphabet (30 karakter & ejaan fonetik)
 * 3. die Nummer (Angka 0-100 & permainan hitung benda)
 * 4. die Tage (Hari, bulan, kalender Jerman & waktu)
 *
 * Mendukung akses guru (langsung tanpa kunci) dan murid (via kunci akses DE-XXXXX
 * berdasar sessionId tetap "grundlagen").
 */
export default function GrundlagenPage({
  navigate,
  initialTab = 'words',
}: GrundlagenPageProps) {
  const isTeacher = isTeacherAuthenticated()

  // Tab State: words | alphabet | nummer | tage
  const [activeTab, setActiveTab] = useState<GrundlagenTab>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search).get('tab')
      if (p === 'alphabet' || p === 'nummer' || p === 'tage' || p === 'words') {
        return p as GrundlagenTab
      }
    }
    return initialTab
  })

  // Access Gate States untuk Murid
  const [accessGranted, setAccessGranted] = useState<boolean>(isTeacher)
  const [validKey, setValidKey] = useState<string>('')
  const [verifyingKey, setVerifyingKey] = useState<boolean>(!isTeacher)
  const [accessError, setAccessError] = useState<'missing_key' | 'not_found' | 'expired' | ''>('')
  const [inputKey, setInputKey] = useState<string>('')
  const [gateSubmitting, setGateSubmitting] = useState(false)
  const [gateErrorMsg, setGateErrorMsg] = useState('')

  // Teacher Key Manager Modal
  const [showKeyManager, setShowKeyManager] = useState(false)

  // Bank Kata States
  const [words, setWords] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [totalWords, setTotalWords] = useState(0)
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState('')
  const [selectedWords, setSelectedWords] = useState<number[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('selectedWords') || '[]')
    } catch {
      return []
    }
  })

  // Voice Persona: dikunci ke suara tunggal Grundlagen (Katja / female-1)
  const currentPersonaId = GRUNDLAGEN_PERSONA_ID

  // Sinkronisasi Tab ke URL Query (mempertahankan query key siswa)
  const handleTabChange = (tab: GrundlagenTab) => {
    setActiveTab(tab)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('tab', tab)
      if (validKey) {
        url.searchParams.set('key', validKey)
      }
      window.history.replaceState({}, '', url.toString())
    }
  }

  // Verifikasi Kunci Akses Siswa untuk Grundlagen
  useEffect(() => {
    if (isTeacher) {
      setAccessGranted(true)
      setVerifyingKey(false)
      return
    }

    const searchParams = new URLSearchParams(window.location.search)
    const rawKey = searchParams.get('key')
    const storedKey = typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('grundlagen_access_key') : null
    const queryKey = rawKey ? rawKey.trim().toUpperCase() : (storedKey ? storedKey.trim().toUpperCase() : null)

    if (!queryKey) {
      setAccessGranted(false)
      setAccessError('missing_key')
      setVerifyingKey(false)
      return
    }

    setVerifyingKey(true)
    fetch(`/api/sessions/grundlagen/verify-access?key=${encodeURIComponent(queryKey)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.valid) {
          setAccessGranted(true)
          setValidKey(queryKey)
          setAccessError('')
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('grundlagen_access_key', queryKey)
          }
        } else {
          setAccessGranted(false)
          setAccessError(data.reason === 'expired' ? 'expired' : 'not_found')
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem('grundlagen_access_key')
          }
        }
      })
      .catch(() => {
        setAccessGranted(false)
        setAccessError('not_found')
      })
      .finally(() => {
        setVerifyingKey(false)
      })
  }, [isTeacher])

  // Submit Kunci Akses dari Gate
  const handleKeySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGateErrorMsg('')
    const trimmed = inputKey.trim().toUpperCase()
    if (!trimmed) {
      setGateErrorMsg('Silakan masukkan kunci akses.')
      return
    }

    try {
      setGateSubmitting(true)
      const res = await fetch(`/api/sessions/grundlagen/verify-access?key=${encodeURIComponent(trimmed)}`)
      const data = await res.json()

      if (data.valid) {
        setValidKey(trimmed)
        setAccessGranted(true)
        setAccessError('')
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.setItem('grundlagen_access_key', trimmed)
        }
        const url = new URL(window.location.href)
        url.searchParams.set('key', trimmed)
        window.history.replaceState({}, '', url.toString())
      } else {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('grundlagen_access_key')
        }
        if (data.reason === 'expired') {
          setAccessError('expired')
          setGateErrorMsg('Kunci akses ini sudah kedaluwarsa.')
        } else {
          setAccessError('not_found')
          setGateErrorMsg('Kunci akses tidak ditemukan atau salah.')
        }
      }
    } catch {
      setGateErrorMsg('Gagal memverifikasi kunci akses. Coba lagi.')
    } finally {
      setGateSubmitting(false)
    }
  }

  // Fetch Bank Kata (hanya bila tab words aktif dan akses terbuka)
  useEffect(() => {
    if (!accessGranted || activeTab !== 'words') return
    fetch(`/api/words?search=${encodeURIComponent(search)}&category=${encodeURIComponent(selectedCat)}&limit=105`)
      .then((res) => res.json())
      .then((data) => {
        setWords(data.words || [])
        setTotalWords(data.total || 0)
        if (categories.length === 0 && data.categories) setCategories(data.categories)
      })
      .catch(console.error)
  }, [accessGranted, activeTab, search, selectedCat])

  const toggleWord = (id: number) => {
    setSelectedWords((prev) => {
      const next = prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]
      localStorage.setItem('selectedWords', JSON.stringify(next))
      return next
    })
  }

  const clearSelection = () => {
    setSelectedWords([])
    localStorage.setItem('selectedWords', '[]')
  }

  // Tampilan Loading Verifikasi
  if (verifyingKey) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-neutral">
        <div className="text-center p-6">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-sm font-medium text-text-muted">Memverifikasi akses Grundlagen...</p>
        </div>
      </div>
    )
  }

  // GATE AKSES MURID JIKA KUNCI BELUM VALID
  if (!accessGranted) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-neutral p-4">
        <div className="max-w-md w-full bg-surface rounded-lg p-6 sm:p-8 border border-border shadow-md text-center space-y-4">
          <div className="w-14 h-14 rounded-md bg-primary/10 text-primary mx-auto flex items-center justify-center">
            {accessError === 'expired' ? <Clock size={28} /> : <Lock size={28} />}
          </div>

          <div>
            <h2 className="text-heading font-bold text-text">
              {accessError === 'expired'
                ? 'Kunci Akses Grundlagen Kedaluwarsa'
                : 'Akses Modul Die Grundlagen'}
            </h2>
            <p className="text-body-sm text-text-muted mt-1 leading-relaxed">
              {accessError === 'expired'
                ? 'Masa berlaku kunci akses telah habis. Mintalah kunci baru kepada guru Anda.'
                : 'Masukkan kode kunci akses berbatas waktu dari guru untuk membuka materi dasar bahasa Jerman.'}
            </p>
          </div>

          {gateErrorMsg && (
            <div role="alert" aria-live="assertive" className="p-3 rounded-md bg-danger/10 border border-danger/30 text-danger text-body-sm flex items-center gap-2 text-left">
              <AlertCircle size={16} className="shrink-0" />
              <span>{gateErrorMsg}</span>
            </div>
          )}

          <form onSubmit={handleKeySubmit} className="space-y-3 pt-1">
            <input
              type="text"
              value={inputKey}
              onChange={(e) => setInputKey(e.target.value.toUpperCase())}
              placeholder="Contoh: DE-GRUND"
              className="w-full text-center font-mono text-base font-bold px-4 py-2.5 bg-neutral border border-border rounded-md focus:border-primary focus:bg-surface focus:outline-none transition-colors uppercase"
            />
            <button
              type="submit"
              disabled={gateSubmitting}
              className="w-full py-2.5 px-4 rounded-md bg-primary text-on-primary font-semibold text-sm hover:opacity-95 active:scale-[0.98] transition-transform disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {gateSubmitting ? 'Memverifikasi...' : 'Buka Materi Grundlagen'}
            </button>
          </form>

          {isTeacher && (
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-xs text-text-muted hover:text-text transition-colors mt-2"
            >
              Kembali ke Dashboard Guru
            </button>
          )}
        </div>
      </div>
    )
  }

  // KONTEN UTAMA DIE GRUNDLAGEN
  return (
    <div className="space-y-6">
      {/* Header Banner Modul */}
      <div className="bg-surface border border-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm bg-primary/10 text-primary text-label font-bold border border-primary/20">
              <Layers size={13} aria-hidden="true" />
              Modul Fondasi CEFR A1
            </span>
            {isTeacher ? (
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-label px-2.5 py-0.5 rounded-sm font-semibold border border-amber-200">
                <ShieldCheck size={12} /> Mode Guru (Akses Penuh)
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 text-label px-2.5 py-0.5 rounded-sm font-mono font-semibold border border-emerald-200">
                <Key size={12} /> Kunci: {validKey}
              </span>
            )}
          </div>
          <h1 className="text-display font-bold text-text tracking-tight">Die Grundlagen</h1>
          <p className="text-body-sm text-text-muted mt-1 leading-relaxed">
            Fondasi esensial bahasa Jerman untuk siswa Indonesia: Alfabet fonetik, Angka & hitung benda, Penanggalan/Hari libur, serta Bank Kata kognat.
          </p>
        </div>

        {/* Action: Guru Kelola Kunci Akses Murid */}
        <div className="shrink-0 flex items-center gap-2.5 flex-wrap">
          {isTeacher && (
            <button
              type="button"
              onClick={() => setShowKeyManager(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-surface border border-border hover:bg-surface-muted text-text text-sm font-semibold transition-colors shadow-xs cursor-pointer"
            >
              <Key size={15} className="text-primary" />
              <span>Kunci Akses Murid</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tab Navigasi 4 Pilar */}
      <div className="flex items-center gap-1.5 bg-surface-muted p-1 rounded-md border border-border overflow-x-auto">
        <button
          type="button"
          onClick={() => handleTabChange('words')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors cursor-pointer shrink-0 ${
            activeTab === 'words'
              ? 'bg-surface text-primary shadow-xs font-bold'
              : 'text-text-muted hover:text-text'
          }`}
        >
          <BookOpen size={16} />
          <span>Bank Kata ({totalWords})</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('alphabet')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors cursor-pointer shrink-0 ${
            activeTab === 'alphabet'
              ? 'bg-surface text-primary shadow-xs font-bold'
              : 'text-text-muted hover:text-text'
          }`}
        >
          <Languages size={16} />
          <span>Das Alphabet (30)</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('nummer')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors cursor-pointer shrink-0 ${
            activeTab === 'nummer'
              ? 'bg-surface text-primary shadow-xs font-bold'
              : 'text-text-muted hover:text-text'
          }`}
        >
          <Hash size={16} />
          <span>die Nummer</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('tage')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold transition-colors cursor-pointer shrink-0 ${
            activeTab === 'tage'
              ? 'bg-surface text-primary shadow-xs font-bold'
              : 'text-text-muted hover:text-text'
          }`}
        >
          <Calendar size={16} />
          <span>die Tage</span>
        </button>
      </div>

      {/* SUB-MODUL 1: BANK KATA (WORTSCHATZ) */}
      {activeTab === 'words' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Cari kata Jerman atau Indonesia..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 rounded-md border border-border px-4 py-2 text-base bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <select
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
              className="rounded-md border border-border px-4 py-2 text-base bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary min-w-[180px]"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {isTeacher && selectedWords.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-primary bg-primary/10 border border-primary/20 rounded-md px-4 py-2">
              <span className="font-bold">{selectedWords.length}</span> kata dipilih
              <button
                type="button"
                onClick={clearSelection}
                className="ml-auto text-xs text-text-muted hover:text-danger cursor-pointer"
              >
                Hapus pilihan
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {words.map((w) => (
              <WordCard
                key={w.id}
                word={w}
                isSelected={isTeacher && selectedWords.includes(w.id)}
                onToggle={() => isTeacher && toggleWord(w.id)}
                personaId={currentPersonaId}
                selectable={isTeacher}
              />
            ))}
          </div>

          {words.length === 0 && (
            <div className="text-center py-16 bg-surface border border-border rounded-lg text-text-muted">
              <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-base font-semibold text-text">Tidak ada kata ditemukan</p>
              <p className="text-xs text-text-muted mt-0.5">Ubah kata kunci atau kategori pencarian.</p>
            </div>
          )}

          {isTeacher && (
            <SelectionBasket count={selectedWords.length} onGenerate={() => navigate('/generate')} />
          )}
        </div>
      )}

      {/* SUB-MODUL 2: DAS ALPHABET */}
      {activeTab === 'alphabet' && (
        <div className="bg-surface border border-border rounded-lg p-4 sm:p-6 shadow-xs">
          <AlphabetPage navigate={navigate} embedded />
        </div>
      )}

      {/* SUB-MODUL 3: DIE NUMMER */}
      {activeTab === 'nummer' && (
        <div className="bg-surface border border-border rounded-lg p-4 sm:p-6 shadow-xs">
          <NumberPage navigate={navigate} embedded />
        </div>
      )}

      {/* SUB-MODUL 4: DIE TAGE */}
      {activeTab === 'tage' && (
        <div className="bg-surface border border-border rounded-lg p-4 sm:p-6 shadow-xs">
          <DayPage navigate={navigate} embedded />
        </div>
      )}

      {/* MODAL KUNCI AKSES GURU KHUSUS GRUNDLAGEN */}
      {isTeacher && showKeyManager && (
        <KeyManagerModal
          sessionId="grundlagen"
          sessionTitle="Die Grundlagen (Modul Fondasi Dasar)"
          isOpen={showKeyManager}
          onClose={() => setShowKeyManager(false)}
        />
      )}
    </div>
  )
}
