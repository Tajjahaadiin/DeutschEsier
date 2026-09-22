import { Hono } from 'hono'
import { db } from '../../db/client'
import { quizSubmission } from '../../db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { requireTeacherAuth } from './auth'

const submissionsRouter = new Hono()

/** Jenis aktivitas yang didukung. */
const KINDS = ['quiz', 'grammar'] as const
type SubmissionKind = (typeof KINDS)[number]

function parseKind(raw: unknown): SubmissionKind {
  const v = (raw || '').toString().trim().toLowerCase()
  return (KINDS as readonly string[]).includes(v) ? (v as SubmissionKind) : 'quiz'
}

// 1. POST /:id/submissions
submissionsRouter.post('/:id/submissions', async (c) => {
  try {
    const sessionId = c.req.param('id')
    const body = await c.req.json().catch(() => ({}))

    const rawScore = typeof body.score === 'number' ? body.score : 0
    const score = Math.max(0, Math.min(100, Math.round(rawScore)))
    const totalQuestions = typeof body.totalQuestions === 'number' ? Math.max(0, Math.round(body.totalQuestions)) : 0
    const correctAnswers = typeof body.correctAnswers === 'number' ? Math.max(0, Math.min(totalQuestions, Math.round(body.correctAnswers))) : 0
    const studentName = (body.studentName || '').toString().trim().slice(0, 100)
    const accessKey = (body.accessKey || '').toString().trim().toUpperCase().slice(0, 20)
    const kind = parseKind(body.kind)

    if (studentName === '') {
      return c.json({ error: 'Nama siswa wajib diisi' }, 400)
    }

    const id = nanoid()
    const answersJson = JSON.stringify(body.answers || [])

    await db.insert(quizSubmission).values({
      id,
      sessionId,
      kind,
      accessKey,
      studentName,
      score,
      totalQuestions,
      correctAnswers,
      answersJson,
    })

    return c.json({ success: true, submissionId: id, kind })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to submit quiz' }, 500)
  }
})

/** Hitung statistik dari sekumpulan submission. */
function buildStats(submissions: { score: number }[]) {
  const totalSubmissions = submissions.length
  const averageScore =
    totalSubmissions > 0
      ? Math.round(submissions.reduce((acc, s) => acc + s.score, 0) / totalSubmissions)
      : 0
  const passedCount = submissions.filter((s) => s.score >= 70).length
  const passRate =
    totalSubmissions > 0 ? Math.round((passedCount / totalSubmissions) * 100) : 0
  const highestScore =
    totalSubmissions > 0 ? Math.max(...submissions.map((s) => s.score)) : 0

  let c1 = 0
  let c2 = 0
  let c3 = 0
  let c4 = 0
  for (const s of submissions) {
    if (s.score <= 40) c1++
    else if (s.score <= 60) c2++
    else if (s.score <= 80) c3++
    else c4++
  }

  return {
    totalSubmissions,
    averageScore,
    passRate,
    highestScore,
    distribution: {
      '0-40': c1,
      '41-60': c2,
      '61-80': c3,
      '81-100': c4,
    },
  }
}

// 2. GET /:id/submissions
//    ?kind=quiz (default) | ?kind=grammar | ?kind=all
//    Statistik dihitung HANYA dari kind yang diminta, agar nilai grammar
//    tidak mencemari rata-rata kuis (dan sebaliknya).
submissionsRouter.get('/:id/submissions', requireTeacherAuth, async (c) => {
  try {
    const sessionId = c.req.param('id')
    const kindParam = (c.req.query('kind') || 'quiz').toString().toLowerCase()
    const wantAll = kindParam === 'all'

    const rawSubmissions = await db
      .select()
      .from(quizSubmission)
      .where(
        wantAll
          ? eq(quizSubmission.sessionId, sessionId)
          : and(
              eq(quizSubmission.sessionId, sessionId),
              eq(quizSubmission.kind, parseKind(kindParam))
            )
      )
      .orderBy(desc(quizSubmission.submittedAt))

    const submissions = rawSubmissions.map((s) => {
      let answers: any[] = []
      try {
        answers = JSON.parse(s.answersJson)
      } catch {
        answers = []
      }
      return { ...s, answers }
    })

    const quizSubs = submissions.filter((s) => s.kind === 'quiz')
    const grammarSubs = submissions.filter((s) => s.kind === 'grammar')

    return c.json({
      submissions,
      stats: buildStats(submissions),
      // Rincian per jenis supaya UI bisa menampilkan kedua aktivitas sekaligus.
      byKind: {
        quiz: { count: quizSubs.length, stats: buildStats(quizSubs) },
        grammar: { count: grammarSubs.length, stats: buildStats(grammarSubs) },
      },
    })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to fetch submissions' }, 500)
  }
})

export default submissionsRouter
