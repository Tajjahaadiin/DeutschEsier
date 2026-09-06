import { Hono } from 'hono'
import { db } from '../../db/client'
import { wordBank } from '../../db/schema'
import { sql, asc } from 'drizzle-orm'

const wordsRouter = new Hono()

wordsRouter.get('/', async (c) => {
  const search = c.req.query('search') || ''
  const category = c.req.query('category') || ''
  const page = parseInt(c.req.query('page') || '1')
  const limit = parseInt(c.req.query('limit') || '20')
  const offset = (page - 1) * limit

  try {
    let query = db.select().from(wordBank)
    let countQuery = db.select({ count: sql`COUNT(*)` }).from(wordBank)

    const conditions = []
    if (search) {
      conditions.push(sql`(lower(${wordBank.germanWord}) LIKE lower(${'%' + search + '%'}) OR lower(${wordBank.indonesianWord}) LIKE lower(${'%' + search + '%'}))`)
    }
    if (category) {
      conditions.push(sql`${wordBank.category} = ${category}`)
    }

    if (conditions.length > 0) {
      const whereClause = sql.join(conditions, sql` AND `)
      query = query.where(whereClause) as any
      countQuery = countQuery.where(whereClause) as any
    }

    const safeLimit = Math.min(Math.max(1, limit), 200)
    const safePage = Math.max(1, page)
    const safeOffset = (safePage - 1) * safeLimit
    const [totalRes, wordsRes, allCatsRes] = await Promise.all([
      countQuery,
      query.orderBy(asc(wordBank.germanWord)).limit(safeLimit).offset(safeOffset),
      db.selectDistinct({ category: wordBank.category }).from(wordBank)
    ])

    return c.json({
      words: wordsRes,
      total: Number(totalRes[0].count),
      categories: allCatsRes.map(c => c.category)
    })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to fetch words' }, 500)
  }
})

export default wordsRouter
