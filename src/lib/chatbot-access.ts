import { db } from '@/lib/db'
import { checkSpaceAccess } from '@/lib/space-access'

export async function getAccessibleSpaceIds(userId: string): Promise<string[]> {
  const [spaceMembers, ownedSpaces] = await Promise.all([
    db.spaceMember.findMany({
      where: { userId },
      select: { spaceId: true },
    }),
    db.space.findMany({
      where: { createdBy: userId, deletedAt: null },
      select: { id: true },
    }),
  ])

  return Array.from(
    new Set([
      ...spaceMembers.map((member) => member.spaceId),
      ...ownedSpaces.map((space) => space.id),
    ])
  )
}

export async function canAccessChatbot(
  userId: string,
  chatbot: { createdBy?: string | null; spaceId?: string | null }
): Promise<boolean> {
  if (chatbot.createdBy === userId) {
    return true
  }

  if (!chatbot.spaceId) {
    return false
  }

  return checkSpaceAccess(chatbot.spaceId, userId)
}
