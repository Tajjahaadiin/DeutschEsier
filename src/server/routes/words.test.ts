import { describe, it, expect, beforeEach, vi } from 'vitest'

const state = vi.hoisted(() => ({
  countRes: [] as any[],
  wordsRes: [] as any[],
  catsRes: [] as any[],
}))

vi.mock('../../db/client', () => {
  return {
    db: {
      select: (arg?: any) => {
        if (arg && arg.count) {
          const countChain: any = {
            from: () => countChain,
            where: () => countChain,
            then: (resolve: any) => resolve(state.countRes),
          }
          return countChain
        }
        const dataChain: any = {
          from: () => dataChain,
          where: () => dataChain,
          orderBy: () => dataChain,
          limit: () => dataChain,
          offset: () => dataChain,
          then: (resolve: any) => resolve(state.wordsRes),
        }
        return dataChain
      },
      selectDistinct: () => ({
        from: async () => state.catsRes,
      }),
    },
  }
})

const { default: app } = await import('../app')

beforeEach(() => {
  state.countRes = []
  state.wordsRes = []
  state.catsRes = []
})

describe('GET /api/words', () => {
  it('mengembalikan daftar kata, total, dan kategori dengan pagination', async () => {
    state.countRes = [{ count: 25 }]
    state.wordsRes = [
      { id: 1, germanWord: 'Auto', indonesianWord: 'mobil', category: 'Transportasi' },
      { id: 2, germanWord: 'Bus', indonesianWord: 'bus', category: 'Transportasi' },
    ]
    state.catsRes = [{ category: 'Transportasi' }, { category: 'Makanan' }]

    const res = await app.request('/api/words?page=1&limit=2')

    expect(res.status).toBe(200)
    const body = (await res.json()) as any
    expect(body.total).toBe(25)
    expect(body.words).toHaveLength(2)
    expect(body.categories).toEqual(['Transportasi', 'Makanan'])
  })

  it('menangani error DB dengan 500', async () => {
    state.countRes = null as any // pemicu error
    const res = await app.request('/api/words')

    expect(res.status).toBe(500)
    const body = (await res.json()) as any
    expect(body.error).toBe('Failed to fetch words')
  })
})
