export interface Schedule {
  id: string
  name: string
  description: string
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom'
  time: string
  dayOfWeek?: number
  dayOfMonth?: number
  recipients: string[]
  format: 'pdf' | 'excel' | 'csv' | 'image'
  enabled: boolean
  lastRun?: string
  nextRun: string
  created_at: string
  created_by: string
}

export const mockSchedules: Schedule[] = [
  {
    id: '1',
    name: 'Daily Sales Report',
    description: 'Daily sales performance report',
    frequency: 'daily',
    time: '08:00',
    recipients: ['sales@company.com', 'manager@company.com'],
    format: 'pdf',
    enabled: true,
    lastRun: '2024-01-17T08:00:00Z',
    nextRun: '2024-01-18T08:00:00Z',
    created_at: '2024-01-15T10:00:00Z',
    created_by: 'John Doe'
  },
  {
    id: '2',
    name: 'Weekly Marketing Summary',
    description: 'Weekly marketing metrics and insights',
    frequency: 'weekly',
    time: '09:00',
    dayOfWeek: 1,
    recipients: ['marketing@company.com'],
    format: 'excel',
    enabled: true,
    lastRun: '2024-01-15T09:00:00Z',
    nextRun: '2024-01-22T09:00:00Z',
    created_at: '2024-01-10T14:30:00Z',
    created_by: 'Jane Smith'
  },
  {
    id: '3',
    name: 'Monthly Financial Report',
    description: 'Monthly financial dashboard export',
    frequency: 'monthly',
    time: '10:00',
    dayOfMonth: 1,
    recipients: ['finance@company.com', 'ceo@company.com'],
    format: 'pdf',
    enabled: false,
    nextRun: '2024-02-01T10:00:00Z',
    created_at: '2024-01-01T12:00:00Z',
    created_by: 'Bob Johnson'
  }
]

export const calculateNextRun = (frequency: string, time: string, dayOfWeek?: number, dayOfMonth?: number): string => {
  const now = new Date()
  const [hours, minutes] = time.split(':').map(Number)

  const nextRun = new Date()
  nextRun.setHours(hours, minutes, 0, 0)

  switch (frequency) {
    case 'daily':
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1)
      }
      break
    case 'weekly':
      const targetDay = dayOfWeek || 1
      const currentDay = now.getDay()
      const daysUntilTarget = (targetDay - currentDay + 7) % 7
      nextRun.setDate(now.getDate() + (daysUntilTarget === 0 ? 7 : daysUntilTarget))
      break
    case 'monthly':
      const targetDate = dayOfMonth || 1
      nextRun.setDate(targetDate)
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1)
      }
      break
  }

  return nextRun.toISOString()
}

export const getFrequencyLabel = (frequency: string) => {
  switch (frequency) {
    case 'daily': return 'Daily'
    case 'weekly': return 'Weekly'
    case 'monthly': return 'Monthly'
    case 'custom': return 'Custom'
    default: return frequency
  }
}

export const getFormatLabel = (format: string) => {
  switch (format) {
    case 'pdf': return 'PDF'
    case 'excel': return 'Excel'
    case 'csv': return 'CSV'
    case 'image': return 'Image'
    default: return format
  }
}
