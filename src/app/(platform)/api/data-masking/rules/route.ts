import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { dataMasking } from '@/lib/data-masking'

async function getHandler(request: NextRequest) {
    try {
      const authResult = await requireAuth()
      if (!authResult.success) return authResult.response
      const { session } = authResult

      await dataMasking.initialize()
      const rules = await dataMasking.getMaskingRules()

      return NextResponse.json(rules)
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to get masking rules', details: error.message },
        { status: 500 }
      )
    }
}





async function postHandler(request: NextRequest) {
    try {
      const authResult = await requireAuth()
      if (!authResult.success) return authResult.response
      const { session } = authResult

      const body = await request.json()
      await dataMasking.initialize()
      const ruleId = await dataMasking.createMaskingRule(body)
      const rules = await dataMasking.getMaskingRules()
      const rule = rules.find(r => r.id === ruleId)

      return NextResponse.json(rule || { id: ruleId, ...body }, { status: 201 })
    } catch (error: any) {
      return NextResponse.json(
        { error: 'Failed to create masking rule', details: error.message },
        { status: 500 }
      )
    }
}




export const GET = withErrorHandling(getHandler, 'GET GET GET /api/data-masking/rules')
export const POST = withErrorHandling(postHandler, 'POST POST /api/data-masking\rules\route.ts')