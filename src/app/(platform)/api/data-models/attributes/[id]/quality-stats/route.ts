import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id: attributeId } = await params

    // Get attribute information
    const attributeQuery = `
      SELECT 
        dma.id,
        dma.name,
        dma.display_name,
        dma.type,
        dma.is_required,
        dma.is_unique,
        dm.name as model_name,
        dm.id as model_id
      FROM data_model_attributes dma
      JOIN data_models dm ON dma.data_model_id = dm.id
      WHERE dma.id = $1::uuid
    `

    const { rows: attributeRows } = await query(attributeQuery, [attributeId])
    if (attributeRows.length === 0) {
      return NextResponse.json({ error: 'Attribute not found' }, { status: 404 })
    }

    const attribute = attributeRows[0]

    // Get actual data quality statistics
    // This would need to be implemented based on your actual data structure
    // For now, we'll create a realistic implementation

    // Get total records count for this attribute
    const totalRecordsQuery = `
      SELECT COUNT(*) as total_records
      FROM data_records dr
      WHERE dr.data_model_id = $1::uuid
    `
    const { rows: totalRows } = await query(totalRecordsQuery, [attribute.model_id])
    const totalRecords = parseInt(totalRows[0]?.total_records || '0')

    // Get non-null values count
    const nonNullQuery = `
      SELECT COUNT(*) as non_null_count
      FROM data_records dr
      JOIN data_record_values drv ON dr.id = drv.data_record_id
      WHERE dr.data_model_id = $1::uuid 
        AND drv.attribute_id = $2::uuid 
        AND drv.value IS NOT NULL 
        AND drv.value != ''
    `
    const { rows: nonNullRows } = await query(nonNullQuery, [attribute.model_id, attributeId])
    const nonNullCount = parseInt(nonNullRows[0]?.non_null_count || '0')

    // Calculate completion rate
    const completionRate = totalRecords > 0 ? Math.round((nonNullCount / totalRecords) * 100) : 0

    // Get unique values count
    const uniqueQuery = `
      SELECT COUNT(DISTINCT drv.value) as unique_count
      FROM data_records dr
      JOIN data_record_values drv ON dr.id = drv.data_record_id
      WHERE dr.data_model_id = $1::uuid 
        AND drv.attribute_id = $2::uuid 
        AND drv.value IS NOT NULL 
        AND drv.value != ''
    `
    const { rows: uniqueRows } = await query(uniqueQuery, [attribute.model_id, attributeId])
    const uniqueCount = parseInt(uniqueRows[0]?.unique_count || '0')

    // Get recent changes (last 7 days)
    const recentChangesQuery = `
      SELECT COUNT(*) as recent_changes
      FROM audit_logs al
      WHERE al.entity_type = 'attribute' 
        AND al.entity_id = $1::uuid
        AND al.created_at >= NOW() - INTERVAL '7 days'
    `
    const { rows: recentRows } = await query(recentChangesQuery, [attributeId])
    const recentChanges = parseInt(recentRows[0]?.recent_changes || '0')

    // Get data quality issues
    const qualityIssues = []

    // Check for missing values
    const missingValues = totalRecords - nonNullCount
    if (missingValues > 0) {
      qualityIssues.push({
        type: 'missing_values',
        severity: 'warning',
        count: missingValues,
        percentage: totalRecords > 0 ? Math.round((missingValues / totalRecords) * 100) : 0,
        message: `${missingValues} missing values (${Math.round((missingValues / totalRecords) * 100)}%)`
      })
    }

    // Check for duplicate values if attribute should be unique
    if (attribute.is_unique && uniqueCount < nonNullCount) {
      const duplicates = nonNullCount - uniqueCount
      qualityIssues.push({
        type: 'duplicates',
        severity: 'error',
        count: duplicates,
        percentage: nonNullCount > 0 ? Math.round((duplicates / nonNullCount) * 100) : 0,
        message: `${duplicates} duplicate values found`
      })
    }

    // Check for format inconsistencies (basic check for common patterns)
    const formatQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN drv.value ~ '^[0-9]+$' THEN 1 END) as numeric_count,
        COUNT(CASE WHEN drv.value ~ '^[A-Za-z]+$' THEN 1 END) as text_count,
        COUNT(CASE WHEN drv.value ~ '^[A-Za-z0-9@._-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$' THEN 1 END) as email_count
      FROM data_records dr
      JOIN data_record_values drv ON dr.id = drv.data_record_id
      WHERE dr.data_model_id = $1::uuid 
        AND drv.attribute_id = $2::uuid 
        AND drv.value IS NOT NULL 
        AND drv.value != ''
    `
    const { rows: formatRows } = await query(formatQuery, [attribute.model_id, attributeId])
    const formatData = formatRows[0]

    // Check for mixed data types
    if (formatData.total > 0) {
      const numericCount = parseInt(formatData.numeric_count || '0')
      const textCount = parseInt(formatData.text_count || '0')
      const emailCount = parseInt(formatData.email_count || '0')
      
      if (numericCount > 0 && textCount > 0) {
        qualityIssues.push({
          type: 'mixed_types',
          severity: 'warning',
          count: Math.min(numericCount, textCount),
          percentage: Math.round((Math.min(numericCount, textCount) / formatData.total) * 100),
          message: `Mixed data types detected (${numericCount} numeric, ${textCount} text)`
        })
      }
    }

    return NextResponse.json({
      attribute: {
        id: attribute.id,
        name: attribute.name,
        display_name: attribute.display_name,
        type: attribute.type,
        model_name: attribute.model_name
      },
      statistics: {
        totalRecords,
        nonNullCount,
        completionRate,
        uniqueCount,
        recentChanges,
        missingValues
      },
      qualityIssues
    })
}

export const GET = withErrorHandling(getHandler, 'GET GET /api/data-models/attributes/[id]/quality-stats/route.ts')