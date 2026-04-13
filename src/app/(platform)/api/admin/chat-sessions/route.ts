import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

async function getHandler() {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  // TODO: Add requireSpaceAccess check if spaceId is available

  const chatSessions = await prisma.chatSession.findMany({
    where: {
      userId: session.user.id,
      deletedAt: null,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      space: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      model: {
        select: {
          id: true,
          name: true,
          provider: true,
        },
      },
    },
    orderBy: {
      updatedAt: 'desc',
    },
  })

  const formattedSessions = chatSessions.map((session) => ({
    id: session.id,
    title: session.title,
    description: session.description,
    isPrivate: session.isPrivate,
    userId: session.userId,
    userName: session.user.name,
    userEmail: session.user.email,
    spaceId: session.spaceId,
    spaceName: session.space?.name,
    modelId: session.modelId,
    modelName: session.model?.name,
    provider: session.model?.provider,
    messages: session.messages || [],
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
  }))

  return NextResponse.json({ sessions: formattedSessions })
}


async function postHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  // TODO: Add requireSpaceAccess check if spaceId is available

  const body = await request.json()
  const { title, description, isPrivate, spaceId, modelId } = body

  const chatSession = await prisma.chatSession.create({
    data: {
      title: title || 'New Chat',
      description,
      isPrivate: isPrivate || false,
      userId: session.user.id,
      spaceId: spaceId || null,
      modelId: modelId || null,
      messages: [],
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      space: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      model: {
        select: {
          id: true,
          name: true,
          provider: true,
        },
      },
    },
  })

  const formattedSession = {
    id: chatSession.id,
    title: chatSession.title,
    description: chatSession.description,
    isPrivate: chatSession.isPrivate,
    userId: chatSession.userId,
    userName: chatSession.user.name,
    userEmail: chatSession.user.email,
    spaceId: chatSession.spaceId,
    spaceName: chatSession.space?.name,
    modelId: chatSession.modelId,
    modelName: chatSession.model?.name,
    provider: chatSession.model?.provider,
    messages: chatSession.messages || [],
    createdAt: chatSession.createdAt,
    updatedAt: chatSession.updatedAt,
  }

  return NextResponse.json({ session: formattedSession })
}

export const POST = withErrorHandling(postHandler, 'POST /api/admin/chat-sessions')


export const GET = withErrorHandling(getHandler, 'GET GET /api/admin/chat-sessions')