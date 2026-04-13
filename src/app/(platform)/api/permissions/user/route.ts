
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auth } from '@/lib/auth' // Assuming auth helper exists, or use getSession
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth' // Adjust path if needed

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // For now, return all permissions for verified users to ensure menu shows up
    // In a real app, fetch from database based on roles
    const permissions = ['*']

    return NextResponse.json({ permissions })
  } catch (error) {
    console.error('Error fetching user permissions:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
