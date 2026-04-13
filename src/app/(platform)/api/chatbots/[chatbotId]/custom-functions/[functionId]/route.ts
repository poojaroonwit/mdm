import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

// GET - Get custom function
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string; functionId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { chatbotId, functionId } = await params
  const func = await prisma.chatbotCustomFunction.findUnique({
    where: { id: functionId },
  })

  if (!func || func.chatbotId !== chatbotId) {
    return NextResponse.json({ error: 'Function not found' }, { status: 404 })
  }

  return NextResponse.json({ function: func })
}

// PUT - Update custom function
async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string; functionId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { functionId } = await params
  const body = await request.json()
  const { name, description, parameters, endpoint, code, executionType, enabled, metadata } = body

  const func = await prisma.chatbotCustomFunction.update({
    where: { id: functionId },
    data: {
      ...(name && { name }),
      ...(description && { description }),
      ...(parameters && { parameters }),
      ...(endpoint !== undefined && { endpoint: endpoint || null }),
      ...(code !== undefined && { code: code || null }),
      ...(executionType && { executionType }),
      ...(enabled !== undefined && { enabled }),
      ...(metadata && { metadata }),
    },
  })

  return NextResponse.json({ function: func })
}

// DELETE - Delete custom function
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string; functionId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { functionId } = await params
  await prisma.chatbotCustomFunction.delete({
    where: { id: functionId },
  })

  return NextResponse.json({ success: true })
}

export const GET = withErrorHandling(getHandler, 'GET /api/chatbots/[chatbotId]/custom-functions/[functionId]')
export const PUT = withErrorHandling(putHandler, 'PUT /api/chatbots/[chatbotId]/custom-functions/[functionId]')
export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/chatbots/[chatbotId]/custom-functions/[functionId]')