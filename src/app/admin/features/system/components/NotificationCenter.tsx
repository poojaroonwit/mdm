'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogDescription, DialogBody, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Bell, 
  Plus, 
  Edit, 
  Trash2, 
  Send,
  Settings,
  Mail,
  MessageSquare,
  Smartphone,
  Globe,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Users,
  Database,
  FileText,
  Zap
} from 'lucide-react'
import toast from 'react-hot-toast'
import { NotificationTemplate, NotificationSettings } from '../types'

interface NotificationHistory {
  id: string
  templateId: string
  templateName: string
  recipient: string
  type: string
  status: 'sent' | 'failed' | 'pending'
  sentAt: Date
  error?: string
}

export function NotificationCenter() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [settings, setSettings] = useState<NotificationSettings | null>(null)
  const [history, setHistory] = useState<NotificationHistory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null)

  const [newTemplate, setNewTemplate] = useState({
    name: '',
    type: 'email' as const,
    subject: '',
    content: '',
    variables: [] as string[]
  })

  useEffect(() => {
    loadTemplates()
    loadSettings()
    loadHistory()
  }, [])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/notification-templates')
      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates.map((template: any) => ({
          ...template,
          createdAt: new Date(template.createdAt),
          updatedAt: new Date(template.updatedAt)
        })))
      }
    } catch (error) {
      console.error('Error loading templates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/admin/notification-settings')
      if (response.ok) {
        const data = await response.json()
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/admin/notification-history')
      if (response.ok) {
        const data = await response.json()
        setHistory(data.history.map((item: any) => ({
          ...item,
          sentAt: new Date(item.sentAt)
        })))
      }
    } catch (error) {
      console.error('Error loading history:', error)
    }
  }

  const createTemplate = async () => {
    try {
      const response = await fetch('/api/admin/notification-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTemplate)
      })

      if (response.ok) {
        toast.success('Template created successfully')
        setShowCreateTemplate(false)
        setNewTemplate({
          name: '',
          type: 'email',
          subject: '',
          content: '',
          variables: []
        })
        loadTemplates()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create template')
      }
    } catch (error) {
      console.error('Error creating template:', error)
      toast.error('Failed to create template')
    }
  }

  const updateTemplate = async (templateId: string, updates: Partial<NotificationTemplate>) => {
    try {
      const response = await fetch(`/api/admin/notification-templates/${templateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        toast.success('Template updated successfully')
        loadTemplates()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update template')
      }
    } catch (error) {
      console.error('Error updating template:', error)
      toast.error('Failed to update template')
    }
  }

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const response = await fetch(`/api/admin/notification-templates/${templateId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Template deleted successfully')
        loadTemplates()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to delete template')
      }
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error('Failed to delete template')
    }
  }

  const sendTestNotification = async (templateId: string) => {
    try {
      const response = await fetch(`/api/admin/notification-templates/${templateId}/test`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('Test notification sent')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to send test notification')
      }
    } catch (error) {
      console.error('Error sending test notification:', error)
      toast.error('Failed to send test notification')
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <Mail className="h-4 w-4" />
      case 'push':
        return <Smartphone className="h-4 w-4" />
      case 'sms':
        return <MessageSquare className="h-4 w-4" />
      case 'webhook':
        return <Globe className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertTriangle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email':
        return 'bg-blue-100 text-blue-800'
      case 'push':
        return 'bg-green-100 text-green-800'
      case 'sms':
        return 'bg-yellow-100 text-yellow-800'
      case 'webhook':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-muted text-foreground'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notification Center
          </h2>
          <p className="text-muted-foreground">
            Manage notification templates, settings, and delivery history
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadTemplates} disabled={isLoading}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <div className="w-full">
      <Tabs defaultValue="templates">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Notification Templates</h3>
            <Dialog open={showCreateTemplate} onOpenChange={setShowCreateTemplate}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Notification Template</DialogTitle>
                  <DialogDescription>
                    Create a new notification template for automated messaging
                  </DialogDescription>
                </DialogHeader>
                <DialogBody>
<div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="template-name">Template Name</Label>
                      <Input
                        id="template-name"
                        value={newTemplate.name}
                        onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                        placeholder="Enter template name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="template-type">Type</Label>
                      <Select value={newTemplate.type} onValueChange={(value: any) => setNewTemplate({ ...newTemplate, type: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="push">Push Notification</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                          <SelectItem value="webhook">Webhook</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {newTemplate.type === 'email' && (
                    <div>
                      <Label htmlFor="template-subject">Subject</Label>
                      <Input
                        id="template-subject"
                        value={newTemplate.subject}
                        onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
                        placeholder="Email subject line"
                      />
                    </div>
                  )}

                  <div>
                    <Label htmlFor="template-content">Content</Label>
                    <Textarea
                      id="template-content"
                      value={newTemplate.content}
                      onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                      placeholder="Notification content (use {{variable}} for dynamic content)"
                      rows={6}
                    />
                  </div>

                  <div>
                    <Label>Available Variables</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {['{{user.name}}', '{{user.email}}', '{{space.name}}', '{{data.title}}', '{{system.name}}'].map(variable => (
                        <Badge
                          key={variable}
                          variant="outline"
                          className="cursor-pointer"
                          onClick={() => {
                            setNewTemplate({
                              ...newTemplate,
                              content: newTemplate.content + variable
                            })
                          }}
                        >
                          {variable}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                </DialogBody>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateTemplate(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createTemplate} disabled={!newTemplate.name || !newTemplate.content}>
                    Create Template
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => (
              <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getTypeIcon(template.type)}
                      {template.name}
                    </CardTitle>
                    <Badge className={getTypeColor(template.type)}>
                      {template.type}
                    </Badge>
                  </div>
                  <CardDescription>
                    {template.variables.length} variables
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {template.subject && (
                    <div className="text-sm">
                      <span className="font-medium">Subject:</span> {template.subject}
                    </div>
                  )}
                  
                  <div className="text-sm text-muted-foreground">
                    {template.content.substring(0, 100)}...
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedTemplate(template)}
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendTestNotification(template.id)}
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Test
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteTemplate(template.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <h3 className="text-lg font-semibold">Notification Settings</h3>
          {settings && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch checked={settings.email.enabled} />
                    <Label>Enable Email Notifications</Label>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtp-host">SMTP Host</Label>
                      <Input
                        id="smtp-host"
                        value={settings.email.smtp.host}
                        placeholder="smtp.gmail.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtp-port">Port</Label>
                      <Input
                        id="smtp-port"
                        type="number"
                        value={settings.email.smtp.port}
                        placeholder="587"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtp-username">Username</Label>
                      <Input
                        id="smtp-username"
                        value={settings.email.smtp.username}
                        placeholder="your-email@gmail.com"
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtp-password">Password</Label>
                      <Input
                        id="smtp-password"
                        type="password"
                        value={settings.email.smtp.password}
                        placeholder="App password"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Push Notification Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch checked={settings.push.enabled} />
                    <Label>Enable Push Notifications</Label>
                  </div>
                  <div>
                    <Label htmlFor="vapid-public">VAPID Public Key</Label>
                    <Input
                      id="vapid-public"
                      value={settings.push.vapidKeys?.publicKey || ''}
                      placeholder="VAPID public key"
                    />
                  </div>
                  <div>
                    <Label htmlFor="vapid-private">VAPID Private Key</Label>
                    <Input
                      id="vapid-private"
                      type="password"
                      value={settings.push.vapidKeys?.privateKey || ''}
                      placeholder="VAPID private key"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <h3 className="text-lg font-semibold">Notification History</h3>
          <Card>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
              <CardDescription>Delivery history and status tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <div className="space-y-2">
                  {history.map(notification => (
                    <div key={notification.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getTypeIcon(notification.type)}
                        <div>
                          <div className="font-medium">{notification.templateName}</div>
                          <div className="text-sm text-muted-foreground">
                            {notification.recipient} • {notification.sentAt.toLocaleString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(notification.status)}
                        <Badge variant={notification.status === 'sent' ? 'default' : 'destructive'}>
                          {notification.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
