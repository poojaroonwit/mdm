import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; attrId: string }> }
) {
  try {
    const { id: dataModelId, attrId } = await params

    // Get the attribute configuration
    const attributeSql = `
      SELECT 
        auto_increment_prefix,
        auto_increment_suffix,
        auto_increment_padding,
        current_auto_increment_value
      FROM public.data_model_attributes 
      WHERE id = $1::uuid AND data_model_id = $2::uuid AND is_auto_increment = true
    `
    
    const { rows: attrRows } = await query(attributeSql, [attrId, dataModelId])
    
    if (attrRows.length === 0) {
      return NextResponse.json({ error: 'Attribute not found or not auto-increment' }, { status: 404 })
    }

    const attribute = attrRows[0]
    
    // Increment the current value
    const nextValue = attribute.current_auto_increment_value + 1
    
    // Update the current value in the database
    const updateSql = `
      UPDATE public.data_model_attributes 
      SET current_auto_increment_value = $1
      WHERE id = $2::uuid
    `
    
    await query(updateSql, [nextValue, attrId])
    
    // Generate the formatted value
    const paddedNumber = String(nextValue).padStart(attribute.auto_increment_padding, '0')
    const formattedValue = `${attribute.auto_increment_prefix}${paddedNumber}${attribute.auto_increment_suffix}`
    
    return NextResponse.json({ 
      value: formattedValue,
      nextNumber: nextValue,
      prefix: attribute.auto_increment_prefix,
      suffix: attribute.auto_increment_suffix,
      padding: attribute.auto_increment_padding
    })
    
  } catch (error) {
    console.error('Error generating next auto-increment value:', error)
    return NextResponse.json({ error: 'Failed to generate next value' }, { status: 500 })
  }
}
