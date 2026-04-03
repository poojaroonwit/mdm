import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { validateBody, validateQuery, commonSchemas, validateParams } from '@/lib/api-validation'
import { z } from 'zod'
import { requireSpaceAccess } from '@/lib/space-access'
import {
  deleteFolderStateEntry,
  resolveFolderSpaceId,
  updateFolderStateEntry,
  type SupportedFolderType,
} from '@/lib/folder-state'

const folderTypeSchema = z.enum(['data_model'])

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  const resolvedParams = await params
  const paramValidation = validateParams(resolvedParams, z.object({ id: commonSchemas.id }))
  if (!paramValidation.success) {
    return paramValidation.response
  }

  const bodyValidation = await validateBody(request, z.object({
    name: z.string().min(1).optional(),
    parent_id: commonSchemas.id.optional().nullable(),
    space_id: commonSchemas.id.optional(),
    type: folderTypeSchema.optional().default('data_model'),
  }))
  if (!bodyValidation.success) {
    return bodyValidation.response
  }

  const { id } = paramValidation.data
  const spaceId = await resolveFolderSpaceId(session.user.id!, bodyValidation.data.space_id)
  if (!spaceId) {
    return NextResponse.json({ error: 'Space is required' }, { status: 400 })
  }

  const accessResult = await requireSpaceAccess(spaceId, session.user.id!)
  if (!accessResult.success) {
    return accessResult.response
  }

  try {
    const folder = await updateFolderStateEntry(spaceId, bodyValidation.data.type as SupportedFolderType, id, {
      name: bodyValidation.data.name,
      parent_id: bodyValidation.data.parent_id,
    })

    return NextResponse.json({ folder, spaceId })
  } catch (error: any) {
    const status = error.message === 'Folder not found' ? 404 : 400
    return NextResponse.json({ error: error.message || 'Failed to update folder' }, { status })
  }
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/folders/[id]')

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  const resolvedParams = await params
  const paramValidation = validateParams(resolvedParams, z.object({ id: commonSchemas.id }))
  if (!paramValidation.success) {
    return paramValidation.response
  }

  const queryValidation = validateQuery(request, z.object({
    space_id: commonSchemas.id.optional(),
    type: folderTypeSchema.optional().default('data_model'),
  }))
  if (!queryValidation.success) {
    return queryValidation.response
  }

  const { id } = paramValidation.data
  const spaceId = await resolveFolderSpaceId(session.user.id!, queryValidation.data.space_id)
  if (!spaceId) {
    return NextResponse.json({ error: 'Space is required' }, { status: 400 })
  }

  const accessResult = await requireSpaceAccess(spaceId, session.user.id!)
  if (!accessResult.success) {
    return accessResult.response
  }

  try {
    const deletedIds = await deleteFolderStateEntry(spaceId, queryValidation.data.type as SupportedFolderType, id)
    return NextResponse.json({ success: true, deletedIds, spaceId })
  } catch (error: any) {
    const status = error.message === 'Folder not found' ? 404 : 400
    return NextResponse.json({ error: error.message || 'Failed to delete folder' }, { status })
  }
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/folders/[id]')
