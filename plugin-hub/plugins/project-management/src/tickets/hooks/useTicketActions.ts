'use client'

import { useState } from 'react'
import { Ticket } from '../types'

export interface UseTicketActionsResult {
  createTicket: (ticket: Partial<Ticket>) => Promise<Ticket | null>
  updateTicket: (id: string, ticket: Partial<Ticket>) => Promise<Ticket | null>
  deleteTicket: (id: string) => Promise<boolean>
  moveTicket: (id: string, newStatus: string) => Promise<boolean>
  loading: boolean
  error: string | null
}

/**
 * Hook for ticket actions (create, update, delete, move)
 */
export function useTicketActions(): UseTicketActionsResult {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createTicket = async (ticket: Partial<Ticket>): Promise<Ticket | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticket),
      })

      if (!response.ok) {
        throw new Error('Failed to create ticket')
      }

      const data = await response.json()
      return data.ticket || data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create ticket'
      setError(errorMessage)
      console.error('Error creating ticket:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  const updateTicket = async (id: string, ticket: Partial<Ticket>): Promise<Ticket | null> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ticket),
      })

      if (!response.ok) {
        throw new Error('Failed to update ticket')
      }

      const data = await response.json()
      return data.ticket || data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update ticket'
      setError(errorMessage)
      console.error('Error updating ticket:', err)
      return null
    } finally {
      setLoading(false)
    }
  }

  const deleteTicket = async (id: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/tickets/${id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to delete ticket')
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete ticket'
      setError(errorMessage)
      console.error('Error deleting ticket:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  const moveTicket = async (id: string, newStatus: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/tickets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!response.ok) {
        throw new Error('Failed to move ticket')
      }

      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to move ticket'
      setError(errorMessage)
      console.error('Error moving ticket:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    createTicket,
    updateTicket,
    deleteTicket,
    moveTicket,
    loading,
    error,
  }
}

