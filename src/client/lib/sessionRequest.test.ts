// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest'
import { buildSessionRequest, accessDenialFrom } from './sessionRequest'
import { TEACHER_TOKEN_KEY } from './auth'


beforeEach(() => {
  localStorage.clear()
})

describe('buildSessionRequest', () => {
  it('siswa tanpa kunci: URL tanpa ?key dan tanpa Authorization', () => {
    const req = buildSessionRequest('sess-1', null, false)

    expect(req.url).toBe('/api/sessions/sess-1')
    expect(req.headers.Authorization).toBeUndefined()
  })

  it('siswa dengan kunci: kunci masuk ke URL, dinormalkan', () => {
    const req = buildSessionRequest('sess-1', '  de-abcde  ', false)

    expect(req.url).toBe('/api/sessions/sess-1?key=DE-ABCDE')
  })

  it('guru: token dikirim, kunci tidak wajib', () => {
    localStorage.setItem(TEACHER_TOKEN_KEY, 'tok-123')

    const req = buildSessionRequest('sess-1', null, true)

    expect(req.url).toBe('/api/sessions/sess-1')
    expect(req.headers.Authorization).toBe('Bearer tok-123')
  })

  it('guru yang juga membawa kunci: keduanya dikirim', () => {
    localStorage.setItem(TEACHER_TOKEN_KEY, 'tok-123')

    const req = buildSessionRequest('sess-1', 'DE-ABCDE', true)

    expect(req.url).toBe('/api/sessions/sess-1?key=DE-ABCDE')
    expect(req.headers.Authorization).toBe('Bearer tok-123')
  })

  it('id di-encode agar aman di URL', () => {
    expect(buildSessionRequest('a b', null, false).url).toBe('/api/sessions/a%20b')
  })
})

describe('accessDenialFrom', () => {
  it('null untuk respons yang bukan 403', () => {
    expect(accessDenialFrom(200, null)).toBeNull()
    expect(accessDenialFrom(500, { reason: 'expired' })).toBeNull()
  })

  it('meneruskan alasan yang dikenal', () => {
    expect(accessDenialFrom(403, { reason: 'missing_key' })).toBe('missing_key')
    expect(accessDenialFrom(403, { reason: 'expired' })).toBe('expired')
    expect(accessDenialFrom(403, { reason: 'not_found' })).toBe('not_found')
  })

  it('403 tanpa alasan dikenal jatuh ke not_found, bukan layar kosong', () => {
    expect(accessDenialFrom(403, {})).toBe('not_found')
    expect(accessDenialFrom(403, null)).toBe('not_found')
  })
})
