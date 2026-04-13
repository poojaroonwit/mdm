import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware';
import { db } from '@/lib/db';

// POST - Publish a chatbot (set isPublished to true and mark latest version as published)
async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const authResult = await requireAuthWithId();
  if (!authResult.success) return authResult.response;
  const { session } = authResult;

  const { chatbotId } = await params;

  // Check if chatbot exists and user has access
  const existingChatbot = await db.chatbot.findFirst({
    where: {
      id: chatbotId,
      deletedAt: null,
      OR: [
        { createdBy: session.user.id },
        { space: { members: { some: { userId: session.user.id } } } }
      ]
    },
    include: {
      versions: {
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  if (!existingChatbot) {
    return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
  }

  // Update the chatbot to published
  const updatedChatbot = await db.chatbot.update({
    where: { id: chatbotId },
    data: {
      isPublished: true,
      updatedAt: new Date()
    }
  });

  // Mark the latest version as published
  if (existingChatbot.versions.length > 0) {
    const latestVersion = existingChatbot.versions[0];
    await db.chatbotVersion.update({
      where: { id: latestVersion.id },
      data: { isPublished: true }
    });
  }

  return NextResponse.json({ 
    success: true,
    chatbot: updatedChatbot,
    message: 'Chatbot published successfully'
  });
}

// DELETE - Unpublish a chatbot (set isPublished to false)
async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const authResult = await requireAuthWithId();
  if (!authResult.success) return authResult.response;
  const { session } = authResult;

  const { chatbotId } = await params;

  // Check if chatbot exists and user has access
  const existingChatbot = await db.chatbot.findFirst({
    where: {
      id: chatbotId,
      deletedAt: null,
      OR: [
        { createdBy: session.user.id },
        { space: { members: { some: { userId: session.user.id } } } }
      ]
    }
  });

  if (!existingChatbot) {
    return NextResponse.json({ error: 'Chatbot not found' }, { status: 404 });
  }

  // Update the chatbot to unpublished
  const updatedChatbot = await db.chatbot.update({
    where: { id: chatbotId },
    data: {
      isPublished: false,
      updatedAt: new Date()
    }
  });

  return NextResponse.json({ 
    success: true,
    chatbot: updatedChatbot,
    message: 'Chatbot unpublished successfully'
  });
}

export const POST = withErrorHandling(postHandler, 'POST /api/chatbots/[chatbotId]/publish');
export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/chatbots/[chatbotId]/publish');
