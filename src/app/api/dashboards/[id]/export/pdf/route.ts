import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import puppeteer from 'puppeteer'
import { getS3Client, getS3Config } from '@/lib/s3'
import { PutObjectCommand } from '@aws-sdk/client-s3'

async function postHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params

    // Get dashboard with elements and datasources
    const { rows: dashboards } = await query(`
      SELECT d.*, 
             ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL) as space_names,
             COUNT(DISTINCT de.id) as element_count,
             COUNT(DISTINCT dds.id) as datasource_count
      FROM public.dashboards d
      LEFT JOIN dashboard_spaces ds ON ds.dashboard_id = d.id
      LEFT JOIN spaces s ON s.id = ds.space_id
      LEFT JOIN dashboard_elements de ON de.dashboard_id = d.id
      LEFT JOIN dashboard_datasources dds ON dds.dashboard_id = d.id
      WHERE d.id = $1 AND d.deleted_at IS NULL
        AND (
          d.created_by = $2 OR
          d.id IN (SELECT dashboard_id FROM dashboard_permissions WHERE user_id = $2) OR
          (ds.space_id IN (SELECT space_id FROM space_members WHERE user_id = $2)) OR
          d.visibility = 'PUBLIC'
        )
      GROUP BY d.id
    `, [id, session.user.id])

    if (dashboards.length === 0) {
      return NextResponse.json({ error: 'Dashboard not found' }, { status: 404 })
    }

    const dashboard = dashboards[0]

    // Get dashboard elements
    const { rows: elements } = await query(`
      SELECT * FROM dashboard_elements 
      WHERE dashboard_id = $1 AND is_visible = true
      ORDER BY z_index ASC, position_y ASC, position_x ASC
    `, [id])

    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${dashboard.name}</title>
          <style>
            body {
              font-family: ${dashboard.font_family || 'Inter'}, sans-serif;
              font-size: ${dashboard.font_size || 14}px;
              margin: 0;
              padding: 20px;
              background-color: ${dashboard.background_color || '#ffffff'};
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 20px;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              color: #1f2937;
            }
            .header p {
              margin: 10px 0 0 0;
              color: #6b7280;
            }
            .metadata {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 20px;
              margin-bottom: 30px;
              background: #f9fafb;
              padding: 20px;
              border-radius: 8px;
            }
            .metadata-item {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .metadata-item:last-child {
              border-bottom: none;
            }
            .metadata-label {
              font-weight: 600;
              color: #374151;
            }
            .metadata-value {
              color: #6b7280;
            }
            .elements-grid {
              display: grid;
              grid-template-columns: repeat(${dashboard.grid_size || 12}, 1fr);
              gap: 10px;
              min-height: 600px;
            }
            .element {
              background: white;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 16px;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              display: flex;
              flex-direction: column;
            }
            .element-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;
              padding-bottom: 8px;
              border-bottom: 1px solid #f3f4f6;
            }
            .element-title {
              font-weight: 600;
              font-size: 14px;
              color: #1f2937;
            }
            .element-type {
              background: #f3f4f6;
              color: #6b7280;
              padding: 2px 8px;
              border-radius: 4px;
              font-size: 12px;
            }
            .element-content {
              flex: 1;
              display: flex;
              align-items: center;
              justify-content: center;
              background: #f9fafb;
              border: 2px dashed #d1d5db;
              border-radius: 4px;
              min-height: 80px;
              color: #9ca3af;
              font-size: 12px;
            }
            .no-elements {
              grid-column: 1 / -1;
              text-align: center;
              padding: 60px 20px;
              color: #6b7280;
            }
            .footer {
              margin-top: 40px;
              text-align: center;
              color: #9ca3af;
              font-size: 12px;
              border-top: 1px solid #e5e7eb;
              padding-top: 20px;
            }
            @media print {
              body { margin: 0; }
              .header { page-break-after: avoid; }
              .element { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${dashboard.name}</h1>
            ${dashboard.description ? `<p>${dashboard.description}</p>` : ''}
          </div>

          <div class="metadata">
            <div class="metadata-item">
              <span class="metadata-label">Type:</span>
              <span class="metadata-value">${dashboard.type}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Visibility:</span>
              <span class="metadata-value">${dashboard.visibility}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Spaces:</span>
              <span class="metadata-value">${dashboard.space_names?.join(', ') || 'None'}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Elements:</span>
              <span class="metadata-value">${dashboard.element_count}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Data Sources:</span>
              <span class="metadata-value">${dashboard.datasource_count}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Refresh Rate:</span>
              <span class="metadata-value">${dashboard.is_realtime ? 'Real-time' : `${dashboard.refresh_rate} seconds`}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Created:</span>
              <span class="metadata-value">${new Date(dashboard.created_at).toLocaleDateString()}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">Updated:</span>
              <span class="metadata-value">${new Date(dashboard.updated_at).toLocaleDateString()}</span>
            </div>
          </div>

          <div class="elements-grid">
            ${elements.length === 0 ? `
              <div class="no-elements">
                <h3>No elements in this dashboard</h3>
                <p>This dashboard doesn't contain any visual elements yet.</p>
              </div>
            ` : elements.map(element => `
              <div class="element" style="grid-column: span ${element.width}; grid-row: span ${element.height};">
                <div class="element-header">
                  <span class="element-title">${element.name}</span>
                  <span class="element-type">${element.type}${element.chart_type ? ` - ${element.chart_type}` : ''}</span>
                </div>
                <div class="element-content">
                  <div>
                    <div style="font-size: 24px; margin-bottom: 8px;">📊</div>
                    <div>${element.name}</div>
                    <div style="font-size: 10px; margin-top: 4px;">${element.width}×${element.height} grid units</div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>

          <div class="footer">
            <p>Generated on ${new Date().toLocaleString()} | Dashboard: ${dashboard.name}</p>
          </div>
        </body>
      </html>
    `

    // Launch Puppeteer and generate PDF
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    const page = await browser.newPage()
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' })

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '20mm',
        bottom: '20mm',
        left: '20mm'
      }
    })

    await browser.close()

    // Upload PDF to configured S3 storage
    const s3Config = await getS3Config()
    if (!s3Config?.bucket) {
      return NextResponse.json(
        { error: 'AWS S3 is not configured in the UI' },
        { status: 500 }
      )
    }
    const bucket = s3Config.bucket

    // Generate S3 key
    const timestamp = Date.now()
    const filename = `${dashboard.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${timestamp}.pdf`
    const s3Key = `attachments/${session.user.id}/${filename}`

    // Upload to S3
    const uploadCommand = new PutObjectCommand({
      Bucket: bucket,
      Key: s3Key,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
      ContentDisposition: `attachment; filename="${filename}"`,
    })

    const client = await getS3Client()
    await client.send(uploadCommand)

    // Return S3 key for client to download
    return NextResponse.json({
      success: true,
      key: s3Key,
      bucket: bucket,
      filename: filename,
      message: 'PDF generated and uploaded successfully'
    })
}

export const POST = withErrorHandling(postHandler, 'POST POST /api/dashboards/[id]/export/pdf/route.ts')
