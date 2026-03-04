import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { query } from '@/lib/db'

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response

  const { id } = await params

  const { rows } = await query(
    'DELETE FROM public.security_policies WHERE id::text = $1 RETURNING id',
    [id]
  )

  if (!rows.length) {
    return NextResponse.json({ error: 'Policy not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/admin/security-policies/[id]')
