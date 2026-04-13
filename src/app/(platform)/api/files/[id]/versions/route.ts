import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/database'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  const userId = session?.user?.id || request.headers.get('x-user-id')
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: fileId } = await params

  // Check if user has access to this file
  const accessResult = await query(
    `SELECT af.space_id, af.file_name, af.mime_type, af.file_size
     FROM attachment_files af
     JOIN space_members sm ON af.space_id = sm.space_id
     WHERE af.id = $1 AND sm.user_id = $2 AND sm.role IN ('owner', 'admin', 'member')`,
    [fileId, userId]
  )

  if (accessResult.rows.length === 0) {
    return NextResponse.json({ error: 'File not found or access denied' }, { status: 403 })
  }

  // Get all versions of the file
  const versionsResult = await query(
    `SELECT 
      fv.id,
      fv.version_number,
      fv.file_name,
      fv.file_path,
      fv.file_size,
      fv.mime_type,
      fv.change_log,
      fv.uploaded_by,
      fv.uploaded_at,
      fv.is_current,
      u.name as uploaded_by_name
     FROM file_versions fv
     LEFT JOIN users u ON fv.uploaded_by = u.id
     WHERE fv.file_id = $1
     ORDER BY fv.version_number DESC`,
    [fileId]
  )

  return NextResponse.json({
    file: accessResult.rows[0],
    versions: versionsResult.rows
  })
}

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  const userId = session?.user?.id || request.headers.get('x-user-id')
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id: fileId } = await params
  const { changeLog } = await request.json()

  // Check if user has access to this file
  const accessResult = await query(
    `SELECT af.space_id, af.file_name, af.mime_type, af.file_size, af.file_path
     FROM attachment_files af
     JOIN space_members sm ON af.space_id = sm.space_id
     WHERE af.id = $1 AND sm.user_id = $2 AND sm.role IN ('owner', 'admin', 'member')`,
    [fileId, userId]
  )

  if (accessResult.rows.length === 0) {
    return NextResponse.json({ error: 'File not found or access denied' }, { status: 403 })
  }

  const file = accessResult.rows[0] as any

  // Get the next version number
  const versionResult = await query(
    'SELECT COALESCE(MAX(version_number), 0) + 1 as next_version FROM file_versions WHERE file_id = $1',
    [fileId]
  )

  const nextVersion = (versionResult.rows[0] as any).next_version

  // Create new version entry
  const versionInsertResult = await query(
    `INSERT INTO file_versions 
     (file_id, version_number, file_name, file_path, file_size, mime_type, change_log, uploaded_by, is_current)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
     RETURNING *`,
    [
      fileId,
      nextVersion,
      file.file_name,
      file.file_path,
      file.file_size,
      file.mime_type,
      changeLog || `Version ${nextVersion} created`,
      userId
    ]
  )

  // Mark all other versions as not current
  await query(
    'UPDATE file_versions SET is_current = false WHERE file_id = $1 AND id != $2',
    [fileId, (versionInsertResult.rows[0] as any).id]
  )

  return NextResponse.json({
    version: versionInsertResult.rows[0]
  })
}

export const GET = withErrorHandling(getHandler, 'GET /api/files/[id]/versions')
export const POST = withErrorHandling(postHandler, 'POST /api/files/[id]/versions')
