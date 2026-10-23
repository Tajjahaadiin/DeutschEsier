import { describe, it, expect } from 'vitest'
import {
  GRAMMAR_ROLES,
  isGrammarRole,
  normalizeRole,
} from './grammarRoles'

describe('grammarRoles — single source of truth for sentence segment roles', () => {
  it('mendefinisikan tepat 4 peran gramatikal baku', () => {
    expect(GRAMMAR_ROLES).toEqual(['subjekt', 'praedikat', 'objekt', 'other'])
  })

  it('isGrammarRole mengidentifikasi peran yang sah', () => {
    for (const role of GRAMMAR_ROLES) {
      expect(isGrammarRole(role)).toBe(true)
    }
    expect(isGrammarRole('verb')).toBe(false)
    expect(isGrammarRole('')).toBe(false)
    expect(isGrammarRole(null)).toBe(false)
  })

  it('normalizeRole mengembalikan peran yang sah apa adanya', () => {
    expect(normalizeRole('subjekt')).toBe('subjekt')
    expect(normalizeRole('praedikat')).toBe('praedikat')
    expect(normalizeRole('objekt')).toBe('objekt')
    expect(normalizeRole('other')).toBe('other')
  })

  it('normalizeRole memetakan peran yang tidak dikenal ke "other"', () => {
    expect(normalizeRole('adverb')).toBe('other')
    expect(normalizeRole('keterangan')).toBe('other')
    expect(normalizeRole(undefined)).toBe('other')
    expect(normalizeRole(123)).toBe('other')
  })
})
