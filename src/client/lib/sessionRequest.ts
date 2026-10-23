/**
 * Pembentukan request sesi + pemetaan penolakan server.
 *
 * Dua keputusan di sini bisa salah secara diam-diam dan tidak terlihat dari
 * render komponen, jadi keduanya diekstrak sebagai fungsi murni agar bisa diuji
 * tanpa merender ViewPage (900+ baris).
 */

import { getAuthHeaders } from './auth'

export interface SessionRequest {
  url: string
  headers: Record<string, string>
}

/**
 * Bangun URL + header untuk mengambil satu sesi.
 *
 * - Siswa: kunci dikirim sebagai `?key=`.
 * - Guru: token dikirim sebagai `Authorization`, kunci tidak wajib.
 * Kunci dinormalkan (trim + huruf besar) karena kunci disimpan dalam bentuk itu.
 */
export function buildSessionRequest(
  id: string,
  key: string | null | undefined,
  isTeacher: boolean
): SessionRequest {
  const params = new URLSearchParams()
  const normalizedKey = (key || '').trim().toUpperCase()
  if (normalizedKey) params.set('key', normalizedKey)

  const query = params.toString()
  const url = `/api/sessions/${encodeURIComponent(id)}${query ? `?${query}` : ''}`

  // Pakai helper auth yang sudah ada agar nama kunci token tidak diduplikasi.
  const headers: Record<string, string> = isTeacher ? getAuthHeaders() : {}

  return { url, headers }
}

/** Alasan penolakan yang dikenali UI. */
export type AccessDenial = 'missing_key' | 'not_found' | 'expired'

/**
 * Petakan respons server menjadi alasan penolakan.
 *
 * Server menjawab 403 dengan `{ reason }`. Bila alasannya tidak dikenal, pakai
 * 'not_found' agar siswa melihat pesan yang bisa ditindaklanjuti, bukan layar
 * kosong. Respons non-403 berarti tidak ada penolakan.
 */
export function accessDenialFrom(
  status: number,
  body: { reason?: string } | null | undefined
): AccessDenial | null {
  if (status !== 403) return null
  const reason = body?.reason
  if (reason === 'missing_key' || reason === 'expired' || reason === 'not_found') return reason
  return 'not_found'
}
