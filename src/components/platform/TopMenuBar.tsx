'use client'

import { useSession, signOut } from 'next-auth/react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover'
import { LogOut, User, Bell, CheckCircle, AlertCircle, Info, AlertTriangle, ExternalLink, MoreHorizontal, ChevronDown, Settings } from 'lucide-react'
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
        return <Info className="h-4 w-4 text-zinc-500" />
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
      className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-sidebar-border px-4 lg:px-8 backdrop-blur-xl transition-all duration-300 shrink-0"
      data-component="top-menu-bar"
      style={{
        zIndex: Z_INDEX.navigation,
        backgroundColor: 'var(--bg-default-60)', // 60% opacity for blur effect
        color: 'var(--text-primary)',
      }}
    >
      {/* Left Section: Logo + Divider + Feature */}
      <div className="flex items-center space-x-6 min-w-0">
        {/* Brand Logo */}
        <div className="flex items-center group">
          {displayLogo ? (
            <img
              src={displayLogo}
              alt={displayName}
              className="w-9 h-9 flex-shrink-0 mr-4 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none'
              }}
            />
          ) : (
            <div className="bg-gradient-to-br from-[var(--primary-light)] to-[var(--primary-blue)]  text-primary-foreground  w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-white text-sm shadow-lg mr-4 group-hover:bg-zinc-800 transition-all duration-300 overflow-hidden ">
              <span>{displayName.substring(0, 1).toUpperCase()}</span>
            </div>
          )}
          
          <div className="hidden md:block overflow-hidden whitespace-nowrap">
            <h1 className="font-bold text-zinc-900 dark:text-white tracking-tight text-xl leading-none mb-0.5">
              {displayName}
            </h1>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium uppercase tracking-widest leading-none">
              {showSpaceName && spaceName ? spaceName : 'Platform'}
            </p>
          </div>
        </div>

        {!showSpaceName && (
          <div className="hidden sm:flex items-center">
            {/* Vertical Divider */}
            <div className="hidden lg:block h-8 w-px bg-gradient-to-b from-transparent via-sidebar-border to-transparent mx-6" />

            {/* Page Title */}
            <h2 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">{featureName}</h2>
          </div>
        )}
      </div>

      {/* Right Section: Notifications and User Avatar */}
      <div className="flex items-center space-x-4 md:space-x-6">
        {/* Notification Bell with Popover */}
        <Popover open={notificationPopoverOpen} onOpenChange={setNotificationPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              className="relative p-2.5 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-all duration-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl group"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
              {notifications.length > 0 && unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-zinc-900 animate-pulse" />
              )}
            </button>
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
            <button className="flex items-center space-x-3 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all duration-200 group outline-none">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--primary-light)] to-[var(--primary-blue)]  text-primary-foreground  flex items-center justify-center text-white dark:text-zinc-900 font-bold text-sm shadow-lg group-hover:bg-zinc-800 transition-all duration-300 overflow-hidden">
                {userImage ? (
                  <img src={userImage} alt={userName} className="h-full w-full object-cover" />
                ) : userInitial}
              </div>
              <div className="hidden sm:block text-left pr-3">
                <p className="text-sm font-semibold text-zinc-900 dark:text-white leading-none capitalize">
                  {userName}
                </p>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-medium uppercase mt-0.5 tracking-wider">
                  {userRole}
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors duration-200" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 mt-2 origin-top-right divide-y divide-zinc-100 dark:divide-zinc-800 rounded-2xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl ring-1 ring-black/5 dark:ring-white/5 focus:outline-none z-50 border border-zinc-200 dark:border-zinc-800 p-0 overflow-hidden" align="end">
            <div className="px-5 py-4">
              <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest mb-1">Signed in as</p>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate mt-1">{userEmail}</p>
            </div>

            <div className="p-3 space-y-1">
              <Button
                variant="ghost"
                className="flex w-full justify-start items-center px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 rounded-xl transition-all duration-200 hover:bg-zinc-50/80 dark:hover:bg-zinc-800/80 h-11"
                onClick={() => {
                  setProfilePopoverOpen(false)
                  setProfileModalOpen(true)
                }}
              >
                <Settings className="w-4 h-4 mr-3 text-zinc-400" />
                <span>Account Settings</span>
              </Button>
            </div>

            <div className="p-3">
              <Button
                variant="ghost"
                className="flex w-full justify-start items-center px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-200 bg-transparent text-zinc-700 dark:text-zinc-300 hover:bg-red-50/80 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 h-11"
                onClick={handleSignOut}
              >
                <LogOut className="w-4 h-4 mr-3 text-red-500" />
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

