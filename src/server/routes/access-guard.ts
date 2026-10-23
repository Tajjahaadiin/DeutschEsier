import { db } from '../../db/client'
import { scenarioAccessKey } from '../../db/schema'
import { eq, and } from 'drizzle-orm'
import { isValidTeacherToken } from './auth'

/**
 * Gerbang akses untuk data sesi yang boleh dilihat/ditulis siswa.
 *
 * Siswa hanya boleh lewat bila membawa kunci akses yang valid UNTUK SESI ITU;
 * guru boleh lewat tanpa kunci. Satu tempat untuk aturan ini supaya route baca
 * dan route tulis tidak bisa menyimpang.
 */

export type AccessDenialReason = 'missing_key' | 'not_found' | 'expired'

export type AccessResult =
  | { allowed: true }
  | { allowed: false; reason: AccessDenialReason }

/**
 * Apakah pemeriksaan kunci diaktifkan.
 *
 * Default MATI supaya link lama tanpa `?key=` tetap hidup. Nyalakan lewat
 * env `REQUIRE_ACCESS_KEY=true` setelah link yang beredar diverifikasi.
 * Dibaca saat request (bukan saat modul dimuat) agar mudah diuji.
 */
export function accessKeyRequired(): boolean {
  return process.env.REQUIRE_ACCESS_KEY === 'true'
}

/** Ambil token guru dari header Authorization atau X-Teacher-Token. */
export function teacherTokenFrom(headers: {
  get(name: string): string | null
}): string {
  const authHeader = headers.get('Authorization')
  const explicit = headers.get('X-Teacher-Token')
  if (explicit) return explicit
  if (!authHeader) return ''
  return authHeader.startsWith('Bearer ') ? authHeader.substring(7).trim() : authHeader.trim()
}

export function isTeacherRequest(headers: { get(name: string): string | null }): boolean {
  const token = teacherTokenFrom(headers)
  return Boolean(token) && isValidTeacherToken(token)
}

/**
 * Periksa kunci akses untuk satu sesi.
 *
 * Kunci selalu difilter berdasarkan `sessionId`, jadi kunci milik sesi lain
 * tidak pernah lolos walau valid di database.
 */
export async function verifySessionKey(
  sessionId: string,
  rawKey: string | null | undefined
): Promise<AccessResult> {
  const key = (rawKey || '').trim().toUpperCase()
  if (!key) return { allowed: false, reason: 'missing_key' }

  const [found] = await db
    .select()
    .from(scenarioAccessKey)
    .where(
      and(
        eq(scenarioAccessKey.sessionId, sessionId),
        eq(scenarioAccessKey.key, key),
        eq(scenarioAccessKey.isActive, true)
      )
    )
    .limit(1)

  if (!found) return { allowed: false, reason: 'not_found' }

  // Jangan percaya filter query saja: pastikan baris yang kembali memang milik
  // sesi ini, supaya kunci sesi lain tidak pernah lolos walau query berubah.
  if (found.sessionId !== sessionId) return { allowed: false, reason: 'not_found' }

  if (new Date(found.expiresAt) < new Date()) return { allowed: false, reason: 'expired' }

  return { allowed: true }
}

/**
 * Aturan lengkap: guru selalu boleh; selain itu kunci wajib bila fitur menyala.
 * Saat fitur mati, semua boleh (perilaku lama dipertahankan).
 */
export async function authorizeSessionAccess(
  headers: { get(name: string): string | null },
  sessionId: string,
  rawKey: string | null | undefined
): Promise<AccessResult> {
  if (isTeacherRequest(headers)) return { allowed: true }
  if (!accessKeyRequired()) return { allowed: true }
  return verifySessionKey(sessionId, rawKey)
}
