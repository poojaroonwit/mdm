import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET - Get rate limit config
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
  const config = await prisma.chatbotRateLimit.findUnique({
    where: { chatbotId },
  })

  if (!config) {
    return NextResponse.json({ config: null })
  }

  return NextResponse.json({ config })
}

// POST/PUT - Create or update rate limit config
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
    maxRequestsPerMinute,
    maxRequestsPerHour,
    maxRequestsPerDay,
    maxRequestsPerMonth,
    burstLimit,
    windowSize,
    blockDuration,
  } = body

  const config = await prisma.chatbotRateLimit.upsert({
    where: { chatbotId },
    create: {
      chatbotId,
      enabled: enabled ?? true,
      maxRequestsPerMinute: maxRequestsPerMinute ?? 60,
      maxRequestsPerHour: maxRequestsPerHour ?? 1000,
      maxRequestsPerDay: maxRequestsPerDay ?? 10000,
      maxRequestsPerMonth: maxRequestsPerMonth || null,
      burstLimit: burstLimit || null,
      windowSize: windowSize ?? 60,
      blockDuration: blockDuration ?? 300,
    },
    update: {
      enabled: enabled ?? true,
      maxRequestsPerMinute,
      maxRequestsPerHour,
      maxRequestsPerDay,
      maxRequestsPerMonth: maxRequestsPerMonth || null,
      burstLimit: burstLimit || null,
      windowSize,
      blockDuration,
    },
  })

  return NextResponse.json({ config })
}

// DELETE - Reset rate limit config to defaults
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
  await prisma.chatbotRateLimit.deleteMany({
    where: { chatbotId },
  })

  return NextResponse.json({ success: true })
}

export const GET = withErrorHandling(getHandler, 'GET /api/chatbots/[chatbotId]/rate-limit')
export const POST = withErrorHandling(postHandler, 'POST /api/chatbots/[chatbotId]/rate-limit')
export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/chatbots/[chatbotId]/rate-limit')
