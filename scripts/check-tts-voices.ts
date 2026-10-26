/**
 * Guard untuk mendeteksi kerusakan endpoint Microsoft Edge TTS sebelum
 * dilaporkan pengguna.
 *
 * Latar belakang: 10 Oktober 2026 Microsoft memindahkan endpoint sintesis
 * (speech.platform.bing.com -> api.msedgeservices.com) dan seluruh permintaan
 * mulai gagal 403. Perbaikan satu-satunya adalah menaikkan versi pustaka,
 * karena token Sec-MS-GEC diturunkan dari versi Chromium yang dipatok di
 * dalam paket. Kerusakan jenis ini akan berulang.
 *
 * Skrip ini SENGAJA tidak ikut CI (butuh jaringan + memanggil layanan pihak
 * ketiga). Jalankan manual atau lewat cron sebelum rilis:
 *
 *   npm run tts:smoke
 *
 * Keluar dengan kode 1 bila ada suara yang gagal, supaya kegagalan tidak
 * tertukar dengan "kebetulan lambat".
 */
import { promises as fs } from 'fs'
import { join } from 'path'
import { tmpdir } from 'os'
import { EdgeTTS } from 'node-edge-tts'
import { TTS_PERSONAS, SCENARIO_PERSONAS, GRUNDLAGEN_PERSONA_ID, getTtsPersona } from '../src/shared/ttsPersonas'

/**
 * Daftar yang di-smoke bukan hanya TTS_PERSONAS: `GRUNDLAGEN_PERSONA_ID`
 * (Katja) tetap hidup sebagai resolver untuk fallback dinamis Die Grundlagen
 * walau tidak lagi diekspos sebagai persona pilihan. Kalau Katja rusak,
 * halaman Grundlagen ikut rusak saat aset statis gagal dimuat.
 */
const SMOKE_PERSONAS = [
  ...TTS_PERSONAS,
  ...SCENARIO_PERSONAS,
  getTtsPersona(GRUNDLAGEN_PERSONA_ID)!,
].filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)

const SAMPLE = 'Guten Tag! Ich heiße Bernd und wohne in Berlin.'
const TIMEOUT_MS = 15000

function looksLikeAudio(buf: Buffer): boolean {
  if (buf.length < 512) return false
  // ID3 tag atau frame sync MPEG (11 bit pertama = 1)
  const isId3 = buf[0] === 0x49 && buf[1] === 0x44 && buf[2] === 0x33
  const isMpeg = buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0
  return isId3 || isMpeg
}

async function main() {
  const failures: string[] = []
  const usedVoiceIds = new Set<string>()

  for (const persona of SMOKE_PERSONAS) {
    const out = join(tmpdir(), `tts-smoke-${persona.id}-${Date.now()}.mp3`)
    const started = Date.now()

    try {
      const tts = new EdgeTTS({
        voice: persona.voiceId,
        lang: 'de-DE',
        outputFormat: 'audio-24khz-48kbitrate-mono-mp3',
        timeout: TIMEOUT_MS,
      })
      await tts.ttsPromise(SAMPLE, out)

      const stat = await fs.stat(out)
      const head = await fs.readFile(out).then((b) => b.subarray(0, 512))
      const elapsed = Date.now() - started

      if (!looksLikeAudio(head)) {
        failures.push(`${persona.id} (${persona.voiceId}): respons bukan audio MP3`)
      } else {
        usedVoiceIds.add(persona.voiceId)
        console.log(
          `OK   ${persona.id.padEnd(9)} ${persona.voiceId.padEnd(34)} ${String(stat.size).padStart(6)} B  ${elapsed} ms`
        )
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      failures.push(`${persona.id} (${persona.voiceId}): ${message}`)
      console.error(`FAIL ${persona.id.padEnd(9)} ${persona.voiceId.padEnd(34)} ${message}`)
    } finally {
      await fs.unlink(out).catch(() => {})
    }
  }

  if (usedVoiceIds.size !== SMOKE_PERSONAS.length) {
    failures.push(
      `hanya ${usedVoiceIds.size}/${SMOKE_PERSONAS.length} persona menghasilkan audio berbeda`
    )
  }

  if (failures.length > 0) {
    console.error('\nEndpoint TTS Microsoft kemungkinan berubah lagi.')
    console.error('Periksa rilis terbaru node-edge-tts; token Sec-MS-GEC dipatok ke versi Chromium.')
    for (const failure of failures) console.error(` - ${failure}`)
    process.exit(1)
  }

  console.log(`\nSemua ${SMOKE_PERSONAS.length} persona menghasilkan audio yang valid.`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
