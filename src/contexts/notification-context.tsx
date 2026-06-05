'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { 
  Notification, 
  NotificationFilters, 
  NotificationContextType, 
  CreateNotificationRequest
} from '@/types/notifications';

// Action types
type NotificationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'UPDATE_NOTIFICATION'; payload: Notification }
  | { type: 'DELETE_NOTIFICATION'; payload: string }
  | { type: 'SET_UNREAD_COUNT'; payload: number }
  | { type: 'REFRESH_NOTIFICATIONS' };

// Initial state
interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  lastFetch: number;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  lastFetch: 0,
};

const NOTIFICATION_REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const INITIAL_NOTIFICATION_FETCH_DELAY_MS = 1000;

// Reducer
function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_NOTIFICATIONS':
      return { 
        ...state, 
        notifications: action.payload, 
        isLoading: false, 
        error: null,
        lastFetch: Date.now()
      };
    
    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: action.payload.status === 'UNREAD' ? state.unreadCount + 1 : state.unreadCount,
      };
    
    case 'UPDATE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.map(notification =>
          notification.id === action.payload.id ? action.payload : notification
        ),
        unreadCount: action.payload.status === 'UNREAD' 
          ? state.unreadCount + (state.notifications.find(n => n.id === action.payload.id)?.status === 'READ' ? 1 : 0)
          : state.unreadCount - (state.notifications.find(n => n.id === action.payload.id)?.status === 'UNREAD' ? 1 : 0),
      };
    
    case 'DELETE_NOTIFICATION':
      const deletedNotification = state.notifications.find(n => n.id === action.payload);
      return {
        ...state,
        notifications: state.notifications.filter(notification => notification.id !== action.payload),
        unreadCount: deletedNotification?.status === 'UNREAD' ? state.unreadCount - 1 : state.unreadCount,
      };
    
    case 'SET_UNREAD_COUNT':
      return { ...state, unreadCount: action.payload };
    
    case 'REFRESH_NOTIFICATIONS':
      return { ...state, lastFetch: 0 };
    
    default:
      return state;
  }
}

// Context
const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider component
export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const inFlightFetchRef = useRef<AbortController | null>(null);

  // Fetch notifications
  const fetchNotifications = useCallback(async (filters?: NotificationFilters) => {
    // Don't fetch if user is not authenticated
    if (status !== 'authenticated' || !session?.user?.id) {
      return;
    }

    inFlightFetchRef.current?.abort();
    const controller = new AbortController();
    inFlightFetchRef.current = controller;

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const params = new URLSearchParams();
      if (filters?.type) params.append('type', filters.type);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.priority) params.append('priority', filters.priority);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.offset) params.append('offset', filters.offset.toString());
      if (filters?.search) params.append('search', filters.search);

      const response = await fetch(`/api/notifications?${params.toString()}`, {
        signal: controller.signal,
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      // Check if response is HTML (likely a redirect to login page)
      const contentType = response.headers.get('content-type');
      if (contentType && !contentType.includes('application/json')) {
        throw new Error('Authentication required. Please sign in.');
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError);
        throw new Error('Invalid response format. Please try again.');
      }
      
      dispatch({ type: 'SET_NOTIFICATIONS', payload: data.notifications });
      dispatch({ type: 'SET_UNREAD_COUNT', payload: data.unreadCount });
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }
      console.error('Error fetching notifications:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to fetch notifications' });
    } finally {
      if (inFlightFetchRef.current === controller) {
        inFlightFetchRef.current = null;
      }
    }
  }, [session?.user?.id, status]);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'READ', read_at: new Date().toISOString() }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark notification as read');
      }

      const updatedNotification = await response.json();
      dispatch({ type: 'UPDATE_NOTIFICATION', payload: updatedNotification });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to mark notification as read' });
    }
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to mark all notifications as read');
      }

      // Update all notifications to read status
      dispatch({ type: 'SET_NOTIFICATIONS', payload: state.notifications.map(n => ({ ...n, status: 'READ' as const, read_at: new Date().toISOString() })) });
      dispatch({ type: 'SET_UNREAD_COUNT', payload: 0 });
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to mark all notifications as read' });
    }
  }, [state.notifications]);

  // Delete notification
  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete notification');
      }

      dispatch({ type: 'DELETE_NOTIFICATION', payload: notificationId });
    } catch (error) {
      console.error('Error deleting notification:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to delete notification' });
    }
  }, []);

  // Create notification
  const createNotification = useCallback(async (notification: CreateNotificationRequest) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification),
      });

      if (!response.ok) {
        throw new Error('Failed to create notification');
      }

      const newNotification = await response.json();
      dispatch({ type: 'ADD_NOTIFICATION', payload: newNotification });
    } catch (error) {
      console.error('Error creating notification:', error);
      dispatch({ type: 'SET_ERROR', payload: error instanceof Error ? error.message : 'Failed to create notification' });
    }
  }, []);

  // Refresh notifications
  const refreshNotifications = useCallback(async () => {
    dispatch({ type: 'REFRESH_NOTIFICATIONS' });
    await fetchNotifications();
  }, [fetchNotifications]);

  // Auto-refresh notifications while the page is visible.
  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) {
      return;
    }

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && Date.now() - state.lastFetch > NOTIFICATION_REFRESH_INTERVAL_MS) {
        fetchNotifications();
      }
    }, NOTIFICATION_REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [fetchNotifications, session?.user?.id, state.lastFetch, status]);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id) {
      return;
    }

    const refreshIfStale = () => {
      if (document.visibilityState === 'visible' && Date.now() - state.lastFetch > NOTIFICATION_REFRESH_INTERVAL_MS) {
        fetchNotifications();
      }
    };

    document.addEventListener('visibilitychange', refreshIfStale);
    window.addEventListener('focus', refreshIfStale);

    return () => {
      document.removeEventListener('visibilitychange', refreshIfStale);
      window.removeEventListener('focus', refreshIfStale);
    };
  }, [fetchNotifications, session?.user?.id, state.lastFetch, status]);

  // Initial fetch with delay to prevent blocking initial render
  useEffect(() => {
    // Only fetch if user is authenticated
    if (status === 'authenticated' && session?.user?.id) {
      // Add a delay to allow the page to render first
      const timer = setTimeout(() => {
        fetchNotifications();
      }, INITIAL_NOTIFICATION_FETCH_DELAY_MS);
      
      return () => clearTimeout(timer);
    }
  }, [status, session?.user?.id, fetchNotifications]);

  useEffect(() => {
    return () => {
      inFlightFetchRef.current?.abort();
    };
  }, []);

  const contextValue = useMemo<NotificationContextType>(() => ({
    notifications: state.notifications,
    unreadCount: state.unreadCount,
    isLoading: state.isLoading,
    error: state.error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    createNotification,
    refreshNotifications,
  }), [
    createNotification,
    deleteNotification,
    fetchNotifications,
    markAllAsRead,
    markAsRead,
    refreshNotifications,
    state.error,
    state.isLoading,
    state.notifications,
    state.unreadCount,
  ]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

// Hook to use notification context
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
