'use client'

import { Button } from '@/components/ui/button'
import { ExternalLink, GitBranch, Loader, Trash2 } from 'lucide-react'
import { SearchableSelect } from './SearchableSelect'
import type { GitLabRepository, IntegrationConfig } from './ticket-detail-types'

interface TicketFooterActionsProps {
  isNew: boolean
  ticketId: string
  serviceDeskConfig: IntegrationConfig | null
  pushingToServiceDesk: boolean
  onPushToServiceDesk: () => void
  gitLabConfig: IntegrationConfig | null
  gitLabIssueUrl: string | null
  gitLabRepositories: GitLabRepository[]
  selectedRepository: string
  onSelectedRepositoryChange: (value: string) => void
  loadingRepositories: boolean
  pushingToGitLab: boolean
  onPushToGitLab: () => void
  onDelete?: (ticketId: string) => void
}

export function TicketFooterActions({
  isNew,
  ticketId,
  serviceDeskConfig,
  pushingToServiceDesk,
  onPushToServiceDesk,
  gitLabConfig,
  gitLabIssueUrl,
  gitLabRepositories,
  selectedRepository,
  onSelectedRepositoryChange,
  loadingRepositories,
  pushingToGitLab,
  onPushToGitLab,
  onDelete,
}: TicketFooterActionsProps) {
  if (isNew) return null

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {serviceDeskConfig?.isConfigured && (
        <Button variant="outline" onClick={onPushToServiceDesk} disabled={pushingToServiceDesk}>
          {pushingToServiceDesk ? (
            <Loader className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <ExternalLink className="h-4 w-4 mr-2" />
          )}
          Push to ServiceDesk
        </Button>
      )}

      {gitLabConfig?.isConfigured && (
        <>
          {gitLabRepositories.length > 0 && (
            <SearchableSelect
              value={selectedRepository}
              onValueChange={onSelectedRepositoryChange}
              options={[
                { value: '', label: 'Default Repository' },
                ...gitLabRepositories.map((repo) => ({ value: repo.projectId, label: repo.name })),
              ]}
              placeholder="Repository"
              searchPlaceholder="Search repositories..."
              className="w-48"
            />
          )}
          <Button variant="outline" onClick={onPushToGitLab} disabled={pushingToGitLab || loadingRepositories}>
            {pushingToGitLab ? (
              <Loader className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <GitBranch className="h-4 w-4 mr-2" />
            )}
            {gitLabIssueUrl ? 'Update GitLab Issue' : 'Push to GitLab'}
          </Button>
        </>
      )}

      {gitLabIssueUrl && (
        <Button variant="outline" onClick={() => window.open(gitLabIssueUrl, '_blank')}>
          <ExternalLink className="h-4 w-4 mr-2" />
          View in GitLab
        </Button>
      )}

      {onDelete && (
        <Button variant="destructive" onClick={() => onDelete(ticketId)}>
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      )}
    </div>
  )
}
