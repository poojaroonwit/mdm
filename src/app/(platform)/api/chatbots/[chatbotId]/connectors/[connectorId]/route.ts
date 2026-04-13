import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

// PUT - Update connector
async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string; connectorId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { connectorId } = await params
  const body = await request.json()
  const { connectorType, enabled, credentials, config, metadata } = body

  const connector = await prisma.chatbotConnector.update({
    where: { id: connectorId },
    data: {
      ...(connectorType && { connectorType }),
      ...(enabled !== undefined && { enabled }),
      ...(credentials !== undefined && { credentials: credentials || null }),
      ...(config && { config }),
      ...(metadata && { metadata }),
    },
  })

  return NextResponse.json({ connector })
}

// DELETE - Delete connector
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string; connectorId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { connectorId } = await params
  await prisma.chatbotConnector.delete({
    where: { id: connectorId },
  })

  return NextResponse.json({ success: true })
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/chatbots/[chatbotId]/connectors/[connectorId]')
export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/chatbots/[chatbotId]/connectors/[connectorId]')
