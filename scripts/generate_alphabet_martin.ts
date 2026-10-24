import { execSync } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { GERMAN_ALPHABET } from '../src/client/data/alphabetData'

const OUTPUT_DIR = join(process.cwd(), 'public/audio/alphabet')
if (!existsSync(OUTPUT_DIR)) {
  mkdirSync(OUTPUT_DIR, { recursive: true })
}

const THORSTEN_MODEL = '/tmp/piper_voices/de_DE-thorsten-medium.onnx'
const PIPER_BIN = '/home/tajjz/.local/bin/piper'

console.log(`Memulai pre-generation audio Kartu Alfabet (30 huruf x 2 audio: Eja & Contoh Kata)...`)
console.log(`Target: ${OUTPUT_DIR}\n`)

let total = 0

for (let i = 0; i < GERMAN_ALPHABET.length; i++) {
  const item = GERMAN_ALPHABET[i]
  const id = item.id // misal: 'a', 'ae', 'b', 'c', 'sz', dll.

  // 1. Audio Eja Huruf: /audio/alphabet/{id}-letter.wav
  const letterText = item.audioText.letterOnly
  const letterPath = join(OUTPUT_DIR, `${id}-letter.wav`)
  execSync(`echo "${letterText}" | ${PIPER_BIN} -m ${THORSTEN_MODEL} -f "${letterPath}"`)
  total++

  // 2. Audio Contoh Kata: /audio/alphabet/{id}-word.wav
  const wordText = item.audioText.exampleWord
  const wordPath = join(OUTPUT_DIR, `${id}-word.wav`)
  execSync(`echo "${wordText}" | ${PIPER_BIN} -m ${THORSTEN_MODEL} -f "${wordPath}"`)
  total++

  console.log(`[${i + 1}/${GERMAN_ALPHABET.length}] Selesai: Huruf ${item.letter} ("${letterText}") & Contoh ("${wordText}")`)
}

console.log(`\nSukses! Total ${total} file audio Kartu Alfabet (Martin) berhasil dibuat di public/audio/alphabet/`)
