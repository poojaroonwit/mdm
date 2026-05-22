import { ProjectsWorkspace } from '@/components/project-management/ProjectsWorkspace'

export default async function ProjectTicketsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  return <ProjectsWorkspace projectId={projectId} />
}
