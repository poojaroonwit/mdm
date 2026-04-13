import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

// GET - Get a specific thread
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

    const thread = await prisma.openAIAgentThread.findFirst({
      where: {
        threadId,
        userId: session.user.id,
        deletedAt: null,
      },
    })

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    return NextResponse.json({ thread })
  } catch (error: any) {
    console.error('Error fetching thread:', error)
    return NextResponse.json(
      { error: 'Failed to fetch thread', details: error.message },
      { status: 500 }
    )
  }
}

// PATCH - Update thread (title, metadata, etc.)
async function patchHandler(
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
    const body = await request.json()
    const { title, metadata } = body

    const thread = await prisma.openAIAgentThread.findFirst({
      where: {
        threadId,
        userId: session.user.id,
        deletedAt: null,
      },
    })

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    const updated = await prisma.openAIAgentThread.update({
      where: { id: thread.id },
      data: {
        ...(title !== undefined && { title }),
        ...(metadata !== undefined && { metadata }),
      },
    })

    return NextResponse.json({ thread: updated })
  } catch (error: any) {
    console.error('Error updating thread:', error)
    return NextResponse.json(
      { error: 'Failed to update thread', details: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete a thread
async function deleteHandler(
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

    const thread = await prisma.openAIAgentThread.findFirst({
      where: {
        threadId,
        userId: session.user.id,
        deletedAt: null,
      },
    })

    if (!thread) {
      return NextResponse.json({ error: 'Thread not found' }, { status: 404 })
    }

    await prisma.openAIAgentThread.update({
      where: { id: thread.id },
      data: { deletedAt: new Date() },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting thread:', error)
    return NextResponse.json(
      { error: 'Failed to delete thread', details: error.message },
      { status: 500 }
    )
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/openai-agent-sdk/threads/[threadId]')
export const PATCH = withErrorHandling(patchHandler, 'PATCH /api/openai-agent-sdk/threads/[threadId]')
export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/openai-agent-sdk/threads/[threadId]')
