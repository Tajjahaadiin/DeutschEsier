import { Hono } from 'hono'
import { db } from '../../db/client'
import { quizSubmission } from '../../db/schema'
import { eq, desc } from 'drizzle-orm'
import { nanoid } from 'nanoid'
import { requireTeacherAuth } from './auth'

const submissionsRouter = new Hono()

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

    if (studentName === '') {
      return c.json({ error: 'Nama siswa wajib diisi' }, 400)
    }

    const id = nanoid()
    const answersJson = JSON.stringify(body.answers || [])

    await db.insert(quizSubmission).values({
      id,
      sessionId,
      accessKey,
      studentName,
      score,
      totalQuestions,
      correctAnswers,
      answersJson,
    })

    return c.json({ success: true, submissionId: id })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to submit quiz' }, 500)
  }
})

// 2. GET /:id/submissions
submissionsRouter.get('/:id/submissions', requireTeacherAuth, async (c) => {
  try {
    const sessionId = c.req.param('id')
    const rawSubmissions = await db
      .select()
      .from(quizSubmission)
      .where(eq(quizSubmission.sessionId, sessionId))
      .orderBy(desc(quizSubmission.submittedAt))

    const submissions = rawSubmissions.map((s) => {
      let answers: any[] = []
      try {
        answers = JSON.parse(s.answersJson)
      } catch {
        answers = []
      }
      return {
        ...s,
        answers,
      }
    })

    const totalSubmissions = submissions.length
    const averageScore =
      totalSubmissions > 0
        ? Math.round(submissions.reduce((acc, s) => acc + s.score, 0) / totalSubmissions)
        : 0
    const passedCount = submissions.filter((s) => s.score >= 70).length
    const passRate =
      totalSubmissions > 0
        ? Math.round((passedCount / totalSubmissions) * 100)
        : 0
    const highestScore =
      totalSubmissions > 0
        ? Math.max(...submissions.map((s) => s.score))
        : 0

    let c1 = 0
    let c2 = 0
    let c3 = 0
    let c4 = 0

    for (const s of submissions) {
      if (s.score <= 40) {
        c1++
      } else if (s.score <= 60) {
        c2++
      } else if (s.score <= 80) {
        c3++
      } else {
        c4++
      }
    }

    return c.json({
      submissions,
      stats: {
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
      },
    })
  } catch (error) {
    console.error(error)
    return c.json({ error: 'Failed to fetch submissions' }, 500)
  }
})

export default submissionsRouter
