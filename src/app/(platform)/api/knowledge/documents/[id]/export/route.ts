import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { applyRateLimit } from '@/app/api/v1/middleware'
import { getKnowledgeSchema, isValidUUID } from '../../../utils'

async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimitResponse = await applyRateLimit(request)
  if (rateLimitResponse) {
    return rateLimitResponse
  }

  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const { id: documentId } = await params

  if (!isValidUUID(documentId)) {
    return NextResponse.json({ error: 'Invalid document ID' }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'markdown'
  const spaceId = searchParams.get('spaceId')

  // Get the isolated schema for Knowledge Base
  const schema = await getKnowledgeSchema(spaceId)

  // Get document
  const docResult = await query(
    `SELECT kd.*, kc.is_private, kc.created_by as collection_created_by
       FROM ${schema}.knowledge_documents kd
       JOIN ${schema}.knowledge_collections kc ON kc.id = kd.collection_id
       WHERE kd.id::text = $1 AND kd.deleted_at IS NULL`,
    [documentId]
  )

  if (docResult.rows.length === 0) {
    return NextResponse.json({ error: 'Document not found' }, { status: 404 })
  }

  const doc = docResult.rows[0]

  // Check access
  const memberCheck = await query(
    `SELECT role FROM ${schema}.knowledge_collection_members
       WHERE collection_id::text = $1 AND user_id::text = $2`,
    [doc.collection_id, session.user.id]
  )

  const isCollectionCreator = doc.collection_created_by === session.user.id
  const isMember = memberCheck.rows.length > 0
  const isPublic = doc.is_public

  if (!isCollectionCreator && !isMember && doc.is_private && !isPublic) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Export based on format
  if (format === 'markdown') {
    const markdown = `# ${doc.title}\n\n${doc.content}`
    return new NextResponse(markdown, {
      headers: {
        'Content-Type': 'text/markdown',
        'Content-Disposition': `attachment; filename="${doc.title.replace(/[^a-z0-9]/gi, '_')}.md"`,
      },
    })
  } else if (format === 'html') {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${doc.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }
    h1 { border-bottom: 2px solid #eaecef; padding-bottom: 10px; }
    pre { background: #f6f8fa; padding: 16px; border-radius: 6px; overflow-x: auto; }
    code { background: #f6f8fa; padding: 2px 6px; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>${doc.title}</h1>
  <div>${doc.content_html || doc.content}</div>
</body>
</html>`
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="${doc.title.replace(/[^a-z0-9]/gi, '_')}.html"`,
      },
    })
  } else if (format === 'json') {
    return NextResponse.json({
      title: doc.title,
      content: doc.content,
      contentHtml: doc.content_html,
      createdAt: doc.created_at,
      updatedAt: doc.updated_at,
    }, {
      headers: {
        'Content-Disposition': `attachment; filename="${doc.title.replace(/[^a-z0-9]/gi, '_')}.json"`,
      },
    })
  }

  return NextResponse.json(
    { error: 'Invalid format. Use: markdown, html, or json' },
    { status: 400 }
  )
}

export const GET = withErrorHandling(getHandler, 'GET /api/knowledge/documents/[id]/export')

