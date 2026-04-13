import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { query } from '@/lib/database'
import { logger } from '@/lib/logger'
import { validateQuery, validateBody, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'

async function getHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  const userId = session.user.id!

  // Validate query parameters
  const queryValidation = validateQuery(request, z.object({
    spaceId: commonSchemas.id,
  }))
  
  if (!queryValidation.success) {
    return queryValidation.response
  }
  
  const { spaceId } = queryValidation.data
  logger.apiRequest('GET', '/api/files/categories', { userId, spaceId })

  // Check if user has access to this space
  const accessResult = await requireSpaceAccess(spaceId, userId)
  if (!accessResult.success) return accessResult.response

    // Get categories
    const categoriesResult = await query(
      `SELECT 
        fc.id,
        fc.name,
        fc.description,
        fc.color,
        fc.icon,
        fc.is_system,
        fc.created_at,
        fc.updated_at,
        u.name as created_by_name,
        COUNT(fc_rel.file_id) as file_count
       FROM file_categories fc
       LEFT JOIN users u ON fc.created_by = u.id
       LEFT JOIN file_categorizations fc_rel ON fc.id = fc_rel.category_id
       WHERE fc.space_id = $1
       GROUP BY fc.id, fc.name, fc.description, fc.color, fc.icon, fc.is_system, fc.created_at, fc.updated_at, u.name
       ORDER BY fc.is_system DESC, fc.name ASC`,
      [spaceId]
    )

    // Get tags
    const tagsResult = await query(
      `SELECT 
        ft.id,
        ft.name,
        ft.color,
        ft.created_at,
        u.name as created_by_name,
        COUNT(fta.file_id) as file_count
       FROM file_tags ft
       LEFT JOIN users u ON ft.created_by = u.id
       LEFT JOIN file_tag_assignments fta ON ft.id = fta.tag_id
       WHERE ft.space_id = $1
       GROUP BY ft.id, ft.name, ft.color, ft.created_at, u.name
       ORDER BY ft.name ASC`,
      [spaceId]
    )

    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/files/categories', 200, duration, { 
      categoriesCount: categoriesResult.rows.length,
      tagsCount: tagsResult.rows.length
    })
    return NextResponse.json({
      categories: categoriesResult.rows,
      tags: tagsResult.rows
    })
}

export const GET = withErrorHandling(getHandler, 'GET /api/files/categories')

async function postHandler(request: NextRequest) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  const userId = session.user.id!

  // Validate request body
  const bodyValidation = await validateBody(request, z.object({
    type: z.enum(['category', 'tag']),
    spaceId: commonSchemas.id,
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    color: z.string().optional(),
    icon: z.string().optional(),
  }))
  
  if (!bodyValidation.success) {
    return bodyValidation.response
  }
  
  const { type, spaceId, name, description, color, icon } = bodyValidation.data
  logger.apiRequest('POST', '/api/files/categories', { userId, spaceId, type, name })

  // Check if user has admin access to this space
  const accessResult = await requireSpaceAccess(spaceId, userId)
  if (!accessResult.success) return accessResult.response

  // Additional check for admin role
  const memberResult = await query(
    'SELECT role FROM space_members WHERE space_id = $1 AND user_id = $2',
    [spaceId, userId]
  )

  if (memberResult.rows.length === 0 || !['owner', 'admin'].includes((memberResult.rows[0] as any).role)) {
    logger.warn('Insufficient permissions for file category/tag creation', { spaceId, userId })
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

    if (type === 'category') {
      // Create category
      const categoryResult = await query(
        `INSERT INTO file_categories (space_id, name, description, color, icon, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [spaceId, name, description || '', color || '#1e40af', icon || 'folder', userId]
      )

      const duration = Date.now() - startTime
      const category = categoryResult.rows[0] as any
      logger.apiResponse('POST', '/api/files/categories', 200, duration, { type: 'category', categoryId: category.id })
      return NextResponse.json({
        category
      })
    } else if (type === 'tag') {
      // Create tag
      const tagResult = await query(
        `INSERT INTO file_tags (space_id, name, color, created_by)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [spaceId, name, color || '#6B7280', userId]
      )

      const duration = Date.now() - startTime
      const tag = tagResult.rows[0] as any
      logger.apiResponse('POST', '/api/files/categories', 200, duration, { type: 'tag', tagId: tag.id })
      return NextResponse.json({
        tag: tagResult.rows[0]
      })
    } else {
      logger.warn('Invalid type for file category/tag creation', { type })
      return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    }
}

export const POST = withErrorHandling(postHandler, 'POST /api/files/categories')
