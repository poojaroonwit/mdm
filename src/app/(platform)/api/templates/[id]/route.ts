import { NextRequest, NextResponse } from 'next/server'
import { getStoredTemplate, updateStoredTemplate, deleteStoredTemplate } from '@/lib/server-template-storage'
import { logger } from '@/lib/logger'
import { validateParams, validateBody } from '@/lib/api-validation'
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

    const { id } = paramValidation.data
    logger.apiRequest('GET', `/api/templates/${id}`)

    const template = await getStoredTemplate(id)

    if (!template) {
      logger.warn('Template not found', { templateId: id })
      return addSecurityHeaders(NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      ))
    }

    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/templates/${id}`, 200, duration)
    return addSecurityHeaders(NextResponse.json({
      success: true,
      template
    }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('GET', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Templates API GET')
  }
}

export async function PUT(
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

    const { id } = paramValidation.data
    logger.apiRequest('PUT', `/api/templates/${id}`)

    const bodySchema = z.object({
      name: z.string().optional(),
      content: z.any().optional(),
      type: z.string().optional(),
      metadata: z.any().optional(),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return addSecurityHeaders(bodyValidation.response)
    }

    // Ensure we fetch the existing one to merge or just overwrite? 
    // The previous logic was { ...bodyValidation.data, id } as any, which implies partial update or full overwrite depending on how saveTemplate handled it. 
    // Our updateStoredTemplate does a replace if ID exists.
    // If we want partial update, we should fetch first.

    let template = await getStoredTemplate(id)
    if (template) {
      template = { ...template, ...bodyValidation.data, updatedAt: new Date().toISOString() }
    } else {
      // If not found, maybe create or 404? 
      // For PUT usually we update.
      // But since we don't have all fields, we might fail validation if we try to use it as a full template.
      // Assuming bodyValidation.data contains enough or we just save what we have if the types allow.
      // For now, let's assume we update if exists, return 404 if not.
      return addSecurityHeaders(NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      ))
    }

    await updateStoredTemplate(template)

    const duration = Date.now() - startTime
    logger.apiResponse('PUT', `/api/templates/${id}`, 200, duration)
    return addSecurityHeaders(NextResponse.json({
      success: true,
      template,
      message: 'Template updated successfully'
    }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('PUT', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Templates API PUT')
  }
}

export async function DELETE(
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

    const { id } = paramValidation.data
    logger.apiRequest('DELETE', `/api/templates/${id}`)

    const deleted = await deleteStoredTemplate(id)

    if (!deleted) {
      return addSecurityHeaders(NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      ))
    }

    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', `/api/templates/${id}`, 200, duration)
    return addSecurityHeaders(NextResponse.json({
      success: true,
      message: 'Template deleted successfully'
    }))
  } catch (error) {
    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', request.nextUrl.pathname, 500, duration)
    return handleApiError(error, 'Templates API DELETE')
  }
}
