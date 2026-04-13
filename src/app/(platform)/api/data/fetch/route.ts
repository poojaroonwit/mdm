import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { dataSourceId, query, timestamp } = await request.json()

    // Validate required fields
    if (!dataSourceId) {
      return NextResponse.json(
        { error: 'Data source ID is required' },
        { status: 400 }
      )
    }

    // Mock data for demonstration - replace with actual data fetching logic
    const mockData = [
      { id: 1, name: 'Product A', category: 'Electronics', price: 299.99, sales: 150, date: '2024-01-01' },
      { id: 2, name: 'Product B', category: 'Clothing', price: 49.99, sales: 200, date: '2024-01-02' },
      { id: 3, name: 'Product C', category: 'Electronics', price: 199.99, sales: 75, date: '2024-01-03' },
      { id: 4, name: 'Product D', category: 'Books', price: 19.99, sales: 300, date: '2024-01-04' },
      { id: 5, name: 'Product E', category: 'Clothing', price: 79.99, sales: 120, date: '2024-01-05' },
      { id: 6, name: 'Product F', category: 'Electronics', price: 399.99, sales: 90, date: '2024-01-06' },
      { id: 7, name: 'Product G', category: 'Books', price: 24.99, sales: 180, date: '2024-01-07' },
      { id: 8, name: 'Product H', category: 'Clothing', price: 59.99, sales: 250, date: '2024-01-08' }
    ]

    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 500))

    return NextResponse.json({
      success: true,
      result: mockData,
      metadata: {
        dataSourceId,
        query,
        timestamp,
        recordCount: mockData.length,
        fetchedAt: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}
