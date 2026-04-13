import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'

async function getHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    const limit = parseInt(searchParams.get('limit') || '50')

    const history = await prisma.apiRequestHistory.findMany({
      where: {
        createdBy: session.user.id,
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ history })
}


async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const body = await request.json()
    const {
      requestId,
      method,
      url,
      headers,
      body: requestBody,
      statusCode,
      statusText,
      responseHeaders,
      responseBody,
      responseTime,
      error,
    } = body

    const historyItem = await prisma.apiRequestHistory.create({
      data: {
        requestId,
        method,
        url,
        headers: headers || {},
        body: requestBody,
        statusCode,
        statusText,
        responseHeaders,
        responseBody,
        responseTime,
        error,
        createdBy: session.user.id,
      },
    })

    return NextResponse.json({ history: historyItem })
}




export const GET = withErrorHandling(getHandler, 'GET GET /api/api-client/history')
export const POST = withErrorHandling(postHandler, 'POST POST /api/api-client/history')