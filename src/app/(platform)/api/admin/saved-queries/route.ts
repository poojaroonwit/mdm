import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const search = searchParams.get('search') || ''
    const spaceId = searchParams.get('spaceId') || ''
    
    // Mock saved queries data
    const savedQueries = [
      {
        id: '1',
        name: 'Active Users Last 7 Days',
        description: 'Get all users who have been active in the last 7 days',
        query: 'SELECT * FROM users WHERE last_login_at > NOW() - INTERVAL \'7 days\'',
        spaceId: 'space-1',
        spaceName: 'Production',
        createdBy: 'john.doe@example.com',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        isPublic: true,
        tags: ['users', 'analytics', 'active'],
        executionCount: 15,
        lastExecuted: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        isStarred: true
      },
      {
        id: '2',
        name: 'Daily User Registration',
        description: 'Daily count of new user registrations',
        query: 'SELECT DATE(created_at) as date, COUNT(*) as new_users FROM users GROUP BY DATE(created_at) ORDER BY date DESC',
        spaceId: 'space-2',
        spaceName: 'Analytics',
        createdBy: 'analyst@example.com',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        isPublic: true,
        tags: ['users', 'registration', 'daily'],
        executionCount: 8,
        lastExecuted: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        isStarred: false
      },
      {
        id: '3',
        name: 'High Value Orders',
        description: 'Orders with value greater than $1000',
        query: 'SELECT * FROM orders WHERE amount > 1000 ORDER BY amount DESC',
        spaceId: 'space-1',
        spaceName: 'Production',
        createdBy: 'admin@example.com',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        isPublic: false,
        tags: ['orders', 'revenue', 'high-value'],
        executionCount: 3,
        lastExecuted: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
        isStarred: true
      },
      {
        id: '4',
        name: 'User Engagement Metrics',
        description: 'Calculate user engagement metrics by space',
        query: 'SELECT s.name as space_name, COUNT(DISTINCT u.id) as total_users, COUNT(DISTINCT CASE WHEN u.last_login_at > NOW() - INTERVAL \'30 days\' THEN u.id END) as active_users FROM spaces s LEFT JOIN space_members sm ON s.id = sm.space_id LEFT JOIN users u ON sm.user_id = u.id GROUP BY s.id, s.name',
        spaceId: 'space-2',
        spaceName: 'Analytics',
        createdBy: 'analyst@example.com',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
        isPublic: true,
        tags: ['engagement', 'metrics', 'spaces'],
        executionCount: 12,
        lastExecuted: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        isStarred: false
      },
      {
        id: '5',
        name: 'Failed Login Attempts',
        description: 'Monitor failed login attempts for security analysis',
        query: 'SELECT user_id, COUNT(*) as failed_attempts, MAX(attempted_at) as last_attempt FROM login_attempts WHERE success = false AND attempted_at > NOW() - INTERVAL \'24 hours\' GROUP BY user_id HAVING COUNT(*) > 3 ORDER BY failed_attempts DESC',
        spaceId: 'space-1',
        spaceName: 'Production',
        createdBy: 'security@example.com',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
        isPublic: false,
        tags: ['security', 'login', 'monitoring'],
        executionCount: 5,
        lastExecuted: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        isStarred: true
      },
      {
        id: '6',
        name: 'Monthly Revenue Report',
        description: 'Calculate monthly revenue by product category',
        query: 'SELECT DATE_TRUNC(\'month\', created_at) as month, category, SUM(amount) as revenue FROM orders o JOIN products p ON o.product_id = p.id GROUP BY DATE_TRUNC(\'month\', created_at), category ORDER BY month DESC, revenue DESC',
        spaceId: 'space-2',
        spaceName: 'Analytics',
        createdBy: 'finance@example.com',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        updatedAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
        isPublic: true,
        tags: ['revenue', 'monthly', 'categories'],
        executionCount: 6,
        lastExecuted: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
        isStarred: false
      }
    ]

    // Apply filters
    let filteredQueries = savedQueries

    if (search) {
      filteredQueries = filteredQueries.filter(q => 
        q.name.toLowerCase().includes(search.toLowerCase()) ||
        q.description.toLowerCase().includes(search.toLowerCase()) ||
        q.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
      )
    }

    if (spaceId) {
      filteredQueries = filteredQueries.filter(q => q.spaceId === spaceId)
    }

    // Apply pagination
    const paginatedQueries = filteredQueries.slice(offset, offset + limit)
    const total = filteredQueries.length

    return NextResponse.json({
      queries: paginatedQueries,
      total,
      page: Math.floor(offset / limit) + 1,
      limit,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error('Saved queries API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved queries' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, query, spaceId, isPublic, tags } = body

    // Mock creating a new saved query
    const newQuery = {
      id: Date.now().toString(),
      name,
      description,
      query,
      spaceId,
      spaceName: 'Current Space', // This would be fetched from space data
      createdBy: 'current.user@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublic: isPublic || false,
      tags: tags || [],
      executionCount: 0,
      lastExecuted: null,
      isStarred: false,
    }

    return NextResponse.json(newQuery)
  } catch (error) {
    console.error('Create saved query error:', error)
    return NextResponse.json(
      { error: 'Failed to create saved query' },
      { status: 500 },
    )
  }
}
