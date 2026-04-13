import { NextResponse } from 'next/server'
import { generateOpenAPISpec } from '@/lib/api-documentation'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const spec = generateOpenAPISpec()
    return NextResponse.json(spec, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    })
  } catch (error) {
    console.error('Error generating OpenAPI spec:', error)
    return NextResponse.json(
      { error: 'Failed to generate API documentation' },
      { status: 500 }
    )
  }
}

