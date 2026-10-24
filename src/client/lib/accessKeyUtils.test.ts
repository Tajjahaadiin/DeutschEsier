import { describe, it, expect } from 'vitest'
import { buildStudentShareUrl } from './accessKeyUtils'

describe('buildStudentShareUrl', () => {
  const origin = 'https://deu-easier.vercel.app'

  it('menghasilkan URL modul /grundlagen saat sessionId adalah "grundlagen"', () => {
    const url = buildStudentShareUrl(origin, 'grundlagen', 'DE-TEST1')
    expect(url).toBe('https://deu-easier.vercel.app/grundlagen?key=DE-TEST1')
  })

  it('menghasilkan URL /view/:id untuk skenario dialog pembelajaran standar', () => {
    const url = buildStudentShareUrl(origin, 'sess-abc-123', 'DE-TEST2')
    expect(url).toBe('https://deu-easier.vercel.app/view/sess-abc-123?key=DE-TEST2')
  })

  it('melakukan pembersihan spasi dan kapitalisasi pada kode kunci akses', () => {
    const url = buildStudentShareUrl(origin, 'grundlagen', '  de-abc89  ')
    expect(url).toBe('https://deu-easier.vercel.app/grundlagen?key=DE-ABC89')
  })
})
