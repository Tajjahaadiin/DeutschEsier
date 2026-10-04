import { describe, it, expect } from 'vitest'
import { numberWord, combineNumberAndNoun, type NumberObject } from './numberGame'

const tomate: NumberObject = { noun: 'Tomate', article: 'die', plural: 'Tomaten', emoji: '🍅', meaningId: 'tomat' }
const apfel: NumberObject = { noun: 'Apfel', article: 'der', plural: 'Äpfel', emoji: '🍎', meaningId: 'apel' }
const glas: NumberObject = { noun: 'Glas', article: 'das', plural: 'Gläser', emoji: '🥛', meaningId: 'gelas' }

describe('numberWord', () => {
  it('mengucapkan angka 0-12', () => {
    expect(numberWord(0)).toBe('null')
    expect(numberWord(1)).toBe('eins')
    expect(numberWord(3)).toBe('drei')
    expect(numberWord(11)).toBe('elf')
    expect(numberWord(12)).toBe('zwölf')
  })

  it('menyusun angka 13-20', () => {
    expect(numberWord(13)).toBe('dreizehn')
    expect(numberWord(16)).toBe('sechzehn')
    expect(numberWord(20)).toBe('zwanzig')
  })

  it('menyusun puluhan dan gabungan di atas 20', () => {
    expect(numberWord(21)).toBe('einundzwanzig')
    expect(numberWord(30)).toBe('dreißig')
    expect(numberWord(42)).toBe('zweiundvierzig')
    expect(numberWord(100)).toBe('hundert')
  })
})

describe('combineNumberAndNoun', () => {
  it('memakai artikel yang sesuai jenis kelamin untuk angka 1', () => {
    expect(combineNumberAndNoun(1, tomate).german).toBe('eine Tomate')
    expect(combineNumberAndNoun(1, apfel).german).toBe('ein Apfel')
    expect(combineNumberAndNoun(1, glas).german).toBe('ein Glas')
  })

  it('memakai bentuk jamak untuk angka lebih dari satu', () => {
    expect(combineNumberAndNoun(2, tomate).german).toBe('zwei Tomaten')
    expect(combineNumberAndNoun(3, apfel).german).toBe('drei Äpfel')
    expect(combineNumberAndNoun(4, glas).german).toBe('vier Gläser')
  })

  it('memakai bentuk jamak dengan angka besar', () => {
    expect(combineNumberAndNoun(21, tomate).german).toBe('einundzwanzig Tomaten')
    expect(combineNumberAndNoun(100, apfel).german).toBe('hundert Äpfel')
  })

  it('tidak memakai bentuk jamak untuk angka 0', () => {
    // "null Tomaten" secara tata bahasa tetap jamak.
    expect(combineNumberAndNoun(0, tomate).german).toBe('null Tomaten')
  })

  it('menyertakan terjemahan Indonesia dan audio', () => {
    const result = combineNumberAndNoun(2, tomate)

    expect(result.indonesian).toBe('2 tomat')
    expect(result.audioText).toBe('zwei Tomaten')
    expect(result.emoji).toBe('🍅')
  })
})
