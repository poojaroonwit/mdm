import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAuthWithId, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { db } from '@/lib/db'
import { logger } from '@/lib/logger'
import { validateParams, validateBody, commonSchemas } from '@/lib/api-validation'
import { z } from 'zod'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const resolvedParams = await params
  const paramValidation = validateParams(resolvedParams, z.object({
    id: commonSchemas.id,
  }))
  
  if (!paramValidation.success) {
    return paramValidation.response
  }
    
    const { id: dataModelId } = paramValidation.data
    logger.apiRequest('GET', `/api/data-models/${dataModelId}/attributes`)
    
    // Use Prisma ORM - best practice, type-safe, handles UUIDs automatically
    try {
      const attributes = await db.attribute.findMany({
        where: {
          dataModelId: dataModelId,
          isActive: true,
          deletedAt: null
        },
        orderBy: [
          { order: 'asc' },
          { createdAt: 'asc' }
        ],
        take: 1000
      })
      
      logger.info('Found attributes', { 
        dataModelId, 
        count: attributes.length 
      })
      
      // Transform to match expected API response format
      const rows = attributes.map(attr => ({
        id: attr.id,
        name: attr.name,
        display_name: attr.displayName,
        type: attr.type,
        is_required: attr.isRequired,
        is_unique: attr.isUnique,
        default_value: attr.defaultValue,
        options: attr.options,
        validation_rules: attr.validationRules,
        order_index: attr.order,
        created_at: attr.createdAt,
        updated_at: attr.updatedAt
      }))
      
      if (rows.length === 0) {
        logger.warn('No attributes found', { dataModelId })
      }
      
      const response = { 
        attributes: rows,
        count: rows.length
      }
      
      const duration = Date.now() - startTime
      logger.apiResponse('GET', `/api/data-models/${dataModelId}/attributes`, 200, duration)
      return NextResponse.json(response)
      
    } catch (queryError: any) {
      logger.dbError('SELECT attributes', queryError, { dataModelId })
      
      // Return empty array on error
      return NextResponse.json({ 
        attributes: [],
        count: 0
      })
    }
}

export const GET = withErrorHandling(getHandler, 'GET /api/data-models/[id]/attributes')

async function postHandler(
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
    
    const { id: dataModelId } = paramValidation.data
    logger.apiRequest('POST', `/api/data-models/${dataModelId}/attributes`, { userId: session.user.id })

    // Check if user has permission to create attributes in this space using Prisma ORM
    const dataModel = await db.dataModel.findFirst({
      where: {
        id: dataModelId,
        deletedAt: null
      },
      include: {
        spaces: {
          include: {
            space: {
              include: {
                members: {
                  where: {
                    userId: session.user.id
                  }
                },
                creator: true
              }
            }
          }
        }
      }
    })

    if (!dataModel || dataModel.spaces.length === 0) {
      return NextResponse.json({ error: 'Data model not found' }, { status: 404 })
    }

    // Check if user has access to the space
    const spaceId = dataModel.spaces[0].spaceId
    if (spaceId) {
      const accessResult = await requireSpaceAccess(spaceId, session.user.id!)
      if (!accessResult.success) return accessResult.response
    }

    const space = dataModel.spaces[0].space
    const userMembership = space.members[0]
    const userRole = userMembership?.role
    const isOwner = space.createdBy === session.user.id
    const canCreate = userRole === 'ADMIN' || userRole === 'MEMBER' || isOwner

    if (!canCreate) {
      return NextResponse.json({ error: 'Insufficient permissions to create attributes' }, { status: 403 })
    }

    // Validate request body
    const bodySchema = z.object({
      name: z.string().min(1),
      display_name: z.string().min(1),
      data_type: z.string().min(1),
      description: z.string().optional(),
      is_required: z.boolean().optional().default(false),
      is_unique: z.boolean().optional().default(false),
      min_length: z.number().int().nonnegative().optional().default(0),
      max_length: z.number().int().nonnegative().optional().default(0),
      default_value: z.any().optional().nullable().default(null),
      tooltip: z.string().optional().nullable().default(null),
      validation_rules: z.any().optional().nullable().default(null),
      options: z.array(z.any()).optional().default([]),
      order_index: z.number().int().nonnegative().optional().default(0),
      data_entity_model_id: z.string().uuid().optional().nullable().default(null),
      data_entity_attribute_id: z.string().uuid().optional().nullable().default(null),
      is_auto_increment: z.boolean().optional().default(false),
      auto_increment_prefix: z.string().optional().default(''),
      auto_increment_suffix: z.string().optional().default(''),
      auto_increment_start: z.number().int().positive().optional().default(1),
      auto_increment_padding: z.number().int().positive().optional().default(3),
    })

    const bodyValidation = await validateBody(request, bodySchema)
    if (!bodyValidation.success) {
      return bodyValidation.response
    }

    const {
      name,
      display_name,
      data_type,
      description,
      is_required,
      is_unique,
      min_length,
      max_length,
      default_value,
      tooltip,
      validation_rules,
      options,
      order_index,
      data_entity_model_id,
      data_entity_attribute_id,
      is_auto_increment,
      auto_increment_prefix,
      auto_increment_suffix,
      auto_increment_start,
      auto_increment_padding,
    } = bodyValidation.data

    // Map data_type to type for database (convert to uppercase for enum)
    const typeMapping: Record<string, string> = {
      'text': 'TEXT',
      'number': 'NUMBER', 
      'boolean': 'BOOLEAN',
      'date': 'DATE',
      'email': 'EMAIL',
      'phone': 'PHONE',
      'url': 'URL',
      'select': 'SELECT',
      'multi_select': 'MULTI_SELECT',
      'textarea': 'TEXTAREA',
      'json': 'JSON',
      'user': 'USER',
      'user_multi': 'USER_MULTI'
    }
    const type = typeMapping[data_type?.toLowerCase()] || data_type?.toUpperCase() || 'TEXT'

    // Use Prisma ORM to create attribute - best practice, type-safe
    const attribute = await db.attribute.create({
      data: {
        dataModelId: dataModelId,
        name,
        displayName: display_name,
        type,
        description,
        isRequired: !!is_required,
        isUnique: !!is_unique,
        defaultValue: default_value,
        options: options && options.length > 0 ? options : undefined,
        validationRules: validation_rules ? validation_rules : undefined,
        order: Number(order_index) || 0,
        // Optional fields (will be null if columns don't exist - Prisma handles this)
        dataEntityModelId: data_entity_model_id || null,
        dataEntityAttributeId: data_entity_attribute_id || null,
        isAutoIncrement: !!is_auto_increment,
        autoIncrementPrefix: auto_increment_prefix || '',
        autoIncrementSuffix: auto_increment_suffix || '',
        autoIncrementStart: Number(auto_increment_start) || 1,
        autoIncrementPadding: Number(auto_increment_padding) || 3,
        currentAutoIncrementValue: Number(auto_increment_start) || 1
      }
    })
    
    // Transform to match expected API response format
    const response = {
      id: attribute.id,
      name: attribute.name,
      display_name: attribute.displayName,
      type: attribute.type,
      is_required: attribute.isRequired,
      is_unique: attribute.isUnique,
      default_value: attribute.defaultValue,
      options: attribute.options,
      validation_rules: attribute.validationRules,
      order_index: attribute.order,
      created_at: attribute.createdAt,
      updated_at: attribute.updatedAt
    }
    
    const duration = Date.now() - startTime
    logger.apiResponse('POST', `/api/data-models/${dataModelId}/attributes`, 201, duration, { 
      attributeId: attribute.id 
    })
    return NextResponse.json({ attribute: response }, { status: 201 })
}

export const POST = withErrorHandling(postHandler, 'POST /api/data-models/[id]/attributes')
