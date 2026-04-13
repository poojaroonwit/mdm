import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const stats = {
      total: 1247,
      byLevel: {
        DEBUG: 312,
        INFO: 748,
        WARN: 143,
        ERROR: 38,
        FATAL: 6,
      },
      byService: {
        API: 489,
        Database: 287,
        Cache: 156,
        Auth: 198,
        Storage: 117,
      },
      byHour: Array.from({ length: 24 }, (_, i) => ({
        hour: String(i).padStart(2, '0') + ':00',
        count: Math.floor(Math.random() * 80) + 10,
      })),
      errorRate: 0.035,
      avgResponseTime: 142,
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching log stats:', error)
    return NextResponse.json({ error: 'Failed to fetch log stats' }, { status: 500 })
  }
}
