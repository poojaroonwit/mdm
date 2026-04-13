import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    // Mock query history data
    const queryHistory = [
      {
        id: '1',
        query: 'SELECT * FROM users WHERE created_at > NOW() - INTERVAL \'7 days\'',
        timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        executionTime: 1250, // milliseconds
        status: 'success',
        results: [],
        columns: ['id', 'name', 'email', 'created_at'],
        spaceId: 'space-1',
        spaceName: 'Production',
        userId: 'user-1',
        userName: 'John Doe',
        size: 15600
      },
      {
        id: '2',
        query: 'SELECT COUNT(*) as total_users FROM users',
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        executionTime: 890,
        status: 'success',
        results: [],
        columns: ['total_users'],
        spaceId: 'space-2',
        spaceName: 'Analytics',
        userId: 'user-2',
        userName: 'Jane Smith',
        size: 100
      },
      {
        id: '3',
        query: 'SELECT * FROM orders WHERE status = \'pending\'',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        executionTime: 2100,
        status: 'success',
        results: [],
        columns: ['id', 'user_id', 'status', 'amount'],
        spaceId: 'space-1',
        spaceName: 'Production',
        userId: 'user-3',
        userName: 'Admin User',
        size: 2300
      },
      {
        id: '4',
        query: 'SELECT u.name, COUNT(o.id) as order_count FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id, u.name',
        timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        executionTime: 3200,
        status: 'success',
        results: [],
        columns: ['name', 'order_count'],
        spaceId: 'space-1',
        spaceName: 'Production',
        userId: 'user-1',
        userName: 'John Doe',
        size: 8900
      },
      {
        id: '5',
        query: 'SELECT * FROM products WHERE price > 100',
        timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        executionTime: 1500,
        status: 'error',
        results: [],
        columns: [],
        spaceId: 'space-3',
        spaceName: 'Development',
        userId: 'user-4',
        userName: 'Dev User',
        size: 0
      },
      {
        id: '6',
        query: 'SELECT DATE(created_at) as date, COUNT(*) as daily_users FROM users GROUP BY DATE(created_at) ORDER BY date DESC',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        executionTime: 2800,
        status: 'success',
        results: [],
        columns: ['date', 'daily_users'],
        spaceId: 'space-2',
        spaceName: 'Analytics',
        userId: 'user-5',
        userName: 'Analyst User',
        size: 600
      },
      {
        id: '7',
        query: 'SELECT * FROM users WHERE email LIKE \'%@gmail.com\'',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        executionTime: 950,
        status: 'success',
        results: [],
        columns: ['id', 'name', 'email', 'created_at'],
        spaceId: 'space-1',
        spaceName: 'Production',
        userId: 'user-2',
        userName: 'Jane Smith',
        size: 4500
      },
      {
        id: '8',
        query: 'SELECT AVG(amount) as avg_order_value FROM orders WHERE created_at > NOW() - INTERVAL \'30 days\'',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        executionTime: 1800,
        status: 'success',
        results: [],
        columns: ['avg_order_value'],
        spaceId: 'space-2',
        spaceName: 'Analytics',
        userId: 'user-5',
        userName: 'Analyst User',
        size: 100
      }
    ]

    // Apply pagination
    const paginatedHistory = queryHistory.slice(offset, offset + limit)
    const total = queryHistory.length

    return NextResponse.json({
      history: paginatedHistory,
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Query history API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch query history' },
      { status: 500 }
    )
  }
}
