import { requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { NextRequest, NextResponse } from 'next/server'
import { getSecretsManager } from '@/lib/secrets-manager'

async function getHandler(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 },
    )
  }

  const secretsManager = getSecretsManager()
  const health = await secretsManager.healthCheck()

  const aiProviders = await secretsManager.listSecrets('ai-providers')
  const dbConnections = await secretsManager.listSecrets('database-connections')
  const externalConnections = await secretsManager.listSecrets(
    'external-connections',
  )

  return NextResponse.json({
    backend: health.backend,
    healthy: health.healthy,
    vaultStatus: health.vaultStatus,
    secrets: {
      aiProviders: aiProviders.length,
      databaseConnections: dbConnections.length,
      externalConnections: externalConnections.length,
    },
    paths: {
      aiProviders,
      databaseConnections: dbConnections,
      externalConnections: externalConnections,
    },
  })
}

export const GET = withErrorHandling(getHandler, 'GET /api/admin/secrets')

async function postHandler(request: NextRequest) {
  const authResult = await requireAdmin()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
    return NextResponse.json(
      { error: 'Insufficient permissions' },
      { status: 403 },
    )
  }

  const body = await request.json()
  const { action } = body

  if (action === 'health') {
    const secretsManager = getSecretsManager()
    const health = await secretsManager.healthCheck()
    return NextResponse.json(health)
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

export const POST = withErrorHandling(postHandler, 'POST /api/admin/secrets')


