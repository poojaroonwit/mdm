import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { schemaMigration } from '@/lib/schema-migration'

async function getHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    await schemaMigration.initialize()
    const migrations = await schemaMigration.getMigrations()

    return NextResponse.json(migrations)
  } catch (error: any) {
    console.error('Error fetching migrations:', error)
    return NextResponse.json(
      { error: 'Failed to fetch migrations', details: error.message },
      { status: 500 }
    )
  }
}

async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const body = await request.json()
    await schemaMigration.initialize()
    const migrationId = await schemaMigration.createMigration(body)
    const migrations = await schemaMigration.getMigrations()
    const migration = migrations.find(m => m.id === migrationId)

    return NextResponse.json(migration, { status: 201 })
  } catch (error: any) {
    console.error('Error creating migration:', error)
    return NextResponse.json(
      { error: 'Failed to create migration', details: error.message },
      { status: 500 }
    )
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/schema/migrations')
export const POST = withErrorHandling(postHandler, 'POST /api/schema/migrations')
