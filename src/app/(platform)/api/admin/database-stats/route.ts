import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function GET() {
  try {
    // Get connection statistics
    const connections = await prisma.externalConnection.findMany({
      where: {
        isActive: true
      }
    })

    const dataModels = await prisma.dataModel.findMany({
      include: {
        dataRecords: true
      }
    })

    // Mock database performance stats
    const stats = {
      totalConnections: connections.length,
      activeConnections: connections.filter(c => c.isActive).length,
      idleConnections: Math.floor(connections.length * 0.3),
      slowQueries: 5,
      avgQueryTime: 150, // milliseconds
      cacheHitRate: 85.5,
      databaseSize: 1024 * 1024 * 1024, // 1GB
      tableCount: dataModels.length,
      indexCount: dataModels.length * 2 // Assume 2 indexes per table
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching database stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch database stats' },
      { status: 500 },
    )
  }
}
