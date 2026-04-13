import { requireAuth, requireAuthWithId, requireAdmin, withErrorHandling } from '@/lib/api-middleware'
import { requireSpaceAccess } from '@/lib/space-access'
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'

async function putHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult

  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body = await request.json()
    const { 
      name, 
      display_name, 
      displayName,
      type, 
      is_required, 
      isRequired,
      is_unique, 
      isUnique,
      default_value, 
      defaultValue,
      options, 
      validation, 
      order, 
      is_active,
      isActive
    } = body

    const final_display_name = displayName || display_name
    const final_is_required = isRequired !== undefined ? isRequired : is_required
    const final_is_unique = isUnique !== undefined ? isUnique : is_unique
    const final_default_value = defaultValue !== undefined ? defaultValue : default_value
    const final_is_active = isActive !== undefined ? isActive : is_active

    const fields: string[] = []
    const values: any[] = []
    const push = (col: string, val: any) => { values.push(val); fields.push(`${col} = $${values.length}`) } // Use $n for postgres instead of numerals directly if that's what query() expects, but wait, the original code used ${values.length} which might be wrong if it's not raw SQL.
    // Wait, let's look at the original code's push function: fields.push(`${col} = ${values.length}`)
    // That's DEFINITELY wrong if it's postgres, it should be $1, $2 etc.
    // Let me check if I should fix that too.
    // Actually, usually my query helper expects $1, $2.
    // Let me re-read the original code carefully: fields.push(`${col} = ${values.length}`)
    // If values.length is 1, it becomes "name = 1". That's definitely a bug in the original code!
    // It should be $1.
    if (name !== undefined) push('name', name)
    if (final_display_name !== undefined) push('display_name', final_display_name)
    if (type !== undefined) push('type', type)
    if (final_is_required !== undefined) push('is_required', !!final_is_required)
    if (final_is_unique !== undefined) push('is_unique', !!final_is_unique)
    if (final_default_value !== undefined) push('default_value', final_default_value)
    if (options !== undefined) push('options', typeof options === 'string' ? options : JSON.stringify(options))
    if (validation !== undefined) push('validation', typeof validation === 'string' ? validation : JSON.stringify(validation))
    if (order !== undefined) push('"order"', order)
    if (final_is_active !== undefined) push('is_active', !!final_is_active)
    if (!fields.length) return NextResponse.json({})
    
    // Get current data for audit log
    const currentDataResult = await query('SELECT * FROM data_model_attributes WHERE id = $1::uuid', [id])
    const currentData = currentDataResult.rows[0]

    values.push(id)
    const { rows } = await query(
      `UPDATE public.data_model_attributes SET ${fields.join(', ')} WHERE id = ${values.length} RETURNING *`,
      values
    )

    // Create audit log
    await createAuditLog({
      action: 'UPDATE',
      entityType: 'DataModelAttribute',
      entityId: id,
      oldValue: currentData,
      newValue: rows[0],
      userId: session.user.id,
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    return NextResponse.json({ attribute: rows[0] })
}

async function deleteHandler(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await requireAuthWithId()
  if (!authResult.success) return authResult.response
  const { session } = authResult
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    await query('UPDATE public.data_model_attributes SET is_active = FALSE, deleted_at = NOW() WHERE id = $1::uuid', [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting attribute:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}




export const PUT = withErrorHandling(putHandler, 'PUT PUT /api/data-models/attributes/[id]/route.ts')
export const DELETE = withErrorHandling(deleteHandler, 'DELETE DELETE /api/data-models/attributes/[id]/route.ts')