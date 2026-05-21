import { DeveloperDocsContent } from '@/features/marketplace/components/DeveloperDocsContent'
import { getProjectDeveloperSnapshot } from '@/lib/project-developer'

export default async function MarketplaceDeveloperPage() {
  const snapshot = await getProjectDeveloperSnapshot()

  return <DeveloperDocsContent snapshot={snapshot} />
}
