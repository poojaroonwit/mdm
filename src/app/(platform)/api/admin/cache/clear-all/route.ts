import { NextRequest, NextResponse } from 'next/server'
import { flushAll } from '@/lib/redis-client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    // Check if user is authenticated and is an admin
    if (!session || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await flushAll()

    return NextResponse.json({ 
      message: 'All Redis cache cleared successfully',
      success: true
    })
  } catch (error) {
    console.error('Error clearing all cache:', error)
    return NextResponse.json({ error: 'Failed to clear all cache' }, { status: 500 })
  }
}
