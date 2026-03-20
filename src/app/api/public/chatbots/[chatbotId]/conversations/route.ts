import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// GET /api/public/chatbots/[chatbotId]/conversations?sessionId=xxx
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  try {
    const { chatbotId } = await params
    const sessionId = request.nextUrl.searchParams.get('sessionId')
    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400, headers: corsHeaders })
    }

    const conversations = await db.widgetConversation.findMany({
      where: { chatbotId, sessionId },
      orderBy: { updatedAt: 'desc' },
      select: { id: true, title: true, messages: true, createdAt: true, updatedAt: true },
    })

    return NextResponse.json({ conversations }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error fetching widget conversations:', error)
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500, headers: corsHeaders })
  }
}

// POST /api/public/chatbots/[chatbotId]/conversations
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  try {
    const { chatbotId } = await params
    const body = await request.json()
    const { sessionId, title, messages } = body

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400, headers: corsHeaders })
    }

    const conversation = await db.widgetConversation.create({
      data: {
        chatbotId,
        sessionId,
        title: title || 'New Chat',
        messages: messages || [],
      },
    })

    return NextResponse.json({ conversation }, { status: 201, headers: corsHeaders })
  } catch (error) {
    console.error('Error creating widget conversation:', error)
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500, headers: corsHeaders })
  }
}
