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
    // TODO: Trigger pipeline in OpenMetadata using id
    return NextResponse.json({
      success: true,
      message: 'Pipeline execution started',
    })
  } catch (error) {
    console.error('Error triggering ingestion pipeline:', error)
    return NextResponse.json(
      { error: 'Failed to trigger ingestion pipeline' },
      { status: 500 },
    )
  }
}

export const POST = withErrorHandling(
  postHandler,
  'POST /api/admin/data-governance/ingestion/[id]/trigger',
)