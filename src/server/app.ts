import { Hono } from 'hono'
import { cors } from 'hono/cors'

import wordsRouter from './routes/words'
import sessionsRouter from './routes/sessions'
import generateRouter from './routes/generate'
import ttsRouter from './routes/tts'
import authRouter from './routes/auth'
import accessKeysRouter from './routes/access-keys'
import submissionsRouter from './routes/submissions'

const app = new Hono()

// CORS
app.use('*', cors())

// API Routes
app.route('/api/auth', authRouter)
app.route('/api/words', wordsRouter)
app.route('/api/sessions', sessionsRouter)
app.route('/api/sessions', accessKeysRouter)
app.route('/api/sessions', submissionsRouter)
app.route('/api/generate', generateRouter)
app.route('/api/tts', ttsRouter)

export default app
