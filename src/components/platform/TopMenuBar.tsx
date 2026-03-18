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
      className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-border px-4"
      data-component="top-menu-bar"
      style={{
        zIndex: Z_INDEX.navigation,
        backgroundColor: headerBg,
        color: headerColor,
      }}
    >
      {/* Left Section: Logo + Application Name + Feature */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Logo */}
        {displayLogo ? (
          <img
            src={displayLogo}
            alt={displayName}
            className="h-5 w-5 object-contain flex-shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none'
            }}
          />
        ) : (
          <div className="h-6 w-6 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
            <span className="text-primary-foreground text-[10px] font-bold">
              {displayName.charAt(0)}
            </span>
          </div>
        )}

        {/* Space Name or Application Name */}
        {showSpaceName && spaceName ? (
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-sm whitespace-nowrap leading-none">
              {spaceName}
            </span>
            <span className="text-xs whitespace-nowrap leading-none mt-0.5 opacity-60">
              {displayName}
            </span>
          </div>
        ) : displayName && (
          <>
            <span className="font-semibold text-sm whitespace-nowrap">
              {displayName}
            </span>

            {!showSpaceName && (
              <>
                <span className="text-sm opacity-30 select-none">/</span>

                {/* Selected Feature */}
                <span className="text-sm truncate opacity-70">
                  {featureName}
                </span>
              </>
            )}
          </>
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
              className="relative h-9 w-9"
              title="Notifications"
            >
              <Bell className="h-4 w-4" />
              {notifications.length > 0 && unreadCount > 0 && (
                <Badge
                  className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px] bg-red-500 text-white border-2 border-background"
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </Badge>
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
            <button className="flex items-center space-x-3 p-1 rounded-full hover:bg-muted/50 transition-all duration-200 group outline-none ml-2">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-600/25 group-hover:shadow-blue-600/40 transition-all duration-300 overflow-hidden">
                {userImage ? (
                  <img src={userImage} alt={userName} className="h-full w-full object-cover" />
                ) : userInitial}
              </div>
              <div className="hidden sm:block text-left pr-1">
                <p className="text-xs font-semibold text-foreground leading-none">
                  {userName}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase mt-0.5 tracking-wider">
                  {userRole}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 mt-2 rounded-2xl border-border/50 glass p-0" align="end">
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

