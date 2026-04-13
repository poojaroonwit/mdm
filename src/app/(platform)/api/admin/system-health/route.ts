import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const services = [
      {
        service: 'API Server',
        status: 'healthy',
        uptime: 86400,
        responseTime: 45,
        lastCheck: new Date(),
        errorRate: 0.1,
        dependencies: ['Database', 'Cache']
      },
      {
        service: 'Database',
        status: 'healthy',
        uptime: 86400,
        responseTime: 12,
        lastCheck: new Date(),
        errorRate: 0.05,
        dependencies: []
      },
      {
        service: 'Cache',
        status: 'healthy',
        uptime: 86400,
        responseTime: 2,
        lastCheck: new Date(),
        errorRate: 0.02,
        dependencies: []
      },
      {
        service: 'File Storage',
        status: 'healthy',
        uptime: 86400,
        responseTime: 8,
        lastCheck: new Date(),
        errorRate: 0.01,
        dependencies: []
      }
    ]

    return NextResponse.json({ services })
  } catch (error) {
    console.error('Error fetching system health:', error)
    return NextResponse.json(
      { error: 'Failed to fetch system health' },
      { status: 500 }
    )
  }
}

