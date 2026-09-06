import 'dotenv/config'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import app from './app'

const distPath = join(process.cwd(), 'dist')
const indexHtmlPath = join(distPath, 'index.html')

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
