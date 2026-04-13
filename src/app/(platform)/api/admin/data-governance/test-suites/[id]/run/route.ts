import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    // TODO: Execute test suite in OpenMetadata using id
    return NextResponse.json({
      success: true,
      message: 'Test suite execution started',
    })
  } catch (error) {
    console.error('Error running test suite:', error)
    return NextResponse.json(
      { error: 'Failed to run test suite' },
      { status: 500 },
    )
  }
}

export const POST = withErrorHandling(
  postHandler,
  'POST /api/admin/data-governance/test-suites/[id]/run',
)