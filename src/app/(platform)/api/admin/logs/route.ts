import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Mock log data
    const logs = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        level: 'INFO',
        service: 'API',
        message: 'User login successful',
        context: { userId: 'user123', ip: '192.168.1.1' },
        userId: 'user123',
        sessionId: 'session456',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        duration: 150,
        tags: ['auth', 'login']
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
        level: 'ERROR',
        service: 'Database',
        message: 'Connection timeout',
        context: { query: 'SELECT * FROM users', timeout: 5000 },
        userId: undefined,
        sessionId: undefined,
        ipAddress: undefined,
        userAgent: undefined,
        duration: 5000,
        tags: ['database', 'timeout']
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
        level: 'WARN',
        service: 'Cache',
        message: 'Cache miss rate high',
        context: { missRate: 0.15, threshold: 0.1 },
        userId: undefined,
        sessionId: undefined,
        ipAddress: undefined,
        userAgent: undefined,
        duration: undefined,
        tags: ['cache', 'performance']
      }
    ]

    return NextResponse.json({ logs })
  } catch (error) {
    console.error('Error fetching logs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch logs' },
      { status: 500 },
    )
  }
}
