'use client'

import { useSession, signOut } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { LogOut, User, Bell, CheckCircle, AlertCircle, Info, AlertTriangle, ExternalLink, MoreHorizontal, ChevronDown } from 'lucide-react'
import { Z_INDEX } from '@/lib/z-index'
import { useEffect, useState } from 'react'
import { loadBrandingConfig } from '@/lib/branding'
import { cn } from '@/lib/utils'
import type { BrandingConfig } from '@/app/admin/features/system/types'
import { useNotifications } from '@/contexts/notification-context'
import { Badge } from '@/components/ui/badge'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import { NotificationList } from '@/components/notifications/notification-list'
import { formatDistanceToNow } from 'date-fns'
import type { Notification } from '@/types/notifications'
import { ProfileSettingsModal } from '@/components/settings/ProfileSettingsModal'
import { useSystemSettingsSafe } from '@/contexts/system-settings-context'

interface TopMenuBarProps {
  activeTab: string
  applicationName?: string
  logoUrl?: string
  spaceName?: string
  showSpaceName?: boolean
}

// Get feature name from activeTab
const getFeatureName = (activeTab: string): string => {
  const tabNames: Record<string, string> = {
    'overview': 'Overview',
    'analytics': 'Analytics',
    'bigquery': 'SQL Query',
    'notebook': 'Data Science',
    'ai-analyst': 'Chat with AI',
    'ai-chat-ui': 'Agent Embed GUI',
    'knowledge-base': 'Knowledge Base',
    'marketplace': 'Marketplace',
    'infrastructure': 'Infrastructure',
    'projects': 'Project Management',
    'bi': 'BI & Reports',
    'storage': 'Storage',
    'data-governance': 'Data Governance',
    'users': 'Users',
    'roles': 'Roles',
    'permission-tester': 'Permission Tester',
    'space-layouts': 'Space Layouts',
    'space-settings': 'Space Settings',
    'assets': 'Asset Management',
    'data': 'Data Models',
    'attachments': 'Attachments',
    'kernels': 'Kernel Management',
    'logs': 'Logs',
    'audit': 'Audit Logs',
    'database': 'Database',
    'change-requests': 'Change Requests',
    'sql-linting': 'SQL Linting',
    'schema-migrations': 'Schema Migrations',
    'data-masking': 'Data Masking',
    'cache': 'Cache',
    'backup': 'Backup & Recovery',
    'security': 'Security',
    'performance': 'Performance',
    'settings': 'System Settings',
    'page-templates': 'Page Templates',
    'notifications': 'Notifications',
    'integrations': 'Integrations',
    'api': 'API Management',
    'space-selection': 'Data Management'
  }

  return tabNames[activeTab] || activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace(/([A-Z])/g, ' $1')
}

export function TopMenuBar({ activeTab, applicationName = 'Unified Data Platform', logoUrl, spaceName, showSpaceName = false }: TopMenuBarProps) {
  const { data: session } = useSession()
  const [branding, setBranding] = useState<BrandingConfig | null>(null)
  const [notificationPopoverOpen, setNotificationPopoverOpen] = useState(false)
  const [notificationDrawerOpen, setNotificationDrawerOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)
  const [profilePopoverOpen, setProfilePopoverOpen] = useState(false)
  const { notifications, unreadCount, isLoading, markAsRead } = useNotifications()
  const { settings } = useSystemSettingsSafe()

  useEffect(() => {
    // Load branding config
    loadBrandingConfig().then((config) => {
      if (config) {
        setBranding(config)
      }
    })
  }, [])

  // Use branding config if available, then system settings, then props
  const displayName = branding?.applicationName || settings.siteName || applicationName
  const displayLogo = branding?.applicationLogo || settings.logoUrl || logoUrl

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' })
  }

  const featureName = getFeatureName(activeTab)
  const userName = (session as any)?.user?.name || 'User'
  const userEmail = (session as any)?.user?.email || ''
  const userImage = (session as any)?.user?.image || (session as any)?.user?.avatar || ''
  const userInitial = userName?.charAt(0) || userEmail?.charAt(0) || 'U'
  const userId = (session as any)?.user?.id || (session as any)?.user?.email || ''
  const userRole = (session as any)?.user?.role || 'User'

  // Construct user object for ProfileSettingsModal
  const user = {
    id: userId,
    email: userEmail,
    name: userName,
    role: userRole
  }

  // Get notification icon helper
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'ERROR':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  // Handle notification click
  const handleNotificationClick = async (notification: Notification) => {
    if (notification.status === 'UNREAD') {
      await markAsRead(notification.id)
    }
    if (notification.action_url) {
      window.open(notification.action_url, '_blank')
    }
    setNotificationPopoverOpen(false)
  }

  // Get recent notifications (first 5)
  const recentNotifications = notifications.slice(0, 5)

  // Derive header background/text – prefer explicit brand colours from branding config,
  // fall back to CSS-variable-based defaults so the bar is always opaque.
  const headerBg = (branding?.topMenuBackgroundColor &&
    !branding.topMenuBackgroundColor.includes('var(--brand-top-menu-bg)'))
    ? branding.topMenuBackgroundColor
    : 'var(--brand-top-menu-bg, hsl(var(--background)))'

  const headerColor = (branding?.topMenuTextColor &&
    !branding.topMenuTextColor.includes('var(--brand-top-menu-text)'))
    ? branding.topMenuTextColor
    : 'var(--brand-top-menu-text, hsl(var(--foreground)))'

  return (
    <header
      className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-zinc-100/60 dark:border-zinc-800/60 px-4 backdrop-blur-md transition-all duration-300"
      data-component="top-menu-bar"
      style={{
        zIndex: Z_INDEX.navigation,
        backgroundColor: headerBg.includes('var(--background)') ? 'transparent' : headerBg,
        color: headerColor,
      }}
    >
      {/* Left Section: Logo + Application Name + Feature */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Logo */}
        {displayLogo ? (
          <div className="relative group cursor-pointer">
            <div className="absolute -inset-1 bg-gradient-to-r from-zinc-200 to-zinc-100 dark:from-zinc-800 dark:to-zinc-900 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <img
              src={displayLogo}
              alt={displayName}
              className="relative h-6 w-6 object-contain flex-shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          </div>
        ) : (
          <div className="h-7 w-7 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center flex-shrink-0 shadow-lg">
            <span className="text-white dark:text-zinc-900 text-[10px] font-black uppercase">
              {displayName.charAt(0)}
            </span>
          </div>
        )}

        {/* Space Name or Application Name */}
        {showSpaceName && spaceName ? (
          <div className="flex flex-col min-w-0 ml-1">
            <span className="font-black text-xs uppercase tracking-widest text-zinc-900 dark:text-white whitespace-nowrap leading-none">
              {spaceName}
            </span>
            <span className="text-[9px] font-medium uppercase tracking-[0.1em] text-zinc-400 dark:text-zinc-500 whitespace-nowrap leading-none mt-1">
              {displayName}
            </span>
          </div>
        ) : displayName && (
          <div className="flex items-center gap-2 ml-1">
            <span className="font-black text-xs uppercase tracking-widest text-zinc-900 dark:text-white whitespace-nowrap">
              {displayName}
            </span>

            {!showSpaceName && (
              <>
                <span className="text-zinc-300 dark:text-zinc-700 select-none">/</span>

                {/* Selected Feature */}
                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500 truncate">
                  {featureName}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right Section: Notifications and User Avatar */}
      <div className="flex items-center gap-2">
        {/* Notification Bell with Popover */}
        <Popover open={notificationPopoverOpen} onOpenChange={setNotificationPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100/60 dark:border-zinc-800/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-95 group"
              title="Notifications"
            >
              <Bell className="h-4 w-4 text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors" />
              {notifications.length > 0 && unreadCount > 0 && (
                <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-zinc-950 dark:bg-white border border-white dark:border-zinc-950 animate-pulse" />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0" align="end">
            <div className="flex flex-col max-h-[600px]">
              {/* Header */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {unreadCount} unread
                    </Badge>
                  )}
                </div>
              </div>

              {/* Notification List */}
              <div className="overflow-y-auto max-h-[500px]">
                {isLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
                  </div>
                ) : recentNotifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Bell className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {recentNotifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={cn(
                          "p-4 cursor-pointer transition-colors hover:bg-muted/50",
                          notification.status === 'UNREAD' && "bg-muted/30"
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h4 className={cn(
                                "text-sm font-medium truncate",
                                notification.status === 'UNREAD' && "font-semibold"
                              )}>
                                {notification.title}
                              </h4>
                              {notification.status === 'UNREAD' && (
                                <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1.5"></div>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </span>
                              {notification.action_url && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 px-2 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    window.open(notification.action_url, '_blank')
                                  }}
                                >
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  {notification.action_label || 'View'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer with Show More button */}
              {notifications.length > 0 && (
                <div className="p-3 border-t border-border">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setNotificationPopoverOpen(false)
                      setNotificationDrawerOpen(true)
                    }}
                  >
                    <MoreHorizontal className="h-4 w-4 mr-2" />
                    {notifications.length > 5
                      ? `Show More (${notifications.length - 5} more)`
                      : 'View All Notifications'
                    }
                  </Button>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        {/* Notification Drawer */}
        <Drawer open={notificationDrawerOpen} onOpenChange={setNotificationDrawerOpen}>
          <DrawerContent className="w-[600px] max-w-[90vw]">
            <DrawerHeader>
              <DrawerTitle>All Notifications</DrawerTitle>
              <DrawerDescription>
                {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All notifications'}
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4 overflow-y-auto max-h-[calc(100vh-120px)]">
              <NotificationList showActions={true} maxHeight="none" />
            </div>
          </DrawerContent>
        </Drawer>

        {/* User Avatar with Popover */}
        <Popover open={profilePopoverOpen} onOpenChange={setProfilePopoverOpen}>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-3 p-1 rounded-xl hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-all duration-300 group outline-none ml-2 border border-transparent hover:border-zinc-100 dark:hover:border-zinc-800">
              <div className="h-8 w-8 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-zinc-900 font-black text-xs shadow-sm group-hover:shadow-md transition-all duration-300 overflow-hidden">
                {userImage ? (
                  <img src={userImage} alt={userName} className="h-full w-full object-cover" />
                ) : userInitial}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-[11px] font-black text-zinc-900 dark:text-white leading-none uppercase tracking-wider">
                  {userName}
                </p>
                <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase mt-1 tracking-[0.2em]">
                  {userRole}
                </p>
              </div>
              <ChevronDown className="h-3 w-3 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors duration-300" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 mt-2 rounded-xl border border-zinc-100/60 dark:border-zinc-800/60 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-2xl p-0 overflow-hidden" align="end">
            <div className="px-5 py-4 border-b border-border/50">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1">Signed in as</p>
              <p className="text-sm font-semibold truncate mt-1">{userEmail}</p>
            </div>

            <div className="p-2">
              <Button
                variant="ghost"
                className="w-full justify-start font-medium h-11 px-4 rounded-xl hover:bg-muted/50 transition-colors"
                onClick={() => {
                  setProfilePopoverOpen(false)
                  setProfileModalOpen(true)
                }}
              >
                <User className="mr-3 h-4 w-4 text-muted-foreground" />
                <span>Account Settings</span>
              </Button>
            </div>

            <div className="p-2 border-t border-border/50">
              <Button
                variant="ghost"
                className="w-full justify-start font-semibold h-11 px-4 text-destructive rounded-xl hover:bg-destructive/10 transition-colors"
                onClick={handleSignOut}
              >
                <LogOut className="mr-3 h-4 w-4" />
                <span>Sign Out</span>
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Profile Settings Modal */}
        <ProfileSettingsModal
          open={profileModalOpen}
          onOpenChange={setProfileModalOpen}
          user={user}
        />
      </div>
    </header>
  )
}

