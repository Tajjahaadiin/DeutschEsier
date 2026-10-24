import 'dotenv/config'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import app from './app'

const distPath = join(process.cwd(), 'dist')
const indexHtmlPath = join(distPath, 'index.html')

// Melayani aset audio statis (/audio/*) dengan MIME type audio/wav yang valid
// Browser Audio player memerlukan Content-Type audio/wav (bukan application/octet-stream)
app.get('/audio/*', (c) => {
  const filePath = join(distPath, c.req.path)
  if (existsSync(filePath)) {
    const buffer = readFileSync(filePath)
    const isWav = filePath.endsWith('.wav')
    return new Response(buffer, {
      headers: {
        'Content-Type': isWav ? 'audio/wav' : 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  }
  return c.text('Audio file not found', 404)
})

// Serve static assets for standalone local production mode
app.use(
  '/assets/*',
  serveStatic({ root: distPath, rewriteRequestPath: (p) => p })
)

app.use(
  '/*',
  serveStatic({
    root: distPath,
    onNotFound: () => {},
  })
)

// SPA Fallback
app.get('*', (c) => {
  if (existsSync(indexHtmlPath)) {
    const html = readFileSync(indexHtmlPath, 'utf-8')
    return c.html(html)
  }
  return c.text(
    'Frontend not built. Run: npm run build:client\n\nAPI server is running.',
    200
  )
})

const port = process.env.PORT ? parseInt(process.env.PORT) : 3001
console.log(`DeutschEasier server running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})
