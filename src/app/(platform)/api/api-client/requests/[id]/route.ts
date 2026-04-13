import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { prisma } from '@/lib/prisma'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { id } = await params
    const apiRequest = await prisma.apiRequest.findUnique({
      where: { id },
    })

    if (!apiRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    return NextResponse.json({ request: apiRequest })
}

export const GET = withErrorHandling(getHandler, 'GET /api/api-client/requests/[id]')

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { id } = await params
    const body = await request.json()

    const apiRequest = await prisma.apiRequest.update({
      where: { id },
      data: body,
    })

    return NextResponse.json({ request: apiRequest })
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/api-client/requests/[id]')

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { id } = await params
    await prisma.apiRequest.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/api-client/requests/[id]')

