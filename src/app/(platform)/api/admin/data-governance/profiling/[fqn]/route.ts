import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ fqn: string }> },
) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { fqn: fqnParam } = await params
    const fqn = decodeURIComponent(fqnParam)

    // TODO: Load config from database
    // For now, return mock profile data
    const profile = {
      rowCount: 10000,
      columnCount: 8,
      timestamp: new Date(),
      columns: [
        {
          name: 'id',
          type: 'INTEGER',
          nullCount: 0,
          nullPercentage: 0,
          uniqueCount: 10000,
          uniquePercentage: 100,
          distinctCount: 10000,
        },
        {
          name: 'email',
          type: 'VARCHAR',
          nullCount: 0,
          nullPercentage: 0,
          uniqueCount: 9950,
          uniquePercentage: 99.5,
          distinctCount: 9950,
        },
        {
          name: 'created_at',
          type: 'TIMESTAMP',
          nullCount: 0,
          nullPercentage: 0,
          uniqueCount: 8500,
          uniquePercentage: 85,
          distinctCount: 8500,
          min: '2020-01-01',
          max: '2024-12-31',
        },
      ],
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Error loading profile:', error)
    return NextResponse.json(
      { error: 'Failed to load profile' },
      { status: 500 },
    )
  }
}

export const GET = withErrorHandling(
  getHandler,
  'GET /api/admin/data-governance/profiling/[fqn]',
)