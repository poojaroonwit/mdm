import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'

async function getHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 })
    }

    const environments = await prisma.apiEnvironment.findMany({
      where: {
        workspaceId,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ environments })
}

export const GET = withErrorHandling(getHandler, 'GET /api/api-client/environments')

async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const body = await request.json()
    const { workspaceId, name, variables, isGlobal } = body

    const environment = await prisma.apiEnvironment.create({
      data: {
        workspaceId,
        name,
        variables: variables || [],
        isGlobal: isGlobal || false,
        createdBy: session.user.id,
      },
    })

    return NextResponse.json({ environment })
}




export const POST = withErrorHandling(postHandler, 'POST POST /api/api-client/environments')