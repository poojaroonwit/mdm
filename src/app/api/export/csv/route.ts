import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { getConfiguredSiteUrl } from '@/lib/system-runtime-settings'
async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult


    const { dataModelId, filters, columns, elementId, datasourceId } = await request.json()

    // Support both old format (elementId/datasourceId) and new format (dataModelId)
    const modelId = dataModelId || datasourceId

    if (!modelId) {
      return NextResponse.json(
        { error: 'Data Model ID is required' },
        { status: 400 }
      )
    }

    // Fetch data from data model
    const siteUrl = await getConfiguredSiteUrl(request)
    const dataResponse = await fetch(
      `${siteUrl}/api/data-models/${modelId}/data`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || ''
        },
        body: JSON.stringify({
          filters: filters || {},
          limit: 10000, // Max records for export
          offset: 0
        })
      }
    )

    if (!dataResponse.ok) {
      const error = await dataResponse.json().catch(() => ({}))
      throw new Error(error.error || 'Failed to fetch data')
    }

    const { data, metadata } = await dataResponse.json()

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: 'No data available to export' },
        { status: 404 }
      )
    }

    // Get column names from metadata or data
    const allColumns = columns || metadata?.attributes?.map((attr: any) => attr.name) || Object.keys(data[0] || {})
    
    // Build CSV header
    const header = allColumns.map((col: string) => {
      // Escape commas and quotes in CSV
      const value = String(col).replace(/"/g, '""')
      return `"${value}"`
    }).join(',')

    // Build CSV rows
    const rows = data.map((record: any) => {
      return allColumns.map((col: string) => {
        const value = record[col] ?? ''
        // Handle null/undefined
        if (value === null || value === undefined) return '""'
        // Convert to string and escape
        const stringValue = String(value).replace(/"/g, '""')
        // Handle newlines
        if (stringValue.includes('\n') || stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue}"`
        }
        return stringValue
      }).join(',')
    })

    const csvContent = [header, ...rows].join('\n')

    // Create response with CSV content
    const filename = elementId 
      ? `chart_data_${elementId}.csv`
      : `export_${modelId}_${new Date().toISOString().split('T')[0]}.csv`

    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`
      }
    })

    return response
  } catch (error: any) {
    console.error('Error exporting to CSV:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to export data to CSV' },
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/export/csv/route.ts')
