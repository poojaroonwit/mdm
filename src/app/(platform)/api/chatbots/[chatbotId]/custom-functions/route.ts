import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { isUuid } from '@/lib/validation'

// GET - List custom functions
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { chatbotId } = await params

  // Validate UUID format before querying
  if (!isUuid(chatbotId)) {
    return NextResponse.json(
      { error: 'Invalid chatbot ID format', details: 'Chatbot ID must be a valid UUID' },
      { status: 400 }
    )
  }

  const functions = await prisma.chatbotCustomFunction.findMany({
    where: { chatbotId },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ functions })
}

// POST - Create custom function
async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { chatbotId } = await params

  // Validate UUID format before querying
  if (!isUuid(chatbotId)) {
    return NextResponse.json(
      { error: 'Invalid chatbot ID format', details: 'Chatbot ID must be a valid UUID' },
      { status: 400 }
    )
  }

  const body = await request.json()
  const { name, description, parameters, endpoint, code, executionType, enabled, metadata } = body

  if (!name || !description || !parameters) {
    return NextResponse.json(
      { error: 'name, description, and parameters are required' },
      { status: 400 }
    )
  }

  const func = await prisma.chatbotCustomFunction.create({
    data: {
      chatbotId,
      name,
      description,
      parameters,
      endpoint: endpoint || null,
      code: code || null,
      executionType: executionType || 'api',
      enabled: enabled !== undefined ? enabled : true,
      metadata: metadata || {},
    },
  })

  return NextResponse.json({ function: func })
}

export const GET = withErrorHandling(getHandler, 'GET /api/chatbots/[chatbotId]/custom-functions')
export const POST = withErrorHandling(postHandler, 'POST /api/chatbots/[chatbotId]/custom-functions')