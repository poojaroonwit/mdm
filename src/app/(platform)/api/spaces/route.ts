import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { query } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateQuery, validateBody, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'

async function getHandler(request: NextRequest) {
  try {
    const startTime = Date.now()
    // Use requireAuthWithId to ensure we have a valid user ID (consistency with other routes)
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    // Validate query parameters
    const queryValidation = validateQuery(request, z.object({
      page: z.string().optional().transform((val) => parseInt(val || '1')).pipe(z.number().int().positive()).optional().default(1),
      limit: z.string().optional().transform((val) => parseInt(val || '10')).pipe(z.number().int().positive().max(100)).optional().default(10),
    }))

    if (!queryValidation.success) {
      return queryValidation.response
    }

    const { page, limit } = queryValidation.data
    // Safe logging check
    logger.apiRequest('GET', '/api/spaces', { userId: session?.user?.id, page, limit })

    const offset = (page - 1) * limit

    // Check if tags column exists first
    const tagsColumnCheck = await query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'spaces' 
          AND column_name = 'tags'
        ) as exists
      `)

    const tagsColumnExists = tagsColumnCheck.rows[0]?.exists || false

    // Build query based on whether tags column exists
    // Note: limit and offset are safe integers, so we can interpolate them directly
    const listSql = tagsColumnExists
      ? `
          SELECT s.id, s.name, s.description, s.slug, s.is_default, s.is_active, 
                s.icon, s.logo_url, s.created_at, s.updated_at, s.deleted_at,
                COALESCE(s.tags, '[]'::jsonb) as tags,
                (SELECT COUNT(*)::int FROM space_members sm WHERE sm.space_id::uuid = s.id::uuid) as member_count
          FROM spaces s
          ORDER BY s.is_default DESC, s.deleted_at NULLS LAST, s.name ASC
          LIMIT ${limit} OFFSET ${offset}
        `
      : `
          SELECT s.id, s.name, s.description, s.slug, s.is_default, s.is_active, 
                s.icon, s.logo_url, s.created_at, s.updated_at, s.deleted_at,
                '[]'::jsonb as tags,
                (SELECT COUNT(*)::int FROM space_members sm WHERE sm.space_id::uuid = s.id::uuid) as member_count
          FROM spaces s
          ORDER BY s.is_default DESC, s.deleted_at NULLS LAST, s.name ASC
          LIMIT ${limit} OFFSET ${offset}
        `

    const countSql = `
        SELECT COUNT(*)::int AS total 
        FROM spaces s
      `

    const [{ rows: spaces }, { rows: totalRows }] = await Promise.all([
      query(listSql),
      query(countSql),
    ])

    const total = totalRows[0]?.total || 0
    const duration = Date.now() - startTime
    logger.apiResponse('GET', '/api/spaces', 200, duration, { total })
    return NextResponse.json({
      spaces: spaces || [],
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    })
  } catch (error: any) {
    console.error('CRITICAL ERROR in GET /api/spaces:', error);
    // Return detailed error in dev
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message, stack: error?.stack },
      { status: 500 }
    );
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/spaces')

async function postHandler(request: NextRequest) {
  try {
    const startTime = Date.now()
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    // Validate request body
    const bodyValidation = await validateBody(request, z.object({
      name: z.string().min(1, 'Space name is required'),
      description: z.string().optional(),
      slug: z.string().optional(),
      is_default: z.boolean().optional(),
      isDefault: z.boolean().optional(),
      tags: z.array(z.string()).optional().default([]),
    }))

    if (!bodyValidation.success) {
      return bodyValidation.response
    }

    const { name, description, slug, is_default, isDefault, tags = [] } = bodyValidation.data
    const finalIsDefault = is_default !== undefined ? is_default : (isDefault !== undefined ? isDefault : false)
    logger.apiRequest('POST', '/api/spaces', { userId: session.user.id, name })

    const spaceSlug = slug?.trim() || name.toLowerCase().replace(/\s+/g, '-')

    // Check if created_by column exists
    const hasCreatedByColumn = await query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'spaces' 
          AND column_name = 'created_by'
        ) as exists
      `)
    const createdByColumnExists = hasCreatedByColumn.rows[0]?.exists || false
    console.log('[POST /api/spaces] created_by column exists:', createdByColumnExists)

    // Create space - check if tags column exists
    const hasTagsColumn = await query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_schema = 'public' 
          AND table_name = 'spaces' 
          AND column_name = 'tags'
        ) as exists
      `)
    const tagsColumnExists = hasTagsColumn.rows[0]?.exists || false
    console.log('[POST /api/spaces] tags column exists:', tagsColumnExists)

    let insertSql: string
    let queryParams: any[]

    if (createdByColumnExists && tagsColumnExists) {
      insertSql = `
          INSERT INTO spaces (id, name, description, slug, is_default, created_by, tags, updated_at)
          VALUES (gen_random_uuid(), $1, $2, $3, $4::boolean, $5::uuid, $6::jsonb, NOW())
          RETURNING id, name, description, slug, is_default, is_active, icon, logo_url, 
                    created_at, updated_at,
                    COALESCE(tags, '[]'::jsonb) as tags
        `
      queryParams = [
        name.trim(),
        description?.trim() || null,
        spaceSlug,
        is_default,
        session.user.id,
        JSON.stringify(Array.isArray(tags) ? tags : [])
      ]
    } else if (createdByColumnExists) {
      insertSql = `
          INSERT INTO spaces (id, name, description, slug, is_default, created_by, updated_at)
          VALUES (gen_random_uuid(), $1, $2, $3, $4::boolean, $5::uuid, NOW())
          RETURNING id, name, description, slug, is_default, is_active, icon, logo_url, 
                    created_at, updated_at
        `
      queryParams = [
        name.trim(),
        description?.trim() || null,
        spaceSlug,
        is_default,
        session.user.id
      ]
    } else if (tagsColumnExists) {
      insertSql = `
          INSERT INTO spaces (id, name, description, slug, is_default, tags, updated_at)
          VALUES (gen_random_uuid(), $1, $2, $3, $4::boolean, $5::jsonb, NOW())
          RETURNING id, name, description, slug, is_default, is_active, icon, logo_url, 
                    created_at, updated_at,
                    COALESCE(tags, '[]'::jsonb) as tags
        `
      queryParams = [
        name.trim(),
        description?.trim() || null,
        spaceSlug,
        is_default,
        JSON.stringify(Array.isArray(tags) ? tags : [])
      ]
    } else {
      insertSql = `
          INSERT INTO spaces (id, name, description, slug, is_default, updated_at)
          VALUES (gen_random_uuid(), $1, $2, $3, $4::boolean, NOW())
          RETURNING id, name, description, slug, is_default, is_active, icon, logo_url, 
                    created_at, updated_at
        `
      queryParams = [
        name.trim(),
        description?.trim() || null,
        spaceSlug,
        is_default
      ]
    }

    console.log('[POST /api/spaces] Insert SQL:', insertSql)
    console.log('[POST /api/spaces] Query params:', queryParams)

    // Replace is_default in queryParams with finalIsDefault
    // Looking at the SQLs, $4 is always is_default
    queryParams[3] = finalIsDefault

    const { rows } = await query(insertSql, queryParams)

    const newSpace = rows[0]

    // Add creator as admin member
    await query(
      `INSERT INTO space_members (space_id, user_id, role) 
         VALUES ($1::uuid, $2::uuid, $3)
         ON CONFLICT (space_id, user_id) DO NOTHING`,
      [newSpace.id, session.user.id, 'ADMIN']
    )

    const duration = Date.now() - startTime
    logger.apiResponse('POST', '/api/spaces', 201, duration, { spaceId: newSpace.id })
    return NextResponse.json({
      space: {
        ...newSpace,
        tags: tagsColumnExists
          ? (typeof newSpace.tags === 'string' ? JSON.parse(newSpace.tags) : (newSpace.tags || []))
          : []
      },
      message: 'Space created successfully'
    }, { status: 201 })
  } catch (error: any) {
    console.error('CRITICAL ERROR in POST /api/spaces:', error);
    // Return detailed error in dev
    return NextResponse.json(
      { error: 'Internal server error', details: error?.message, stack: error?.stack },
      { status: 500 }
    );
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/spaces')