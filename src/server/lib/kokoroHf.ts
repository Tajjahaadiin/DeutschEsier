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
    // Tambahkan polling loop kecil (hingga 10 detik) jika HuggingFace sedang antre/generating
    let audioUrl: string | null = null
    const startTime = Date.now()

    while (Date.now() - startTime < 12000 && !audioUrl) {
      const streamRes = await fetch(`${cleanBase}/gradio_api/call/synthesize/${event_id}`, {
        headers: {
          'Accept': 'text/event-stream',
        },
      })

      if (!streamRes.ok) {
        console.warn(`[Kokoro HF] SSE stream failed with status ${streamRes.status}`)
        break
      }

      const sseText = await streamRes.text()

      // Cari baris data: [...] yang membawa objek payload audio
      const lines = sseText.split('\n')
      for (const line of lines) {
        const trimmed = line.trim()
        if (trimmed.startsWith('data:')) {
          const rawPayload = trimmed.slice(5).trim()
          try {
            const parsed = JSON.parse(rawPayload)
            if (Array.isArray(parsed) && parsed[0]?.url) {
              audioUrl = parsed[0].url
              break
            }
          } catch {}
        }
      }

      if (!audioUrl) {
        // Jika masih status generating / queued, tunggu 350ms lalu coba baca stream lagi
        await new Promise((r) => setTimeout(r, 350))
      }
    }

    if (!audioUrl) {
      console.warn('[Kokoro HF] No audio URL received from SSE stream within timeout')
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
