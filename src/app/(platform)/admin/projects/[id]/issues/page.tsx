import { TicketsList } from '@plugins/project-management/src/tickets/components/TicketsList'

interface PageProps {
    params: Promise<{
        id: string
    }>
}

export default async function ProjectIssuesPage({ params }: PageProps) {
    const { id } = await params
    return (
        <div className="p-6">
            <TicketsList projectId={id} viewMode="kanban" showSpaceSelector={false} showFilters={true} />
        </div>
    )
}
