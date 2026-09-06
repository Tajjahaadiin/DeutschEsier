import React, { useState, useEffect } from 'react'
import { X, Key, Copy, Check, Trash2, Clock, Plus, ExternalLink, ShieldCheck, AlertCircle } from 'lucide-react'
import { getAuthHeaders } from '../../lib/auth'

export interface KeyManagerModalProps {
  sessionId: string
  sessionTitle: string
  isOpen: boolean
  onClose: () => void
}

interface AccessKeyItem {
  id: number
  key: string
  sessionId: string
  label: string
  expiresAt: string
  createdAt: string
  isActive: boolean
  isExpired?: boolean
}

const PRESETS = [
  { label: '1 Jam', hours: 1 },
  { label: '24 Jam (1 Hari)', hours: 24 },
  { label: '3 Hari', hours: 72 },
  { label: '7 Hari', hours: 168 },
  { label: '30 Hari', hours: 720 },
]

function getRemainingTime(expiresAt: string): { isExpired: boolean; text: string } {
  const diffMs = new Date(expiresAt).getTime() - Date.now()
  if (diffMs <= 0) {
    return { isExpired: true, text: 'Kedaluwarsa' }
  }
  const totalMinutes = Math.floor(diffMs / (1000 * 60))
  const totalHours = Math.floor(totalMinutes / 60)
  const days = Math.floor(totalHours / 24)
  const remainingHours = totalHours % 24
  const remainingMinutes = totalMinutes % 60

  if (days > 0) {
    return {
      isExpired: false,
      text: `Sisa ${days}h ${remainingHours}j`,
    }
  }
  if (totalHours > 0) {
    return {
      isExpired: false,
      text: `Sisa ${totalHours}j ${remainingMinutes}m`,
    }
  }
  return {
    isExpired: false,
    text: `Sisa ${totalMinutes} menit`,
  }
}

export default function KeyManagerModal({
  sessionId,
  sessionTitle,
  isOpen,
  onClose,
}: KeyManagerModalProps) {
  const [keys, setKeys] = useState<AccessKeyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  // Form states
  const [selectedHours, setSelectedHours] = useState<number>(24)
  const [isCustom, setIsCustom] = useState(false)
  const [customHours, setCustomHours] = useState<string>('48')
  const [label, setLabel] = useState('')

  // Copied states for feedback
  const [copiedKeyId, setCopiedKeyId] = useState<number | null>(null)
  const [copiedLinkId, setCopiedLinkId] = useState<number | null>(null)

  const fetchKeys = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/sessions/${sessionId}/keys`, {
        headers: getAuthHeaders(),
      })
      const data = await res.json()
      if (data.keys) {
        setKeys(data.keys)
      }
    } catch (err: any) {
      console.error(err)
      setError('Gagal memuat daftar kunci akses')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchKeys()
      setError('')
      setLabel('')
      setSelectedHours(24)
      setIsCustom(false)
    }
  }, [isOpen, sessionId])

  if (!isOpen) return null

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setCreating(true)

    const hours = isCustom ? Math.max(1, parseInt(customHours, 10) || 24) : selectedHours

    try {
      const res = await fetch(`/api/sessions/${sessionId}/keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          hoursValid: hours,
          label: label.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Gagal membuat kunci akses')
      }
      setLabel('')
      await fetchKeys()
    } catch (err: any) {
      setError(err.message || 'Gagal membuat kunci akses')
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteKey = async (keyId: number) => {
    if (!confirm('Cabut kunci akses ini? Murid tidak dapat lagi mengakses skenario menggunakan kunci ini.')) {
      return
    }

    try {
      const res = await fetch(`/api/sessions/${sessionId}/keys/${keyId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (res.ok) {
        setKeys((prev) => prev.filter((k) => k.id !== keyId))
      }
    } catch (err) {
      console.error(err)
      alert('Gagal mencabut kunci akses')
    }
  }

  const handleCopyKey = (k: AccessKeyItem) => {
    navigator.clipboard.writeText(k.key)
    setCopiedKeyId(k.id)
    setTimeout(() => setCopiedKeyId(null), 2000)
  }

  const handleCopyStudentLink = (k: AccessKeyItem) => {
    const studentUrl = `${window.location.origin}/view/${sessionId}?key=${k.key}`
    navigator.clipboard.writeText(studentUrl)
    setCopiedLinkId(k.id)
    setTimeout(() => setCopiedLinkId(null), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-100 text-amber-700">
                <Key size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-800">Kelola Kunci Akses Murid</h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 line-clamp-1">
              Skenario: <span className="font-semibold text-slate-700">{sessionTitle}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Buat Kunci Baru */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Plus size={15} className="text-blue-600" />
              Buat Kunci Akses Baru
            </h3>

            <form onSubmit={handleCreateKey} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1.5">
                  Masa Berlaku Kunci:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESETS.map((p) => {
                    const active = !isCustom && selectedHours === p.hours
                    return (
                      <button
                        key={p.hours}
                        type="button"
                        onClick={() => {
                          setSelectedHours(p.hours)
                          setIsCustom(false)
                        }}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                          active
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {p.label}
                      </button>
                    )
                  })}
                  <button
                    type="button"
                    onClick={() => setIsCustom(true)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                      isCustom
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    Custom Jam
                  </button>
                </div>

                {isCustom && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={8760}
                      value={customHours}
                      onChange={(e) => setCustomHours(e.target.value)}
                      className="w-28 text-xs px-3 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Contoh: 48"
                    />
                    <span className="text-xs text-slate-500">Jam dari sekarang</span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">
                  Label / Keterangan (Opsional):
                </label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder='Misal: "Kelas 10 IPS 1", "Tugas Mandiri"'
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder-slate-400"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                >
                  <Key size={14} />
                  <span>{creating ? 'Membuat Kunci...' : 'Buat Kunci Akses'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Daftar Kunci */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Clock size={15} className="text-slate-400" />
                Daftar Kunci Akses ({keys.length})
              </h3>
            </div>

            {loading ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2" />
                <span>Memuat daftar kunci...</span>
              </div>
            ) : keys.length === 0 ? (
              <div className="text-center py-8 border border-dashed border-slate-200 rounded-xl text-slate-400">
                <Key size={28} className="mx-auto mb-2 opacity-30" />
                <p className="text-xs font-medium">Belum ada kunci akses</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Buat kunci akses pertama di atas untuk dibagikan ke murid.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
                {keys.map((k) => {
                  const remaining = getRemainingTime(k.expiresAt)
                  const isExpired = k.isExpired || remaining.isExpired

                  return (
                    <div
                      key={k.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <code className="text-sm font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                            {k.key}
                          </code>
                          {k.label && (
                            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium">
                              {k.label}
                            </span>
                          )}
                          {isExpired ? (
                            <span className="text-[11px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-semibold">
                              Kedaluwarsa
                            </span>
                          ) : (
                            <span className="text-[11px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {remaining.text}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Berakhir:{' '}
                          {new Date(k.expiresAt).toLocaleString('id-ID', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          })}
                        </div>
                      </div>

                      {/* Tombol aksi */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyKey(k)}
                          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center gap-1 transition-colors"
                          title="Salin Kode Kunci"
                        >
                          {copiedKeyId === k.id ? (
                            <>
                              <Check size={13} className="text-emerald-600" />
                              <span className="text-emerald-600">Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              <span>Salin Kunci</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopyStudentLink(k)}
                          className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium flex items-center gap-1 transition-colors"
                          title="Salin Tautan Khusus Murid"
                        >
                          {copiedLinkId === k.id ? (
                            <>
                              <Check size={13} className="text-emerald-600" />
                              <span className="text-emerald-600">Link Tersalin!</span>
                            </>
                          ) : (
                            <>
                              <ExternalLink size={13} />
                              <span>Salin Link Murid</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteKey(k.id)}
                          className="p-1.5 rounded-lg border border-slate-200 hover:border-red-200 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                          title="Cabut Kunci Akses"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}
