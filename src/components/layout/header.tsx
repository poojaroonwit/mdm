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
    <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-zinc-100/60 dark:border-zinc-800/60 bg-white/40 dark:bg-zinc-950/20 px-6 backdrop-blur-xl transition-all duration-300">
      <div className="flex items-center space-x-4">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors duration-200" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 w-80 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 pl-10 pr-4 text-sm transition-all duration-300 focus:bg-white dark:focus:bg-zinc-900 focus:ring-4 focus:ring-zinc-500/10 outline-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 text-zinc-900 dark:text-zinc-100 font-medium"
          />
        </div>
      </div>

      <div className="flex items-center space-x-6">
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center space-x-3 p-1.5 rounded-xl hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-all duration-300 group outline-none">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950 dark:from-zinc-100 dark:to-zinc-300 flex items-center justify-center text-white dark:text-zinc-900 font-black text-xs shadow-sm shadow-zinc-900/10 group-hover:shadow-md transition-all duration-300">
                {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:block text-left pr-1">
                <p className="text-xs font-black text-zinc-900 dark:text-zinc-100 leading-none tracking-tight">
                  {user.name || 'User'}
                </p>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase mt-1 tracking-[0.2em]">
                  {user.role}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-zinc-400 group-hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors duration-200" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-72 mt-2 rounded-[24px] border-zinc-100/60 dark:border-zinc-800/60 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl p-0 shadow-2xl shadow-zinc-900/10" align="end">
            <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800/60">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1.5">Signed in as</p>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{user.email}</p>
            </div>

            <div className="p-2">
              <DropdownMenuItem
                className="flex items-center px-4 py-3 text-sm font-bold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer transition-all duration-200 text-zinc-700 dark:text-zinc-300"
                onSelect={(e) => {
                  e.preventDefault()
                  setShowProfileModal(true)
                }}
              >
                <UserIcon className="mr-3 h-4 w-4 text-zinc-400" />
                <span>Account Settings</span>
              </DropdownMenuItem>
            </div>

            <div className="p-5 border-t border-zinc-100 dark:border-zinc-800/60">
              <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Appearance</p>
              <div className="grid grid-cols-3 gap-2 bg-zinc-50/50 dark:bg-zinc-800/30 p-1.5 rounded-2xl border border-zinc-100/60 dark:border-zinc-800/60">
                {[
                  { id: 'light', icon: Sun, label: 'Light' },
                  { id: 'dark', icon: Moon, label: 'Dark' },
                  { id: 'system', icon: Monitor, label: 'System' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTheme(t.id)}
                    className={`
                      flex flex-col items-center justify-center py-2.5 rounded-xl transition-all duration-300
                      ${theme === t.id 
                        ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-600' 
                        : 'text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200'
                      }
                    `}
                  >
                    <t.icon className="h-4 w-4 mb-2 stroke-[2.5]" />
                    <span className="text-[10px] font-black uppercase tracking-wider">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-2 border-t border-zinc-100 dark:border-zinc-800/60">
              <DropdownMenuItem 
                className="flex items-center px-4 py-3 text-sm font-black text-red-500 dark:text-red-400 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 cursor-pointer transition-all duration-200"
                onClick={handleSignOut}
              >
                <LogOut className="mr-3 h-4 w-4" />
                <span className="uppercase tracking-widest text-[11px]">Sign Out</span>
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