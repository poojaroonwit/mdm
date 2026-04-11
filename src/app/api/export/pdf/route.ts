import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import { getConfiguredSiteUrl } from '@/lib/system-runtime-settings'

async function postHandler(request: NextRequest) {
  try {
    const authResult = await requireAuth()
    if (!authResult.success) return authResult.response
    const { session } = authResult


    const { dataModelId, filters, columns, elementId, datasourceId, query, elementName, elementType } = await request.json()

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
          customQuery: query || undefined,
          filters: filters || {},
          limit: 1000, // Limit for PDF (smaller than CSV/JSON)
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

    // Get column names
    const allColumns = columns || metadata?.attributes?.map((attr: any) => attr.display_name || attr.name) || Object.keys(data[0] || {})

    // Build HTML table for PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 20px;
      font-size: 10px;
    }
    h1 {
      color: #333;
      border-bottom: 2px solid #333;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    .metadata {
      margin-bottom: 20px;
      color: #666;
      font-size: 9px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 20px;
    }
    th {
      background-color: #f0f0f0;
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
      font-weight: bold;
    }
    td {
      border: 1px solid #ddd;
      padding: 6px;
    }
    tr:nth-child(even) {
      background-color: #f9f9f9;
    }
    .footer {
      margin-top: 30px;
      font-size: 8px;
      color: #999;
      text-align: center;
    }
  </style>
</head>
<body>
  <h1>${elementName || 'Data Export Report'}</h1>
  <div class="metadata">
    <p><strong>Data Model:</strong> ${metadata?.dataModelName || modelId}</p>
    <p><strong>Element Type:</strong> ${elementType || 'N/A'}</p>
    <p><strong>Total Records:</strong> ${data.length}</p>
    <p><strong>Exported:</strong> ${new Date().toLocaleString()}</p>
    ${query ? `<p><strong>Query:</strong> ${query}</p>` : ''}
  </div>
  <table>
    <thead>
      <tr>
        ${allColumns.map((col: string) => `<th>${String(col).replace(/</g, '&lt;').replace(/>/g, '&gt;')}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
      ${data.map((record: any) => `
        <tr>
          ${allColumns.map((col: string) => {
            const value = record[col] ?? ''
            const displayValue = value === null || value === undefined ? '' : String(value)
            return `<td>${displayValue.replace(/</g, '&lt;').replace(/>/g, '&gt;').substring(0, 100)}</td>`
          }).join('')}
        </tr>
      `).join('')}
    </tbody>
  </table>
  <div class="footer">
    Generated on ${new Date().toLocaleString()}
  </div>
</body>
</html>
    `.trim()

    // Generate PDF using Puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    try {
      const page = await browser.newPage()
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' })
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        },
        printBackground: true
      })

      await browser.close()

      const filename = elementId 
        ? `chart_report_${elementId}.pdf`
        : `export_${modelId}_${new Date().toISOString().split('T')[0]}.pdf`

      return new NextResponse(pdfBuffer as any, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${filename}"`
        }
      })
    } catch (pdfError) {
      await browser.close()
      throw pdfError
    }
  } catch (error: any) {
    console.error('Error exporting to PDF:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to export data to PDF' },
      { status: 500 }
    )
  }
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/export/pdf/route.ts')
