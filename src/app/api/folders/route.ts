import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { logger } from '@/lib/logger'
import { validateQuery, validateBody, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'
import {
  createFolderStateEntry,
  getFolderState,
  resolveFolderSpaceId,
  type SupportedFolderType,
} from '@/lib/folder-state'

const folderTypeSchema = z.enum(['data_model', 'chatbot'])
const spaceIdSchema = z.union([z.string().uuid(), z.literal('global')])

async function getHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  // Validate query parameters
  const queryValidation = validateQuery(request, z.object({
    space_id: spaceIdSchema.optional(),
    type: folderTypeSchema.optional().default('data_model'),
  }))

  if (!queryValidation.success) {
    return queryValidation.response
  }

  const { space_id: requestedSpaceId, type = 'data_model' } = queryValidation.data
  const spaceId = await resolveFolderSpaceId(session.user.id!, requestedSpaceId, type)
  logger.apiRequest('GET', '/api/folders', { userId: session.user.id, spaceId, type })

  if (!spaceId) {
    return NextResponse.json({ folders: [], spaceId: null })
  }

  // Check space access only if a space_id was provided and it's not the 'global' bucket
  if (spaceId && spaceId !== 'global') {
    const accessResult = await requireSpaceAccess(spaceId, session.user.id!)
    if (!accessResult.success) {
      logger.warn('Access denied for folders', { spaceId, userId: session.user.id })
      return accessResult.response
    }
  }

  const state = await getFolderState(spaceId, type as SupportedFolderType)
  const duration = Date.now() - startTime
  logger.apiResponse('GET', '/api/folders', 200, duration, { count: state.folders.length })
  return NextResponse.json({
    folders: state.folders
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name)),
    spaceId,
  })
}

export const GET = withErrorHandling(getHandler, 'GET /api/folders')

async function postHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  // Validate request body
  const bodyValidation = await validateBody(request, z.object({
    name: z.string().min(1, 'Name is required'),
    type: folderTypeSchema.optional().default('data_model'),
    space_id: spaceIdSchema.optional(),
    parent_id: commonSchemas.id.optional().nullable(),
  }))
  
  if (!bodyValidation.success) {
    return bodyValidation.response
  }
  
  const { name, type = 'data_model', parent_id } = bodyValidation.data
  const space_id = await resolveFolderSpaceId(session.user.id!, bodyValidation.data.space_id, type)
  logger.apiRequest('POST', '/api/folders', { userId: session.user.id, name, space_id })

  if (!space_id) {
    return NextResponse.json({ error: 'No accessible space available for folder creation' }, { status: 400 })
  }

  // Check if user has access to the space (skip check for 'global' chatbot bucket)
  if (space_id !== 'global') {
    const accessResult = await requireSpaceAccess(space_id, session.user.id!)
    if (!accessResult.success) {
      logger.warn('Access denied for folder creation', { spaceId: space_id, userId: session.user.id })
      return accessResult.response
    }
  }

  try {
    const folder = await createFolderStateEntry(space_id, type as SupportedFolderType, {
      name,
      parent_id,
      created_by: session.user.id,
    })

    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/folders', 201, duration, { folderId: folder.id })
    return NextResponse.json({ folder, spaceId: space_id }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create folder' }, { status: 400 })
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/folders')
