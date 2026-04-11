'use client'

import React from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Sidebar } from './sidebar'
import { Header } from './header'

interface MainLayoutProps {
  children: React.ReactNode
  contentClassName?: string
}

export function MainLayout({ children, contentClassName }: MainLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-zinc-900 dark:border-zinc-100"></div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-6 text-center space-y-4">
        <h2 className="text-2xl font-bold">Session Expired</h2>
        <p className="text-muted-foreground">Please sign in to access your data.</p>
        <button 
          onClick={() => router.push('/auth/signin')}
          className="rounded-lg bg-zinc-900 dark:bg-zinc-100 px-6 py-2 text-white dark:text-zinc-900 shadow-md hover:opacity-90 transition-all font-medium"
        >
          Go to Sign In
        </button>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={session.user} />
        <main className={`flex-1 overflow-auto ${contentClassName ?? 'p-4'}`}>
          {children}
        </main>
      </div>
    </div>
  )
}