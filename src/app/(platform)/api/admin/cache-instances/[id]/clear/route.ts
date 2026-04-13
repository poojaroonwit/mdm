import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: instanceId } = await params

    // Get the total memory usage before clearing
    const keys = await prisma.cacheKey.findMany({
      where: {
        instanceId
      }
    })

    const totalMemoryUsage = keys.reduce((sum, key) => sum + key.size, 0)
    const keyCount = keys.length

    // Delete all cache keys for this instance
    await prisma.cacheKey.deleteMany({
      where: {
        instanceId
      }
    })

    // Update instance stats
    await prisma.cacheStats.create({
      data: {
        instanceId,
        totalKeys: -keyCount,
        memoryUsage: BigInt(-totalMemoryUsage),
        hitRate: 0,
        missRate: 0,
        evictionRate: 0,
        avgResponseTime: 0,
        connections: 0,
        commandsPerSecond: 0,
        hits: 0,
        misses: 0,
        evictions: keyCount, // Count cleared keys as evictions
        expired: 0
      }
    })

    return NextResponse.json({ 
      message: 'Cache cleared successfully',
      clearedKeys: keyCount,
      freedMemory: totalMemoryUsage
    })
  } catch (error) {
    console.error('Error clearing cache:', error)
    return NextResponse.json({ error: 'Failed to clear cache' }, { status: 500 })
  }
}
