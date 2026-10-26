import { describe, it, expect } from 'vitest'
import { extractCleanJson } from './ai-service'

describe('extractCleanJson', () => {
  it('mengekstrak JSON murni tanpa dekorasi', () => {
    const raw = '{"title":"Test","count":1}'
    expect(extractCleanJson(raw)).toBe('{"title":"Test","count":1}')
  })

  it('membersihkan tag <think>...</think> tertutup dari model reasoning', () => {
    const raw = `
<think>
User wants a dialogue at A1 level.
Let's craft 2 lines with German and Indonesian text.
</think>
{"title":"Begrüßung","dialogue":[]}
`
    expect(JSON.parse(extractCleanJson(raw))).toEqual({
      title: 'Begrüßung',
      dialogue: [],
    })
  })

  it('membersihkan tag <think> yang TIDAK TERTUTUP (unclosed / truncated token)', () => {
    const raw = `<think>The user wants me to generate a lesson.
Here is the JSON output:
{"title":"Unclosed Think Lesson","dialogue":[{"speaker":"A","germanText":"Hallo"}]}`

    const parsed = JSON.parse(extractCleanJson(raw))
    expect(parsed.title).toBe('Unclosed Think Lesson')
    expect(parsed.dialogue).toHaveLength(1)
  })

  it('membersihkan markdown code fences ```json ... ```', () => {
    const raw = `Berikut hasil generate:
\`\`\`json
{
  "title": "Im Cafe",
  "dialogue": []
}
\`\`\`
Semoga bermanfaat!`

    const parsed = JSON.parse(extractCleanJson(raw))
    expect(parsed.title).toBe('Im Cafe')
  })

  it('tetap mengembalikan string kosong bila tidak ada format JSON valid', () => {
    expect(extractCleanJson('Bukan JSON sama sekali')).toBe('')
    expect(extractCleanJson('')).toBe('')
  })
})
