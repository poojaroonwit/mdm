'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { NotificationList } from '@/components/notifications/notification-list';
import { NotificationSettings } from '@/components/notifications/notification-settings';
import { useNotifications } from '@/contexts/notification-context';
import { NotificationFilters } from '@/types/notifications';
import { RefreshCw, Filter, Search } from 'lucide-react';

export default function NotificationsPage() {
  const { notifications, unreadCount, isLoading, refreshNotifications } = useNotifications();
  const [filters, setFilters] = useState<NotificationFilters>({});
  const [searchQuery, setSearchQuery] = useState('');

  const handleFilterChange = (key: keyof NotificationFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
  };

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      search: searchQuery || undefined,
    }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchQuery('');
  };

  const activeFilters = Object.values(filters).filter(Boolean).length;

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-gray-600">
            Manage your notifications and preferences
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={refreshNotifications}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="space-y-6">
      <Tabs defaultValue="all">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">
            All Notifications
            {notifications.length > 0 && (
              <span className="ml-2 bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">
                {notifications.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="unread">
            Unread
            {unreadCount > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                {unreadCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search notifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    value={filters.type || ''}
                    onValueChange={(value) => handleFilterChange('type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All types</SelectItem>
                      <SelectItem value="INFO">Information</SelectItem>
                      <SelectItem value="SUCCESS">Success</SelectItem>
                      <SelectItem value="WARNING">Warning</SelectItem>
                      <SelectItem value="ERROR">Error</SelectItem>
                      <SelectItem value="ASSIGNMENT_CREATED">Assignment Created</SelectItem>
                      <SelectItem value="ASSIGNMENT_UPDATED">Assignment Updated</SelectItem>
                      <SelectItem value="ASSIGNMENT_COMPLETED">Assignment Completed</SelectItem>
                      <SelectItem value="CUSTOMER_CREATED">Customer Created</SelectItem>
                      <SelectItem value="CUSTOMER_UPDATED">Customer Updated</SelectItem>
                      <SelectItem value="USER_INVITED">User Invited</SelectItem>
                      <SelectItem value="USER_ROLE_CHANGED">Role Changed</SelectItem>
                      <SelectItem value="SYSTEM_MAINTENANCE">System Maintenance</SelectItem>
                      <SelectItem value="DATA_IMPORT_COMPLETED">Data Import</SelectItem>
                      <SelectItem value="DATA_EXPORT_COMPLETED">Data Export</SelectItem>
                      <SelectItem value="AUDIT_LOG_CREATED">Audit Log</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select
                    value={filters.status || ''}
                    onValueChange={(value) => handleFilterChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="UNREAD">Unread</SelectItem>
                      <SelectItem value="READ">Read</SelectItem>
                      <SelectItem value="ARCHIVED">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Priority</label>
                  <Select
                    value={filters.priority || ''}
                    onValueChange={(value) => handleFilterChange('priority', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All priorities" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All priorities</SelectItem>
                      <SelectItem value="LOW">Low</SelectItem>
                      <SelectItem value="MEDIUM">Medium</SelectItem>
                      <SelectItem value="HIGH">High</SelectItem>
                      <SelectItem value="URGENT">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button onClick={handleSearch}>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                {activeFilters > 0 && (
                  <Button variant="outline" onClick={clearFilters}>
                    Clear Filters ({activeFilters})
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <NotificationList 
            filters={filters} 
            showActions={true}
            maxHeight="max-h-[600px]"
          />
        </TabsContent>

        <TabsContent value="unread">
          <NotificationList 
            filters={{ status: 'UNREAD' }} 
            showActions={true}
            maxHeight="max-h-[600px]"
          />
        </TabsContent>

        <TabsContent value="settings">
          <NotificationSettings />
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
