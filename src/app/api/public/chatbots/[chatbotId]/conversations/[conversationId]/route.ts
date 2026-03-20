import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Cache-Control': 'no-store',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders })
}

// PUT /api/public/chatbots/[chatbotId]/conversations/[conversationId]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string; conversationId: string }> }
) {
  try {
    const { chatbotId, conversationId } = await params
    const body = await request.json()
    const { sessionId, title, messages } = body

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400, headers: corsHeaders })
    }

    const conversation = await db.widgetConversation.updateMany({
      where: { id: conversationId, chatbotId, sessionId },
      data: {
        ...(title !== undefined && { title }),
        ...(messages !== undefined && { messages }),
      },
    })

    if (conversation.count === 0) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404, headers: corsHeaders })
    }

    return NextResponse.json({ success: true }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error updating widget conversation:', error)
    return NextResponse.json({ error: 'Failed to update conversation' }, { status: 500, headers: corsHeaders })
  }
}

// DELETE /api/public/chatbots/[chatbotId]/conversations/[conversationId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string; conversationId: string }> }
) {
  try {
    const { chatbotId, conversationId } = await params
    const sessionId = request.nextUrl.searchParams.get('sessionId')

    if (!sessionId) {
      return NextResponse.json({ error: 'sessionId required' }, { status: 400, headers: corsHeaders })
    }

    await db.widgetConversation.deleteMany({
      where: { id: conversationId, chatbotId, sessionId },
    })

    return NextResponse.json({ success: true }, { headers: corsHeaders })
  } catch (error) {
    console.error('Error deleting widget conversation:', error)
    return NextResponse.json({ error: 'Failed to delete conversation' }, { status: 500, headers: corsHeaders })
  }
}
