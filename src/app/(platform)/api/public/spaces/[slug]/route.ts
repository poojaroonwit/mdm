import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: identifier } = await params

    const result = await query(
      `SELECT id, name, slug, logo_url, features
       FROM spaces
       WHERE deleted_at IS NULL AND (slug = $1 OR id = $1)
       LIMIT 1`,
      [identifier]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 })
    }

    return NextResponse.json({ space: result.rows[0] })
  } catch (error) {
    console.error('Error fetching public space info:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
