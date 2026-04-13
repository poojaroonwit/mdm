import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET: Retrieve all versions for a notebook
async function getHandler(
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

    // Get all versions for this notebook
    const { rows } = await query(
      `SELECT 
        id,
        notebook_id,
        version_number,
        commit_message,
        commit_description,
        branch_name,
        tags,
        change_summary,
        created_by,
        created_at,
        updated_at,
        is_current
      FROM notebook_versions
      WHERE notebook_id::text = $1
      ORDER BY version_number DESC
      LIMIT 100`,
      [notebookId]
    )

    // Get creator names for versions
    const versionsWithCreators = await Promise.all(
      rows.map(async (version) => {
        if (version.created_by) {
          const { rows: userRows } = await query(
            'SELECT name, email FROM users WHERE id::text = $1',
            [version.created_by]
          )
          if (userRows.length > 0) {
            return {
              ...version,
              author: userRows[0].name || 'Unknown',
              authorEmail: userRows[0].email || ''
            }
          }
        }
        return {
          ...version,
          author: 'Unknown',
          authorEmail: ''
        }
      })
    )

    return NextResponse.json({
      success: true,
      versions: versionsWithCreators
    })
  } catch (error: any) {
    console.error('Error fetching notebook versions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notebook versions' },
      { status: 500 }
    )
  }
}

// POST: Create a new version of a notebook
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
    const {
      notebook_data,
      commit_message,
      commit_description,
      branch_name = 'main',
      tags = [],
      change_summary,
      space_id,
      is_current = true
    } = body

    if (!notebook_data) {
      return NextResponse.json(
        { error: 'notebook_data is required' },
        { status: 400 }
      )
    }

    // Get next version number
    const { rows: versionRows } = await query(
      'SELECT get_next_notebook_version($1) as next_version',
      [notebookId]
    )
    const versionNumber = versionRows[0].next_version

    // Insert new version
    const { rows: insertRows } = await query(
      `INSERT INTO notebook_versions 
       (notebook_id, space_id, version_number, notebook_data, commit_message, 
        commit_description, branch_name, tags, change_summary, created_by, is_current)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        notebookId,
        space_id || null,
        versionNumber,
        JSON.stringify(notebook_data),
        commit_message || `Version ${versionNumber}`,
        commit_description || null,
        branch_name,
        tags,
        change_summary ? JSON.stringify(change_summary) : null,
        session.user.id,
        is_current
      ]
    )

    // If this is the current version, mark others as not current
    if (is_current) {
      await query(
        'UPDATE notebook_versions SET is_current = false WHERE notebook_id::text = $1 AND id::text != $2',
        [notebookId, insertRows[0].id]
      )
    }

    return NextResponse.json({
      success: true,
      version: {
        ...insertRows[0],
        notebook_data: JSON.parse(insertRows[0].notebook_data)
      }
    })
  } catch (error: any) {
    console.error('Error creating notebook version:', error)
    return NextResponse.json(
      { error: 'Failed to create notebook version', details: error.message },
      { status: 500 }
    )
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/notebooks/[id]/versions')
export const POST = withErrorHandling(postHandler, 'POST /api/notebooks/[id]/versions')
