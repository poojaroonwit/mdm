import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function GET() {
  try {
    // Get all cache instances with their latest stats
    const instances = await prisma.cacheInstance.findMany({
      include: {
        stats: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 1
        },
        keys: true
      }
    })

    // Calculate aggregate stats
    let totalKeys = 0
    let totalMemoryUsage = 0
    let totalHits = 0
    let totalMisses = 0
    let totalEvictions = 0
    let totalExpired = 0
    let totalConnections = 0
    let totalCommandsPerSecond = 0
    let totalResponseTime = 0
    let instanceCount = 0

    instances.forEach(instance => {
      const latestStats = instance.stats[0]
      if (latestStats) {
        totalKeys += instance.keys.length
        totalMemoryUsage += Number(latestStats.memoryUsage)
        totalHits += latestStats.hits
        totalMisses += latestStats.misses
        totalEvictions += latestStats.evictions
        totalExpired += latestStats.expired
        totalConnections += latestStats.connections
        totalCommandsPerSecond += latestStats.commandsPerSecond
        totalResponseTime += latestStats.avgResponseTime
        instanceCount++
      }
    })

    const hitRate = totalHits + totalMisses > 0 ? (totalHits / (totalHits + totalMisses)) * 100 : 0
    const missRate = totalHits + totalMisses > 0 ? (totalMisses / (totalHits + totalMisses)) * 100 : 0
    const avgResponseTime = instanceCount > 0 ? totalResponseTime / instanceCount : 0

    const stats = {
      totalKeys,
      memoryUsage: totalMemoryUsage,
      hitRate,
      missRate,
      evictionRate: totalEvictions,
      avgResponseTime,
      connections: totalConnections,
      commandsPerSecond: totalCommandsPerSecond
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error('Error fetching cache stats:', error)
    return NextResponse.json({ error: 'Failed to fetch cache stats' }, { status: 500 })
  }
}
