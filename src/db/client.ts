import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL || ''

// Fallback dummy client jika DATABASE_URL belum di-set saat build time
const sql = neon(connectionString || 'postgresql://dummy:dummy@ep-dummy.neon.tech/neondb')
export const db = drizzle(sql, { schema })

