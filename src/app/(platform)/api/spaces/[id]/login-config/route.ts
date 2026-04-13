import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { SpacesEditorConfig } from '@/lib/space-studio-manager'
import { logger } from '@/lib/logger'
import { validateParams } from '@/lib/api-validation'
import { handleApiError } from '@/lib/api-middleware'
import { addSecurityHeaders } from '@/lib/security-headers'
import { z } from 'zod'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  try {
    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: z.string().min(1),
    }))
    
    if (!paramValidation.success) {
      return addSecurityHeaders(paramValidation.response)
    }
    
    const { id: spaceSlugOrId } = paramValidation.data
    logger.apiRequest('GET', `/api/spaces/${spaceSlugOrId}/login-config`)
    
    // Get space ID from slug
    const spaceResult = await query(
      'SELECT id FROM spaces WHERE slug = $1 OR id = $1 LIMIT 1',
      [spaceSlugOrId]
    )

    if (spaceResult.rows.length === 0) {
      logger.warn('Space not found for login config', { spaceSlugOrId })
      return addSecurityHeaders(NextResponse.json({ error: 'Space not found' }, { status: 404 }))
    }

    const spaceId = spaceResult.rows[0].id

    // Get spaces editor config
    const configKey = `spaces_editor_config_${spaceId}`
    const configResult = await query(
      'SELECT value FROM system_settings WHERE key = $1',
      [configKey]
    )

    if (configResult.rows.length > 0) {
      try {
        const config: SpacesEditorConfig = JSON.parse(configResult.rows[0].value)
        const duration = Date.now() - startTime
        logger.apiResponse('GET', `/api/spaces/${spaceSlugOrId}/login-config`, 200, duration)
        return addSecurityHeaders(NextResponse.json({ 
          loginPageConfig: config.loginPageConfig || null,
          postAuthRedirectPageId: config.postAuthRedirectPageId || null
        }))
      } catch (e) {
        logger.error('Error parsing config', e, { spaceId: spaceResult.rows[0].id })
      }
    }

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/spaces/${spaceSlugOrId}/login-config`, 200, duration)
    return addSecurityHeaders(NextResponse.json({ 
      loginPageConfig: null,
      postAuthRedirectPageId: null
    }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Space Login Config API')
  }
}


