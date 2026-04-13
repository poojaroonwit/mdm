import { NextRequest, NextResponse } from 'next/server'
import { JiraService } from '@/lib/jira-service'

// Get Jira issue types for a project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { baseUrl, email, apiToken, projectKey } = body

    if (!baseUrl || !email || !apiToken || !projectKey) {
      return NextResponse.json(
        { error: 'baseUrl, email, apiToken, and projectKey are required' },
        { status: 400 }
      )
    }

    const jiraService = new JiraService({
      baseUrl,
      email,
      apiToken,
      projectKey
    })

    const result = await jiraService.getIssueTypes(projectKey)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to get issue types' },
        { status: 500 }
      )
    }

    const issueTypes = (result.data || []).map((it: any) => ({
      id: it.id,
      name: it.name,
      description: it.description,
      iconUrl: it.iconUrl
    }))

    return NextResponse.json({
      success: true,
      issueTypes
    })
  } catch (error: any) {
    console.error('Error getting Jira issue types:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get issue types' },
      { status: 500 }
    )
  }
}

