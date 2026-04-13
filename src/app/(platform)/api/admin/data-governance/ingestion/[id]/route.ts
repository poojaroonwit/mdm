import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'

async function patchHandler(
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
    const body = await request.json()

    // TODO: Update ingestion pipeline in OpenMetadata using id and body
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating ingestion pipeline:', error)
    return NextResponse.json(
      { error: 'Failed to update ingestion pipeline' },
      { status: 500 },
    )
  }
}

export const PATCH = withErrorHandling(
  patchHandler,
  'PATCH /api/admin/data-governance/ingestion/[id]',
)

async function deleteHandler(
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
    // TODO: Delete ingestion pipeline in OpenMetadata using id
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting ingestion pipeline:', error)
    return NextResponse.json(
      { error: 'Failed to delete ingestion pipeline' },
      { status: 500 },
    )
  }
}

export const DELETE = withErrorHandling(
  deleteHandler,
  'DELETE /api/admin/data-governance/ingestion/[id]',
)