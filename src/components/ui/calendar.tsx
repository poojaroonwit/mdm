'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface CalendarProps {
  mode?: 'single' | 'range' | 'multiple'
  selected?: Date
  onSelect?: (date: Date | undefined) => void
  initialFocus?: boolean
  className?: string
}

export function Calendar({
  mode = 'single',
  selected,
  onSelect,
  initialFocus,
  className,
}: CalendarProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(selected)

  React.useEffect(() => {
    setSelectedDate(selected)
  }, [selected])

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value) : undefined
    setSelectedDate(date)
    onSelect?.(date)
  }

  return (
    <div className={cn('p-2', className)}>
      <input
        type="date"
        value={selectedDate ? selectedDate.toISOString().split('T')[0] : ''}
        onChange={handleDateChange}
        className="w-full px-3 py-2 border border-zinc-100/60 dark:border-zinc-800/60 rounded-md bg-white/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-500 transition-all duration-200"
        autoFocus={initialFocus}
      />
    </div>
  )
}
