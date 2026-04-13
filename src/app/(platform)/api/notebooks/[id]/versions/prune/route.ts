import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// POST: Prune old versions, keeping only the last N versions
async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const notebookId = decodeURIComponent(id)
    const body = await request.json()
    const { keep_count = 50 } = body // Default: keep last 50 versions

    // Get all versions ordered by version number (descending)
    const { rows: allVersions } = await query(
      `SELECT id, version_number, is_current
       FROM public.notebook_versions
       WHERE notebook_id = $1::uuid
       ORDER BY version_number DESC`,
      [notebookId]
    )

    if (allVersions.length <= keep_count) {
      return NextResponse.json({
        success: true,
        message: 'No versions to prune',
        kept: allVersions.length,
        deleted: 0
      })
    }

    // Find versions to delete (keep current + last N)
    const currentVersion = allVersions.find((v) => v.is_current)
    const versionsToKeep = allVersions.slice(0, keep_count)
    if (currentVersion && !versionsToKeep.find((v) => v.id === currentVersion.id)) {
      versionsToKeep.push(currentVersion)
    }

    const versionsToDelete = allVersions.filter(
      (v) => !versionsToKeep.find((kept) => kept.id === v.id)
    )

    // Delete old versions
    if (versionsToDelete.length > 0) {
      const idsToDelete = versionsToDelete.map((v) => v.id)
      await query(
        `DELETE FROM public.notebook_versions
         WHERE notebook_id = $1::uuid AND id = ANY($2::uuid[])`,
        [notebookId, idsToDelete]
      )
    }

    return NextResponse.json({
      success: true,
      message: `Pruned ${versionsToDelete.length} old versions`,
      kept: versionsToKeep.length,
      deleted: versionsToDelete.length
    })
  } catch (error: any) {
    console.error('Error pruning versions:', error)
    return NextResponse.json(
      { error: 'Failed to prune versions', details: error.message },
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/notebooks/[id]/versions/prune')
