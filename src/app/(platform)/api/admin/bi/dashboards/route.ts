import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function GET() {
  try {
    const dashboards = await prisma.space.findMany({
      include: {
        dataModels: {
          include: {
            dataModel: true
          }
        }
      }
    })

    // Mock dashboard data - in a real implementation, this would come from a dashboards table
    const mockDashboards = dashboards.map(space => ({
      id: `dashboard-${space.id}`,
      name: `${space.name} Dashboard`,
      description: `Analytics dashboard for ${space.name}`,
      spaceId: space.id,
      spaceName: space.name,
      isPublic: false,
      widgets: [
        {
          id: 'widget-1',
          type: 'chart',
          title: 'Data Models',
          position: { x: 0, y: 0, w: 6, h: 4 },
          config: { type: 'bar', showGrid: true, showLegend: true },
          dataSource: 'data-models',
          filters: []
        },
        {
          id: 'widget-2',
          type: 'metric',
          title: 'Total Records',
          position: { x: 6, y: 0, w: 6, h: 4 },
          config: { value: 0, format: 'number', color: 'blue' },
          dataSource: 'records',
          filters: []
        }
      ],
      createdAt: space.createdAt,
      updatedAt: space.updatedAt,
      createdBy: space.createdBy
    }))

    return NextResponse.json({ dashboards: mockDashboards })
  } catch (error) {
    console.error('Error fetching dashboards:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboards' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, spaceId, isPublic } = body

    // In a real implementation, this would create a dashboard record
    const dashboard = {
      id: `dashboard-${Date.now()}`,
      name,
      description,
      spaceId,
      spaceName: 'Space Name', // Would be fetched from space
      isPublic: isPublic || false,
      widgets: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current-user-id'
    }

    return NextResponse.json({ dashboard })
  } catch (error) {
    console.error('Error creating dashboard:', error)
    return NextResponse.json({ error: 'Failed to create dashboard' }, { status: 500 })
  }
}
