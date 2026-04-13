import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

// GET - List threads for a chatbot
async function getHandler(request: NextRequest) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const { searchParams } = new URL(request.url)
    const chatbotId = searchParams.get('chatbotId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!chatbotId) {
      return NextResponse.json({ error: 'chatbotId is required' }, { status: 400 })
    }

    const threads = await prisma.openAIAgentThread.findMany({
      where: {
        chatbotId,
        userId: session.user.id,
        deletedAt: null,
      },
      orderBy: {
        lastMessageAt: 'desc',
      },
      take: limit,
      skip: offset,
      select: {
        id: true,
        threadId: true,
        title: true,
        messageCount: true,
        lastMessageAt: true,
        createdAt: true,
        metadata: true,
      },
    })

    return NextResponse.json({ threads })
  } catch (error: any) {
    console.error('Error fetching threads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch threads', details: error.message },
      { status: 500 }
    )
  }
}

// POST - Create a new thread
async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const body = await request.json()
    const { chatbotId, threadId, title, metadata, spaceId } = body

    if (!chatbotId || !threadId) {
      return NextResponse.json({ error: 'chatbotId and threadId are required' }, { status: 400 })
    }

    // Check if thread already exists
    const existing = await prisma.openAIAgentThread.findUnique({
      where: { threadId },
    })

    if (existing) {
      return NextResponse.json({ thread: existing }, { status: 200 })
    }

    const thread = await prisma.openAIAgentThread.create({
      data: {
        threadId,
        chatbotId,
        userId: session.user.id,
        spaceId: spaceId || null,
        title: title || 'New Conversation',
        metadata: metadata || {},
        messageCount: 0,
        lastMessageAt: new Date(),
      },
    })

    return NextResponse.json({ thread }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating thread:', error)
    return NextResponse.json(
      { error: 'Failed to create thread', details: error.message },
      { status: 500 }
    )
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/openai-agent-sdk/threads')
export const POST = withErrorHandling(postHandler, 'POST /api/openai-agent-sdk/threads')
