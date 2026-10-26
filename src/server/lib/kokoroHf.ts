/**
 * Helper untuk memanggil HuggingFace Space Gradio API (Kokoro Martin TTS)
 * Space: Tajjz/deutscheasier-tts
 */

const HF_SPACE_BASE = process.env.KOKORO_HF_SPACE_URL || 'https://tajjz-deutscheasier-tts.hf.space'

export async function synthesizeKokoroMartin(text: string, speed: number = 1.0): Promise<Buffer | null> {
  const cleanBase = HF_SPACE_BASE.replace(/\/+$/, '')

  try {
    // 1. Submit tugas sintesis via Gradio SSE API v3
    const callRes = await fetch(`${cleanBase}/gradio_api/call/synthesize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [text.trim(), 'martin', speed],
      }),
    })

    if (!callRes.ok) {
      console.warn(`[Kokoro HF] call/synthesize failed with status ${callRes.status}`)
      return null
    }

    const { event_id } = (await callRes.json()) as { event_id?: string }
    if (!event_id) {
      console.warn('[Kokoro HF] No event_id returned')
      return null
    }

    // 2. Baca hasil EventSource / SSE stream untuk mendapatkan URL file audio
    const streamRes = await fetch(`${cleanBase}/gradio_api/call/synthesize/${event_id}`, {
      headers: {
        'Accept': 'text/event-stream',
      },
    })

    if (!streamRes.ok) {
      console.warn(`[Kokoro HF] SSE stream failed with status ${streamRes.status}`)
      return null
    }

    const sseText = await streamRes.text()
    
    // Parse baris "data: [...]" dari event: complete
    const dataMatch = sseText.match(/data:\s*(\[[\s\S]*?\])/)
    if (!dataMatch) {
      console.warn('[Kokoro HF] No data match in SSE stream response')
      return null
    }

    const parsedData = JSON.parse(dataMatch[1])
    const audioUrl = parsedData[0]?.url

    if (!audioUrl) {
      console.warn('[Kokoro HF] No audio URL in parsed payload')
      return null
    }

    // 3. Download buffer audio WAV dari HuggingFace
    const audioRes = await fetch(audioUrl)
    if (!audioRes.ok) {
      console.warn(`[Kokoro HF] Failed to download audio file: ${audioRes.status}`)
      return null
    }

    const arrayBuf = await audioRes.arrayBuffer()
    return Buffer.from(arrayBuf)
  } catch (err: any) {
    console.warn('[Kokoro HF Error]:', err?.message || err)
    return null
  }
}
