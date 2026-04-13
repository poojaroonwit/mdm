import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { getServiceDeskService } from '@/lib/manageengine-servicedesk-helper'
import { checkServiceDeskRateLimit, getServiceDeskRateLimitConfig } from '@/lib/servicedesk-rate-limiter'
import { createAuditLog } from '@/lib/audit'

// Upload attachment to ServiceDesk ticket
async function postHandler(request: NextRequest) {
  const startTime = Date.now()
  let auditLogId: string | null = null
  
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const space_id = formData.get('space_id') as string
  const request_id = formData.get('request_id') as string
  const file = formData.get('file') as File
  const description = formData.get('description') as string | null

  if (!space_id || !request_id || !file) {
    return NextResponse.json(
      { error: 'space_id, request_id, and file are required' },
      { status: 400 }
    )
  }

  // Check access
  const { rows: access } = await query(
    'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
    [space_id, session.user.id]
  )
  if (access.length === 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Rate limiting check
  const rateLimitConfig = await getServiceDeskRateLimitConfig(space_id)
  const rateLimitResult = await checkServiceDeskRateLimit(space_id, session.user.id, rateLimitConfig)
  
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { 
        error: 'Rate limit exceeded',
        message: rateLimitResult.reason,
        resetTime: rateLimitResult.resetTime
      },
      { 
        status: 429,
        headers: {
          'Retry-After': String(rateLimitResult.resetTime || 60),
          'X-RateLimit-Limit': String(rateLimitConfig?.maxRequestsPerMinute || 60),
          'X-RateLimit-Remaining': String(rateLimitResult.remaining || 0),
          'X-RateLimit-Reset': String(rateLimitResult.resetTime || Date.now() + 60000)
        }
      }
    )
  }

  // Create initial audit log
  try {
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined
    const userAgent = request.headers.get('user-agent') || undefined
    
    const auditResult = await createAuditLog({
      action: 'SERVICEDESK_ATTACHMENT_UPLOAD_ATTEMPTED',
      entityType: 'ServiceDeskIntegration',
      entityId: space_id,
      userId: session.user.id,
      newValue: { request_id: request_id, fileName: file.name, fileSize: file.size },
      ipAddress,
      userAgent
    })
    auditLogId = auditResult?.id || null
  } catch (auditError) {
    console.warn('Failed to create initial audit log:', auditError)
  }

  // Get ServiceDesk service
  const service = await getServiceDeskService(space_id)
  if (!service) {
    return NextResponse.json(
      { error: 'ServiceDesk integration not configured for this space' },
      { status: 400 }
    )
  }

  // Upload attachment to ServiceDesk
  const result = await service.uploadAttachment(request_id, {
    file,
    fileName: file.name,
    description: description || undefined
  })

  if (result.success) {
    // Update audit log on success
    if (auditLogId) {
      await createAuditLog({
        action: 'SERVICEDESK_ATTACHMENT_UPLOADED',
        entityType: 'ServiceDeskIntegration',
        entityId: space_id,
        userId: session.user.id,
        newValue: {
          request_id: request_id,
          fileName: file.name,
          fileSize: file.size,
          duration: Date.now() - startTime,
          status: 'success'
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined
      }).catch(() => {})
    }

    return NextResponse.json({
      success: true,
      message: 'Attachment uploaded to ServiceDesk successfully',
      data: result?.data || null,
      rateLimit: {
        remaining: rateLimitResult.remaining,
        resetTime: rateLimitResult.resetTime
      }
    }, {
      headers: {
        'X-RateLimit-Limit': String(rateLimitConfig?.maxRequestsPerMinute || 60),
        'X-RateLimit-Remaining': String(rateLimitResult.remaining),
        'X-RateLimit-Reset': String(rateLimitResult.resetTime)
      }
    })
  } else {
    // Update audit log on error
    if (auditLogId) {
      await createAuditLog({
        action: 'SERVICEDESK_ATTACHMENT_UPLOAD_FAILED',
        entityType: 'ServiceDeskIntegration',
        entityId: space_id,
        userId: session.user.id,
        newValue: {
          request_id,
          fileName: file.name,
          error: result.error || 'Unknown error',
          duration: Date.now() - startTime,
          status: 'failed'
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined,
        userAgent: request.headers.get('user-agent') || undefined
      }).catch(() => {})
    }

    return NextResponse.json(
      { error: result.error || 'Failed to upload attachment to ServiceDesk' },
      { status: 400 }
    )
  }
}

// Get attachments from ServiceDesk ticket
async function getHandler(request: NextRequest) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { searchParams } = new URL(request.url)
  const space_id = searchParams.get('space_id')
  const request_id = searchParams.get('request_id')

  if (!space_id || !request_id) {
    return NextResponse.json(
      { error: 'space_id and request_id are required' },
      { status: 400 }
    )
  }

  // Check access
  const { rows: access } = await query(
    'SELECT 1 FROM space_members WHERE space_id = $1::uuid AND user_id = $2::uuid',
    [space_id, session.user.id]
  )
  if (access.length === 0) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get ServiceDesk service
  const service = await getServiceDeskService(space_id)
  if (!service) {
    return NextResponse.json(
      { error: 'ServiceDesk integration not configured for this space' },
      { status: 400 }
    )
  }

  // Get attachments from ServiceDesk
  const result = await service.getAttachments(request_id)

  if (result.success) {
    return NextResponse.json({
      success: true,
      attachments: result.data?.attachments || result.data?.requests?.[0]?.attachments || [],
      data: result.data
    })
  } else {
    return NextResponse.json(
      { error: result.error || 'Failed to get attachments from ServiceDesk' },
      { status: 400 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST /api/integrations/manageengine-servicedesk/attachments')
export const GET = withErrorHandling(getHandler, 'GET /api/integrations/manageengine-servicedesk/attachments')
