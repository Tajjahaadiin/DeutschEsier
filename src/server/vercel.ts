import type { IncomingMessage, ServerResponse } from 'node:http'
import app from './app'

export const config = {
  runtime: 'nodejs',
  api: {
    bodyParser: false,
  },
}

async function extractRequestBody(req: IncomingMessage): Promise<Uint8Array | string | undefined> {
  const vReq = req as any

  // 1. Cek jika Vercel helper sudah mem-parse body
  if (vReq.body !== undefined && vReq.body !== null) {
    if (Buffer.isBuffer(vReq.body) || vReq.body instanceof Uint8Array) {
      return vReq.body
    }
    if (typeof vReq.body === 'string') {
      return vReq.body
    }
    if (typeof vReq.body === 'object') {
      return JSON.stringify(vReq.body)
    }
  }

  // 2. Jika stream sudah ditutup tanpa payload, kembalikan undefined
  if (req.readableEnded) {
    return undefined
  }

  // 3. Baca stream mentah secara aman
  return new Promise<Buffer | undefined>((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    })
    req.on('end', () => {
      if (chunks.length === 0) {
        resolve(undefined)
      } else {
        resolve(Buffer.concat(chunks))
      }
    })
    req.on('error', (err) => {
      reject(err)
    })
  })
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    // 1. Rekonstruksi URL Lengkap (tangani rewrite path jika ada)
    const proto = (req.headers['x-forwarded-proto'] as string) || 'https'
    const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'localhost'
    const rawPath =
      (req.headers['x-forwarded-uri'] as string) ||
      (req.headers['x-invoke-path'] as string) ||
      req.url ||
      '/'
    const url = new URL(rawPath, `${proto}://${host}`)

    // 2. Bangun Headers Web Standard
    const headers = new Headers()
    for (const [key, value] of Object.entries(req.headers)) {
      if (value === undefined) continue
      if (Array.isArray(value)) {
        for (const v of value) {
          headers.append(key, v)
        }
      } else {
        headers.set(key, value)
      }
    }

    // 3. Ekstraksi Body untuk Method Non-GET/HEAD
    const init: RequestInit = {
      method: req.method || 'GET',
      headers,
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      const body = await extractRequestBody(req)
      if (body !== undefined) {
        init.body = body as BodyInit
        ;(init as any).duplex = 'half'
      }
    }

    // 4. Eksekusi Hono Framework
    const webRequest = new Request(url.toString(), init)
    const webResponse = await app.fetch(webRequest)

    // 5. Teruskan Status Code & Headers ke res
    res.statusCode = webResponse.status

    webResponse.headers.forEach((value, key) => {
      if (key.toLowerCase() === 'set-cookie') return
      res.setHeader(key, value)
    })

    // Penanganan khusus multi Set-Cookie di Node.js
    const getSetCookie = (webResponse.headers as any).getSetCookie
    if (typeof getSetCookie === 'function') {
      const cookies = getSetCookie.call(webResponse.headers)
      if (Array.isArray(cookies) && cookies.length > 0) {
        res.setHeader('Set-Cookie', cookies)
      }
    } else {
      const cookie = webResponse.headers.get('set-cookie')
      if (cookie) {
        res.setHeader('Set-Cookie', cookie)
      }
    }

    // 6. Alirkan Response Body (Mendukung Streaming & Audio MP3 Binary)
    if (!webResponse.body) {
      res.end()
      return
    }

    const reader = webResponse.body.getReader()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        res.write(value)
      }
    } finally {
      reader.releaseLock()
    }
    res.end()
  } catch (error: any) {
    console.error('Vercel Node Adapter Error:', error)
    if (!res.headersSent) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: 'Internal Server Error', message: error?.message }))
    } else {
      res.end()
    }
  }
}
