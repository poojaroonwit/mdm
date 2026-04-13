import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: dataModelId } = await params

    // DataModelRelation model doesn't exist in Prisma schema
    // Returning empty results for now
    return NextResponse.json({ 
      relatedAttributes: [],
      count: 0
    })

  } catch (error) {
    console.error('Error in related attributes API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
