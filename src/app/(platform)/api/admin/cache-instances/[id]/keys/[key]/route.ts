import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; key: string }> }
) {
  try {
    const { id: instanceId, key: keyParam } = await params
    const keyName = decodeURIComponent(keyParam)

    // Find the cache key
    const cacheKey = await prisma.cacheKey.findUnique({
      where: {
        instanceId_key: {
          instanceId,
          key: keyName
        }
      }
    })

    if (!cacheKey) {
      return NextResponse.json({ error: 'Cache key not found' }, { status: 404 })
    }

    // Delete the cache key
    await prisma.cacheKey.delete({
      where: {
        instanceId_key: {
          instanceId,
          key: keyName
        }
      }
    })

    // Update instance stats
    await prisma.cacheStats.create({
      data: {
        instanceId,
        totalKeys: -1,
        memoryUsage: BigInt(-cacheKey.size),
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

    return NextResponse.json({ message: 'Cache key deleted successfully' })
  } catch (error) {
    console.error('Error deleting cache key:', error)
    return NextResponse.json({ error: 'Failed to delete cache key' }, { status: 500 })
  }
}
