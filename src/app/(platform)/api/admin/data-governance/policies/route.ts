import { requireAuth, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'

async function getHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response

    // TODO: Load policies from database or OpenMetadata
    // For now, return mock data
    const policies = [
      {
        id: '1',
        name: 'PII Data Protection',
        description: 'Protect personally identifiable information',
        rules: [
          {
            id: '1',
            name: 'Mask PII',
            type: 'masking',
            condition: 'tag:pii',
            action: 'mask',
            priority: 1,
          },
        ],
        appliesTo: ['database.service.users'],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]

    return NextResponse.json({ policies })
  } catch (error) {
    console.error('Error loading policies:', error)
    return NextResponse.json(
      { error: 'Failed to load policies' },
      { status: 500 },
    )
  }
}

export const GET = withErrorHandling(
  getHandler,
  'GET /api/admin/data-governance/policies',
)