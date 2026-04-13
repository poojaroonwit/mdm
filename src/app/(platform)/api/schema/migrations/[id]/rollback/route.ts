import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { schemaMigration } from '@/lib/schema-migration'

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { id } = await params
  await schemaMigration.initialize()
  const result = await schemaMigration.rollbackMigration(id, session.user.id)

  return NextResponse.json(result)
}

export const POST = withErrorHandling(postHandler, 'POST /api/schema/migrations/[id]/rollback')

