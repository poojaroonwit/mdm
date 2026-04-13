import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Mock reports data
    const reports = [
      {
        id: 'report-1',
        name: 'Monthly Performance Report',
        description: 'Comprehensive performance analysis for the month',
        spaceId: 'space-1',
        spaceName: 'Sales Team',
        type: 'scheduled',
        schedule: '0 9 1 * *', // First day of every month at 9 AM
        format: 'pdf',
        recipients: ['admin@company.com', 'manager@company.com'],
        isActive: true,
        lastRun: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        nextRun: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        createdBy: 'user-1'
      },
      {
        id: 'report-2',
        name: 'Weekly User Activity',
        description: 'Weekly user engagement and activity metrics',
        spaceId: 'space-2',
        spaceName: 'Marketing Team',
        type: 'scheduled',
        schedule: '0 8 * * 1', // Every Monday at 8 AM
        format: 'excel',
        recipients: ['marketing@company.com'],
        isActive: true,
        lastRun: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        nextRun: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000), // 4 days from now
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        createdBy: 'user-2'
      },
      {
        id: 'report-3',
        name: 'Data Quality Report',
        description: 'Data quality and integrity analysis',
        spaceId: 'space-1',
        spaceName: 'Sales Team',
        type: 'on_demand',
        format: 'csv',
        recipients: ['data-team@company.com'],
        isActive: false,
        lastRun: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        nextRun: undefined,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        createdBy: 'user-1'
      }
    ]

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('Error fetching reports:', error)
    return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, spaceId, type, schedule, format, recipients } = body

    const report = {
      id: `report-${Date.now()}`,
      name,
      description,
      spaceId,
      spaceName: 'Space Name', // Would be fetched from space
      type,
      schedule: type === 'scheduled' ? schedule : undefined,
      format,
      recipients: Array.isArray(recipients) ? recipients : recipients.split(',').map((email: string) => email.trim()),
      isActive: true,
      lastRun: undefined,
      nextRun: type === 'scheduled' ? new Date(Date.now() + 24 * 60 * 60 * 1000) : undefined,
      createdAt: new Date(),
      createdBy: 'current-user-id'
    }

    return NextResponse.json({ report })
  } catch (error) {
    console.error('Error creating report:', error)
    return NextResponse.json({ error: 'Failed to create report' }, { status: 500 })
  }
}
