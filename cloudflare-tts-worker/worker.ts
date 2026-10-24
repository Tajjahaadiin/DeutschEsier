/**
 * Cloudflare Worker: Edge TTS Proxy untuk DeutschEasier
 * 
 * Bertindak sebagai gateway proxy berkecepatan tinggi di jaringan Cloudflare Edge
 * yang menyematkan header Origin ekstensi Microsoft yang valid, menghindari blokir
 * IP datacenter (Vercel/AWS Lambda Unexpected server response: 200).
 *
 * Gratis 100.000 request/hari di Cloudflare Workers Free Plan.
 */

const EDGE_SPEECH_URL = 'wss://api.msedgeservices.com/tts/cognitiveservices/websocket/v1'
const EDGE_API_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4'
const CHROMIUM_FULL_VERSION = '143.0.3650.75'
const CHROMIUM_MAJOR_VERSION = CHROMIUM_FULL_VERSION.split('.')[0]
const WIN_EPOCH_OFFSET = 11644473600

function randomMd5(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function generateSecMsGec(now = Date.now()): Promise<string> {
  let ticks = Math.floor(now / 1000)
  ticks += WIN_EPOCH_OFFSET
  ticks -= ticks % 300
  ticks *= 10_000_000
  const strToHash = `${ticks}${EDGE_API_TOKEN}`
  const data = new TextEncoder().encode(strToHash)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&"']/g, (c) => {
    switch (c) {
      case '<': return '&lt;'
      case '>': return '&gt;'
      case '&': return '&amp;'
      case '"': return '&quot;'
      case "'": return '&apos;'
      default: return c
    }
  })
}

function getHeadersAndData(message: string): { headers: Record<string, string>; body: string } {
  const lines = message.split('\n')
  const headers: Record<string, string> = {}
  let lineIdx = 0
  for (lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const line = lines[lineIdx].trim()
    if (!line) break
    const sep = line.indexOf(':')
    if (sep !== -1) {
      headers[line.slice(0, sep).trim()] = line.slice(sep + 1).trim()
    }
  }
  return { headers, body: lines.slice(lineIdx + 1).join('\n') }
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url)

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        },
      })
    }

    // Health check
    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'DeutschEasier Edge TTS Proxy' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // Endpoint: GET /tts?text=...&voice=...
    const text = url.searchParams.get('text') || ''
    const voice = url.searchParams.get('voice') || 'de-DE-KatjaNeural'

    if (!text.trim()) {
      return new Response(JSON.stringify({ error: 'Text parameter is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const connectId = randomMd5()
    const secMsGec = await generateSecMsGec()
    const targetWsUrl = `${EDGE_SPEECH_URL}?ConnectionId=${connectId}&Ocp-Apim-Subscription-Key=${EDGE_API_TOKEN}&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=1-${CHROMIUM_FULL_VERSION}`

    const baseHeaders: Record<string, string> = {
      'User-Agent': `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/${CHROMIUM_MAJOR_VERSION}.0.0.0 Safari/537.36 Edg/${CHROMIUM_MAJOR_VERSION}.0.0.0`,
      'Accept-Encoding': 'gzip, deflate, br, zstd',
      'Accept-Language': 'en-US,en;q=0.9',
      'Pragma': 'no-cache',
      'Cache-Control': 'no-cache',
      'Origin': 'chrome-extension://jdiccldimpdaibmpdkjnbmckianbfold',
      'Sec-WebSocket-Version': '13',
      'Cookie': `muid=${randomMd5().toUpperCase()};`,
    }

    try {
      const upgradeUrl = targetWsUrl.replace(/^wss:\/\//i, 'https://')
      const upgradeResp = await fetch(upgradeUrl, {
        headers: {
          ...baseHeaders,
          Upgrade: 'websocket',
        },
      }) as any

      if (upgradeResp.status !== 101 || !upgradeResp.webSocket) {
        return new Response(JSON.stringify({ error: `WebSocket upgrade failed with status ${upgradeResp.status}` }), {
          status: 502,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        })
      }

      const ws = upgradeResp.webSocket
      ws.accept()

      const now = new Date().toUTCString()
      const configMsg = `X-Timestamp:${now}\r\nContent-Type:application/json; charset=utf-8\r\nPath:speech.config\r\n\r\n{"context":{"synthesis":{"audio":{"metadataoptions":{"sentenceBoundaryEnabled":false,"wordBoundaryEnabled":false},"outputFormat":"audio-24khz-48kbitrate-mono-mp3"}}}}`

      const ssml = `<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='de-DE'><voice name='${voice}'>${escapeXml(text)}</voice></speak>`
      const ssmlMsg = `X-RequestId:${connectId}\r\nContent-Type:application/ssml+xml\r\nX-Timestamp:${now}\r\nPath:ssml\r\n\r\n${ssml}`

      return await new Promise<Response>((resolve, reject) => {
        let audioData = new Uint8Array(0)
        let settled = false

        const finalize = () => {
          if (settled) return
          settled = true
          try { ws.close() } catch {}

          if (audioData.length === 0) {
            resolve(new Response(JSON.stringify({ error: 'No audio received from upstream' }), {
              status: 502,
              headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
            }))
            return
          }

          resolve(new Response(audioData, {
            status: 200,
            headers: {
              'Content-Type': 'audio/mpeg',
              'Cache-Control': 'public, max-age=31536000, immutable',
              'Access-Control-Allow-Origin': '*',
            },
          }))
        }

        ws.addEventListener('message', async (event: any) => {
          if (settled) return
          const data = event.data

          if (typeof data === 'string') {
            const { headers } = getHeadersAndData(data)
            if (headers['Path'] === 'turn.end') {
              finalize()
            }
            return
          }

          let buf: ArrayBuffer
          if (data instanceof ArrayBuffer) {
            buf = data
          } else if (data instanceof Uint8Array) {
            buf = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength) as ArrayBuffer
          } else if (data && typeof data.arrayBuffer === 'function') {
            buf = await data.arrayBuffer()
          } else {
            return
          }

          const view = new DataView(buf)
          if (view.byteLength > 2) {
            const headerLength = view.getInt16(0)
            if (view.byteLength > 2 + headerLength) {
              const chunk = new Uint8Array(buf, 2 + headerLength)
              const nextAudio = new Uint8Array(audioData.length + chunk.length)
              nextAudio.set(audioData, 0)
              nextAudio.set(chunk, audioData.length)
              audioData = nextAudio
            }
          }
        })

        ws.addEventListener('close', () => finalize())
        ws.addEventListener('error', (err: any) => {
          if (settled) return
          settled = true
          resolve(new Response(JSON.stringify({ error: 'Upstream WebSocket error' }), {
            status: 502,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          }))
        })

        ws.send(configMsg)
        ws.send(ssmlMsg)

        // Safety timeout 15 detik
        setTimeout(() => finalize(), 15000)
      })
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e?.message || 'Proxy error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }
  },
}
