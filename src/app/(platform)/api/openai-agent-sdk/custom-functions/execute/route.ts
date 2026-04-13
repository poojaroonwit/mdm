import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { executeCustomFunction } from '@/lib/custom-functions'

async function postHandler(request: NextRequest) {
  const authResult = await requireAuth()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  const body = await request.json()
  const { functionId, arguments: args, chatbotId } = body

  if (!functionId || !chatbotId) {
    return NextResponse.json(
      { error: 'functionId and chatbotId are required' },
      { status: 400 }
    )
  }

  const result = await executeCustomFunction(functionId, args, chatbotId)

  return NextResponse.json({ result })
}

export const POST = withErrorHandling(postHandler, 'POST /api/openai-agent-sdk/custom-functions/execute')

