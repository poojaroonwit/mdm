import { requireAuth, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'

async function getHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response

    // TODO: Load from OpenMetadata
    const webhooks: any[] = []

    return NextResponse.json({ webhooks })
  } catch (error) {
    console.error('Error loading webhooks:', error)
    return NextResponse.json(
      { error: 'Failed to load webhooks' },
      { status: 500 },
    )
  }
}

export const GET = withErrorHandling(
  getHandler,
  'GET /api/admin/data-governance/webhooks',
)

async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response

    const body = await request.json()

    // TODO: Create in OpenMetadata
    const webhook = {
      id: `webhook_${Date.now()}`,
      ...body,
      status: 'active',
      successCount: 0,
      failureCount: 0,
      createdAt: new Date(),
    }

    return NextResponse.json({ webhook })
  } catch (error) {
    console.error('Error creating webhook:', error)
    return NextResponse.json(
      { error: 'Failed to create webhook' },
      { status: 500 },
    )
  }
}

export const POST = withErrorHandling(
  postHandler,
  'POST /api/admin/data-governance/webhooks',
)