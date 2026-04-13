import { requireAuth, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'

async function getHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    // TODO: Load ingestion pipelines from OpenMetadata, potentially scoped by session
    const pipelines: any[] = []

    return NextResponse.json({ pipelines })
  } catch (error) {
    console.error('Error loading ingestion pipelines:', error)
    return NextResponse.json(
      { error: 'Failed to load ingestion pipelines' },
      { status: 500 },
    )
  }
}

export const GET = withErrorHandling(
  getHandler,
  'GET /api/admin/data-governance/ingestion',
)

async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const body = await request.json()

    // TODO: Create ingestion pipeline in OpenMetadata
    const pipeline = {
      id: `pipeline_${Date.now()}`,
      ...body,
      status: 'idle',
      createdAt: new Date(),
    }

    return NextResponse.json({ pipeline })
  } catch (error) {
    console.error('Error creating ingestion pipeline:', error)
    return NextResponse.json(
      { error: 'Failed to create ingestion pipeline' },
      { status: 500 },
    )
  }
}

export const POST = withErrorHandling(
  postHandler,
  'POST /api/admin/data-governance/ingestion',
)