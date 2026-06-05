'use client';

import React, { useState } from 'react';
import { 
  Trash2, 
  Check, 
  AlertCircle,
  CheckCircle,
  Info,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/status-badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollableContainer } from '@/components/ui/scrollable-container';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/contexts/notification-context';
import { Notification, NotificationFilters } from '@/types/notifications';
import { formatDistanceToNow } from 'date-fns';

interface NotificationListProps {
  filters?: NotificationFilters;
  showActions?: boolean;
  maxHeight?: string;
}

export function NotificationList({ 
  filters, 
  showActions = true, 
  maxHeight = 'max-h-96' 
}: NotificationListProps) {
  const { 
    notifications, 
    isLoading, 
    markAsRead, 
    deleteNotification,
    fetchNotifications 
  } = useNotifications();

  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'ERROR':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (notification.status === 'UNREAD') {
      await markAsRead(notification.id);
    }
    
    if (notification.action_url) {
      window.open(notification.action_url, '_blank');
    }
  };

  const handleDeleteNotification = async (notificationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteNotification(notificationId);
  };

  const handleSelectNotification = (notificationId: string, checked: boolean) => {
    if (checked) {
      setSelectedNotifications(prev => [...prev, notificationId]);
    } else {
      setSelectedNotifications(prev => prev.filter(id => id !== notificationId));
    }
  };

  const handleBulkMarkAsRead = async () => {
    for (const notificationId of selectedNotifications) {
      await markAsRead(notificationId);
    }
    setSelectedNotifications([]);
  };

  const handleBulkDelete = async () => {
    for (const notificationId of selectedNotifications) {
      await deleteNotification(notificationId);
    }
    setSelectedNotifications([]);
  };

  // Apply filters
  const filteredNotifications = notifications.filter(notification => {
    if (filters?.type && notification.type !== filters.type) return false;
    if (filters?.status && notification.status !== filters.status) return false;
    if (filters?.priority && notification.priority !== filters.priority) return false;
    if (filters?.search) {
      const searchLower = filters.search.toLowerCase();
      if (!notification.title.toLowerCase().includes(searchLower) && 
          !notification.message.toLowerCase().includes(searchLower)) {
        return false;
      }
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {showActions && selectedNotifications.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-muted/60 p-3">
          <span className="text-sm text-muted-foreground">
            {selectedNotifications.length} selected
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkMarkAsRead}
          >
            <Check className="h-4 w-4 mr-1" />
            Mark as Read
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkDelete}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          <span className="ml-2">Loading notifications...</span>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
          <Info className="h-8 w-8 mb-2" />
          <p>No notifications found</p>
        </div>
      ) : (
        <ScrollableContainer maxHeight={maxHeight}>
          {filteredNotifications.map((notification, index) => (
            <div key={notification.id}>
              <Card className={`transition-colors hover:shadow-md ${
                notification.status === 'UNREAD' ? 'border-l-4 border-l-blue-500 bg-blue-500/8' : ''
              }`}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {showActions && (
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={(e) => handleSelectNotification(notification.id, e.target.checked)}
                        className="mt-1"
                      />
                    )}
                    
                    <div className="flex-shrink-0 mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="text-sm font-medium text-foreground">
                          {notification.title}
                        </h4>
                        <StatusBadge status={notification.priority} label={notification.priority} size="sm" className="text-xs" />
                        {notification.status === 'UNREAD' && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                      
                      <p className="mb-3 text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </span>
                        
                        <div className="flex items-center gap-2">
                          {notification.action_url && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(notification.action_url, '_blank')}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              {notification.action_label || 'View'}
                            </Button>
                          )}
                          
                          {showActions && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleDeleteNotification(notification.id, e)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {index < filteredNotifications.length - 1 && <Separator className="my-2" />}
            </div>
          ))}
        </ScrollableContainer>
      )}
    </div>
  );
}
