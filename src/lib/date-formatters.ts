/**
 * Date and Time Formatting Utilities
 * Centralized date/time formatting functions
 */

import { format, formatDistanceToNow as formatDistanceToNowFns, formatDistance, isValid } from 'date-fns'

/**
 * Format date in various formats
 * @param date - Date object, string, or null/undefined
 * @param formatStr - Format string (default: 'MMM dd, yyyy')
 * @returns Formatted date string or 'N/A' if invalid
 */
export function formatDate(
  date: Date | string | null | undefined,
  formatStr: string = 'MMM dd, yyyy'
): string {
  if (!date) return 'N/A'
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (!isValid(dateObj)) return 'Invalid Date'
  return format(dateObj, formatStr)
}

/**
 * Format date and time
 * @param date - Date object, string, or null/undefined
 * @param formatStr - Format string (default: 'MMM dd, yyyy HH:mm')
 * @returns Formatted date-time string or 'N/A' if invalid
 */
export function formatDateTime(
  date: Date | string | null | undefined,
  formatStr: string = 'MMM dd, yyyy HH:mm'
): string {
  if (!date) return 'N/A'
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (!isValid(dateObj)) return 'Invalid Date'
  return format(dateObj, formatStr)
}

/**
 * Format time only
 * @param date - Date object, string, or null/undefined
 * @param formatStr - Format string (default: 'HH:mm:ss')
 * @returns Formatted time string or 'N/A' if invalid
 */
export function formatTime(
  date: Date | string | null | undefined,
  formatStr: string = 'HH:mm:ss'
): string {
  if (!date) return 'N/A'
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (!isValid(dateObj)) return 'Invalid Date'
  return format(dateObj, formatStr)
}

/**
 * Format timestamp (ISO string to readable format)
 * @param timestamp - ISO timestamp string or null/undefined
 * @param formatStr - Format string (default: 'MMM dd, yyyy HH:mm:ss')
 * @returns Formatted timestamp string or 'N/A' if invalid
 */
export function formatTimestamp(
  timestamp: string | null | undefined,
  formatStr: string = 'MMM dd, yyyy HH:mm:ss'
): string {
  if (!timestamp) return 'N/A'
  const date = new Date(timestamp)
  if (!isValid(date)) return 'Invalid Date'
  return format(date, formatStr)
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatTimeAgo(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (!isValid(dateObj)) return 'Invalid Date'
  
  const seconds = Math.floor((new Date().getTime() - dateObj.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} days ago`
  return format(dateObj, 'MMM dd, yyyy')
}

/**
 * Format distance to now (e.g., "in 2 hours", "2 hours ago")
 * @param date - Date object or string
 * @returns Relative time string
 */
export function formatDistanceToNow(
  date: Date | string
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  if (!isValid(dateObj)) return 'Invalid Date'
  return formatDistanceToNowFns(dateObj, { addSuffix: true })
}

/**
 * Format distance between two dates
 * @param date1 - First date
 * @param date2 - Second date
 * @returns Relative time string
 */
export function formatDistanceBetween(
  date1: Date | string,
  date2: Date | string
): string {
  const dateObj1 = typeof date1 === 'string' ? new Date(date1) : date1
  const dateObj2 = typeof date2 === 'string' ? new Date(date2) : date2
  if (!isValid(dateObj1) || !isValid(dateObj2)) return 'Invalid Date'
  return formatDistance(dateObj1, dateObj2)
}

/**
 * Check if date is valid
 * @param date - Date object or string
 * @returns True if date is valid
 */
export function isValidDate(date: Date | string | null | undefined): boolean {
  if (!date) return false
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return isValid(dateObj)
}

/**
 * Normalize a date-like value for native <input type="date"> controls.
 */
export function toDateInputValue(value?: string | Date | null): string {
  if (!value) return ''
  if (value instanceof Date) {
    return isValid(value) ? format(value, 'yyyy-MM-dd') : ''
  }

  const trimmed = String(value).trim()
  if (!trimmed) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed

  const parsed = new Date(trimmed)
  return isValid(parsed) ? format(parsed, 'yyyy-MM-dd') : ''
}

