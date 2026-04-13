import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'

async function getHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { searchParams } = new URL(request.url)
    const spaceId = searchParams.get('spaceId')

    const workspaces = await prisma.apiWorkspace.findMany({
      where: {
        createdBy: session.user.id,
        ...(spaceId && { spaceId }),
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ workspaces })
}


async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const body = await request.json()
    const { name, description, spaceId } = body

    const workspace = await prisma.apiWorkspace.create({
      data: {
        name,
        description,
        spaceId,
        isPersonal: !spaceId,
        createdBy: session.user.id,
      },
    })

    return NextResponse.json({ workspace })
}




export const GET = withErrorHandling(getHandler, 'GET GET /api/api-client/workspaces')
export const POST = withErrorHandling(postHandler, 'POST POST /api/api-client/workspaces')