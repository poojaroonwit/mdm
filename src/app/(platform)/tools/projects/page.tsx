'use client'

import { TicketsList } from '@plugins/project-management/src/tickets'

export default function ProjectsPage() {
  return (
    <div className="h-full min-h-0">
      <TicketsList 
        spaceId={null}
        viewMode="kanban"
        showFilters={true}
        showSpaceSelector={true}
      />
    </div>
  )
}

