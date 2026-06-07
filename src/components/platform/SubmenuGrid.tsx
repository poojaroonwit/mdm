'use client'

import { useMenuConfig } from '@/hooks/useMenuConfig'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { 
  ComputerDesktopIcon,
  UsersIcon,
  BuildingOfficeIcon,
  BuildingOffice2Icon,
  CodeBracketIcon,
  DocumentTextIcon,
  ChatBubbleLeftIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  ChartBarIcon,
  CloudIcon,
  KeyIcon,
  CircleStackIcon,
  CommandLineIcon,
  CheckCircleIcon,
  DocumentIcon,
  BoltIcon,
  ServerIcon,
  ViewColumnsIcon,
  ShareIcon,
  ClockIcon,
  SwatchIcon,
  BeakerIcon,
  CpuChipIcon,
  BuildingStorefrontIcon,
  FolderIcon,
  WindowIcon,
  BookOpenIcon,
  TableCellsIcon,
  PaperClipIcon,
  BellIcon,
  HeartIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline'
import { cn } from '@/lib/utils'

// Icon mapping (same as PlatformSidebar)
const ICON_MAP: Record<string, any> = {
  Monitor: ComputerDesktopIcon,
  Users: UsersIcon,
  Building: BuildingOfficeIcon,
  Building2: BuildingOffice2Icon,
  Code: CodeBracketIcon,
  FileText: DocumentTextIcon,
  MessageCircle: ChatBubbleLeftIcon,
  Settings: Cog6ToothIcon,
  Shield: ShieldCheckIcon,
  Activity: ChartBarIcon,
  Cloud: CloudIcon,
  Key: KeyIcon,
  FileTextIcon: DocumentTextIcon,
  DatabaseIcon: CircleStackIcon,
  Database: CircleStackIcon,
  GitBranch: CommandLineIcon,
  CheckCircle2: CheckCircleIcon,
  FileCode: DocumentIcon,
  ShieldCheck: ShieldCheckIcon,
  Zap: BoltIcon,
  HardDrive: ServerIcon,
  BarChart3: ChartBarIcon,
  Kanban: ViewColumnsIcon,
  Network: ShareIcon,
  History: ClockIcon,
  Palette: SwatchIcon,
  FlaskConical: BeakerIcon,
  Bot: CpuChipIcon,
  Store: BuildingStorefrontIcon,
  FolderKanban: FolderIcon,
  Layout: WindowIcon,
  BookOpen: BookOpenIcon,
  Table: TableCellsIcon,
  Server: ServerIcon,
  Paperclip: PaperClipIcon,
  Bell: BellIcon,
  Heart: HeartIcon,
}

const getIcon = (name: string) => ICON_MAP[name] || DocumentTextIcon

const SYSTEM_GRID_DESCRIPTIONS: Record<string, string> = {
  users: 'Manage user accounts, invitations, and platform access.',
  roles: 'Define roles, permission sets, and access boundaries.',
  'permission-tester': 'Test role and user permissions before changes go live.',
  'change-requests': 'Review, approve, and track governed change workflows.',
  settings: 'Configure global platform identity, appearance, and defaults.',
  audit: 'Review security audit trails and user activity history.',
  security: 'Manage sign-in protections and platform security controls.',
  notifications: 'Configure notification templates, channels, and delivery rules.',
  themes: 'Customize visual themes and shared interface styling.',
  integrations: 'Connect external services, SSO, email, and platform integrations.',
  'page-templates': 'Manage reusable page templates for spaces and content.',
  'space-layouts': 'Configure reusable layouts for space experiences.',
  api: 'Manage API access, keys, and developer-facing settings.',
  performance: 'Inspect platform performance and operational health.',
}

const getItemDescription = (
  item: { slug: string; name: string; description?: string },
  groupSlug: string
) => {
  if (item.description) return item.description
  if (groupSlug === 'system') {
    return SYSTEM_GRID_DESCRIPTIONS[item.slug] || `Configure ${item.name.toLowerCase()} for the platform.`
  }
  return ''
}

interface SubmenuGridProps {
  groupId: string
}

export function SubmenuGrid({ groupId }: SubmenuGridProps) {
  const { menuConfig, loading } = useMenuConfig()
  const router = useRouter()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const group = menuConfig?.groups.find(g => g.slug === groupId)
  
  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-muted-foreground">
        <ServerIcon className="h-12 w-12 mb-4 opacity-20" />
        <p>Group not found</p>
      </div>
    )
  }

  // Group items by section
  const sections: Record<string, any[]> = {}
  group.items.forEach(item => {
    const sectionName = item.section || 'General'
    if (!sections[sectionName]) {
      sections[sectionName] = []
    }
    sections[sectionName].push(item)
  })

  // Sort sections if needed (General first usually)
  const sortedSections = Object.entries(sections).sort(([a], [b]) => {
    if (a === 'General') return -1
    if (b === 'General') return 1
    return a.localeCompare(b)
  })

  return (
    <div className="p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2 flex items-center gap-3">
          {(() => {
            const Icon = getIcon(group.icon)
            return <Icon className="h-8 w-8 text-primary" />
          })()}
          {group.name}
        </h1>
        <p className="text-muted-foreground text-lg">
          Select a module to manage {group.name.toLowerCase()} resources
        </p>
      </div>

      <div className="space-y-10">
        {sortedSections.map(([sectionName, items]) => (
          <div key={sectionName}>
            <h2 className="text-lg font-semibold mb-4 text-muted-foreground uppercase tracking-wider text-xs">
              {sectionName}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((item) => {
                const Icon = getIcon(item.icon)
                const description = getItemDescription(item, group.slug)
                return (
                  <Card 
                    key={item.id}
                    className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-border/50 hover:border-primary/50 hover:bg-muted/30"
                    onClick={() => router.push(item.href || `/${item.slug}`)}
                  >
                    <CardHeader className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="p-2 rounded-lg bg-primary/5 text-primary group-hover:bg-primary/10 transition-colors">
                          <Icon className="h-6 w-6" />
                        </div>
                        <ChevronRightIcon className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                      </div>
                      <CardTitle className="mt-4 text-lg font-medium group-hover:text-primary transition-colors">
                        {item.name}
                      </CardTitle>
                      {description && (
                         <CardDescription className="line-clamp-2 mt-2">
                           {description}
                         </CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
