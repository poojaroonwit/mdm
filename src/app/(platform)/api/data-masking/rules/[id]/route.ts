import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { dataMasking } from '@/lib/data-masking'

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    await dataMasking.initialize()
    
    await dataMasking.updateMaskingRule(id, body)
    const rules = await dataMasking.getMaskingRules()
    const updatedRule = rules.find(r => r.id === id)
    
    return NextResponse.json(updatedRule || { id, ...body })
  } catch (error: any) {
    console.error('Error updating masking rule:', error)
    return NextResponse.json(
      { error: 'Failed to update masking rule', details: error.message },
      { status: 500 }
    )
  }
}



async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    await dataMasking.initialize()
    
    await dataMasking.deleteMaskingRule(id)
    
    return NextResponse.json({ success: true, message: 'Rule deleted' })
  } catch (error: any) {
    console.error('Error deleting masking rule:', error)
    return NextResponse.json(
      { error: 'Failed to delete masking rule', details: error.message },
      { status: 500 }
    )
  }
}



export const PUT = withErrorHandling(putHandler, 'PUT PUT /api/data-masking/rules/[id]/route.ts')
export const DELETE = withErrorHandling(deleteHandler, 'DELETE DELETE /api/data-masking/rules/[id]/route.ts')