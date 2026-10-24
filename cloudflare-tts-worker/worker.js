/**
 * Cloudflare Worker: Edge TTS Proxy untuk DeutschEasier (JavaScript murni)
 * 
 * Menggunakan protokol resmi Microsoft Edge TTS v2 DRM:
 * - Sec-MS-GEC v2 (CS64 + SHA-256)
 * - Cloudflare Workers fetch-upgrade pattern dengan async pendingBinary drain
 * - Mendukung 6 persona German Neural Edge TTS
 */

const EDGE_SPEECH_URL = 'wss://api.msedgeservices.com/tts/cognitiveservices/websocket/v1'
const EDGE_API_TOKEN = '6A5AA1D4EAFF4E9FB37E23D68491D6F4'
const CHROMIUM_FULL_VERSION = '143.0.3650.75'
const CHROMIUM_MAJOR_VERSION = CHROMIUM_FULL_VERSION.split('.')[0]
const WIN_EPOCH_OFFSET = 11644473600
const S_TO_NS = 1000000000
const GEC_PREFIX_LENGTH = 57
const GEC_PREFIX_WORDS = [
  0x79706f43, 0x68676972, 0x43282074, 0x694d2029, 0x736f7263, 0x2074666f, 0x70726f43, 0x7461726f,
  0x2e6e6f69, 0x6c6c4120, 0x67697220, 0x20737468, 0x65736572, 0x64657672, 0x0000002e,
]

const toHex = (bytes) =>
  Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase()

const rol16 = (x) => ((x << 16) | (x >>> 16)) >>> 0

const toWords = (bytes) => {
  const padded = new Uint8Array(Math.ceil(bytes.length / 8) * 8)
  padded.set(bytes)
  const view = new DataView(padded.buffer)
  return Array.from({ length: padded.length / 4 }, (_, i) => view.getUint32(i * 4, true))
}

const cs64WordSwap = (words, a, b) => {
  let acc = 0
  let last = 0
  for (let i = 0; i < words.length; i += 2) {
    const x = words[i]
    const y = words[i + 1]
    let t = rol16((Math.imul(rol16(x), 0xef0569fb) + Math.imul(x, a)) >>> 0)
    let q = Math.imul(t, 0x76f50f34) >>> 0
    acc = (acc + Math.imul(rol16(q), 0xc3efea97) + q) >>> 0
    t = rol16((Math.imul(rol16(y), 0xc31713db) + Math.imul(y, b)) >>> 0)
    q = Math.imul(t, 0x1881ce3c) >>> 0
    last = (Math.imul(rol16(q), 0x35bd1ec9) + q) >>> 0
    acc = (acc + last) >>> 0
  }
  return [last, acc]
}

const cs64Reversible = (words, a, b) => {
  let state = 0
  let acc = 0
  for (let i = 0; i < words.length; i += 2) {
    state = Math.imul(state + words[i], a) >>> 0
    for (const c of [0xcf98b111, 0x87085b9f, 0x12ceb96d, 0x257e1d83]) {
      state = Math.imul(rol16(state), c) >>> 0
    }
    let t = Math.imul(words[i + 1] + state, b) >>> 0
    t = Math.imul(rol16(t), 0xa27416f5) >>> 0
    t = rol16(Math.imul(rol16(t), 0xd38396ff) >>> 0)
    acc = (acc + state) >>> 0
    state = Math.imul(rol16(Math.imul(t, 0x7c932b89) >>> 0), 0xbfa49f69) >>> 0
    acc = (acc + state) >>> 0
  }
  return [state, acc]
}

async function generateSecMsGecV2(now = Date.now()) {
  let ticks = Math.floor(now / 1000)
  ticks += WIN_EPOCH_OFFSET
  ticks -= ticks % 300
  ticks *= S_TO_NS / 100

  const suffix = new TextEncoder().encode(`${ticks.toFixed(0)}${EDGE_API_TOKEN}`)
  const data = new Uint8Array(GEC_PREFIX_LENGTH + suffix.length)
  const view = new DataView(data.buffer)
  GEC_PREFIX_WORDS.forEach((word, i) => view.setUint32(i * 4, word, true))
  data.set(suffix, GEC_PREFIX_LENGTH)

  const digest = new Uint8Array(await crypto.subtle.digest('SHA-256', data))
  const words = toWords(data)
  const [key0, key1] = toWords(digest)
  const a = (key0 | 1) >>> 0
  const b = (key1 | 1) >>> 0
  const [s0, s1] = cs64WordSwap(words, a, b)
  const [r0, r1] = cs64Reversible(words, a, b)

  const cs64 = new DataView(new ArrayBuffer(8))
  cs64.setUint32(0, s0 ^ r0, true)
  cs64.setUint32(4, s1 ^ r1, true)

  return `${toHex(new Uint8Array(cs64.buffer))}-${toHex(digest)}`
}

function randomMd5() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

function escapeXml(unsafe) {
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

function getHeadersAndData(message) {
  const lines = message.split('\n')
  const headers = {}
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
  async fetch(request) {
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        },
      })
    }

    if (url.pathname === '/' || url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', service: 'DeutschEasier Edge TTS Proxy v2' }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const text = url.searchParams.get('text') || ''
    const voice = url.searchParams.get('voice') || 'de-DE-KatjaNeural'

    if (!text.trim()) {
      return new Response(JSON.stringify({ error: 'Text parameter is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const connectId = randomMd5()
    const secMsGec = await generateSecMsGecV2()
    const targetWsUrl = `${EDGE_SPEECH_URL}?ConnectionId=${connectId}&Ocp-Apim-Subscription-Key=${EDGE_API_TOKEN}&Sec-MS-GEC=${secMsGec}&Sec-MS-GEC-Version=2-${CHROMIUM_FULL_VERSION}`

    const baseHeaders = {
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
      // Pola resmi WebSocket upgrade di Cloudflare Workers:
      // fetch() ke URL HTTPS dengan header Upgrade: 'websocket'
      const upgradeUrl = targetWsUrl.replace(/^wss:\/\//i, 'https://')
      const upgradeResp = await fetch(upgradeUrl, {
        headers: {
          ...baseHeaders,
          Upgrade: 'websocket',
        },
      })

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

      return await new Promise((resolve) => {
        let audioData = new Uint8Array(0)
        let settled = false
        // Cloudflare Workers mengirim binary WebSocket frame sebagai Blob yang async.
        // Kita serialize decode melalui pendingBinary promise chain agar data audio
        // tidak terpotong saat Path: turn.end diterima.
        let pendingBinary = Promise.resolve()

        const appendBinary = (buffer) => {
          const view = new DataView(buffer)
          const headerLength = view.getInt16(0)
          if (buffer.byteLength > 2 + headerLength) {
            const chunk = new Uint8Array(buffer, 2 + headerLength)
            const nextAudio = new Uint8Array(audioData.length + chunk.length)
            nextAudio.set(audioData, 0)
            nextAudio.set(chunk, audioData.length)
            audioData = nextAudio
          }
        }

        const enqueueBinary = (getBuffer) => {
          pendingBinary = pendingBinary.then(async () => {
            if (settled) return
            const buffer = await getBuffer()
            if (settled) return
            appendBinary(buffer)
          })
        }

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

        ws.addEventListener('message', (event) => {
          if (settled) return
          const data = event.data

          if (typeof data === 'string') {
            const { headers } = getHeadersAndData(data)
            if (headers['Path'] === 'turn.end') {
              pendingBinary
                .then(() => finalize())
                .catch(() => finalize())
            }
            return
          }

          if (data instanceof ArrayBuffer) {
            enqueueBinary(() => data)
            return
          }
          if (data instanceof Uint8Array) {
            enqueueBinary(() => data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength))
            return
          }
          if (typeof Blob !== 'undefined' && data instanceof Blob) {
            enqueueBinary(() => data.arrayBuffer())
            return
          }
        })

        ws.addEventListener('close', () => {
          pendingBinary.then(() => finalize()).catch(() => finalize())
        })

        ws.addEventListener('error', () => {
          if (settled) return
          settled = true
          resolve(new Response(JSON.stringify({ error: 'Upstream WebSocket error' }), {
            status: 502,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
          }))
        })

        ws.send(configMsg)
        ws.send(ssmlMsg)

        setTimeout(() => {
          pendingBinary.then(() => finalize()).catch(() => finalize())
        }, 15000)
      })
    } catch (e) {
      return new Response(JSON.stringify({ error: e?.message || 'Proxy error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }
  },
}
