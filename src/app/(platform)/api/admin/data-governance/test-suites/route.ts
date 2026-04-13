import { requireAuth, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'

async function getHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response

    // TODO: Load from OpenMetadata
    const testSuites: any[] = []

    return NextResponse.json({ testSuites })
  } catch (error) {
    console.error('Error loading test suites:', error)
    return NextResponse.json(
      { error: 'Failed to load test suites' },
      { status: 500 },
    )
  }
}

export const GET = withErrorHandling(
  getHandler,
  'GET /api/admin/data-governance/test-suites',
)

async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response

    const body = await request.json()

    // TODO: Create in OpenMetadata
    const testSuite = {
      id: `suite_${Date.now()}`,
      ...body,
      testCases: [],
      createdAt: new Date(),
    }

    return NextResponse.json({ testSuite })
  } catch (error) {
    console.error('Error creating test suite:', error)
    return NextResponse.json(
      { error: 'Failed to create test suite' },
      { status: 500 },
    )
  }
}

export const POST = withErrorHandling(
  postHandler,
  'POST /api/admin/data-governance/test-suites',
)