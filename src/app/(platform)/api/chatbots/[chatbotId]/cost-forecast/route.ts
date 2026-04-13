import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { getCostForecast } from '@/lib/cost-tracker'

// GET - Get cost forecast
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
  const days = parseInt(searchParams.get('days') || '30')

  const forecast = await getCostForecast(chatbotId, days)

  return NextResponse.json({ forecast })
}

export const GET = withErrorHandling(getHandler, 'GET /api/chatbots/[chatbotId]/cost-forecast')