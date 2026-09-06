import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import * as schema from './schema'
import { join } from 'path'

const dbPath = process.env.DATABASE_URL || join(process.cwd(), 'sqlite.db')

const sqlite = new Database(dbPath)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('synchronous = NORMAL')
sqlite.pragma('foreign_keys = ON')

export const db = drizzle(sqlite, { schema })
