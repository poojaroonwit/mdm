import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

interface NotebookDiff {
  cells_added: any[]
  cells_modified: Array<{
    cell_id: string
    type: 'content' | 'metadata' | 'output'
    old_value: any
    new_value: any
    all_changes?: any[]
  }>
  cells_deleted: any[]
  metadata_changes: Record<string, { old: any; new: any }>
}

function calculateNotebookDiff(notebook1: any, notebook2: any): NotebookDiff {
  const diff: NotebookDiff = {
    cells_added: [],
    cells_modified: [],
    cells_deleted: [],
    metadata_changes: {}
  }

  const cells1 = new Map(
    (notebook1.cells || []).map((cell: any) => [cell.id, cell])
  )
  const cells2 = new Map(
    (notebook2.cells || []).map((cell: any) => [cell.id, cell])
  )

  // Find added cells (in v2 but not in v1)
  for (const [cellId, cell] of cells2.entries()) {
    if (!cells1.has(cellId)) {
      diff.cells_added.push(cell)
    }
  }

  // Find deleted cells (in v1 but not in v2)
  for (const [cellId, cell] of cells1.entries()) {
    if (!cells2.has(cellId)) {
      diff.cells_deleted.push(cell)
    }
  }

  // Find modified cells
  for (const [cellId, cell1] of cells1.entries()) {
    const cell2 = cells2.get(cellId)
    if (cell2) {
      const changes: any[] = []
      const cell1Typed = cell1 as any
      const cell2Typed = cell2 as any

      // Check content changes
      const content1 = cell1Typed.type === 'sql' ? (cell1Typed.sqlQuery || cell1Typed.content) : cell1Typed.content
      const content2 = cell2Typed.type === 'sql' ? (cell2Typed.sqlQuery || cell2Typed.content) : cell2Typed.content
      if (content1 !== content2) {
        changes.push({
          type: 'content',
          old_value: content1,
          new_value: content2
        })
      }

      // Check type changes
      if (cell1Typed.type !== cell2Typed.type) {
        changes.push({
          type: 'metadata',
          old_value: cell1Typed.type,
          new_value: cell2Typed.type
        })
      }

      // Check output changes
      if (JSON.stringify(cell1Typed.output) !== JSON.stringify(cell2Typed.output)) {
        changes.push({
          type: 'output',
          old_value: cell1Typed.output,
          new_value: cell2Typed.output
        })
      }

      // Check SQL-specific changes
      if (cell1Typed.type === 'sql' && cell2Typed.type === 'sql') {
        if (cell1Typed.sqlVariableName !== cell2Typed.sqlVariableName) {
          changes.push({
            type: 'metadata',
            old_value: cell1Typed.sqlVariableName,
            new_value: cell2Typed.sqlVariableName
          })
        }
        if (cell1Typed.sqlConnection !== cell2Typed.sqlConnection) {
          changes.push({
            type: 'metadata',
            old_value: cell1Typed.sqlConnection,
            new_value: cell2Typed.sqlConnection
          })
        }
      }

      if (changes.length > 0) {
        diff.cells_modified.push({
          cell_id: cellId as string,
          type: changes[0].type as any,
          old_value: changes[0].old_value,
          new_value: changes[0].new_value,
          all_changes: changes
        })
      }
    }
  }

  // Check metadata changes
  if (notebook1.name !== notebook2.name) {
    diff.metadata_changes.name = {
      old: notebook1.name,
      new: notebook2.name
    }
  }

  return diff
}

// POST: Get diff between two versions
async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const body = await request.json()
    const { notebook_id, version1_id, version2_id } = body

    if (!notebook_id || !version1_id || !version2_id) {
      return NextResponse.json(
        { error: 'notebook_id, version1_id, and version2_id are required' },
        { status: 400 }
      )
    }

    // Fetch both versions
    const { rows: versions } = await query(
      `SELECT id, version_number, notebook_data, created_at
       FROM public.notebook_versions
       WHERE notebook_id = $1::uuid AND (id = $2::uuid OR id = $3::uuid)
       ORDER BY version_number ASC`,
      [notebook_id, version1_id, version2_id]
    )

    if (versions.length !== 2) {
      return NextResponse.json(
        { error: 'One or both versions not found' },
        { status: 404 }
      )
    }

    const version1 = versions.find((v) => v.id === version1_id)
    const version2 = versions.find((v) => v.id === version2_id)

    if (!version1 || !version2) {
      return NextResponse.json(
        { error: 'Versions not found' },
        { status: 404 }
      )
    }

    const data1 = typeof version1.notebook_data === 'string'
      ? JSON.parse(version1.notebook_data)
      : version1.notebook_data
    const data2 = typeof version2.notebook_data === 'string'
      ? JSON.parse(version2.notebook_data)
      : version2.notebook_data

    // Calculate diff
    const diff = calculateNotebookDiff(data1, data2)

    return NextResponse.json({
      success: true,
      diff: {
        version1: {
          id: version1.id,
          version_number: version1.version_number,
          created_at: version1.created_at
        },
        version2: {
          id: version2.id,
          version_number: version2.version_number,
          created_at: version2.created_at
        },
        changes: diff
      }
    })
  } catch (error: any) {
    console.error('Error calculating diff:', error)
    return NextResponse.json(
      { error: 'Failed to calculate diff', details: error.message },
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/notebooks/[id]/versions/diff')
