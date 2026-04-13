import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: spaceId } = await params

    // Get space information
    const space = await prisma.space.findUnique({
      where: { id: spaceId },
      include: {
        dataModels: {
          include: {
            dataModel: {
              include: {
                dataRecords: true
              }
            }
          }
        }
      }
    })

    if (!space) {
      return NextResponse.json({ error: 'Space not found' }, { status: 404 })
    }

    // Mock dashboard data - in a real implementation, this would come from a dashboards table
    const dashboard = {
      id: `dashboard-${spaceId}`,
      name: `${space.name} Dashboard`,
      description: `Analytics dashboard for ${space.name}`,
      widgets: [
        {
          id: 'widget-1',
          type: 'chart',
          title: 'Data Models Growth',
          position: { x: 0, y: 0, w: 6, h: 4 },
          config: { 
            type: 'line', 
            showGrid: true, 
            showLegend: true,
            data: [
              { name: 'Jan', value: space.dataModels.length * 2 },
              { name: 'Feb', value: space.dataModels.length * 3 },
              { name: 'Mar', value: space.dataModels.length * 4 },
              { name: 'Apr', value: space.dataModels.length * 5 },
              { name: 'May', value: space.dataModels.length * 6 },
              { name: 'Jun', value: space.dataModels.length * 7 }
            ]
          },
          dataSource: 'data-models',
          filters: []
        },
        {
          id: 'widget-2',
          type: 'metric',
          title: 'Total Data Models',
          position: { x: 6, y: 0, w: 6, h: 4 },
          config: { 
            value: space.dataModels.length, 
            format: 'number', 
            color: 'blue' 
          },
          dataSource: 'data-models',
          filters: []
        },
        {
          id: 'widget-3',
          type: 'chart',
          title: 'Records Distribution',
          position: { x: 0, y: 4, w: 12, h: 4 },
          config: { 
            type: 'bar', 
            showGrid: true, 
            showLegend: true,
            data: space.dataModels.map(dm => ({
              name: dm.dataModel.name,
              value: dm.dataModel.dataRecords.length
            }))
          },
          dataSource: 'records',
          filters: []
        }
      ],
      isPublic: false,
      createdAt: space.createdAt,
      updatedAt: space.updatedAt
    }

    return NextResponse.json({ dashboard })
  } catch (error) {
    console.error('Error fetching space dashboard:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: spaceId } = await params
    const body = await request.json()
    const { widgets } = body

    // In a real implementation, this would update the dashboard in the database
    const updatedDashboard = {
      id: `dashboard-${spaceId}`,
      widgets,
      updatedAt: new Date()
    }

    return NextResponse.json({ dashboard: updatedDashboard })
  } catch (error) {
    console.error('Error updating space dashboard:', error)
    return NextResponse.json({ error: 'Failed to update dashboard' }, { status: 500 })
  }
}
