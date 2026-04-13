import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: instanceId } = await params

    const keys = await prisma.cacheKey.findMany({
      where: {
        instanceId
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Transform the data to match the frontend interface
    const transformedKeys = keys.map(key => ({
      key: key.key,
      type: key.type,
      size: key.size,
      ttl: key.ttl,
      lastAccessed: key.lastAccessed,
      hitCount: key.hitCount,
      isExpired: key.isExpired
    }))

    return NextResponse.json({ keys: transformedKeys })
  } catch (error) {
    console.error('Error fetching cache keys:', error)
    return NextResponse.json({ error: 'Failed to fetch cache keys' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: instanceId } = await params
    const body = await request.json()
    const { key, value, ttl } = body

    // Validate required fields
    if (!key || !value) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if key already exists
    const existingKey = await prisma.cacheKey.findUnique({
      where: {
        instanceId_key: {
          instanceId,
          key
        }
      }
    })

    if (existingKey) {
      return NextResponse.json({ error: 'Key already exists' }, { status: 500 })
    }

    // Create the cache key
    const cacheKey = await prisma.cacheKey.create({
      data: {
        instanceId,
        key,
        value,
        type: 'string',
        size: Buffer.byteLength(value, 'utf8'),
        ttl: ttl ? parseInt(ttl) : null,
        hitCount: 0,
        isExpired: false
      }
    })

    // Update instance stats
    await prisma.cacheStats.create({
      data: {
        instanceId,
        totalKeys: 1,
        memoryUsage: BigInt(cacheKey.size),
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

    return NextResponse.json({ key: cacheKey })
  } catch (error) {
    console.error('Error creating cache key:', error)
    return NextResponse.json({ error: 'Failed to create cache key' }, { status: 500 })
  }
}
