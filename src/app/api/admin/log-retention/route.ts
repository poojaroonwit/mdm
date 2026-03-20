import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const retention = [
      { id: '1', service: 'API', level: 'DEBUG', retentionDays: 7, enabled: true },
      { id: '2', service: 'API', level: 'INFO', retentionDays: 30, enabled: true },
      { id: '3', service: 'API', level: 'ERROR', retentionDays: 90, enabled: true },
      { id: '4', service: 'Database', level: 'INFO', retentionDays: 30, enabled: true },
      { id: '5', service: 'Database', level: 'ERROR', retentionDays: 180, enabled: true },
      { id: '6', service: 'Auth', level: 'INFO', retentionDays: 90, enabled: true },
      { id: '7', service: 'Auth', level: 'ERROR', retentionDays: 365, enabled: true },
    ]

    return NextResponse.json({ retention })
  } catch (error) {
    console.error('Error fetching log retention:', error)
    return NextResponse.json({ error: 'Failed to fetch log retention' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const newPolicy = { id: Date.now().toString(), ...body, enabled: true }
    return NextResponse.json({ retention: newPolicy }, { status: 201 })
  } catch (error) {
    console.error('Error creating retention policy:', error)
    return NextResponse.json({ error: 'Failed to create retention policy' }, { status: 500 })
  }
}
