import { NextRequest, NextResponse } from 'next/server'
import { listHubPlugins } from '../../../lib/hub-data'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const plugins = listHubPlugins({
      category: searchParams.get('category'),
      status: searchParams.get('status'),
      verified: searchParams.get('verified'),
    })

    return NextResponse.json({ plugins })
  } catch (error) {
    console.error('Error fetching hub plugins:', error)
    return NextResponse.json(
      { error: 'Failed to fetch plugins', plugins: [] },
      { status: 500 }
    )
  }
}
