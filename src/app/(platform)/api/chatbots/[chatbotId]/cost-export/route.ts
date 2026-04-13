import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

// GET - Export cost data as CSV or JSON
async function getHandler(
  request: NextRequest,
  { params }: { params: Promise<{ chatbotId: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { chatbotId } = await params
  const { searchParams } = new URL(request.url)
  const format = searchParams.get('format') || 'json' // 'json' or 'csv'
  const startDate = searchParams.get('startDate')
  const endDate = searchParams.get('endDate')

  const where: any = {
    chatbotId,
  }

  if (startDate || endDate) {
    where.recordedAt = {}
    if (startDate) where.recordedAt.gte = new Date(startDate)
    if (endDate) where.recordedAt.lte = new Date(endDate)
  }

  const records = await prisma.chatbotCostRecord.findMany({
    where,
    orderBy: { recordedAt: 'desc' },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
        },
      },
    },
  })

  if (format === 'csv') {
    // Generate CSV
    const headers = [
      'Date',
      'Cost (USD)',
      'Input Tokens',
      'Output Tokens',
      'Total Tokens',
      'Model',
      'User ID',
      'User Email',
      'User Name',
      'Thread ID',
      'Trace ID',
    ]

    const rows = records.map((record) => [
      record.recordedAt.toISOString(),
      record.cost.toString(),
      record.inputTokens?.toString() || '',
      record.outputTokens?.toString() || '',
      record.totalTokens?.toString() || '',
      record.model || '',
      record.userId || '',
      record.user?.email || '',
      record.user?.name || '',
      record.threadId || '',
      record.traceId || '',
    ])

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="cost-export-${chatbotId}-${new Date().toISOString().split('T')[0]}.csv"`,
      },
    })
  } else {
    // Return JSON
    return NextResponse.json({
      chatbotId,
      exportedAt: new Date().toISOString(),
      recordCount: records.length,
      records: records.map((record) => ({
        id: record.id,
        recordedAt: record.recordedAt.toISOString(),
        cost: Number(record.cost),
        inputTokens: record.inputTokens,
        outputTokens: record.outputTokens,
        totalTokens: record.totalTokens,
        model: record.model,
        userId: record.userId,
        userEmail: record.user?.email,
        userName: record.user?.name,
        threadId: record.threadId,
        traceId: record.traceId,
        metadata: record.metadata,
      })),
    })
  }
}

export const GET = withErrorHandling(getHandler, 'GET /api/chatbots/[chatbotId]/cost-export')