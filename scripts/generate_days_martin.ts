import { execSync } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { WEEKDAYS, MONTHS, TIME_CONTEXTS, HOLIDAY_LIST } from '../src/client/lib/calendar'

const DAYS_DIR = join(process.cwd(), 'public/audio/days')
if (!existsSync(DAYS_DIR)) {
  mkdirSync(DAYS_DIR, { recursive: true })
}

const THORSTEN_MODEL = '/tmp/piper_voices/de_DE-thorsten-medium.onnx'
const PIPER_BIN = '/home/tajjz/.local/bin/piper'

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

console.log(`=== PRE-GENERATION DIE TAGE (Hari, Bulan, Waktu, Hari Libur) ===`)
console.log(`Target: ${DAYS_DIR}\n`)

let count = 0

// 1. Nama Hari (7)
for (const day of WEEKDAYS) {
  const slug = toSlug(day.german)
  const outPath = join(DAYS_DIR, `${slug}.wav`)
  execSync(`echo "${day.german}" | ${PIPER_BIN} -m ${THORSTEN_MODEL} -f "${outPath}"`)
  count++
  console.log(`[Hari] ${day.german} -> ${slug}.wav`)
}

// 2. Nama Bulan (12)
for (const month of MONTHS) {
  const slug = toSlug(month.german)
  const outPath = join(DAYS_DIR, `${slug}.wav`)
  execSync(`echo "${month.german}" | ${PIPER_BIN} -m ${THORSTEN_MODEL} -f "${outPath}"`)
  count++
  console.log(`[Bulan] ${month.german} -> ${slug}.wav`)
}

// 3. Konteks Waktu (9)
for (const ctx of TIME_CONTEXTS) {
  const slug = toSlug(ctx.german)
  const outPath = join(DAYS_DIR, `${slug}.wav`)
  execSync(`echo "${ctx.german}" | ${PIPER_BIN} -m ${THORSTEN_MODEL} -f "${outPath}"`)
  count++
  console.log(`[Waktu] ${ctx.german} -> ${slug}.wav`)
}

// 4. Hari Libur (5)
for (const hol of HOLIDAY_LIST) {
  const slug = toSlug(hol.german)
  const outPath = join(DAYS_DIR, `${slug}.wav`)
  execSync(`echo "${hol.german}" | ${PIPER_BIN} -m ${THORSTEN_MODEL} -f "${outPath}"`)
  count++
  console.log(`[Hari Libur] ${hol.german} -> ${slug}.wav`)
}

console.log(`\nSukses! Total ${count} audio statis die Tage (Martin) berhasil dibuat di public/audio/days/`)
