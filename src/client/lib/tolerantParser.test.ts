import { describe, it, expect } from 'vitest'
import { parseTolerantArray } from './tolerantParser'

describe('parseTolerantArray', () => {
  const validator = (entry: unknown): string | null => {
    if (typeof entry === 'string' && entry.trim().length > 0) return entry.trim()
    return null
  }

  it('mengembalikan [] untuk input null, undefined, atau string kosong', () => {
    expect(parseTolerantArray(null, validator)).toEqual([])
    expect(parseTolerantArray(undefined, validator)).toEqual([])
    expect(parseTolerantArray('', validator)).toEqual([])
  })

  it('mengembalikan [] untuk JSON sintaks rusak', () => {
    expect(parseTolerantArray('{ rusak: json }', validator)).toEqual([])
  })

  it('mengembalikan [] jika hasil JSON bukan berupa array', () => {
    expect(parseTolerantArray('{"foo": "bar"}', validator)).toEqual([])
    expect(parseTolerantArray('"sebuah string"', validator)).toEqual([])
    expect(parseTolerantArray('123', validator)).toEqual([])
  })

  it('memvalidasi setiap entri dan membuang entri yang tidak lolos validator', () => {
    const raw = JSON.stringify(['halo', '', 123, 'dunia', null])
    expect(parseTolerantArray(raw, validator)).toEqual(['halo', 'dunia'])
  })

  it('meneruskan indeks ke fungsi validator', () => {
    const raw = JSON.stringify(['a', 'b'])
    const indexedValidator = (entry: unknown, idx: number) => `${idx}:${entry}`
    expect(parseTolerantArray(raw, indexedValidator)).toEqual(['0:a', '1:b'])
  })
})
