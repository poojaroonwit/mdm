import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { logAPIRequest } from '@/shared/lib/security/audit-logger'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const { id } = await params

    // Get services with management plugins for this instance
    // Join with service_registry to get plugin slugs
    const result = await query(
      `SELECT DISTINCT sr.slug
       FROM instance_services is
       JOIN service_registry sr ON sr.id = is.management_plugin_id
       WHERE is.instance_id = $1
         AND is.management_plugin_id IS NOT NULL
         AND sr.slug IN ('minio-management', 'kong-management', 'grafana-management', 'prometheus-management')
         AND is.deleted_at IS NULL
         AND sr.deleted_at IS NULL`,
      [id]
    )

    // Map plugin slugs to tags
    const slugToTag: Record<string, string> = {
      'minio-management': 'minio',
      'kong-management': 'kong',
      'grafana-management': 'grafana',
      'prometheus-management': 'prometheus',
    }

    const tags = result.rows
      .map((row: any) => row.slug)
      .map((slug: string) => slugToTag[slug])
      .filter((tag): tag is string => tag !== null && tag !== undefined)

    await logAPIRequest(
      session.user.id,
      'GET',
      `/api/infrastructure/instances/${id}/tags`,
      200
    )

    return NextResponse.json({ tags })
}

export const GET = withErrorHandling(getHandler, 'GET /api/infrastructure/instances/[id]/tags')

