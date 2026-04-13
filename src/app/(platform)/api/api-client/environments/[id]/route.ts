import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { id } = await params
    const body = await request.json()
    const { name, variables, isGlobal } = body

    const environment = await prisma.apiEnvironment.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(variables !== undefined && { variables }),
        ...(isGlobal !== undefined && { isGlobal }),
      },
    })

    return NextResponse.json({ environment })
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/api-client/environments/[id]')

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { id } = await params
    await prisma.apiEnvironment.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/api-client/environments/[id]')

