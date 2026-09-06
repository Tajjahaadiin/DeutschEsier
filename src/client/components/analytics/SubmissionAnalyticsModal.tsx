import React, { useState, useEffect } from 'react'
import {
  X,
  Users,
  TrendingUp,
  Target,
  Trophy,
  Search,
  ChevronRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Volume2,
  Calendar,
  Key,
  BarChart3,
  HelpCircle,
} from 'lucide-react'
import { getAuthHeaders } from '../../lib/auth'
import { speakGerman } from '../../lib/audio'

export interface SubmissionAnalyticsModalProps {
  sessionId: string
  sessionTitle: string
  isOpen: boolean
  onClose: () => void
}

interface AnswerItem {
  questionId: string
  type: string
  title?: string
  prompt: string
  studentAnswer: string
  correctAnswer: string
  isCorrect: boolean
  indonesianHint?: string
  grammarTip?: string
  audioText?: string
  gender?: 'female' | 'male'
}

interface SubmissionItem {
  id: string
  sessionId: string
  accessKey: string
  studentName: string
  score: number
  totalQuestions: number
  correctAnswers: number
  answers: AnswerItem[]
  submittedAt: string
}

interface StatsData {
  totalSubmissions: number
  averageScore: number
  passRate: number
  highestScore: number
  distribution: {
    '0-40': number
    '41-60': number
    '61-80': number
    '81-100': number
  }
}

export default function SubmissionAnalyticsModal({
  sessionId,
  sessionTitle,
  isOpen,
  onClose,
}: SubmissionAnalyticsModalProps) {
  const [submissions, setSubmissions] = useState<SubmissionItem[]>([])
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSubmission, setSelectedSubmission] = useState<SubmissionItem | null>(null)

  const fetchData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/sessions/${sessionId}/submissions`, {
        headers: getAuthHeaders(),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)

      setSubmissions(data.submissions || [])
      setStats(data.stats || null)
    } catch (err: any) {
      console.error(err)
      setError('Gagal memuat data analitik hasil kuis')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchData()
      setSelectedSubmission(null)
      setSearchTerm('')
      setError('')
    }
  }, [isOpen, sessionId])

  if (!isOpen) return null

  // Filter submissions by search term
  const filteredSubmissions = submissions.filter((s) =>
    s.studentName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getScoreBadge = (score: number) => {
    if (score >= 81) return 'bg-emerald-100 text-emerald-800 border-emerald-200'
    if (score >= 61) return 'bg-blue-100 text-blue-800 border-blue-200'
    if (score >= 41) return 'bg-amber-100 text-amber-800 border-amber-200'
    return 'bg-rose-100 text-rose-800 border-rose-200'
  }

  const distribution = stats?.distribution || {
    '0-40': 0,
    '41-60': 0,
    '61-80': 0,
    '81-100': 0,
  }

  const maxDistCount = Math.max(
    1,
    distribution['0-40'],
    distribution['41-60'],
    distribution['61-80'],
    distribution['81-100']
  )

  const distConfig = [
    {
      key: '0-40',
      label: '0–40',
      sublabel: 'Perlu Remedial',
      count: distribution['0-40'],
      color: 'from-rose-500 to-red-600',
      textColor: 'text-rose-600',
    },
    {
      key: '41-60',
      label: '41–60',
      sublabel: 'Cukup',
      count: distribution['41-60'],
      color: 'from-amber-400 to-amber-500',
      textColor: 'text-amber-600',
    },
    {
      key: '61-80',
      label: '61–80',
      sublabel: 'Baik',
      count: distribution['61-80'],
      color: 'from-sky-500 to-blue-600',
      textColor: 'text-blue-600',
    },
    {
      key: '81-100',
      label: '81–100',
      sublabel: 'Sangat Baik',
      count: distribution['81-100'],
      color: 'from-emerald-500 to-green-600',
      textColor: 'text-emerald-600',
    },
  ]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
                <BarChart3 size={20} />
              </div>
              <h2 className="text-lg font-bold text-slate-800">
                Dashboard Analitik & Hasil Kuis
              </h2>
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
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <div className="animate-spin w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3" />
              <span>Memuat data analitik kuis...</span>
            </div>
          ) : selectedSubmission ? (
            /* DETAIL JAWABAN SISWA (DRAWER / SUB-VIEW) */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedSubmission(null)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                >
                  <ArrowLeft size={16} />
                  <span>Kembali ke Daftar Siswa</span>
                </button>
                <span className="text-xs text-slate-400">
                  {new Date(selectedSubmission.submittedAt).toLocaleString('id-ID', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </span>
              </div>

              {/* Ringkasan Nilai Siswa */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {selectedSubmission.studentName}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 flex-wrap text-xs text-slate-500">
                    {selectedSubmission.accessKey && (
                      <span className="flex items-center gap-1 font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                        <Key size={12} />
                        {selectedSubmission.accessKey}
                      </span>
                    )}
                    <span>
                      Soal Benar: <strong>{selectedSubmission.correctAnswers}</strong> dari{' '}
                      <strong>{selectedSubmission.totalQuestions}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-[11px] font-bold text-slate-400 uppercase">
                      Nilai Siswa
                    </div>
                    <div className="text-3xl font-extrabold text-blue-600">
                      {selectedSubmission.score}
                      <span className="text-sm font-normal text-slate-400">/100</span>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${getScoreBadge(
                      selectedSubmission.score
                    )}`}
                  >
                    {selectedSubmission.score >= 70 ? 'Lulus' : 'Remedial'}
                  </span>
                </div>
              </div>

              {/* Rincian Jawaban Soal per Soal */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Rincian Jawaban Soal ({selectedSubmission.answers?.length || 0})
                </h4>

                {(!selectedSubmission.answers || selectedSubmission.answers.length === 0) ? (
                  <p className="text-xs text-slate-400 italic py-4 text-center">
                    Tidak ada rincian jawaban tersimpan untuk siswa ini.
                  </p>
                ) : (
                  selectedSubmission.answers.map((ans, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-xl border text-xs space-y-2 ${
                        ans.isCorrect
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : 'bg-rose-50/40 border-rose-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1 rounded-lg ${
                              ans.isCorrect
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-rose-100 text-rose-700'
                            }`}
                          >
                            {ans.isCorrect ? (
                              <CheckCircle2 size={16} />
                            ) : (
                              <XCircle size={16} />
                            )}
                          </span>
                          <span className="font-bold text-slate-800">
                            Soal #{idx + 1} ({ans.type === 'dictation' ? 'Diktat' : 'Lückentext'})
                          </span>
                        </div>

                        {ans.audioText && (
                          <button
                            type="button"
                            onClick={() => {
                              const textToSpeak = ans.audioText || ans.correctAnswer
                              if (textToSpeak && typeof textToSpeak === 'string') {
                                speakGerman(textToSpeak, { gender: 'female' })
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                            title="Dengarkan audio kata/kalimat"
                          >
                            <Volume2 size={12} className="text-blue-600" />
                            <span>Audio</span>
                          </button>
                        )}
                      </div>

                      <p className="text-slate-600 font-medium">{ans.prompt}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        <div
                          className={`p-2.5 rounded-lg border ${
                            ans.isCorrect
                              ? 'bg-emerald-100/50 border-emerald-200 text-emerald-900'
                              : 'bg-rose-100/50 border-rose-200 text-rose-900'
                          }`}
                        >
                          <span className="block text-[10px] uppercase font-bold opacity-75">
                            Jawaban Siswa:
                          </span>
                          <span className="font-semibold text-sm">
                            {String(ans.studentAnswer ?? '-')}
                          </span>
                        </div>

                        <div className="p-2.5 rounded-lg border bg-white border-slate-200 text-slate-800">
                          <span className="block text-[10px] uppercase font-bold text-slate-400">
                            Kunci Jawaban Benar:
                          </span>
                          <span className="font-bold text-sm text-blue-700">
                            {String(ans.correctAnswer ?? '-')}
                          </span>
                        </div>
                      </div>

                      {(ans.indonesianHint || ans.grammarTip) && (
                        <div className="text-[11px] text-slate-500 pt-1 space-y-0.5 border-t border-slate-200/60">
                          {ans.indonesianHint && (
                            <div>
                              🇮🇩 <strong>Arti:</strong> {ans.indonesianHint}
                            </div>
                          )}
                          {ans.grammarTip && (
                            <div className="text-amber-700">
                              💡 <strong>Tip Grammar:</strong> {ans.grammarTip}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* TAMPILAN DASHBOARD UTAMA (METRIK, CHART, TABEL) */
            <>
              {/* 4 Kartu Metrik Ringkas */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Total Siswa */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Users size={16} className="text-blue-600" />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Total Siswa
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-slate-900">
                    {stats?.totalSubmissions || 0}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Sudah mengumpulkan</div>
                </div>

                {/* Rata-Rata Nilai */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <TrendingUp size={16} className="text-indigo-600" />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Rata-Rata
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-indigo-600">
                    {stats?.averageScore || 0}
                    <span className="text-xs font-normal text-slate-400">/100</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Nilai rata-rata kelas</div>
                </div>

                {/* Tingkat Kelulusan */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Target size={16} className="text-emerald-600" />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Kelulusan
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-emerald-600">
                    {stats?.passRate || 0}%
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Nilai KKM ≥ 70</div>
                </div>

                {/* Nilai Tertinggi */}
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Trophy size={16} className="text-amber-500" />
                    <span className="text-xs font-semibold uppercase tracking-wider">
                      Tertinggi
                    </span>
                  </div>
                  <div className="text-2xl font-extrabold text-amber-600">
                    {stats?.highestScore || 0}
                    <span className="text-xs font-normal text-slate-400">/100</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Skor maksimal kelas</div>
                </div>
              </div>

              {/* DIAGRAM BATANG DISTRIBUSI NILAI */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <BarChart3 size={15} className="text-blue-600" />
                    Distribusi Nilai Siswa (Score Distribution)
                  </h3>
                  <span className="text-xs text-slate-400">
                    Berdasarkan {stats?.totalSubmissions || 0} siswa
                  </span>
                </div>

                {stats && stats.totalSubmissions > 0 ? (
                  <div className="grid grid-cols-4 gap-3 sm:gap-6 pt-4 pb-2 items-end h-48 sm:h-52">
                    {distConfig.map((item) => {
                      const heightPercent = Math.max(12, Math.round((item.count / maxDistCount) * 100))
                      const percentOfTotal =
                        stats.totalSubmissions > 0
                          ? Math.round((item.count / stats.totalSubmissions) * 100)
                          : 0

                      return (
                        <div key={item.key} className="flex flex-col items-center h-full justify-end group">
                          {/* Label Jumlah & Persentase */}
                          <div className="text-center mb-2 transition-transform group-hover:-translate-y-0.5">
                            <span className={`text-xs sm:text-sm font-extrabold ${item.textColor}`}>
                              {item.count}
                            </span>
                            <span className="block text-[10px] text-slate-400 font-medium">
                              ({percentOfTotal}%)
                            </span>
                          </div>

                          {/* Batang Diagram */}
                          <div className="w-full max-w-[56px] bg-slate-100 rounded-xl overflow-hidden flex items-end h-32 sm:h-36 p-1">
                            <div
                              className={`w-full bg-gradient-to-t ${item.color} rounded-lg transition-all duration-500 shadow-xs`}
                              style={{ height: `${heightPercent}%` }}
                            />
                          </div>

                          {/* Keterangan Interval Bawah */}
                          <div className="text-center mt-2">
                            <span className="block text-xs font-bold text-slate-700">
                              {item.label}
                            </span>
                            <span className="block text-[10px] text-slate-400 line-clamp-1">
                              {item.sublabel}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Belum ada data pengumpulan kuis untuk menampilkan diagram batang.
                  </div>
                )}
              </div>

              {/* TABEL DAFTAR SUBMISSION SISWA */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Users size={15} className="text-slate-500" />
                    Daftar Nilai Siswa ({submissions.length})
                  </h3>

                  {/* Input Search */}
                  <div className="relative max-w-xs w-full">
                    <Search
                      size={14}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                    />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Cari nama siswa..."
                      className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder-slate-400"
                    />
                  </div>
                </div>

                {submissions.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl text-slate-400">
                    <HelpCircle size={32} className="mx-auto mb-2 opacity-30" />
                    <p className="text-xs font-medium">Belum ada murid yang mengerjakan kuis.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Bagikan link kuis atau kunci akses kepada murid untuk mulai mengumpulkan nilai.
                    </p>
                  </div>
                ) : filteredSubmissions.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">
                    Tidak ditemukan siswa dengan nama "{searchTerm}".
                  </div>
                ) : (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                          <tr>
                            <th className="py-3 px-4">Nama Siswa</th>
                            <th className="py-3 px-3 text-center">Nilai</th>
                            <th className="py-3 px-3 text-center">Benar / Total</th>
                            <th className="py-3 px-3">Kunci Akses</th>
                            <th className="py-3 px-3">Waktu Pengumpulan</th>
                            <th className="py-3 px-4 text-right">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {filteredSubmissions.map((sub) => (
                            <tr
                              key={sub.id}
                              className="hover:bg-slate-50/70 transition-colors"
                            >
                              <td className="py-3 px-4 font-semibold text-slate-900">
                                {sub.studentName}
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-xs border ${getScoreBadge(
                                    sub.score
                                  )}`}
                                >
                                  {sub.score}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center font-medium text-slate-600">
                                {sub.correctAnswers} / {sub.totalQuestions}
                              </td>
                              <td className="py-3 px-3 font-mono text-[11px] text-slate-500">
                                {sub.accessKey ? (
                                  <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                    {sub.accessKey}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">-</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-slate-500 text-[11px]">
                                {new Date(sub.submittedAt).toLocaleString('id-ID', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short',
                                })}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => setSelectedSubmission(sub)}
                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-colors cursor-pointer"
                                >
                                  <span>Lihat Detail</span>
                                  <ChevronRight size={13} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
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
