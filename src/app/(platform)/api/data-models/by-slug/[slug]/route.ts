import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { rows } = await query(
      'SELECT * FROM public.data_models WHERE slug = $1 AND deleted_at IS NULL',
      [slug]
    )
    if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ dataModel: rows[0] })
  } catch (error) {
    console.error('Error fetching data model by slug:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


