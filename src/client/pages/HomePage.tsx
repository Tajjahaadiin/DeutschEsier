import React, { useState, useEffect } from 'react'
import { WordCard } from '../components/word-bank/WordCard'
import { SelectionBasket } from '../components/word-bank/SelectionBasket'
import { BookOpen, Plus, ExternalLink, Trash2, Clock, Pencil, Key, LogOut } from 'lucide-react'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { getStoredVoiceGender, setStoredVoiceGender, type VoiceGender } from '../lib/audio'
import { logoutTeacher, getAuthHeaders } from '../lib/auth'
import KeyManagerModal from '../components/access/KeyManagerModal'

interface Session {
  id: string
  title: string
  cefrLevel: string
  scenarioPrompt: string
  createdAt: string
}

export default function HomePage({ navigate }: { navigate: (path: string) => void }) {
  const [words, setWords] = useState<any[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [selectedCat, setSelectedCat] = useState('')
  const [selectedWords, setSelectedWords] = useState<number[]>(() => {
    try { return JSON.parse(localStorage.getItem('selectedWords') || '[]') } catch { return [] }
  })
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeTab, setActiveTab] = useState<'bank' | 'sessions'>('bank')
  const [voiceGender, setVoiceGender] = useState<VoiceGender>(() => getStoredVoiceGender())
  const [keyModalSession, setKeyModalSession] = useState<Session | null>(null)

  useEffect(() => {
    fetch(`/api/words?search=${encodeURIComponent(search)}&category=${encodeURIComponent(selectedCat)}&limit=105`)
      .then(res => res.json())
      .then(data => {
        setWords(data.words || [])
        setTotal(data.total || 0)
        if (categories.length === 0 && data.categories) setCategories(data.categories)
      })
      .catch(console.error)
  }, [search, selectedCat])

  useEffect(() => {
    fetch('/api/sessions')
      .then(res => res.json())
      .then(data => setSessions(data.sessions || []))
      .catch(console.error)
  }, [])

  const toggleWord = (id: number) => {
    setSelectedWords(prev => {
      const next = prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
      localStorage.setItem('selectedWords', JSON.stringify(next))
      return next
    })
  }

  const clearSelection = () => {
    setSelectedWords([])
    localStorage.setItem('selectedWords', '[]')
  }

  const handleGenerate = () => navigate('/generate')

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('Hapus skenario ini?')) return
    await fetch(`/api/sessions/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div className="min-h-screen pb-32 bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="text-blue-600" size={24} />
            <h1 className="text-xl font-bold text-blue-600">DeutschEasier</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/alphabet')}
              className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
            >
              <span>🔤 Das Alphabet (30)</span>
            </button>
            <Button
              onClick={() => navigate('/generate')}
              className="flex items-center gap-2 text-sm px-4 py-2"
            >
              <Plus size={16} />
              Buat Skenario
            </Button>
            <div className="h-5 w-px bg-slate-200 mx-0.5 hidden sm:block" />
            <div className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 border border-blue-200 rounded-lg text-xs font-semibold text-blue-700">
              <span>👨‍🏫 Guru</span>
            </div>
            <button
              onClick={() => logoutTeacher()}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-600 px-2.5 py-1.5 rounded-lg hover:bg-red-50 transition-colors font-medium border border-transparent hover:border-red-100"
              title="Keluar dari akun guru"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 mt-6">
        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('bank')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'bank'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Bank Kata ({total})
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
              activeTab === 'sessions'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Skenario ({sessions.length})
          </button>
          <button
            onClick={() => navigate('/alphabet')}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-all text-slate-500 hover:text-blue-600 hover:bg-white/70"
          >
            Das Alphabet (30)
          </button>
        </div>

        {activeTab === 'bank' && (
          <>
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="text"
                placeholder="Cari kata Jerman atau Indonesia..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="flex-1 rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={selectedCat}
                onChange={e => setSelectedCat(e.target.value)}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[180px]"
              >
                <option value="">Semua Kategori</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <div className="flex items-center gap-1 bg-white border border-slate-300 rounded-xl p-1 text-xs">
                <span className="text-slate-400 px-2 font-medium">Suara:</span>
                <button
                  type="button"
                  onClick={() => { setVoiceGender('female'); setStoredVoiceGender('female'); }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${voiceGender === 'female' ? 'bg-rose-100 text-rose-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  👩 Wanita
                </button>
                <button
                  type="button"
                  onClick={() => { setVoiceGender('male'); setStoredVoiceGender('male'); }}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all ${voiceGender === 'male' ? 'bg-sky-100 text-sky-700 shadow-xs' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  👨 Pria
                </button>
              </div>
            </div>

            {selectedWords.length > 0 && (
              <div className="mb-4 flex items-center gap-2 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2">
                <span className="font-semibold">{selectedWords.length}</span> kata dipilih
                <button onClick={clearSelection} className="ml-auto text-slate-400 hover:text-red-500 text-xs">Hapus pilihan</button>
              </div>
            )}

            {/* Word Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {words.map(w => (
                <WordCard
                  key={w.id}
                  word={w}
                  isSelected={selectedWords.includes(w.id)}
                  onToggle={() => toggleWord(w.id)}
                  voiceGender={voiceGender}
                />
              ))}
            </div>

            {words.length === 0 && (
              <div className="text-center py-16 text-slate-400">
                <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Tidak ada kata ditemukan</p>
                <p className="text-sm mt-1">Coba ubah kata kunci atau kategori pencarian</p>
              </div>
            )}
          </>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-4">
            {sessions.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <BookOpen size={48} className="mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Belum ada skenario</p>
                <p className="text-sm mt-1 mb-6">Buat skenario pertamamu menggunakan AI</p>
                <Button onClick={() => navigate('/generate')} className="flex items-center gap-2 mx-auto">
                  <Plus size={16} />
                  Buat Skenario
                </Button>
              </div>
            ) : (
              sessions.map(session => (
                <Card
                  key={session.id}
                  className="p-4 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
                  onClick={() => navigate('/view/' + session.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          {session.cefrLevel}
                        </span>
                      </div>
                      <h3 className="font-semibold text-slate-800 truncate">{session.title}</h3>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{session.scenarioPrompt}</p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-slate-400">
                        <Clock size={12} />
                        {new Date(session.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={e => { e.stopPropagation(); navigate('/view/' + session.id) }}
                        className="p-2 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-blue-50"
                        title="Buka"
                      >
                        <ExternalLink size={16} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); setKeyModalSession(session) }}
                        className="p-2 text-slate-400 hover:text-amber-500 rounded-lg hover:bg-amber-50"
                        title="Kelola Kunci Akses Murid"
                      >
                        <Key size={16} />
                      </button>
                      <button
                        onClick={e => { e.stopPropagation(); navigate('/edit/' + session.id) }}
                        className="p-2 text-slate-400 hover:text-blue-500 rounded-lg hover:bg-blue-50"
                        title="Edit Skenario"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={e => handleDeleteSession(session.id, e)}
                        className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50"
                        title="Hapus"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>
        )}
      </main>

      {keyModalSession && (
        <KeyManagerModal
          sessionId={keyModalSession.id}
          sessionTitle={keyModalSession.title}
          isOpen={!!keyModalSession}
          onClose={() => setKeyModalSession(null)}
        />
      )}

      <SelectionBasket count={selectedWords.length} onGenerate={handleGenerate} />
    </div>
  )
}
