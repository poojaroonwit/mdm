import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get retry config
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
  const config = await prisma.chatbotRetryConfig.findUnique({
    where: { chatbotId },
  })

  if (!config) {
    return NextResponse.json({ config: null })
  }

  return NextResponse.json({ config })
}

// POST/PUT - Create or update retry config
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
  const body = await request.json()
  const {
    enabled,
    maxRetries,
    initialDelay,
    maxDelay,
    backoffMultiplier,
    retryableStatusCodes,
    jitter,
  } = body

  const config = await prisma.chatbotRetryConfig.upsert({
    where: { chatbotId },
    create: {
      chatbotId,
      enabled: enabled ?? true,
      maxRetries: maxRetries ?? 3,
      initialDelay: initialDelay ?? 1000,
      maxDelay: maxDelay ?? 30000,
      backoffMultiplier: backoffMultiplier ?? 2.0,
      retryableStatusCodes: retryableStatusCodes ?? ['500', '502', '503', '504'],
      jitter: jitter ?? true,
    },
    update: {
      enabled: enabled ?? true,
      maxRetries,
      initialDelay,
      maxDelay,
      backoffMultiplier,
      retryableStatusCodes,
      jitter,
    },
  })

  return NextResponse.json({ config })
}

// DELETE - Reset retry config to defaults
async function deleteHandler(
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
  
  // Delete the config (it will use defaults on next creation)
  await prisma.chatbotRetryConfig.deleteMany({
    where: { chatbotId },
  })

  return NextResponse.json({ success: true })
}

export const GET = withErrorHandling(getHandler, 'GET /api/chatbots/[chatbotId]/retry-config')
export const POST = withErrorHandling(postHandler, 'POST /api/chatbots/[chatbotId]/retry-config')
export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/chatbots/[chatbotId]/retry-config')
