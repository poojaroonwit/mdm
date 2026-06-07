import {
  ShieldCheckIcon,
  CircleStackIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UsersIcon,
  DocumentTextIcon,
  CloudIcon,
  TableCellsIcon,
  CodeBracketIcon,
  ServerIcon,
  KeyIcon,
  ComputerDesktopIcon,
  PaperClipIcon,
  BellIcon,
  SwatchIcon,
  HeartIcon,
  BoltIcon,
  BuildingOfficeIcon,
  BuildingOffice2Icon,
  ChevronRightIcon,
  ChevronDownIcon,
  CpuChipIcon,
  WindowIcon,
  FolderIcon,
  BeakerIcon,
  BookOpenIcon,
  CommandLineIcon,
  CheckCircleIcon,
  DocumentIcon,
  ClockIcon,
  ViewColumnsIcon,
  BuildingStorefrontIcon,
  ShareIcon,
  ChatBubbleLeftIcon
} from '@heroicons/react/24/outline'

import type { InfrastructureInstance } from '@/features/infrastructure/types'

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
  ChevronDown: ChevronDownIcon,
  ChevronRight: ChevronRightIcon
}

export const getPlatformIcon = (name: string) => ICON_MAP[name] || DocumentTextIcon

export interface PlatformMenuItemLike {
  id?: string
  slug?: string
  href?: string | null
}

export interface PlatformMenuGroupLike {
  slug: string
  items?: PlatformMenuItemLike[]
}

const normalizeNavigationPath = (path?: string | null) => {
  if (!path) return ''
  const [withoutQuery] = path.split(/[?#]/)
  const normalized = withoutQuery.replace(/\/+$/, '')
  return normalized || '/'
}

export const isPlatformMenuItemActive = (
  item: PlatformMenuItemLike,
  activeTab: string,
  pathname?: string | null
) => {
  if (item.id === activeTab || item.slug === activeTab) return true

  const currentPath = normalizeNavigationPath(pathname)
  const itemPath = normalizeNavigationPath(item.href)
  if (!currentPath || !itemPath) return false

  return currentPath === itemPath || currentPath.startsWith(`${itemPath}/`)
}

export const getPlatformGroupForPath = (
  groups: PlatformMenuGroupLike[] | undefined,
  pathname?: string | null
) => {
  if (!groups?.length) return null

  return groups.find(group =>
    group.items?.some(item => isPlatformMenuItemActive(item, '', pathname))
  )?.slug || null
}

export interface PlatformSidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  selectedSpace?: string
  onSpaceChange?: (spaceId: string) => void
  collapsed?: boolean
  selectedGroup?: string | null
  onGroupSelect?: (group: string) => void
  mode?: 'primary' | 'secondary'
  onToggleCollapse?: () => void
  searchQuery?: string
  onSearchChange?: (query: string) => void
  selectedVmId?: string | null
  onVmSelect?: (vm: InfrastructureInstance) => void
  onVmPermission?: (vm: InfrastructureInstance) => void
  onVmRemove?: (vm: InfrastructureInstance) => void
  onVmReboot?: (vm: InfrastructureInstance) => void
  onVmEdit?: (vm: InfrastructureInstance) => void
  onVmAccess?: (vm: InfrastructureInstance) => void
  onAddVm?: () => void
}
