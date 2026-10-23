import React, { useState, useEffect } from 'react'
import {
  Plus,
  ExternalLink,
  Trash2,
  Clock,
  Pencil,
  Key,
  MessageSquare,
  Sparkles,
} from 'lucide-react'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { getAuthHeaders } from '../lib/auth'
import KeyManagerModal from '../components/access/KeyManagerModal'

interface Session {
  id: string
  title: string
  cefrLevel: string
  scenarioPrompt: string
  createdAt: string
}

export interface HomePageProps {
  navigate: (path: string) => void
}

/**
 * Halaman Utama Dashboard Guru: Skenario Pembelajaran (Szenarien).
 *
 * Menerapkan spesifikasi DESIGN.md:
 * - Menampilkan daftar skenario percakapan interaktif yang dibuat guru.
 * - Tombol aksi spesifik: Buka, Kunci Akses Murid, Edit, dan Hapus.
 * - Transisi hover halus, kartu datar dengan border slate-200.
 */
export default function HomePage({ navigate }: HomePageProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCefr, setSelectedCefr] = useState('')
  const [keyModalSession, setKeyModalSession] = useState<Session | null>(null)

  const fetchSessions = () => {
    setLoading(true)
    fetch('/api/sessions', { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then((data) => setSessions(data.sessions || []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Hapus skenario pembelajaran ini?')) return
    await fetch(`/api/sessions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }

  const filteredSessions = sessions.filter((s) => {
    if (selectedCefr && s.cefrLevel !== selectedCefr) return false
    if (search.trim()) {
      const q = search.toLowerCase()
      return s.title.toLowerCase().includes(q) || s.scenarioPrompt.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-surface border border-border rounded-lg p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-sm bg-primary/10 text-primary text-label font-bold border border-primary/20 mb-1.5">
            <MessageSquare size={13} aria-hidden="true" />
            <span>Manajemen Percakapan</span>
          </div>
          <h1 className="text-display font-bold text-text tracking-tight">Skenario Pembelajaran</h1>
          <p className="text-body-sm text-text-muted mt-1 leading-relaxed">
            Kelola skenario percakapan hasil AI, pantau rapor hasil kuis, dan bagikan kunci akses berbatas waktu kepada murid.
          </p>
        </div>

        <Button
          onClick={() => navigate('/generate')}
          className="shrink-0 flex items-center justify-center gap-2 px-4 py-2.5"
        >
          <Plus size={16} />
          <span>Buat Skenario AI</span>
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Cari judul atau topik skenario..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-md border border-border px-4 py-2 text-base bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary placeholder-text-muted"
        />
        <select
          value={selectedCefr}
          onChange={(e) => setSelectedCefr(e.target.value)}
          className="rounded-md border border-border px-4 py-2 text-base bg-surface text-text focus:outline-none focus:ring-2 focus:ring-primary min-w-[150px] cursor-pointer"
        >
          <option value="">Semua Level CEFR</option>
          <option value="A1">Level A1 (Pemula)</option>
          <option value="A2">Level A2 (Dasar)</option>
          <option value="B1">Level B1 (Menengah)</option>
        </select>
      </div>

      {/* Daftar Skenario */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-16 bg-surface border border-border rounded-lg text-text-muted">
            <div className="animate-spin w-7 h-7 border-2 border-primary border-t-transparent rounded-full mx-auto mb-3" />
            <p className="text-body-sm font-medium">Memuat daftar skenario...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="text-center py-16 bg-surface border border-border rounded-lg text-text-muted p-6">
            <Sparkles size={40} className="mx-auto mb-3 opacity-30 text-primary" />
            <h3 className="text-heading font-bold text-text">Belum ada skenario</h3>
            <p className="text-body-sm text-text-muted mt-1 mb-5 max-w-sm mx-auto">
              {search || selectedCefr
                ? 'Tidak ada skenario yang cocok dengan filter pencarian Anda.'
                : 'Mulai dengan membuat skenario percakapan AI pertama Anda.'}
            </p>
            <Button onClick={() => navigate('/generate')} className="inline-flex items-center gap-2 mx-auto">
              <Plus size={16} />
              <span>Buat Skenario Sekarang</span>
            </Button>
          </div>
        ) : (
          filteredSessions.map((session) => (
            <Card
              key={session.id}
              className="p-4 sm:p-5 cursor-pointer hover:border-primary/50 transition-colors group relative"
              onClick={() => navigate('/view/' + session.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="text-label px-2.5 py-0.5 rounded-sm bg-primary/10 text-primary font-bold border border-primary/20">
                      {session.cefrLevel}
                    </span>
                    <span className="text-label text-text-muted flex items-center gap-1">
                      <Clock size={12} />
                      {new Date(session.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <h3 className="text-heading font-bold text-text truncate group-hover:text-primary transition-colors">
                    {session.title}
                  </h3>
                  <p className="text-body-sm text-text-muted mt-1 line-clamp-2 leading-relaxed">
                    {session.scenarioPrompt}
                  </p>
                </div>

                {/* Tombol Aksi */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate('/view/' + session.id)
                    }}
                    className="p-2 text-text-muted hover:text-primary rounded-md hover:bg-surface-muted transition-colors cursor-pointer"
                    title="Buka Ruang Belajar & Kuis"
                  >
                    <ExternalLink size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setKeyModalSession(session)
                    }}
                    className="p-2 text-text-muted hover:text-amber-600 rounded-md hover:bg-amber-50 transition-colors cursor-pointer"
                    title="Kelola Kunci Akses Murid"
                  >
                    <Key size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate('/edit/' + session.id)
                    }}
                    className="p-2 text-text-muted hover:text-primary rounded-md hover:bg-surface-muted transition-colors cursor-pointer"
                    title="Edit Skenario"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="p-2 text-text-muted hover:text-danger rounded-md hover:bg-danger/10 transition-colors cursor-pointer"
                    title="Hapus Skenario"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal Kelola Kunci Akses Murid */}
      {keyModalSession && (
        <KeyManagerModal
          sessionId={keyModalSession.id}
          sessionTitle={keyModalSession.title}
          isOpen={!!keyModalSession}
          onClose={() => setKeyModalSession(null)}
        />
      )}
    </div>
  )
}
