import * as tts from '@diffusionstudio/vits-web'

export type PersonaWasmConfig = {
  modelId: tts.VoiceId
  detuneCents: number
  playbackRate: number
  fallbackPitch: number
}

// 2 Model Dasar Neural Jerman (~16 MB & ~18 MB) membedakan 6 karakter persona di sisi klien
export const PERSONA_WASM_MAP: Record<string, PersonaWasmConfig> = {
  // WANITA (Base Model: de_DE-kerstin-low)
  'female-1': { modelId: 'de_DE-kerstin-low', detuneCents: 0, playbackRate: 0.96, fallbackPitch: 1.05 }, // Katja
  'female-2': { modelId: 'de_DE-kerstin-low', detuneCents: 180, playbackRate: 1.04, fallbackPitch: 1.2 }, // Amala
  'female-3': { modelId: 'de_DE-kerstin-low', detuneCents: -120, playbackRate: 0.94, fallbackPitch: 0.95 }, // Seraphina

  // PRIA (Base Model: de_DE-thorsten-medium)
  'male-1': { modelId: 'de_DE-thorsten-medium', detuneCents: -150, playbackRate: 0.94, fallbackPitch: 0.75 }, // Conrad
  'male-2': { modelId: 'de_DE-thorsten-medium', detuneCents: 160, playbackRate: 1.05, fallbackPitch: 0.9 }, // Killian
  'male-3': { modelId: 'de_DE-thorsten-medium', detuneCents: 0, playbackRate: 1.0, fallbackPitch: 1.0 }, // Florian
}

const memoryWavCache = new Map<string, ArrayBuffer>()
let audioCtx: AudioContext | null = null
let currentSourceNode: AudioBufferSourceNode | null = null

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    audioCtx = new AudioContextClass()
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume()
  }
  return audioCtx
}

export function stopWasmAudio() {
  if (currentSourceNode) {
    try {
      currentSourceNode.stop()
    } catch {}
    currentSourceNode.disconnect()
    currentSourceNode = null
  }
}

/**
 * Cek apakah model tertentu sudah tersimpan di OPFS browser.
 */
export async function isModelStored(voiceId: tts.VoiceId): Promise<boolean> {
  if (typeof window === 'undefined') return false
  try {
    const list = await tts.stored()
    return list.includes(voiceId)
  } catch {
    return false
  }
}

/**
 * Pre-download model Jerman ke OPFS jika belum ada.
 */
export async function prefetchGermanModel(
  voiceId: tts.VoiceId,
  onProgress?: (loaded: number, total: number) => void
): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const stored = await tts.stored()
    if (!stored.includes(voiceId)) {
      await tts.download(voiceId, (prog) => {
        if (onProgress) onProgress(prog.loaded, prog.total)
      })
    }
  } catch (err) {
    console.warn('[VITS-WASM prefetch error]:', err)
  }
}

/**
 * Sintesis dan putar audio lokal menggunakan VITS WASM & Web Audio API.
 */
export async function synthesizeAndPlayWasm(
  text: string,
  personaId = 'female-1',
  customRate?: number
): Promise<void> {
  const config = PERSONA_WASM_MAP[personaId] ?? PERSONA_WASM_MAP['female-1']
  const cacheKey = `${config.modelId}:${text.trim()}`

  let rawWav = memoryWavCache.get(cacheKey)
  if (!rawWav) {
    const blob = await tts.predict({
      text: text.trim(),
      voiceId: config.modelId,
    })
    rawWav = await blob.arrayBuffer()
    memoryWavCache.set(cacheKey, rawWav)
  }

  const ctx = getAudioContext()
  const audioBuffer = await ctx.decodeAudioData(rawWav.slice(0))

  stopWasmAudio()

  return new Promise((resolve) => {
    const source = ctx.createBufferSource()
    source.buffer = audioBuffer
    source.playbackRate.value = customRate !== undefined ? customRate : config.playbackRate
    if (source.detune) {
      source.detune.value = config.detuneCents
    }

    source.connect(ctx.destination)
    currentSourceNode = source

    source.onended = () => {
      if (currentSourceNode === source) {
        currentSourceNode = null
      }
      resolve()
    }

    source.start(0)
  })
}
