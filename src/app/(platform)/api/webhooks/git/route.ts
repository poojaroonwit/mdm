import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import crypto from 'crypto'
import { getGitWebhookSecret } from '@/lib/system-runtime-settings'

export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const signature = headersList.get('x-hub-signature-256') || headersList.get('x-gitlab-token')
    const body = await request.text()

    // Verify webhook signature
    if (!await verifyWebhookSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    const payload = JSON.parse(body)
    const { repository, commits, ref } = payload

    // Process the webhook based on provider
    if (payload.repository?.full_name) {
      // GitHub webhook
      await processGitHubWebhook(payload)
    } else if (payload.project) {
      // GitLab webhook
      await processGitLabWebhook(payload)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing Git webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}

async function verifyWebhookSignature(body: string, signature: string | null): Promise<boolean> {
  if (!signature) return false

  const secret = await getGitWebhookSecret()
  if (!secret) return false

  // GitHub signature verification
  if (signature.startsWith('sha256=')) {
    const expectedSignature = 'sha256=' + crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex')
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))
  }

  // GitLab token verification
  return signature === secret
}

async function processGitHubWebhook(payload: any) {
  const { repository, commits, ref } = payload

  // Check if the push is to the main branch
  if (ref !== 'refs/heads/main' && ref !== 'refs/heads/master') {
    return
  }

  // Process each commit
  for (const commit of commits) {
    const { added, modified, removed } = commit

    // Check if any SQL files were modified
    const sqlFiles = [...added, ...modified, ...removed].filter((file: string) => 
      file.endsWith('.sql') || file.includes('queries/')
    )

    for (const file of sqlFiles) {
      await syncQueryFromGit(repository.full_name, file, commit.id)
    }
  }
}

async function processGitLabWebhook(payload: any) {
  const { project, commits, ref } = payload

  // Check if the push is to the main branch
  if (ref !== 'refs/heads/main' && ref !== 'refs/heads/master') {
    return
  }

  // Process each commit
  for (const commit of commits) {
    const { added, modified, removed } = commit

    // Check if any SQL files were modified
    const sqlFiles = [...added, ...modified, ...removed].filter((file: string) => 
      file.endsWith('.sql') || file.includes('queries/')
    )

    for (const file of sqlFiles) {
      await syncQueryFromGit(project.path_with_namespace, file, commit.id)
    }
  }
}

async function syncQueryFromGit(repository: string, filePath: string, commitId: string) {
  // SQL Query Manager has been removed - this function is no longer needed
  console.log(`Git webhook received for repository: ${repository}, file: ${filePath}, commit: ${commitId}`)
  console.log('SQL Query Manager has been removed - Git sync functionality disabled')
}
