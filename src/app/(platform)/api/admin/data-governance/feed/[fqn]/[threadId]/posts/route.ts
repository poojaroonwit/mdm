import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ fqn: string; threadId: string }> }
) {
  try {
    const { fqn, threadId } = await params
    const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // TODO: Create post in OpenMetadata
    const post = {
      id: `post_${Date.now()}`,
      ...body,
      createdBy: {
        id: session.user.id,
        name: session.user.name || session.user.email || 'Unknown',
        displayName: session.user.name
      },
      createdAt: new Date()
    }

    return NextResponse.json({ post })
  } catch (error) {
    console.error('Error creating post:', error)
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/admin/data-governance/feed/[fqn]/[threadId]/posts')

