import React, { useState } from 'react'
import { BookOpen, Lock, Eye, EyeOff, Loader2, Sparkles, AlertCircle } from 'lucide-react'
import { loginTeacher } from '../lib/auth'

export default function LoginPage({ navigate }: { navigate: (path: string) => void }) {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password) {
      setError('Silakan masukkan password guru')
      return
    }

    setLoading(true)
    setError('')

    const res = await loginTeacher(password)
    setLoading(false)

    if (res.success) {
      navigate('/')
    } else {
      setError(res.error || 'Password salah')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white text-center relative">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm mb-3 shadow-inner">
              <BookOpen size={30} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">DeutschEasier</h1>
            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-500/30 border border-white/20 text-xs font-semibold text-blue-100">
              <Sparkles size={12} />
              <span>Portal Khusus Guru (Lehrer)</span>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 sm:p-8">
            {/* Description */}
            <p className="text-sm text-slate-600 leading-relaxed mb-6 text-center">
              Guru dapat membuat skenario percakapan AI, mengelola bank kata kognat, membuat kunci akses berbatas waktu untuk murid, dan memantau analitik nilai kuis.
            </p>

            {/* Error state */}
            {error && (
              <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-red-700 text-sm">
                <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Password / PIN Guru
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password..."
                    disabled={loading}
                    className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {/* Hint */}
                <p className="mt-2 text-xs text-slate-400">
                  Hint: Password default: <code className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 font-mono text-[11px]">guru123</code> (dikonfigurasi melalui file .env)
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <span>Masuk ke Dashboard Guru</span>
                )}
              </button>
            </form>

            {/* Student Callout */}
            <div className="mt-8 pt-6 border-t border-slate-100">
              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/60 text-xs leading-relaxed text-amber-900">
                <span className="font-semibold block mb-1">🧑‍🎓 Apakah Anda seorang Murid?</span>
                Anda tidak memerlukan akun untuk belajar. Cukup gunakan tautan skenario yang dibagikan oleh guru Anda beserta Kunci Aksesnya.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
