import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateBody } from '@/lib/api-validation'
import { z } from 'zod'

const COMP_PREFIX = 'freq:companies:'
const IND_PREFIX = 'freq:industries:'

async function getHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    logger.apiRequest('GET', '/api/user-frequencies', { userId: session.user.id })

    const compKey = `${COMP_PREFIX}${session.user.id}`
    const indKey = `${IND_PREFIX}${session.user.id}`

    const [compRow, indRow] = await Promise.all([
      db.systemSetting.findUnique({
        where: { key: compKey },
        select: { value: true }
      }),
      db.systemSetting.findUnique({
        where: { key: indKey },
        select: { value: true }
      })
    ])

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/user-frequencies', 200, duration)
    return NextResponse.json({
      companies: (compRow?.value as unknown as Record<string, number>) || {},
      industries: (indRow?.value as unknown as Record<string, number>) || {},
    })
}


async function postHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  logger.apiRequest('POST', '/api/user-frequencies', { userId: session.user.id })

  const bodySchema = z.object({
    companies: z.array(z.string()).optional().default([]),
    industries: z.array(z.string()).optional().default([]),
  })

  const bodyValidation = await validateBody(request, bodySchema)
  if (!bodyValidation.success) {
    return bodyValidation.response
  }

    const { companies, industries } = bodyValidation.data

    const compKey = `${COMP_PREFIX}${session.user.id}`
    const indKey = `${IND_PREFIX}${session.user.id}`

    // Load existing using Prisma
    const [compRow, indRow] = await Promise.all([
      db.systemSetting.findUnique({
        where: { key: compKey },
        select: { value: true }
      }),
      db.systemSetting.findUnique({
        where: { key: indKey },
        select: { value: true }
      })
    ])

    const compMap: Record<string, number> = (compRow?.value as any) || {}
    const indMap: Record<string, number> = (indRow?.value as any) || {}

    for (const name of companies) {
      if (!name) continue
      compMap[name] = (compMap[name] || 0) + 1
    }
    for (const name of industries) {
      if (!name) continue
      indMap[name] = (indMap[name] || 0) + 1
    }

    if (companies.length > 0) {
      await db.systemSetting.upsert({
        where: { key: compKey },
        update: { value: JSON.stringify(compMap), updatedAt: new Date() },
        create: { key: compKey, value: JSON.stringify(compMap) }
      })
    }
    if (industries.length > 0) {
      await db.systemSetting.upsert({
        where: { key: indKey },
        update: { value: JSON.stringify(indMap), updatedAt: new Date() },
        create: { key: indKey, value: JSON.stringify(indMap) }
      })
    }

    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/user-frequencies', 200, duration, {
      companyCount: companies.length,
      industryCount: industries.length,
    })
    return NextResponse.json({ ok: true })
}

export const POST = withErrorHandling(postHandler, 'POST /api/user-frequencies')




export const GET = withErrorHandling(getHandler, 'GET GET /api/user-frequencies')