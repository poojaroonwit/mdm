import { NextRequest, NextResponse } from 'next/server'
import { requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { db } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return paramValidation.response
    }
    
    const { id } = paramValidation.data
    logger.apiRequest('GET', `/api/data-records/${id}`, { userId: session.user.id })

    const record = await db.dataRecord.findUnique({
      where: { id },
      include: {
        values: true
      }
    })

    if (!record) {
      logger.warn('Data record not found', { recordId: id })
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    
    const duration = Date.now() - startTime
    logger.apiResponse('GET', `/api/data-records/${id}`, 200, duration)
    return NextResponse.json({ record })
}

export const GET = withErrorHandling(getHandler, 'GET /api/data-records/[id]')

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return paramValidation.response
    }
    
    const { id } = paramValidation.data
    logger.apiRequest('PUT', `/api/data-records/${id}`, { userId: session.user.id })

    const bodySchema = z.object({
      values: z.array(z.object({
        attribute_id: z.string().uuid().optional(),
        attributeId: z.string().uuid().optional(),
        value: z.any().nullable(),
      })).refine(items => items.every(i => i.attribute_id || i.attributeId), {
        message: "Either attribute_id or attributeId is required for each value"
      }),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return bodyValidation.response
    }

    const { values } = bodyValidation.data

    // Upsert values using Prisma
    if (values.length) {
      for (const v of values) {
        const attrId = v.attribute_id || v.attributeId
        await db.dataRecordValue.upsert({
          where: {
            dataRecordId_attributeId: {
              dataRecordId: id,
              attributeId: attrId!
            }
          },
          update: {
            value: v.value ?? null
          },
          create: {
            dataRecordId: id,
            attributeId: attrId!,
            value: v.value ?? null
          }
        })
      }
    }

    const record = await db.dataRecord.findUnique({
      where: { id },
      include: {
        values: true
      }
    })

    if (!record) {
      logger.warn('Data record not found for update', { recordId: id })
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    // Create audit log
    await createAuditLog({
      action: 'UPDATE',
      entityType: 'DataRecord',
      entityId: id,
      oldValue: null, // We don't have old values in this case
      newValue: record,
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    const duration = Date.now() - startTime
    logger.apiResponse('PUT', `/api/data-records/${id}`, 200, duration)
    return NextResponse.json({ record })
}

export const PUT = withErrorHandling(putHandler, 'PUT /api/data-records/[id]')

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

    const resolvedParams = await params
    const paramValidation = validateParams(resolvedParams, z.object({
      id: commonSchemas.id,
    }))
    
    if (!paramValidation.success) {
      return paramValidation.response
    }
    
    const { id } = paramValidation.data
    logger.apiRequest('DELETE', `/api/data-records/${id}`, { userId: session.user.id })

    await db.dataRecord.update({
      where: { id },
      data: {
        deletedAt: new Date()
      }
    })

    const duration = Date.now() - startTime
    logger.apiResponse('DELETE', `/api/data-records/${id}`, 200, duration)
    return NextResponse.json({ success: true })
}

export const DELETE = withErrorHandling(deleteHandler, 'DELETE /api/data-records/[id]')


