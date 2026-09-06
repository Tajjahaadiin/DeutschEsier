import 'dotenv/config'
import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from '@hono/node-server/serve-static'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

import wordsRouter from './routes/words'
import sessionsRouter from './routes/sessions'
import generateRouter from './routes/generate'
import ttsRouter from './routes/tts'
import authRouter from './routes/auth'
import accessKeysRouter from './routes/access-keys'
import submissionsRouter from './routes/submissions'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// When bundled via esbuild to dist/server.js, __dirname is dist/
// When run via tsx from src/server/, __dirname is src/server/
// So we resolve relative to process.cwd() which is project root
const distPath = join(process.cwd(), 'dist')
const indexHtmlPath = join(distPath, 'index.html')

const app = new Hono()

// CORS for development
app.use('*', cors())

// API Routes — must be registered BEFORE static serving
app.route('/api/auth', authRouter)
app.route('/api/words', wordsRouter)
app.route('/api/sessions', sessionsRouter)
app.route('/api/sessions', accessKeysRouter)
app.route('/api/sessions', submissionsRouter)
app.route('/api/generate', generateRouter)
app.route('/api/tts', ttsRouter)

// Serve static assets (JS, CSS, images etc.) from /dist/assets
// serveStatic will return 404 for non-file routes, so we handle SPA fallback after
app.use(
  '/assets/*',
  serveStatic({ root: distPath, rewriteRequestPath: (p) => p })
)

// Serve any other static files (favicon, etc.)
app.use(
  '/*',
  serveStatic({
    root: distPath,
    // Custom onNotFound: don't intercept, let next handler do SPA fallback
    onNotFound: (_path, c) => {
      // Intentionally do nothing — fall through to app.get('*') below
    },
  })
)

// SPA Fallback — serve index.html for all unmatched routes (client-side routing)
app.get('*', (c) => {
  if (existsSync(indexHtmlPath)) {
    const html = readFileSync(indexHtmlPath, 'utf-8')
    return c.html(html)
  }
  // Development mode: no dist built yet
  return c.text(
    'Frontend not built. Run: npm run build:client\n\nAPI server is running. Endpoints:\n- GET /api/words\n- GET /api/sessions\n- POST /api/generate',
    200
  )
})

const port = process.env.PORT ? parseInt(process.env.PORT) : 3001
console.log(`DeutschEasier server running on http://localhost:${port}`)

serve({
  fetch: app.fetch,
  port,
})
