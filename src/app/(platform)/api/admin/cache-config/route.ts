import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function GET() {
  try {
    // Get all cache configurations
    const configs = await prisma.cacheConfig.findMany()

    // Return the first configuration as the global config
    // In a real implementation, you might have a global config table
    const config = configs[0] || {
      maxMemory: '1gb',
      evictionPolicy: 'allkeys-lru',
      ttl: 3600,
      compression: false,
      persistence: false,
      clustering: false
    }

    return NextResponse.json({ config })
  } catch (error) {
    console.error('Error fetching cache config:', error)
    return NextResponse.json({ error: 'Failed to fetch cache config' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { maxMemory, evictionPolicy, ttl, compression, persistence, clustering } = body

    // Update all cache configurations (in a real implementation, you might have a global config)
    const configs = await prisma.cacheConfig.findMany()
    
    for (const config of configs) {
      await prisma.cacheConfig.update({
        where: {
          id: config.id
        },
        data: {
          maxMemory: maxMemory || config.maxMemory,
          evictionPolicy: evictionPolicy || config.evictionPolicy,
          ttl: ttl !== undefined ? parseInt(ttl) : config.ttl,
          compression: compression !== undefined ? compression : config.compression,
          persistence: persistence !== undefined ? persistence : config.persistence,
          clustering: clustering !== undefined ? clustering : config.clustering
        }
      })
    }

    return NextResponse.json({ message: 'Cache configuration updated successfully' })
  } catch (error) {
    console.error('Error updating cache config:', error)
    return NextResponse.json({ error: 'Failed to update cache config' }, { status: 500 })
  }
}
