'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Bell, Search, Settings, LogOut, User as UserIcon, Moon, Sun, Monitor, ChevronDown } from 'lucide-react'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { ProfileSettingsModal } from '@/components/settings/ProfileSettingsModal'

interface HeaderProps {
  user: {
    id: string
    email: string
    name: string
    role: string
  }
}

export function Header({ user }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showProfileModal, setShowProfileModal] = useState(false)
  const router = useRouter()
  const { theme, setTheme } = useTheme()

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/auth/signin' })
  }

  return (
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-border/50 glass px-6 backdrop-blur-xl">
      <div className="flex items-center space-x-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-80 rounded-xl border border-border/50 bg-background/50 pl-10 pr-4 text-sm transition-all duration-200 focus:bg-background focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center space-x-3 p-1 rounded-full hover:bg-muted/50 transition-all duration-200 group outline-none">
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-blue-600/25 group-hover:shadow-blue-600/40 transition-all duration-300">
                {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block text-left pr-1">
                <p className="text-xs font-semibold text-foreground leading-none">
                  {user.name || 'User'}
                </p>
                <p className="text-[10px] text-muted-foreground font-medium uppercase mt-0.5 tracking-wider">
                  {user.role}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-72 mt-2 rounded-2xl border-border/50 glass p-0" align="end">
            <div className="px-5 py-4 border-b border-border/50">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest mb-1">Signed in as</p>
              <p className="text-sm font-semibold truncate mt-1">{user.email}</p>
            </div>

            <div className="p-2">
              <DropdownMenuItem
                className="flex items-center px-4 py-3 text-sm font-medium rounded-xl hover:bg-muted/50 cursor-pointer transition-colors"
                onSelect={(e) => {
                  e.preventDefault()
                  setShowProfileModal(true)
                }}
              >
                <UserIcon className="mr-3 h-4 w-4 text-muted-foreground" />
                <span>Account Settings</span>
              </DropdownMenuItem>
            </div>

            <div className="p-4 border-t border-border/50">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3">Appearance</p>
              <div className="grid grid-cols-3 gap-2 bg-muted/30 p-1.5 rounded-xl border border-border/50">
                {[
                  { id: 'light', icon: Sun, label: 'Light' },
                  { id: 'dark', icon: Moon, label: 'Dark' },
                  { id: 'system', icon: Monitor, label: 'System' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`
                      flex flex-col items-center justify-center py-2.5 rounded-lg transition-all duration-200
                      ${theme === t.id 
                        ? 'bg-background text-primary shadow-sm ring-1 ring-primary/20' 
                        : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                      }
                    `}
                  >
                    <t.icon className="h-4 w-4 mb-1" />
                    <span className="text-[9px] font-bold">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-2 border-t border-border/50">
              <DropdownMenuItem 
                className="flex items-center px-4 py-3 text-sm font-semibold text-destructive rounded-xl hover:bg-destructive/10 cursor-pointer transition-colors"
                onClick={handleSignOut}
              >
                <LogOut className="mr-3 h-4 w-4" />
                <span>Sign Out</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ProfileSettingsModal
        open={showProfileModal}
        onOpenChange={setShowProfileModal}
        user={user}
      />
    </header>
  )
}