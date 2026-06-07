import type { JiraConfig, JiraResponse } from './types'

type ExecuteFetch = (url: string, options: RequestInit) => Promise<Response>

export async function getProjects(
  config: JiraConfig,
  authHeader: string,
  executeFetch: ExecuteFetch
): Promise<JiraResponse> {
  try {
    const response = await executeFetch(`${config.baseUrl}/rest/api/3/project`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
    })

    if (response.ok) {
      return { success: true, data: await response.json() }
    }

    const errorText = await response.text()
    return { success: false, error: `Failed to get projects: ${response.status} ${errorText}` }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get projects',
    }
  }
}

export async function getIssueTypes(
  config: JiraConfig,
  authHeader: string,
  executeFetch: ExecuteFetch,
  projectKey?: string
): Promise<JiraResponse> {
  try {
    const project = projectKey || config.projectKey
    if (!project) {
      return { success: false, error: 'Project key is required' }
    }

    const response = await executeFetch(`${config.baseUrl}/rest/api/3/project/${project}`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
        Accept: 'application/json',
      },
    })

    if (response.ok) {
      const projectData = await response.json()
      return { success: true, data: projectData.issueTypes || [] }
    }

    const errorText = await response.text()
    return { success: false, error: `Failed to get issue types: ${response.status} ${errorText}` }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get issue types',
    }
  }
}
