
import { PluginDefinition } from '@/features/marketplace/types'

export const knowledgeBasePlugin: PluginDefinition = {
  id: 'knowledge-base',
  name: 'Knowledge Base',
  slug: 'knowledge-base',
  description: 'Manage team knowledge with documents, collections, search, and an Obsidian-style knowledge graph.',
  version: '1.0.0',
  provider: 'Platform',
  category: 'business-intelligence',
  status: 'approved',
  verified: true,
  iconUrl: '/icons/knowledge-base.svg',
  capabilities: {
    documents: true,
    collections: true,
    search: true,
    graph: true,
    wikiLinks: true,
  },
  uiType: 'react_component',
  uiConfig: {
    componentPath: '@plugins/knowledge-base/src/components/OutlineKnowledgeBase',
  },
  navigation: {
    group: 'overview',
    label: 'Knowledge Base',
    icon: 'BookOpen',
    href: '/knowledge',
    priority: 10,
  },
  installationCount: 0,
  reviewCount: 0,
}
