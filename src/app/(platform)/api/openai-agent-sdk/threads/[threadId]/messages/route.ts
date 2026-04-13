import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { OpenAI } from 'openai'

// GET - Get messages for a specific thread
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { threadId } = await params

    // Get thread from database to verify ownership and get API key
    const thread = await prisma.openAIAgentThread.findFirst({
      where: {
        threadId,
        userId: session.user.id,
        deletedAt: null,
      },
      include: {
        chatbot: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    // Get API key from thread metadata or chatbot config
    const metadata = thread.metadata as any
    const apiKey = metadata?.apiKey
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not found' }, { status: 404 })
    }

    // Fetch messages from OpenAI API
    const openai = new OpenAI({ apiKey })
    const messagesResponse = await openai.beta.threads.messages.list(threadId, {
      limit: 100,
      order: 'asc', // Oldest first
    })

    // Format messages for frontend
    const messages = (messagesResponse.data || []).map((msg) => ({
      id: msg.id,
      role: msg.role,
      content: msg.content,
      created_at: msg.created_at,
      traceId: (msg.metadata as any)?.traceId,
    }))

    return NextResponse.json({ messages })
  } catch (error: any) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages', details: error.message },
      { status: 500 }
    )
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/openai-agent-sdk/threads/[threadId]/messages')
