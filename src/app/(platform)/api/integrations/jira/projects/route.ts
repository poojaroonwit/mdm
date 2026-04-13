import { NextRequest, NextResponse } from 'next/server'
import { JiraService } from '@/lib/jira-service'

// Get Jira projects (for UI)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { baseUrl, email, apiToken } = body

    if (!baseUrl || !email || !apiToken) {
      return NextResponse.json(
        { error: 'baseUrl, email, and apiToken are required' },
        { status: 400 }
      )
    }

    const jiraService = new JiraService({
      baseUrl,
      email,
      apiToken
    })

    const result = await jiraService.getProjects()

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to get projects' },
        { status: 500 }
      )
    }

    const projects = (result.data || []).map((project: any) => ({
      id: project.id,
      key: project.key,
      name: project.name,
      description: project.description,
      avatarUrls: project.avatarUrls
    }))

    return NextResponse.json({
      success: true,
      projects
    })
  } catch (error: any) {
    console.error('Error getting Jira projects:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get projects' },
      { status: 500 }
    )
  }
}

