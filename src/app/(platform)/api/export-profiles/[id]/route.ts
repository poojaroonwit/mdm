import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { id } = await params

  // ExportProfile model doesn't exist in Prisma schema
  return NextResponse.json(
    { error: 'Export profile model not implemented' },
    { status: 501 }
  )
}

export const GET = withErrorHandling(getHandler, 'GET /api/export-profiles/[id]')

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { id } = await params

  // ExportProfile model doesn't exist in Prisma schema
  return NextResponse.json(
    { error: 'Export profile model not implemented' },
    { status: 501 }
  )
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/export-profiles/[id]')

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { id } = await params

  // ExportProfile model doesn't exist in Prisma schema
  return NextResponse.json(
    { error: 'Export profile model not implemented' },
    { status: 501 }
  )
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/export-profiles/[id]')
