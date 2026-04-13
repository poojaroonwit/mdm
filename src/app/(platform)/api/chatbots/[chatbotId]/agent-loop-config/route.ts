import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { isUuid } from '@/lib/validation'

// GET - Get agent loop config
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
    
    const config = await prisma.chatbotAgentLoopConfig.findUnique({
      where: { chatbotId },
    })

    return NextResponse.json({ config: config || null })
}

// POST - Create or update agent loop config
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
    const { maxIterations, stopConditions, timeout, enableHumanInLoop, humanInLoopConfig, metadata } = body

    const config = await prisma.chatbotAgentLoopConfig.upsert({
      where: { chatbotId },
      create: {
        chatbotId,
        maxIterations: maxIterations || null,
        stopConditions: stopConditions || {},
        timeout: timeout || null,
        enableHumanInLoop: enableHumanInLoop || false,
        humanInLoopConfig: humanInLoopConfig || {},
        metadata: metadata || {},
      },
      update: {
        maxIterations: maxIterations !== undefined ? maxIterations : undefined,
        stopConditions: stopConditions !== undefined ? stopConditions : undefined,
        timeout: timeout !== undefined ? timeout : undefined,
        enableHumanInLoop: enableHumanInLoop !== undefined ? enableHumanInLoop : undefined,
        humanInLoopConfig: humanInLoopConfig !== undefined ? humanInLoopConfig : undefined,
        metadata: metadata !== undefined ? metadata : undefined,
      },
    })

    return NextResponse.json({ config })
}

export const GET = withErrorHandling(getHandler, 'GET /api/chatbots/[chatbotId]/agent-loop-config')
export const POST = withErrorHandling(postHandler, 'POST /api/chatbots/[chatbotId]/agent-loop-config')
