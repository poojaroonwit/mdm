import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { query } from '@/lib/db'

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response

  const { id } = await params

  const { rows } = await query(
    'UPDATE public.security_events SET resolved = true WHERE id::text = $1 RETURNING id',
    [id]
  )

  if (!rows.length) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}

export const POST = withErrorHandling(postHandler, 'POST /api/admin/security-events/[id]/resolve')
