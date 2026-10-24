import * as tts from '@diffusionstudio/vits-web'

export type PersonaWasmConfig = {
  modelId: tts.VoiceId
  detuneCents: number
  playbackRate: number
  fallbackPitch: number
}

// Pemetaan DSP Trio Persona Baru (weiblich, männlich-1, männlich-2) + alias backwards-compat
export const PERSONA_WASM_MAP: Record<string, PersonaWasmConfig> = {
  // 1. WEIBLICH (Base Model: de_DE-kerstin-low, ceria/muda)
  'weiblich': { modelId: 'de_DE-kerstin-low', detuneCents: 180, playbackRate: 1.04, fallbackPitch: 1.2 },
  'female-2': { modelId: 'de_DE-kerstin-low', detuneCents: 180, playbackRate: 1.04, fallbackPitch: 1.2 }, // alias
  'female-1': { modelId: 'de_DE-kerstin-low', detuneCents: 0, playbackRate: 0.96, fallbackPitch: 1.05 }, // Katja Grundlagen

  // 2. MÄNNLICH 1 (Base Model: de_DE-kerstin-low dengan detune -250c, timbre unik tegas/dewasa)
  'männlich-1': { modelId: 'de_DE-kerstin-low', detuneCents: -250, playbackRate: 1.06, fallbackPitch: 0.75 },
  'male-1': { modelId: 'de_DE-kerstin-low', detuneCents: -250, playbackRate: 1.06, fallbackPitch: 0.75 }, // alias

  // 3. MÄNNLICH 2 (Base Model: de_DE-thorsten-medium dengan detune +160c, energik/muda)
  'männlich-2': { modelId: 'de_DE-thorsten-medium', detuneCents: 160, playbackRate: 1.05, fallbackPitch: 0.9 },
  'male-2': { modelId: 'de_DE-thorsten-medium', detuneCents: 160, playbackRate: 1.05, fallbackPitch: 0.9 }, // alias

  // Fallback cadangan
  'male-3': { modelId: 'de_DE-thorsten-medium', detuneCents: 0, playbackRate: 1.0, fallbackPitch: 1.0 },
  'female-3': { modelId: 'de_DE-kerstin-low', detuneCents: -120, playbackRate: 0.94, fallbackPitch: 0.95 },
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
 * Pre-synthesize kalimat teks ke dalam memori RAM (memoryWavCache).
 * Menjamin saat tombol putar ditekan, latensi = 0ms karena komputasi VITS sudah selesai.
 */
export async function warmUpSpeechCache(
  text: string,
  personaId = 'weiblich'
): Promise<void> {
  if (typeof window === 'undefined') return
  const config = PERSONA_WASM_MAP[personaId] ?? PERSONA_WASM_MAP['weiblich']
  const clean = text.trim()
  if (!clean) return

  const cacheKey = `${config.modelId}:${clean}`
  if (memoryWavCache.has(cacheKey)) return

  try {
    const blob = await tts.predict({
      text: clean,
      voiceId: config.modelId,
    })
    const rawWav = await blob.arrayBuffer()
    memoryWavCache.set(cacheKey, rawWav)
  } catch (err) {
    console.warn('[warmUpSpeechCache warning]:', err)
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
