import { execSync } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { NUMBER_ITEMS } from '../src/client/data/numberData'
import { GAME_NUMBERS } from '../src/client/pages/NumberPage'
import { OBJECT_ITEMS } from '../src/client/data/objectData'
import { combineNumberAndNoun } from '../src/client/lib/numberGame'

const NUMBERS_DIR = join(process.cwd(), 'public/audio/numbers')
const GAME_DIR = join(process.cwd(), 'public/audio/number-game')

if (!existsSync(NUMBERS_DIR)) mkdirSync(NUMBERS_DIR, { recursive: true })
if (!existsSync(GAME_DIR)) mkdirSync(GAME_DIR, { recursive: true })

const THORSTEN_MODEL = '/tmp/piper_voices/de_DE-thorsten-medium.onnx'
const PIPER_BIN = '/home/tajjz/.local/bin/piper'

console.log(`=== 1. PRE-GENERATION KARTU ANGKA (0-100, 1k, 10k, 1M) ===`)
for (let i = 0; i < NUMBER_ITEMS.length; i++) {
  const item = NUMBER_ITEMS[i]
  const outPath = join(NUMBERS_DIR, `${item.value}.wav`)
  execSync(`echo "${item.german}" | ${PIPER_BIN} -m ${THORSTEN_MODEL} -f "${outPath}"`)
  console.log(`[${i + 1}/${NUMBER_ITEMS.length}] Angka ${item.value}: "${item.german}" -> ${item.value}.wav`)
}

console.log(`\n=== 2. PRE-GENERATION GAME HITUNG DETERMINISTIK (10 Angka x 24 Benda) ===`)
let gameCount = 0
for (const n of GAME_NUMBERS) {
  for (const obj of OBJECT_ITEMS) {
    const combined = combineNumberAndNoun(n, obj)
    const slug = `${n}-${obj.noun.toLowerCase()}`
    const outPath = join(GAME_DIR, `${slug}.wav`)
    execSync(`echo "${combined.german}" | ${PIPER_BIN} -m ${THORSTEN_MODEL} -f "${outPath}"`)
    gameCount++
  }
  console.log(`Selesai kombinasi untuk angka ${n} (24 benda)...`)
}

console.log(`\nSukses! Total ${NUMBER_ITEMS.length} audio angka dan ${gameCount} audio game hitung Martin berhasil dibuat!`)
