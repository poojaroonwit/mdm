import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function GET() {
  try {
    const instances = await prisma.cacheInstance.findMany({
      include: {
        keys: true,
        stats: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        }
      }
    })

    // Transform the data to match the frontend interface
    const transformedInstances = instances.map(instance => {
      const latestStats = instance.stats[0]
      const keyCount = instance.keys.length
      
      return {
        id: instance.id,
        name: instance.name,
        type: instance.type,
        host: instance.host,
        port: instance.port,
        isActive: instance.isActive,
        status: instance.status,
        lastConnected: instance.lastConnected,
        memory: {
          used: latestStats ? Number(latestStats.memoryUsage) : 0,
          total: 1024 * 1024 * 1024, // Default 1GB total
          peak: latestStats ? Number(latestStats.memoryUsage) * 1.2 : 0
        },
        stats: {
          hits: latestStats?.hits || 0,
          misses: latestStats?.misses || 0,
          evictions: latestStats?.evictions || 0,
          expired: latestStats?.expired || 0,
          keys: keyCount
        }
      }
    })

    return NextResponse.json({ instances: transformedInstances })
  } catch (error) {
    console.error('Error fetching cache instances:', error)
    return NextResponse.json({ error: 'Failed to fetch cache instances' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, host, port, password } = body

    // Validate required fields
    if (!name || !type || !host || !port) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Create the cache instance
    const instance = await prisma.cacheInstance.create({
      data: {
        name,
        type,
        host,
        port: parseInt(port),
        password: password || null,
        status: 'disconnected'
      }
    })

    // Create initial stats record
    await prisma.cacheStats.create({
      data: {
        instanceId: instance.id,
        totalKeys: 0,
        memoryUsage: 0,
        hitRate: 0,
        missRate: 0,
        evictionRate: 0,
        avgResponseTime: 0,
        connections: 0,
        commandsPerSecond: 0,
        hits: 0,
        misses: 0,
        evictions: 0,
        expired: 0
      }
    })

    // Create default configuration
    await prisma.cacheConfig.create({
      data: {
        instanceId: instance.id,
        maxMemory: '1gb',
        evictionPolicy: 'allkeys-lru',
        ttl: 3600,
        compression: false,
        persistence: false,
        clustering: false
      }
    })

    return NextResponse.json({ instance })
  } catch (error) {
    console.error('Error creating cache instance:', error)
    return NextResponse.json({ error: 'Failed to create cache instance' }, { status: 500 })
  }
}
