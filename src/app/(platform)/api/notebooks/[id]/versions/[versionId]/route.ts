import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET: Retrieve a specific version
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: idParam, versionId } = await params
    const notebookId = decodeURIComponent(idParam)

    const { rows } = await query(
      `SELECT * FROM public.notebook_versions
       WHERE notebook_id = $1::uuid AND id = $2::uuid`,
      [notebookId, versionId]
    )

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      )
    }

    const version = rows[0]
    
    // Get creator name
    let author = 'Unknown'
    let authorEmail = ''
    if (version.created_by) {
      const { rows: userRows } = await query(
        'SELECT name, email FROM public.users WHERE id = $1::uuid',
        [version.created_by]
      )
      if (userRows.length > 0) {
        author = userRows[0].name || 'Unknown'
        authorEmail = userRows[0].email || ''
      }
    }

    return NextResponse.json({
      success: true,
      version: {
        ...version,
        notebook_data: JSON.parse(version.notebook_data),
        change_summary: version.change_summary ? JSON.parse(version.change_summary) : null,
        author,
        authorEmail
      }
    })
  } catch (error: any) {
    console.error('Error fetching notebook version:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notebook version' },
      { status: 500 }
    )
  }
}

// POST: Restore a specific version (make it current)
async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: idParam, versionId } = await params
    const notebookId = decodeURIComponent(idParam)

    // Get the version to restore
    const { rows } = await query(
      `SELECT * FROM public.notebook_versions
       WHERE notebook_id = $1::uuid AND id = $2::uuid`,
      [notebookId, versionId]
    )

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Version not found' },
        { status: 404 }
      )
    }

    const version = rows[0]

    // Mark all versions as not current
    await query(
      'UPDATE public.notebook_versions SET is_current = false WHERE notebook_id = $1::uuid',
      [notebookId]
    )

    // Mark this version as current
    await query(
      'UPDATE public.notebook_versions SET is_current = true WHERE id = $1::uuid',
      [versionId]
    )

    return NextResponse.json({
      success: true,
      message: 'Version restored successfully',
      version: {
        ...version,
        notebook_data: JSON.parse(version.notebook_data),
        change_summary: version.change_summary ? JSON.parse(version.change_summary) : null,
        is_current: true
      }
    })
  } catch (error: any) {
    console.error('Error restoring notebook version:', error)
    return NextResponse.json(
      { error: 'Failed to restore notebook version', details: error.message },
      { status: 500 }
    )
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/notebooks/[id]/versions/[versionId]')
export const POST = withErrorHandling(postHandler, 'POST /api/notebooks/[id]/versions/[versionId]')
