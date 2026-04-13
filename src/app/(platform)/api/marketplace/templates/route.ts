import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { query } from '@/lib/db'
import { z } from 'zod'
import { validateBody, validateQuery, commonSchemas } from '@/lib/api-validation'

// GET - List marketplace templates (public templates)
async function getHandler(request: NextRequest) {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const queryValidation = validateQuery(request, z.object({
        search: z.string().optional(),
        source: z.string().optional(),
        tags: z.string().optional(), // comma-separated
        limit: z.string().optional().default('50'),
        offset: z.string().optional().default('0'),
    }))

    if (!queryValidation.success) {
        return queryValidation.response
    }

    const { search, source, tags, limit, offset } = queryValidation.data

    const params: any[] = [session.user.id]
    const filters: string[] = ['deleted_at IS NULL']

    // Show public templates or user's own templates
    filters.push('(visibility = $2 OR created_by = $1)')
    params.push('public')

    if (search) {
        params.push(`%${search}%`)
        filters.push(`(name ILIKE $${params.length} OR description ILIKE $${params.length})`)
    }

    if (source) {
        params.push(source.toUpperCase())
        filters.push(`source = $${params.length}`)
    }

    if (tags) {
        const tagArray = tags.split(',').map(t => t.trim())
        params.push(tagArray)
        filters.push(`tags && $${params.length}`)
    }

    const sql = `
    SELECT 
      id, name, description, source, category_id, folder_id,
      metadata, is_public, visibility, usage_count, downloads,
      author_name, preview_image, tags, created_by, created_at
    FROM public.report_templates
    WHERE ${filters.join(' AND ')}
    ORDER BY downloads DESC, usage_count DESC, created_at DESC
    LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
  `

    const countSql = `
    SELECT COUNT(*) as total
    FROM public.report_templates
    WHERE ${filters.join(' AND ')}
  `

    const [result, countResult] = await Promise.all([
        query(sql, params),
        query(countSql, params)
    ])

    return NextResponse.json({
        templates: result.rows || [],
        total: parseInt(countResult.rows[0]?.total || '0'),
        limit: parseInt(limit),
        offset: parseInt(offset)
    })
}

// POST - Upload a new template to marketplace
async function postHandler(request: NextRequest) {
    const authResult = await requireAuthWithId()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const bodyValidation = await validateBody(request, z.object({
        name: z.string().min(1, 'Name is required'),
        description: z.string().optional(),
        source: z.string().min(1, 'Source is required'),
        category_id: commonSchemas.id.optional(),
        folder_id: commonSchemas.id.optional(),
        metadata: z.any().optional(),
        visibility: z.enum(['private', 'public']).default('private'),
        preview_image: z.string().url().optional(),
        tags: z.array(z.string()).optional(),
    }))

    if (!bodyValidation.success) {
        return bodyValidation.response
    }

    const {
        name, description, source, category_id, folder_id,
        metadata, visibility, preview_image, tags
    } = bodyValidation.data

    // Get author name from user profile
    const userResult = await query('SELECT name, email FROM public.users WHERE id = $1', [session.user.id])
    const authorName = userResult.rows[0]?.name || userResult.rows[0]?.email || 'Unknown'

    const sql = `
    INSERT INTO public.report_templates (
      name, description, source, category_id, folder_id,
      metadata, visibility, is_public, preview_image, tags,
      author_name, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
    RETURNING *
  `

    const result = await query(sql, [
        name,
        description || null,
        source,
        category_id || null,
        folder_id || null,
        metadata ? JSON.stringify(metadata) : null,
        visibility,
        visibility === 'public',
        preview_image || null,
        tags || null,
        authorName,
        session.user.id
    ])

    return NextResponse.json({ template: result.rows[0] }, { status: 201 })
}

export const GET = withErrorHandling(getHandler, 'GET /api/marketplace/templates')
export const POST = withErrorHandling(postHandler, 'POST /api/marketplace/templates')
