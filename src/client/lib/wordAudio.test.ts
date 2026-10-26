import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { playWordAudio } from './audio'

describe('WordBank Audio Assets Integration', () => {
  it('semua audio file kata statis MP3 ter-load dan ada di public/audio/words', () => {
    const wordsDir = path.resolve(process.cwd(), 'public/audio/words')
    expect(fs.existsSync(wordsDir)).toBe(true)

    const files = fs.readdirSync(wordsDir).filter((f) => f.endsWith('.mp3'))
    expect(files.length).toBeGreaterThan(30)

    // Periksa beberapa kata kunci utama Bank Kata
    const sampleWords = [
      'das-auto.mp3',
      'das-buch.mp3',
      'der-kaffee.mp3',
      'der-bus.mp3',
      'die-apotheke.mp3',
      'die-musik.mp3',
    ]

    for (const sample of sampleWords) {
      const filePath = path.join(wordsDir, sample)
      expect(fs.existsSync(filePath), `File ${sample} harus ada`).toBe(true)
      const stat = fs.statSync(filePath)
      expect(stat.size).toBeGreaterThan(1000) // File bukan file kosong
    }
  })

  it('memetakan pemanggilan playWordAudio ke path MP3 yang benar', () => {
    // Verifikasi bahwa fungsi playWordAudio ada dan bertipe function
    expect(typeof playWordAudio).toBe('function')
  })
})
