import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { query } from '@/lib/db'
import { SpacesEditorConfig } from '@/lib/space-studio-manager'
import { logger } from '@/lib/logger'
import { validateParams } from '@/lib/api-validation'
import { z } from 'zod'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: z.string().min(1),
    }))
    
    if (!paramValidation.success) {
      return paramValidation.response
    }
    
    const { id: spaceSlugOrId } = paramValidation.data
    logger.apiRequest('GET', `/api/spaces/${spaceSlugOrId}/default-page`, { userId: session.user.id })
    
    // Get space ID from slug or id
    const spaceResult = await query(
      'SELECT id FROM spaces WHERE slug = $1 OR id = $1 LIMIT 1',
      [spaceSlugOrId]
    )

    if (spaceResult.rows.length === 0) {
      logger.warn('Space not found for default page', { spaceSlugOrId })
      return NextResponse.json({ error: 'Space not found' }, { status: 404 })
    }

    const spaceId = spaceResult.rows[0].id

    // Check if user has access to this space
    const accessResult = await requireSpaceAccess(spaceId, session.user.id!)
    if (!accessResult.success) return accessResult.response

    // Get spaces editor config to find default page
    const configKey = `spaces_editor_config_${spaceId}`
    const configResult = await query(
      'SELECT value FROM system_settings WHERE key = $1',
      [configKey]
    )

    let defaultPath = '/dashboard'
    let pageId: string | null = null

    if (configResult.rows.length > 0) {
      try {
        const config: SpacesEditorConfig = JSON.parse(configResult.rows[0].value)
        
        // First, check if postAuthRedirectPageId is configured
        if (config.postAuthRedirectPageId && config.pages && config.pages.length > 0) {
          const redirectPage = config.pages.find(p => p.id === config.postAuthRedirectPageId && p.isActive && !p.hidden)
          if (redirectPage) {
            defaultPath = redirectPage.path || '/dashboard'
            pageId = redirectPage.id
          } else {
            // If configured page not found, fall through to default homepage
            const homepage = config.pages
              .filter(p => p.isActive && !p.hidden)
              .sort((a, b) => (a.order || 0) - (b.order || 0))[0]
            if (homepage) {
              defaultPath = homepage.path || '/dashboard'
              pageId = homepage.id
            }
          }
        } else if (config.pages && config.pages.length > 0) {
          // Find the default/homepage (first active page sorted by order)
          const homepage = config.pages
            .filter(p => p.isActive && !p.hidden)
            .sort((a, b) => (a.order || 0) - (b.order || 0))[0]

          if (homepage) {
            defaultPath = homepage.path || '/dashboard'
            pageId = homepage.id
          }
        }
      } catch (e) {
        logger.error('Error parsing spaces editor config', e, { spaceId })
        // Fallback to dashboard
      }
    }

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/spaces/${spaceSlugOrId}/default-page`, 200, duration, {
      path: defaultPath,
      hasPageId: !!pageId,
    })
    return NextResponse.json({ 
      path: defaultPath,
      pageId: pageId
    })
  } catch (error: any) {
    const duration = Date.now() - startTime
    logger.error('Error fetching default page', error)
    return NextResponse.json(
      { error: 'Failed to fetch default page', details: error.message },
      { status: 500 }
    )
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/spaces/[id]/default-page')
