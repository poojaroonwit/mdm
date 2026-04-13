import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function GET() {
  try {
    // Get external connections as data sources
    const connections = await prisma.externalConnection.findMany({
      include: {
        space: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    const dataSources = connections.map(conn => ({
      id: conn.id,
      name: conn.name,
      type: conn.dbType,
      connection: `${conn.host}:${conn.port}/${conn.database}`,
      spaceId: conn.spaceId,
      spaceName: conn.space.name,
      isActive: conn.isActive
    }))

    // Add space data sources
    const spaces = await prisma.space.findMany({
      select: {
        id: true,
        name: true
      }
    })

    const spaceDataSources = spaces.map(space => ({
      id: `space-${space.id}`,
      name: `${space.name} Data`,
      type: 'space_data',
      connection: `space://${space.id}`,
      spaceId: space.id,
      spaceName: space.name,
      isActive: true
    }))

    return NextResponse.json({ 
      dataSources: [...dataSources, ...spaceDataSources] 
    })
  } catch (error) {
    console.error('Error fetching data sources:', error)
    return NextResponse.json({ error: 'Failed to fetch data sources' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, type, connection, spaceId } = body

    const dataSource = {
      id: `source-${Date.now()}`,
      name,
      type,
      connection,
      spaceId: spaceId || null,
      spaceName: spaceId ? 'Space Name' : null, // Would be fetched from space
      isActive: true
    }

    return NextResponse.json({ dataSource })
  } catch (error) {
    console.error('Error creating data source:', error)
    return NextResponse.json({ error: 'Failed to create data source' }, { status: 500 })
  }
}
