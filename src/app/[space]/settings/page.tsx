"use client"

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserInviteInput } from '@/components/ui/user-invite-input'
import { MemberManagementPanel } from '@/components/space-management/MemberManagementPanel'
import { MemberPermissionsPanel } from '@/components/space-management/MemberPermissionsPanel'
import { MemberAuditLog } from '@/components/space-management/MemberAuditLog'
import { Building2, Layout, Database, History, Users as UsersIcon, UserCog, UserPlus, Plus, Edit, Trash2, Search, Type, AlertTriangle, FolderPlus, Share2, Folder, FolderOpen, Move, Settings, Palette, Shield, Archive, Trash, MoreVertical, ChevronDown, ChevronRight, ArrowLeft, ExternalLink, Grid3X3, CheckCircle2, Circle, Lock } from 'lucide-react'
import { showSuccess, showError, ToastMessages } from '@/lib/toast-utils'
import { useSpace } from '@/contexts/space-context'
import { useSession } from 'next-auth/react'
import { PagesManagement } from '@/components/studio/pages-management'
import { useSpacesEditor } from '@/hooks/use-space-studio'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import IconPickerPopover from '@/components/ui/icon-picker-popover'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'
import { ColorPickerPopover } from '@/components/studio/layout-config/ColorPickerPopover'
import { AttributeDetailDrawer } from '@/components/data-models/AttributeDetailDrawer'
import { AttributeManagementPanel } from '@/components/attribute-management/AttributeManagementPanel'
import { DraggableAttributeList } from '@/components/attribute-management/DraggableAttributeList'
import { EnhancedAttributeDetailDrawer } from '@/components/attribute-management/EnhancedAttributeDetailDrawer'
import { getStorageProviderIcon, getStorageProviderLabel } from '@/lib/storage-provider-icons'
import { DataModelTreeView } from '@/components/data-model/DataModelTreeView'
import LayoutConfig from '@/components/studio/layout-config'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { SpaceSettingsSidebar } from '@/components/space-management/SpaceSettingsSidebar'
import { SpaceSettingsHeader } from '@/components/space-management/SpaceSettingsHeader'
import { DataSyncManagement } from '@/components/data-sync/DataSyncManagement'
import { AttachmentBrowser } from '@/components/attachment-storage/AttachmentBrowser'
import { DataModelBrowser } from '@/components/data-model/DataModelBrowser'

function EffectRedirect({ to }: { to: string }) {
  const router = useRouter()
  useEffect(() => {
    router.push(to)
  }, [router, to])
  return null
}

const DEFAULT_LOGIN_PAGE_CONFIG = {
  backgroundType: 'gradient',
  backgroundColor: '#f8fafc',
  backgroundImage: '',
  gradient: {
    from: '#eff6ff',
    to: '#dbeafe',
    angle: 135,
  },
  leftPanelWidth: '60%',
  rightPanelWidth: '40%',
  title: 'Welcome back',
  description: 'Sign in to access this workspace.',
  heroTitle: 'Your space, ready when you are',
  heroDescription: 'Secure access for your team, data, and workflows in one place.',
  signInButtonLabel: 'Sign in',
  helpText: '',
  showLogo: true,
  logoUrl: '',
  cardStyle: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    textColor: '#111827',
    borderColor: 'rgba(226, 232, 240, 0.9)',
    borderRadius: 24,
    shadow: true,
  },
}

function normalizeLoginPageConfig(config: any) {
  return {
    ...DEFAULT_LOGIN_PAGE_CONFIG,
    ...(config || {}),
    gradient: {
      ...DEFAULT_LOGIN_PAGE_CONFIG.gradient,
      ...(config?.gradient || {}),
    },
    cardStyle: {
      ...DEFAULT_LOGIN_PAGE_CONFIG.cardStyle,
      ...(config?.cardStyle || {}),
    },
  }
}

export default function SpaceSettingsPage() {
  const router = useRouter()
  const params = useParams() as { space: string }
  const searchParams = useSearchParams()
  const allowedTabs = ['details', 'members', 'data-model', 'data-sync', 'attachments', 'danger']
  const initialTabRaw = (searchParams.get('tab') as string) || 'details'
  const initialTab = allowedTabs.includes(initialTabRaw) ? initialTabRaw : 'details'
  const fromDataManagement = searchParams.get('from') === 'data-management'
  const fromSpaceSidebar = searchParams.get('from') === 'space-sidebar'
  const { spaces, currentSpace, refreshSpaces } = useSpace()
  const { data: session } = useSession()

  // Spaces Editor: pages/templates management for this space
  const {
    pages: editorPages,
    templates: editorTemplates,
    createPage: createEditorPage,
    updatePage: updateEditorPage,
    deletePage: deleteEditorPage,
    assignTemplateToPage: assignTemplateToEditorPage,
    refreshConfig: refreshEditorConfig
  } = useSpacesEditor(currentSpace?.id || '')

  // Reset all pages function
  const handleResetPages = async () => {
    try {
      const { SpacesEditorManager } = await import('@/lib/space-studio-manager')
      await SpacesEditorManager.clearSpacesEditorConfig(currentSpace?.id || '')
      await refreshEditorConfig()
      showSuccess('All pages have been removed')
    } catch (error) {
      console.error('Failed to reset pages:', error)
      showError('Failed to reset pages')
    }
  }

  const homepage = useMemo(() => {
    if (!editorPages || editorPages.length === 0) return null
    const byOrder = [...editorPages]
      .filter(p => p.isActive)
      .sort((a, b) => (a.order || 0) - (b.order || 0))
    return byOrder[0] || null
  }, [editorPages])

  const selectedSpace = useMemo(() => {
    return (
      spaces.find((s: any) => s.id === params.space || s.slug === params.space) || currentSpace || null
    ) as any
  }, [spaces, currentSpace, params.space])

  const [tab, setTab] = useState<string>(initialTab)
  useEffect(() => {
    setTab(initialTab)
  }, [initialTab])

  // Handle tab change and update URL to preserve from parameter
  const handleTabChange = (newTab: string) => {
    setTab(newTab)
    const queryParams = new URLSearchParams(searchParams?.toString() || '')
    queryParams.set('tab', newTab)
    // Preserve from parameter if it exists
    if (fromDataManagement) {
      queryParams.set('from', 'data-management')
    } else if (fromSpaceSidebar) {
      queryParams.set('from', 'space-sidebar')
    }
    router.push(`/${params.space}/settings?${queryParams.toString()}`)
  }

  const [members, setMembers] = useState<any[]>([])
  const [memberPermissions, setMemberPermissions] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])
  const [auditLogsLoading, setAuditLogsLoading] = useState(false)
  const canManageMembers = selectedSpace?.user_role === 'owner' || selectedSpace?.user_role === 'admin'

  // Handle user invitation
  const handleInviteUser = async (user: any, role: string) => {
    if (!selectedSpace?.id) return

    try {
      if (user.id) {
        // Existing user - add directly to space
        const res = await fetch(`/api/spaces/${selectedSpace.id}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: user.id, role })
        })

        if (res.ok) {
          showSuccess('User added to space')
          await loadMembers(selectedSpace.id)
        } else {
          const error = await res.json()
          showError(error.error || 'Failed to add user')
        }
      } else {
        // Create a real platform user first, then assign it to the space.
        const res = await fetch(`/api/spaces/${selectedSpace.id}/members`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role,
            create_user: {
              name: user.name,
              email: user.email,
              system_role: user.system_role || 'USER',
            },
          })
        })

        if (res.ok) {
          const data = await res.json().catch(() => ({}))
          showSuccess(data.message || 'Platform user created and added to space')
          await loadMembers(selectedSpace.id)
        } else {
          const error = await res.json()
          showError(error.error || 'Failed to create platform user')
        }
      }
    } catch (error) {
      console.error('Error inviting user:', error)
      showError('Failed to add user')
    }
  }

  // Handle bulk operations
  const handleBulkOperation = async (operation: string, userIds: string[], data?: any) => {
    if (!selectedSpace?.id) return

    try {
      const res = await fetch(`/api/spaces/${selectedSpace.id}/members/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operation, userIds, data })
      })

      if (res.ok) {
        await loadMembers(selectedSpace.id)
        showSuccess('Bulk operation completed successfully')
      } else {
        const error = await res.json()
        showError(error.error || 'Failed to perform bulk operation')
      }
    } catch (error) {
      console.error('Error performing bulk operation:', error)
      showError('Failed to perform bulk operation')
    }
  }

  // Handle member role update
  const handleUpdateRole = async (userId: string, role: string) => {
    if (!selectedSpace?.id) return

    try {
      const res = await fetch(`/api/spaces/${selectedSpace.id}/members/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      })

      if (res.ok) {
        await loadMembers(selectedSpace.id)
        showSuccess('Role updated successfully')
      } else {
        const error = await res.json()
        showError(error.error || 'Failed to update role')
      }
    } catch (error) {
      console.error('Error updating role:', error)
      showError('Failed to update role')
    }
  }

  // Handle member removal
  const handleRemoveMember = async (userId: string) => {
    if (!selectedSpace?.id) return

    try {
      const res = await fetch(`/api/spaces/${selectedSpace.id}/members/${userId}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        await loadMembers(selectedSpace.id)
        showSuccess('Member removed successfully')
      } else {
        const error = await res.json()
        showError(error.error || 'Failed to remove member')
      }
    } catch (error) {
      console.error('Error removing member:', error)
      showError('Failed to remove member')
    }
  }

  // Handle permission updates
  const handleUpdatePermissions = async (userId: string, permissions: string[]) => {
    if (!selectedSpace?.id) return

    try {
      const res = await fetch(`/api/spaces/${selectedSpace.id}/members/${userId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions })
      })

      if (res.ok) {
        showSuccess('Permissions updated successfully')
      } else {
        const error = await res.json()
        showError(error.error || 'Failed to update permissions')
      }
    } catch (error) {
      console.error('Error updating permissions:', error)
      showError('Failed to update permissions')
    }
  }

  // Load audit logs
  const loadAuditLogs = async () => {
    if (!selectedSpace?.id) return

    try {
      setAuditLogsLoading(true)
      const res = await fetch(`/api/spaces/${selectedSpace.id}/audit-log`)
      if (res.ok) {
        const data = await res.json()
        setAuditLogs(data.auditLogs || [])
      }
    } catch (error) {
      console.error('Error loading audit logs:', error)
    } finally {
      setAuditLogsLoading(false)
    }
  }

  // Embedded Data Models (space-scoped)
  const [models, setModels] = useState<any[]>([])
  const [modelsLoading, setModelsLoading] = useState(false)
  const [modelSearch, setModelSearch] = useState('')
  const [showModelDrawer, setShowModelDrawer] = useState(false)
  const [editingModel, setEditingModel] = useState<any | null>(null)
  const [modelForm, setModelForm] = useState({ name: '', display_name: '', description: '', slug: '' })

  // Data Model Type Selection
  const [showDataModelTypeDialog, setShowDataModelTypeDialog] = useState(false)
  const [selectedDataModelType, setSelectedDataModelType] = useState<'internal' | 'external' | null>(null)

  // External Data Source Connection
  const [showDatabaseSelection, setShowDatabaseSelection] = useState(false)
  const [databaseSearch, setDatabaseSearch] = useState('')
  const [selectedDatabaseType, setSelectedDatabaseType] = useState<'postgres' | 'mysql' | 'api' | null>(null)
  const [showConnectionForm, setShowConnectionForm] = useState(false)
  const [connectionForm, setConnectionForm] = useState({
    name: '',
    connection_type: 'database' as 'database' | 'api',
    db_type: 'postgres' as 'postgres' | 'mysql',
    host: '',
    port: '',
    database: '',
    username: '',
    password: '',
    schema: '',
    table: '',
    // API fields
    api_url: '',
    api_method: 'GET' as 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
    api_headers: {} as Record<string, string>,
    api_auth_type: 'none' as 'none' | 'bearer' | 'basic' | 'apikey',
    api_auth_token: '',
    api_auth_username: '',
    api_auth_password: '',
    api_auth_apikey_name: '',
    api_auth_apikey_value: '',
    api_body: '',
    api_response_path: ''
  })
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionTestResult, setConnectionTestResult] = useState<any>(null)
  const [connectionSchemas, setConnectionSchemas] = useState<string[]>([])
  const [connectionTables, setConnectionTables] = useState<Record<string, string[]>>({})
  const [activeModelTab, setActiveModelTab] = useState<'details' | 'attributes' | 'activity'>('details')
  const [attributes, setAttributes] = useState<any[]>([])
  const [attributesLoading, setAttributesLoading] = useState(false)
  const [showAttributeDrawer, setShowAttributeDrawer] = useState(false)
  const [selectedAttribute, setSelectedAttribute] = useState<any | null>(null)

  // For data model entities reference
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [referenceModelAttributes, setReferenceModelAttributes] = useState<any[]>([])
  const [loadingReferenceAttributes, setLoadingReferenceAttributes] = useState(false)

  // Folder management
  const [folders, setFolders] = useState<any[]>([])
  const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false)
  const [showShareModelDialog, setShowShareModelDialog] = useState(false)
  const [selectedModelForSharing, setSelectedModelForSharing] = useState<any | null>(null)
  const [availableSpaces, setAvailableSpaces] = useState<any[]>([])
  const [folderForm, setFolderForm] = useState({ name: '', parent_id: '' })
  const [shareForm, setShareForm] = useState({ space_ids: [] as string[] })
  const [spaceDetails, setSpaceDetails] = useState<any | null>(null)
  const [loginPageConfig, setLoginPageConfig] = useState<any>(DEFAULT_LOGIN_PAGE_CONFIG)
  const [savingLoginConfig, setSavingLoginConfig] = useState(false)
  const [expandedFolders, setExpandedFolders] = useState<string[]>([])
  const [showEditFolderDialog, setShowEditFolderDialog] = useState(false)
  const [editingFolder, setEditingFolder] = useState<any | null>(null)
  const [editFolderName, setEditFolderName] = useState('')

  // Extra model config
  const [modelIcon, setModelIcon] = useState<string>('')
  const [modelPrimaryColor, setModelPrimaryColor] = useState<string>('#1e40af')
  const [modelTags, setModelTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState<string>('')
  const [modelGroupFolder, setModelGroupFolder] = useState<string>('')
  const [modelOwnerName, setModelOwnerName] = useState<string>('')

  // Attachment storage configuration
  const [attachmentStorage, setAttachmentStorage] = useState({
    provider: 'minio',
    config: {
      // MinIO configuration
      minio: {
        endpoint: '',
        access_key: '',
        secret_key: '',
        bucket: '',
        region: 'us-east-1',
        use_ssl: true
      },
      // AWS S3 configuration
      s3: {
        access_key_id: '',
        secret_access_key: '',
        bucket: '',
        region: 'us-east-1'
      },
      // SFTP configuration
      sftp: {
        host: '',
        port: 22,
        username: '',
        password: '',
        path: '/uploads'
      },
      // FTP configuration
      ftp: {
        host: '',
        port: 21,
        username: '',
        password: '',
        path: '/uploads',
        passive: true
      }
    }
  })
  const [storageTestResult, setStorageTestResult] = useState<any>(null)
  const [testingStorage, setTestingStorage] = useState(false)

  // Attribute creation state
  const [showCreateAttributeDrawer, setShowCreateAttributeDrawer] = useState(false)
  const [createAttributeForm, setCreateAttributeForm] = useState({
    name: '',
    display_name: '',
    type: 'text',
    default_value: '',
    is_required: false,
    is_unique: false,
    options: [] as string[],
    // For data model entities type
    reference_model_id: '',
    reference_attribute_code: '',
    reference_attribute_label: '',
    // For currency type
    currency_code: 'USD',
    decimal_places: '2',
    // For rating type
    rating_scale: '5',
    rating_display: 'stars',
    // For address type
    default_country: '',
    address_format: 'standard',
    require_country: false,
    enable_geocoding: false,
    // For duration type
    duration_format: 'hh:mm:ss',
    max_duration: '',
    // For tags type
    allow_custom_tags: true,
    require_tags: false,
    max_tags: ''
  })

  useEffect(() => {
    const loadSpaceDetails = async () => {
      if (!selectedSpace?.id) return
      try {
        const [spaceRes, loginConfigRes] = await Promise.all([
          fetch(`/api/spaces/${selectedSpace.id}`),
          fetch(`/api/spaces/${selectedSpace.id}/login-config`),
        ])
        const spaceJson = await spaceRes.json().catch(() => ({}))
        const loginConfigJson = await loginConfigRes.json().catch(() => ({}))
        setSpaceDetails(spaceJson.space || null)
        setLoginPageConfig(normalizeLoginPageConfig(loginConfigJson.loginPageConfig))
      } catch {
        setSpaceDetails(null)
        setLoginPageConfig(DEFAULT_LOGIN_PAGE_CONFIG)
      }
    }
    loadSpaceDetails()
  }, [selectedSpace?.id])



  useEffect(() => {
    if (tab === 'members' && selectedSpace?.id) {
      loadMembers(selectedSpace.id)
      loadAuditLogs()
    }
    if (tab === 'data-model' && selectedSpace?.id) {
      loadModels()
      loadFolders()
    }
    if (tab === 'attachments' && selectedSpace?.id) {
      loadAttachmentStorageConfig()
    }
  }, [tab, selectedSpace?.id])

  useEffect(() => {
    if (activeModelTab === 'attributes' && editingModel?.id) {
      loadAttributes(editingModel.id)
    }
  }, [activeModelTab, editingModel?.id])

  const loadMembers = async (spaceId: string) => {
    try {
      const res = await fetch(`/api/spaces/${spaceId}/members`)
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to load members')
      }
      const json = await res.json()
      // Ensure we have a valid array
      const membersArray = Array.isArray(json.members) ? json.members : []
      setMembers(membersArray)
      if (membersArray.length === 0) {
        console.log('No members found for space:', spaceId)
      }
    } catch (e: any) {
      console.error('Error loading members:', e)
      showError(e.message || 'Failed to load members')
      setMembers([]) // Ensure members is always an array
    }
  }

  const saveLoginPageSettings = async () => {
    if (!selectedSpace?.id) return

    setSavingLoginConfig(true)
    try {
      const normalizedConfig = normalizeLoginPageConfig(loginPageConfig)
      const res = await fetch(`/api/spaces/${selectedSpace.id}/login-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ loginPageConfig: normalizedConfig }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save login page settings')
      }

      setLoginPageConfig(normalizedConfig)
      showSuccess('Login page customization saved')
    } catch (error: any) {
      console.error('Error saving login page settings:', error)
      showError(error.message || 'Failed to save login page settings')
    } finally {
      setSavingLoginConfig(false)
    }
  }

  const loadModels = async () => {
    if (!selectedSpace?.id) return
    setModelsLoading(true)
    try {
      const res = await fetch(`/api/data-models?page=1&limit=200&space_id=${selectedSpace.id}`)
      const json = await res.json().catch(() => ({}))
      setModels(json.dataModels || [])
    } catch (e) {
      showError('Failed to load data models')
    } finally {
      setModelsLoading(false)
    }
  }

  const loadFolders = async () => {
    if (!selectedSpace?.id) return
    try {
      const res = await fetch(`/api/folders?space_id=${selectedSpace.id}&type=data_model`)
      if (res.status === 503) {
        // Folders feature not available yet
        setFolders([])
        return
      }
      const json = await res.json().catch(() => ({}))
      setFolders(json.folders || [])
    } catch (e) {
      setFolders([])
    }
  }

  const loadAvailableSpaces = async () => {
    try {
      const res = await fetch('/api/spaces?page=1&limit=200')
      const json = await res.json().catch(() => ({}))
      setAvailableSpaces((json.spaces || []).filter((s: any) => s.id !== selectedSpace?.id))
    } catch (e) {
      setAvailableSpaces([])
    }
  }

  const openCreateModel = () => {
    // Show dialog to select data model type
    setShowDataModelTypeDialog(true)
    setSelectedDataModelType(null)
    setShowDatabaseSelection(false)
    setShowConnectionForm(false)
    setDatabaseSearch('')
    setSelectedDatabaseType(null)
    setConnectionForm({
      name: '',
      connection_type: 'database',
      db_type: 'postgres',
      host: '',
      port: '',
      database: '',
      username: '',
      password: '',
      schema: '',
      table: '',
      api_url: '',
      api_method: 'GET',
      api_headers: {},
      api_auth_type: 'none',
      api_auth_token: '',
      api_auth_username: '',
      api_auth_password: '',
      api_auth_apikey_name: '',
      api_auth_apikey_value: '',
      api_body: '',
      api_response_path: ''
    })
  }

  const handleSelectDataModelType = (type: 'internal' | 'external') => {
    setSelectedDataModelType(type)
    if (type === 'external') {
      setShowDatabaseSelection(true)
      setShowDataModelTypeDialog(false)
    } else {
      // Internal - proceed with existing flow
      setShowDataModelTypeDialog(false)
      setEditingModel(null)
      setModelForm({ name: '', display_name: '', description: '', slug: '' })
      setModelIcon('')
      setModelPrimaryColor('#1e40af')
      setModelTags([])
      setModelGroupFolder('')
      setModelOwnerName('')
      setShowModelDrawer(true)
    }
  }

  const handleSelectDatabase = (dbType: 'postgres' | 'mysql' | 'api') => {
    setSelectedDatabaseType(dbType)
    if (dbType === 'api') {
      setConnectionForm(prev => ({
        ...prev,
        connection_type: 'api',
        api_method: 'GET',
        api_auth_type: 'none'
      }))
    } else {
      setConnectionForm(prev => ({
        ...prev,
        connection_type: 'database',
        db_type: dbType,
        port: dbType === 'postgres' ? '5432' : '3306'
      }))
    }
    setShowDatabaseSelection(false)
    setShowConnectionForm(true)
  }

  const testConnection = async () => {
    if (!selectedSpace?.id) return

    setTestingConnection(true)
    setConnectionTestResult(null)

    try {
      if (connectionForm.connection_type === 'api') {
        // Test API connection
        const res = await fetch('/api/external-connections/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            space_id: selectedSpace.id,
            connection_type: 'api',
            api_url: connectionForm.api_url,
            api_method: connectionForm.api_method,
            api_headers: connectionForm.api_headers,
            api_auth_type: connectionForm.api_auth_type,
            api_auth_token: connectionForm.api_auth_token,
            api_auth_username: connectionForm.api_auth_username,
            api_auth_password: connectionForm.api_auth_password,
            api_auth_apikey_name: connectionForm.api_auth_apikey_name,
            api_auth_apikey_value: connectionForm.api_auth_apikey_value,
            api_body: connectionForm.api_body
          })
        })

        const json = await res.json()
        if (res.ok && json.success) {
          setConnectionTestResult({ success: true, data: json.data, sampleResponse: json.sampleResponse })
          showSuccess('API connection test successful')
        } else {
          setConnectionTestResult({ success: false, error: json.error || 'API connection failed' })
          showError('API connection test failed')
        }
      } else {
        // Test database connection
        const res = await fetch('/api/external-connections/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            space_id: selectedSpace.id,
            connection_type: 'database',
            db_type: connectionForm.db_type,
            host: connectionForm.host,
            port: connectionForm.port ? parseInt(connectionForm.port) : undefined,
            database: connectionForm.database || undefined,
            username: connectionForm.username || undefined,
            password: connectionForm.password || undefined
          })
        })

        const json = await res.json()
        if (res.ok && json.ok) {
          setConnectionTestResult({ success: true, schemas: json.schemas, tablesBySchema: json.tablesBySchema })
          setConnectionSchemas(json.schemas || [])
          setConnectionTables(json.tablesBySchema || {})
          showSuccess('Connection test successful')
        } else {
          setConnectionTestResult({ success: false, error: json.error || 'Connection failed' })
          showError('Connection test failed')
        }
      }
    } catch (error: any) {
      setConnectionTestResult({ success: false, error: error.message || 'Connection test failed' })
      showError('Connection test failed')
    } finally {
      setTestingConnection(false)
    }
  }

  const saveExternalConnection = async () => {
    if (!selectedSpace?.id) return

    if (!connectionForm.name) {
      showError('Please provide a connection name')
      return
    }

    if (connectionForm.connection_type === 'api') {
      // Validate API connection
      if (!connectionForm.api_url) {
        showError('Please provide an API URL')
        return
      }
    } else {
      // Validate database connection
      if (!connectionForm.host || !connectionForm.db_type) {
        showError('Please fill in all required fields')
        return
      }

      // For PostgreSQL, schema and table are required. For MySQL, schema might be optional
      if (!connectionForm.table) {
        showError('Please select a table')
        return
      }

      // For PostgreSQL, schema is required. For MySQL, use database name as schema if not provided
      const schemaToUse = connectionForm.schema || (connectionForm.db_type === 'mysql' ? connectionForm.database : null)
      if (connectionForm.db_type === 'postgres' && !schemaToUse) {
        showError('Please select a schema')
        return
      }
    }

    try {
      let connectionPayload: any

      if (connectionForm.connection_type === 'api') {
        // Create API connection
        connectionPayload = {
          space_id: selectedSpace.id,
          name: connectionForm.name,
          connection_type: 'api',
          db_type: 'api', // Store as 'api' for compatibility
          api_url: connectionForm.api_url,
          api_method: connectionForm.api_method,
          api_headers: connectionForm.api_headers,
          api_auth_type: connectionForm.api_auth_type,
          api_auth_token: connectionForm.api_auth_token || null,
          api_auth_username: connectionForm.api_auth_username || null,
          api_auth_password: connectionForm.api_auth_password || null,
          api_auth_apikey_name: connectionForm.api_auth_apikey_name || null,
          api_auth_apikey_value: connectionForm.api_auth_apikey_value || null,
          api_body: connectionForm.api_body || null,
          api_response_path: connectionForm.api_response_path || null
        }
      } else {
        // Create database connection
        connectionPayload = {
          space_id: selectedSpace.id,
          name: connectionForm.name,
          connection_type: 'database',
          db_type: connectionForm.db_type,
          host: connectionForm.host,
          port: connectionForm.port ? parseInt(connectionForm.port) : (connectionForm.db_type === 'postgres' ? 5432 : 3306),
          database: connectionForm.database || null,
          username: connectionForm.username || null,
          password: connectionForm.password || null,
          options: {}
        }
      }

      const connectionRes = await fetch('/api/external-connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(connectionPayload)
      })

      if (!connectionRes.ok) {
        const error = await connectionRes.json().catch(() => ({}))
        throw new Error(error.error || 'Failed to create connection')
      }

      const connectionData = await connectionRes.json()
      const connectionId = connectionData.connection?.id || connectionData.id

      // Create data model linked to external connection
      let modelPayload: any
      if (connectionForm.connection_type === 'api') {
        modelPayload = {
          name: connectionForm.name.toLowerCase().replace(/\s+/g, '_'),
          display_name: connectionForm.name,
          description: `External API data source: ${connectionForm.api_url}`,
          slug: connectionForm.name.toLowerCase().replace(/\s+/g, '_'),
          space_ids: [selectedSpace.id],
          source_type: 'EXTERNAL',
          external_connection_id: connectionId
        }
      } else {
        const schemaToUse = connectionForm.schema || (connectionForm.db_type === 'mysql' ? connectionForm.database : null)
        modelPayload = {
          name: connectionForm.table || connectionForm.name.toLowerCase().replace(/\s+/g, '_'),
          display_name: connectionForm.name,
          description: `External data source: ${connectionForm.db_type} - ${connectionForm.host}/${connectionForm.database || ''}`,
          slug: connectionForm.table || connectionForm.name.toLowerCase().replace(/\s+/g, '_'),
          space_ids: [selectedSpace.id],
          source_type: 'EXTERNAL',
          external_connection_id: connectionId,
          external_schema: schemaToUse || connectionForm.database || null,
          external_table: connectionForm.table
        }
      }

      const modelRes = await fetch('/api/data-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(modelPayload)
      })

      if (!modelRes.ok) {
        throw new Error('Failed to create data model')
      }

      showSuccess('External data source connected successfully')
      setShowConnectionForm(false)
      setShowDatabaseSelection(false)
      setSelectedDataModelType(null)
      setConnectionForm({
        name: '',
        connection_type: 'database',
        db_type: 'postgres',
        host: '',
        port: '',
        database: '',
        username: '',
        password: '',
        schema: '',
        table: '',
        api_url: '',
        api_method: 'GET',
        api_headers: {},
        api_auth_type: 'none',
        api_auth_token: '',
        api_auth_username: '',
        api_auth_password: '',
        api_auth_apikey_name: '',
        api_auth_apikey_value: '',
        api_body: '',
        api_response_path: ''
      })
      await loadModels()
    } catch (error: any) {
      console.error('Error saving external connection:', error)
      showError(error.message || 'Failed to save external connection')
    }
  }

  // Data sources list (from asset management system)
  const [allDataSources] = useState([
    {
      id: 'postgres',
      name: 'PostgreSQL',
      description: 'Connect to a PostgreSQL database',
      icon: '🐘'
    },
    {
      id: 'mysql',
      name: 'MySQL',
      description: 'Connect to a MySQL database',
      icon: '🗄️'
    },
    {
      id: 'api',
      name: 'REST API',
      description: 'Connect to a REST API endpoint',
      icon: '🔌'
    }
  ])

  // filteredDatabaseTypes is computed from allDataSources (which uses asset management system)
  const filteredDatabaseTypes = useMemo(() => {
    return allDataSources.filter(db =>
      db.name.toLowerCase().includes(databaseSearch.toLowerCase()) ||
      db.description.toLowerCase().includes(databaseSearch.toLowerCase())
    )
  }, [allDataSources, databaseSearch])

  const openEditModel = (model: any) => {
    setEditingModel(model)
    setModelForm({
      name: model.name || '',
      display_name: model.display_name || '',
      description: model.description || '',
      slug: model.slug || ''
    })
    setModelIcon(model.icon || '')
    setModelPrimaryColor(model.primary_color || '#1e40af')
    setModelTags(model.tags || [])
    setModelGroupFolder(model.group_folder || '')
    setModelOwnerName(model.owner_name || '')
    setShowModelDrawer(true)
  }


  const saveModel = async () => {
    try {
      const body = {
        ...modelForm,
        icon: modelIcon,
        space_ids: [selectedSpace!.id],
        primary_color: modelPrimaryColor,
        tags: modelTags,
        group_folder: modelGroupFolder,
        owner_name: modelOwnerName
      }

      const url = editingModel ? `/api/data-models/${editingModel.id}` : '/api/data-models'
      const method = editingModel ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!res.ok) throw new Error(editingModel ? 'Failed to update model' : 'Failed to create model')
      setShowModelDrawer(false)
      await loadModels()
      showSuccess(editingModel ? 'Model updated' : 'Model created')
    } catch (e) {
      showError(editingModel ? 'Failed to update model' : 'Failed to create model')
    }
  }

  const deleteModel = async (m: any) => {
    if (!confirm(`Delete model "${m.display_name || m.name}"?`)) return
    try {
      const res = await fetch(`/api/data-models/${m.id}`, { method: 'DELETE' })
      if (res.ok) { await loadModels(); showSuccess('Model deleted') } else { throw new Error() }
    } catch {
      showError('Failed to delete model')
    }
  }

  const loadAttributes = async (modelId: string) => {
    setAttributesLoading(true)
    try {
      const res = await fetch(`/api/data-models/${modelId}/attributes`)
      const json = await res.json().catch(() => ({}))
      setAttributes(json.attributes || [])
    } catch {
      setAttributes([])
    } finally {
      setAttributesLoading(false)
    }
  }

  const loadAvailableModels = async () => {
    if (!selectedSpace?.id) return
    try {
      const res = await fetch(`/api/data-models?page=1&limit=200&space_id=${selectedSpace.id}`)
      const json = await res.json().catch(() => ({}))
      setAvailableModels(json.dataModels || [])
    } catch (e) {
      setAvailableModels([])
    }
  }

  const loadReferenceModelAttributes = async (modelId: string) => {
    if (!modelId) {
      setReferenceModelAttributes([])
      return
    }

    setLoadingReferenceAttributes(true)
    try {
      const res = await fetch(`/api/data-models/${modelId}/attributes`)
      const json = await res.json().catch(() => ({}))
      setReferenceModelAttributes(json.attributes || [])
    } catch (e) {
      setReferenceModelAttributes([])
    } finally {
      setLoadingReferenceAttributes(false)
    }
  }

  const openCreateAttribute = () => {
    setCreateAttributeForm({
      name: '',
      display_name: '',
      type: 'text',
      default_value: '',
      is_required: false,
      is_unique: false,
      options: [],
      reference_model_id: '',
      reference_attribute_code: '',
      reference_attribute_label: '',
      currency_code: 'USD',
      decimal_places: '2',
      rating_scale: '5',
      rating_display: 'stars',
      default_country: '',
      address_format: 'standard',
      require_country: false,
      enable_geocoding: false,
      duration_format: 'hh:mm:ss',
      max_duration: '',
      allow_custom_tags: true,
      require_tags: false,
      max_tags: ''
    })
    setShowCreateAttributeDrawer(true)
    loadAvailableModels()
  }

  const openAttributeDrawer = (attribute: any) => {
    console.log('Opening attribute drawer for:', attribute)
    setSelectedAttribute(attribute)
    setShowAttributeDrawer(true)
  }

  const handleAttributeSave = (updatedAttribute: any) => {
    console.log('Saving attribute:', updatedAttribute)
    setAttributes(prev => prev.map(attr =>
      attr.id === updatedAttribute.id ? updatedAttribute : attr
    ))
    setShowAttributeDrawer(false)
    setSelectedAttribute(null)
    showSuccess('Attribute updated successfully')
  }

  const handleAttributeDelete = (attributeId: string) => {
    console.log('Deleting attribute:', attributeId)
    setAttributes(prev => prev.filter(attr => attr.id !== attributeId))
    setShowAttributeDrawer(false)
    setSelectedAttribute(null)
    showSuccess('Attribute deleted successfully')
  }

  const handleAttributeReorder = (attributeId: string, newOrder: number) => {
    console.log('Reordering attribute:', attributeId, 'to order:', newOrder)
    setAttributes(prev => {
      const sorted = [...prev].sort((a, b) => a.order - b.order)
      const currentIndex = sorted.findIndex(attr => attr.id === attributeId)
      const targetIndex = sorted.findIndex(attr => attr.order === newOrder)

      if (currentIndex === -1 || targetIndex === -1) return prev

      const newSorted = [...sorted]
      const [movedItem] = newSorted.splice(currentIndex, 1)
      newSorted.splice(targetIndex, 0, movedItem)

      return newSorted.map((attr, index) => ({
        ...attr,
        order: index
      }))
    })
    showSuccess('Attribute order updated')
  }

  const createAttribute = async () => {
    if (!editingModel?.id) return

    try {
      const res = await fetch(`/api/data-models/${editingModel.id}/attributes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createAttributeForm)
      })

      if (!res.ok) throw new Error('Failed to create attribute')

      setShowCreateAttributeDrawer(false)
      await loadAttributes(editingModel.id)
      showSuccess('Attribute created')
    } catch (e) {
      showError('Failed to create attribute')
    }
  }

  const createFolder = async () => {
    if (!folderForm.name.trim()) return

    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: folderForm.name,
          type: 'data_model',
          space_id: selectedSpace?.id,
          parent_id: folderForm.parent_id || null
        })
      })

      if (res.status === 503) {
        showError('Folders feature not yet available. Please run database migrations.')
        return
      }

      if (!res.ok) throw new Error('Failed to create folder')

      setShowCreateFolderDialog(false)
      setFolderForm({ name: '', parent_id: '' })
      await loadFolders()
      showSuccess('Folder created')
    } catch (e) {
      showError('Failed to create folder')
    }
  }

  const loadAttachmentStorageConfig = async () => {
    if (!selectedSpace?.id) return
    try {
      const res = await fetch(`/api/spaces/${selectedSpace.id}/attachment-storage`)
      const json = await res.json().catch(() => ({}))
      if (json.storage) {
        setAttachmentStorage(json.storage)
      }
    } catch (e) {
      console.error('Failed to load attachment storage config:', e)
    }
  }

  const saveAttachmentStorageConfig = async () => {
    if (!selectedSpace?.id) return
    try {
      const res = await fetch(`/api/spaces/${selectedSpace.id}/attachment-storage`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attachmentStorage)
      })

      if (!res.ok) throw new Error('Failed to save storage configuration')

      showSuccess('Attachment storage configuration saved')
    } catch (e) {
      showError('Failed to save storage configuration')
    }
  }

  const testStorageConnection = async () => {
    if (!selectedSpace?.id) return
    setTestingStorage(true)
    try {
      const res = await fetch(`/api/spaces/${selectedSpace.id}/attachment-storage/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(attachmentStorage)
      })

      const json = await res.json()
      setStorageTestResult(json)

      if (json.success) {
        showSuccess('Storage connection test successful')
      } else {
        showError('Storage connection test failed')
      }
    } catch (e) {
      setStorageTestResult({ success: false, error: 'Test failed' })
      showError('Storage connection test failed')
    } finally {
      setTestingStorage(false)
    }
  }

  const openShareModel = (model: any) => {
    setSelectedModelForSharing(model)
    setShareForm({ space_ids: model.shared_spaces || [] })
    setShowShareModelDialog(true)
    loadAvailableSpaces()
  }

  const shareModel = async () => {
    if (!selectedModelForSharing?.id) return

    try {
      const res = await fetch(`/api/data-models/${selectedModelForSharing.id}/share`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ space_ids: shareForm.space_ids })
      })

      if (!res.ok) throw new Error('Failed to share model')

      setShowShareModelDialog(false)
      await loadModels()
      showSuccess('Model sharing updated')
    } catch (e) {
      showError('Failed to share model')
    }
  }

  const moveModelToFolder = async (modelId: string, folderId: string | null) => {
    try {
      const res = await fetch(`/api/data-models/${modelId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folder_id: folderId })
      })

      if (!res.ok) throw new Error('Failed to move model')

      await loadModels()
      showSuccess('Model moved')
    } catch (e) {
      showError('Failed to move model')
    }
  }

  const handleFolderExpand = (folderId: string) => {
    setExpandedFolders(prev => prev.includes(folderId) ? prev : [...prev, folderId])
  }

  const handleFolderCollapse = (folderId: string) => {
    setExpandedFolders(prev => prev.filter(id => id !== folderId))
  }

  const handleCreateFolder = async (name: string, parentId?: string) => {
    try {
      const res = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          parent_id: parentId,
          space_id: selectedSpace?.id,
          type: 'data_model'
        })
      })
      if (res.ok) {
        await loadFolders()
        showSuccess('Folder created')
      } else {
        throw new Error()
      }
    } catch {
      showError('Failed to create folder')
    }
  }

  const handleEditFolder = (folder: any) => {
    setEditingFolder(folder)
    setEditFolderName(folder.name)
    setShowEditFolderDialog(true)
  }

  const saveFolderEdit = async () => {
    if (!editingFolder || !editFolderName.trim() || editFolderName === editingFolder.name) {
      setShowEditFolderDialog(false)
      return
    }

    try {
      const res = await fetch(`/api/folders/${editingFolder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editFolderName.trim(),
          parent_id: editingFolder.parent_id || null
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to update folder')
      }

      showSuccess('Folder renamed successfully')
      setShowEditFolderDialog(false)
      setEditingFolder(null)
      setEditFolderName('')
      await loadFolders()
    } catch (e: any) {
      showError(e.message || 'Failed to rename folder')
    }
  }

  const handleDeleteFolder = async (folder: any) => {
    if (!confirm(`Delete folder "${folder.name}"? This will move all models to root level.`)) return
    try {
      const res = await fetch(`/api/folders/${folder.id}`, { method: 'DELETE' })
      if (res.ok) {
        await loadFolders()
        await loadModels()
        showSuccess('Folder deleted')
      } else {
        throw new Error()
      }
    } catch {
      showError('Failed to delete folder')
    }
  }







  if (!selectedSpace) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Space Settings</CardTitle>
            <CardDescription>Space not found.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col h-screen">
      {/* Only show header if NOT accessed from data management (where breadcrumbs show the info) */}
      {!fromDataManagement && !fromSpaceSidebar && (
        <SpaceSettingsHeader
          spaceName={selectedSpace?.name || 'Space Settings'}
          spaceDescription={selectedSpace?.description}
          isActive={selectedSpace?.is_active}
          homepage={homepage}
          spaceSlug={selectedSpace?.slug}
          spaceId={selectedSpace?.id}
        />
      )}

      <div className="flex flex-1 overflow-hidden min-h-0">
        <Tabs value={tab} onValueChange={handleTabChange} className="flex flex-1 min-h-0 w-full">
          {/* Only show sidebar in body if NOT accessed from data management (where it's shown in secondary sidebar) */}
          {!fromDataManagement && !fromSpaceSidebar && (
            <SpaceSettingsSidebar
              activeTab={tab}
              onTabChange={handleTabChange}
              showAllTabs={true}
            />
          )}

          {/* Main Content Area */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            <div className="min-h-full space-y-6 px-6 py-6">
              <TabsContent value="details" className="mt-0 space-y-6 w-full">
                {/* Space Detail Header */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Space Detail</h2>
                  {selectedSpace?.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {selectedSpace.description}
                    </p>
                  )}
                </div>

                {/* Details Sub-tabs */}
                <div className="w-full">
                  <Tabs defaultValue="basic">
                    <TabsList className="flex gap-2 justify-start">
                      <TabsTrigger value="basic" className="flex items-center gap-2 justify-start">
                        <Settings className="h-4 w-4" />
                        Basic Information
                      </TabsTrigger>
                      <TabsTrigger value="login" className="flex items-center gap-2 justify-start">
                        <Layout className="h-4 w-4" />
                        Login Page
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="basic" className="space-y-6 mt-6">
                      <Card className="border-0 shadow-lg bg-card">
                        <CardHeader className="pb-4">
                          <CardTitle className="flex items-center space-x-2 text-lg">
                            <Settings className="h-5 w-5" />
                            <span>Basic Information</span>
                          </CardTitle>
                          <CardDescription>Update your space's core details and configuration</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                              <Label htmlFor="space-name" className="text-sm font-medium">Space Name</Label>
                              <Input
                                id="space-name"
                                defaultValue={selectedSpace.name}
                                className="h-11 border border-input bg-background"
                                onBlur={async (e) => {
                                  const name = e.currentTarget.value.trim()
                                  if (!name || name === selectedSpace.name) return
                                  const res = await fetch(`/api/spaces/${selectedSpace.id}`, {
                                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ name })
                                  })
                                  if (res.ok) { showSuccess('Space name updated'); await refreshSpaces() } else { showError('Failed to update name') }
                                }}
                              />
                              <p className="text-xs text-muted-foreground">The display name for your space</p>
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="space-slug" className="text-sm font-medium">Custom URL (Slug)</Label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">/</span>
                                <Input
                                  id="space-slug"
                                  defaultValue={selectedSpace.slug || ''}
                                  className="h-11 pl-8 border border-input bg-background"
                                  placeholder="my-space"
                                  onBlur={async (e) => {
                                    const slug = e.currentTarget.value.trim()
                                    if (slug === (selectedSpace.slug || '')) return
                                    const res = await fetch(`/api/spaces/${selectedSpace.id}`, {
                                      method: 'PUT', headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ slug })
                                    })
                                    if (res.ok) { showSuccess('Slug updated'); await refreshSpaces() } else { showError('Failed to update slug') }
                                  }}
                                />
                              </div>
                              <p className="text-xs text-muted-foreground">Custom URL: /{selectedSpace.slug || selectedSpace.id}/dashboard</p>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="space-desc" className="text-sm font-medium">Description</Label>
                            <Textarea
                              id="space-desc"
                              defaultValue={selectedSpace.description || ''}
                              rows={4}
                              className="resize-none border border-input bg-background"
                              placeholder="Describe what this space is used for..."
                              onBlur={async (e) => {
                                const description = e.currentTarget.value
                                if (description === (selectedSpace.description || '')) return
                                const res = await fetch(`/api/spaces/${selectedSpace.id}`, {
                                  method: 'PUT', headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({ description })
                                })
                                if (res.ok) { showSuccess('Description updated'); await refreshSpaces() } else { showError('Failed to update description') }
                              }}
                            />
                            <p className="text-xs text-muted-foreground">A brief description of your space's purpose</p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="login" className="space-y-6 mt-6">
                      <Card className="border-0 shadow-lg bg-card">
                        <CardHeader className="gap-4 pb-2 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-2">
                            <CardTitle className="flex items-center space-x-2 text-lg">
                              <Layout className="h-5 w-5" />
                              <span>Login Page Customization</span>
                            </CardTitle>
                            <CardDescription>
                              Configure the actual space login experience, not just the artwork. These settings drive the live sign-in page.
                            </CardDescription>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" asChild>
                              <a
                                href={`/${selectedSpace?.slug || selectedSpace?.id}/auth/signin`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                                Open Login Page
                              </a>
                            </Button>
                            <Button onClick={saveLoginPageSettings} disabled={savingLoginConfig}>
                              {savingLoginConfig ? 'Saving...' : 'Save Login Page'}
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="rounded-2xl border border-border/60 bg-muted/30 p-5">
                            <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
                              <div className="space-y-4">
                                <div>
                                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Hero Preview</p>
                                  <h3 className="mt-2 text-3xl font-semibold text-foreground">
                                    {loginPageConfig.heroTitle || DEFAULT_LOGIN_PAGE_CONFIG.heroTitle}
                                  </h3>
                                  <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                                    {loginPageConfig.heroDescription || DEFAULT_LOGIN_PAGE_CONFIG.heroDescription}
                                  </p>
                                </div>
                                <div
                                  className="min-h-[180px] rounded-2xl border border-white/40 p-5"
                                  style={{
                                    background:
                                      loginPageConfig.backgroundType === 'color'
                                        ? loginPageConfig.backgroundColor
                                        : loginPageConfig.backgroundType === 'image' && loginPageConfig.backgroundImage
                                          ? `url(${loginPageConfig.backgroundImage}) center / cover no-repeat`
                                          : `linear-gradient(${loginPageConfig.gradient?.angle || 135}deg, ${loginPageConfig.gradient?.from || '#eff6ff'}, ${loginPageConfig.gradient?.to || '#dbeafe'})`,
                                  }}
                                >
                                  <div
                                    className="ml-auto flex max-w-sm flex-col gap-3 rounded-2xl border p-4"
                                    style={{
                                      backgroundColor: loginPageConfig.cardStyle?.backgroundColor || DEFAULT_LOGIN_PAGE_CONFIG.cardStyle.backgroundColor,
                                      borderColor: loginPageConfig.cardStyle?.borderColor || DEFAULT_LOGIN_PAGE_CONFIG.cardStyle.borderColor,
                                      color: loginPageConfig.cardStyle?.textColor || DEFAULT_LOGIN_PAGE_CONFIG.cardStyle.textColor,
                                      borderRadius: loginPageConfig.cardStyle?.borderRadius || DEFAULT_LOGIN_PAGE_CONFIG.cardStyle.borderRadius,
                                      boxShadow: loginPageConfig.cardStyle?.shadow === false ? 'none' : '0 20px 45px rgba(15, 23, 42, 0.12)',
                                    }}
                                  >
                                    <div className="space-y-1">
                                      <p className="text-lg font-semibold">{loginPageConfig.title || DEFAULT_LOGIN_PAGE_CONFIG.title}</p>
                                      <p className="text-sm opacity-80">{loginPageConfig.description || DEFAULT_LOGIN_PAGE_CONFIG.description}</p>
                                    </div>
                                    <div className="rounded-md border bg-background/70 px-3 py-2 text-sm text-muted-foreground">name@example.com</div>
                                    <div className="rounded-md border bg-background/70 px-3 py-2 text-sm text-muted-foreground">Password</div>
                                    <div className="rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground">
                                      {loginPageConfig.signInButtonLabel || DEFAULT_LOGIN_PAGE_CONFIG.signInButtonLabel}
                                    </div>
                                    {loginPageConfig.helpText ? (
                                      <p className="text-xs opacity-80">{loginPageConfig.helpText}</p>
                                    ) : null}
                                  </div>
                                </div>
                              </div>

                              <div className="grid gap-4">
                                <Card className="border border-border/60 shadow-none">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Content</CardTitle>
                                    <CardDescription>Headline, helper copy, and call-to-action text.</CardDescription>
                                  </CardHeader>
                                  <CardContent className="grid gap-4">
                                    <div className="grid gap-4 md:grid-cols-2">
                                      <div className="space-y-2">
                                        <Label>Sign-in Title</Label>
                                        <Input
                                          value={loginPageConfig.title || ''}
                                          onChange={(e) => setLoginPageConfig((prev: any) => ({ ...prev, title: e.target.value }))}
                                          placeholder="Welcome back"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Button Label</Label>
                                        <Input
                                          value={loginPageConfig.signInButtonLabel || ''}
                                          onChange={(e) => setLoginPageConfig((prev: any) => ({ ...prev, signInButtonLabel: e.target.value }))}
                                          placeholder="Sign in"
                                        />
                                      </div>
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Sign-in Description</Label>
                                      <Textarea
                                        value={loginPageConfig.description || ''}
                                        onChange={(e) => setLoginPageConfig((prev: any) => ({ ...prev, description: e.target.value }))}
                                        rows={2}
                                        placeholder="Sign in to access this workspace."
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Hero Title</Label>
                                      <Input
                                        value={loginPageConfig.heroTitle || ''}
                                        onChange={(e) => setLoginPageConfig((prev: any) => ({ ...prev, heroTitle: e.target.value }))}
                                        placeholder="Your space, ready when you are"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Hero Description</Label>
                                      <Textarea
                                        value={loginPageConfig.heroDescription || ''}
                                        onChange={(e) => setLoginPageConfig((prev: any) => ({ ...prev, heroDescription: e.target.value }))}
                                        rows={3}
                                        placeholder="Secure access for your team, data, and workflows in one place."
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label>Helper Text</Label>
                                      <Textarea
                                        value={loginPageConfig.helpText || ''}
                                        onChange={(e) => setLoginPageConfig((prev: any) => ({ ...prev, helpText: e.target.value }))}
                                        rows={2}
                                        placeholder="Optional support text shown under the form."
                                      />
                                    </div>
                                    <div className="grid gap-4 md:grid-cols-2">
                                      <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                                        <div>
                                          <p className="text-sm font-medium">Show Logo</p>
                                          <p className="text-xs text-muted-foreground">Display a space-specific mark above the hero title.</p>
                                        </div>
                                        <Select
                                          value={loginPageConfig.showLogo === false ? 'hide' : 'show'}
                                          onValueChange={(value) => setLoginPageConfig((prev: any) => ({ ...prev, showLogo: value === 'show' }))}
                                        >
                                          <SelectTrigger className="w-[110px]">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="show">Show</SelectItem>
                                            <SelectItem value="hide">Hide</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Logo URL</Label>
                                        <Input
                                          value={loginPageConfig.logoUrl || ''}
                                          onChange={(e) => setLoginPageConfig((prev: any) => ({ ...prev, logoUrl: e.target.value }))}
                                          placeholder="https://example.com/logo.svg"
                                        />
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>

                                <Card className="border border-border/60 shadow-none">
                                  <CardHeader className="pb-3">
                                    <CardTitle className="text-base">Visual Style</CardTitle>
                                    <CardDescription>Background, layout split, and card appearance.</CardDescription>
                                  </CardHeader>
                                  <CardContent className="grid gap-4">
                                    <div className="grid gap-4 md:grid-cols-3">
                                      <div className="space-y-2">
                                        <Label>Background Type</Label>
                                        <Select
                                          value={loginPageConfig.backgroundType || 'gradient'}
                                          onValueChange={(value) => setLoginPageConfig((prev: any) => ({ ...prev, backgroundType: value }))}
                                        >
                                          <SelectTrigger>
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="gradient">Gradient</SelectItem>
                                            <SelectItem value="color">Solid Color</SelectItem>
                                            <SelectItem value="image">Image</SelectItem>
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Left Panel Width</Label>
                                        <Input
                                          value={loginPageConfig.leftPanelWidth || ''}
                                          onChange={(e) => setLoginPageConfig((prev: any) => ({ ...prev, leftPanelWidth: e.target.value }))}
                                          placeholder="60%"
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Right Panel Width</Label>
                                        <Input
                                          value={loginPageConfig.rightPanelWidth || ''}
                                          onChange={(e) => setLoginPageConfig((prev: any) => ({ ...prev, rightPanelWidth: e.target.value }))}
                                          placeholder="40%"
                                        />
                                      </div>
                                    </div>

                                    {loginPageConfig.backgroundType === 'color' ? (
                                      <div className="space-y-2">
                                        <Label>Background Color</Label>
                                        <ColorInput
                                          value={loginPageConfig.backgroundColor || '#f8fafc'}
                                          onChange={(value) => setLoginPageConfig((prev: any) => ({ ...prev, backgroundColor: value }))}
                                          allowImageVideo={false}
                                        />
                                      </div>
                                    ) : null}

                                    {loginPageConfig.backgroundType === 'gradient' ? (
                                      <div className="grid gap-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                          <Label>Gradient From</Label>
                                          <ColorInput
                                            value={loginPageConfig.gradient?.from || '#eff6ff'}
                                            onChange={(value) => setLoginPageConfig((prev: any) => ({
                                              ...prev,
                                              gradient: { ...(prev.gradient || {}), from: value },
                                            }))}
                                            allowImageVideo={false}
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Gradient To</Label>
                                          <ColorInput
                                            value={loginPageConfig.gradient?.to || '#dbeafe'}
                                            onChange={(value) => setLoginPageConfig((prev: any) => ({
                                              ...prev,
                                              gradient: { ...(prev.gradient || {}), to: value },
                                            }))}
                                            allowImageVideo={false}
                                          />
                                        </div>
                                        <div className="space-y-2">
                                          <Label>Angle</Label>
                                          <Input
                                            type="number"
                                            value={loginPageConfig.gradient?.angle || 135}
                                            onChange={(e) => setLoginPageConfig((prev: any) => ({
                                              ...prev,
                                              gradient: { ...(prev.gradient || {}), angle: Number(e.target.value) || 135 },
                                            }))}
                                            min="0"
                                            max="360"
                                          />
                                        </div>
                                      </div>
                                    ) : null}

                                    {loginPageConfig.backgroundType === 'image' ? (
                                      <div className="space-y-2">
                                        <Label>Background Image URL</Label>
                                        <Input
                                          value={loginPageConfig.backgroundImage || ''}
                                          onChange={(e) => setLoginPageConfig((prev: any) => ({ ...prev, backgroundImage: e.target.value }))}
                                          placeholder="https://example.com/background.jpg"
                                        />
                                      </div>
                                    ) : null}

                                    <div className="grid gap-4 md:grid-cols-2">
                                      <div className="space-y-2">
                                        <Label>Card Background</Label>
                                        <ColorInput
                                          value={loginPageConfig.cardStyle?.backgroundColor || DEFAULT_LOGIN_PAGE_CONFIG.cardStyle.backgroundColor}
                                          onChange={(value) => setLoginPageConfig((prev: any) => ({
                                            ...prev,
                                            cardStyle: { ...(prev.cardStyle || {}), backgroundColor: value },
                                          }))}
                                          allowImageVideo={false}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Card Text Color</Label>
                                        <ColorInput
                                          value={loginPageConfig.cardStyle?.textColor || DEFAULT_LOGIN_PAGE_CONFIG.cardStyle.textColor}
                                          onChange={(value) => setLoginPageConfig((prev: any) => ({
                                            ...prev,
                                            cardStyle: { ...(prev.cardStyle || {}), textColor: value },
                                          }))}
                                          allowImageVideo={false}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Card Border Color</Label>
                                        <ColorInput
                                          value={loginPageConfig.cardStyle?.borderColor || DEFAULT_LOGIN_PAGE_CONFIG.cardStyle.borderColor}
                                          onChange={(value) => setLoginPageConfig((prev: any) => ({
                                            ...prev,
                                            cardStyle: { ...(prev.cardStyle || {}), borderColor: value },
                                          }))}
                                          allowImageVideo={false}
                                        />
                                      </div>
                                      <div className="space-y-2">
                                        <Label>Card Radius</Label>
                                        <Input
                                          type="number"
                                          value={loginPageConfig.cardStyle?.borderRadius || DEFAULT_LOGIN_PAGE_CONFIG.cardStyle.borderRadius}
                                          onChange={(e) => setLoginPageConfig((prev: any) => ({
                                            ...prev,
                                            cardStyle: { ...(prev.cardStyle || {}), borderRadius: Number(e.target.value) || DEFAULT_LOGIN_PAGE_CONFIG.cardStyle.borderRadius },
                                          }))}
                                          min="0"
                                        />
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                  </Tabs>
                </div>
              </TabsContent>

              <TabsContent value="members" className="mt-0 space-y-6 w-full">
                {/* Members Header */}
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-foreground">Members</h2>
                  <p className="text-sm text-muted-foreground mt-2">
                    Manage team members, permissions, and access control for this space
                  </p>
                </div>

                {/* Members Sub-tabs */}
                <div className="w-full">
                  <Tabs defaultValue="members">
                    <TabsList className="flex gap-2 justify-start flex-wrap">
                      <TabsTrigger value="members" className="justify-start flex items-center gap-2">
                        <UsersIcon className="h-4 w-4" />
                        Members
                      </TabsTrigger>
                      <TabsTrigger value="groups" className="justify-start flex items-center gap-2">
                        <Folder className="h-4 w-4" />
                        Groups
                      </TabsTrigger>
                      <TabsTrigger value="roles" className="justify-start flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Roles
                      </TabsTrigger>
                      <TabsTrigger value="permissions" className="justify-start flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Permissions
                      </TabsTrigger>
                      <TabsTrigger value="audit" className="justify-start flex items-center gap-2">
                        <Archive className="h-4 w-4" />
                        Audit Log
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="members" className="space-y-6 mt-6">
                      <MemberManagementPanel
                        spaceId={selectedSpace.id}
                        members={members}
                        onInvite={handleInviteUser}
                        onUpdateRole={handleUpdateRole}
                        onRemoveMember={handleRemoveMember}
                        onBulkOperation={handleBulkOperation}
                        canManageMembers={canManageMembers}
                        loading={false}
                      />
                    </TabsContent>

                    <TabsContent value="groups" className="space-y-6 mt-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Groups</CardTitle>
                          <CardDescription>
                            Manage member groups and group assignments
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center py-8 text-muted-foreground">
                            <Folder className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Group management coming soon...</p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="roles" className="space-y-6 mt-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Roles</CardTitle>
                          <CardDescription>
                            Manage role definitions and role assignments
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="text-center py-8 text-muted-foreground">
                            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p>Role management coming soon...</p>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="permissions" className="space-y-6 mt-6">
                      <MemberPermissionsPanel
                        spaceId={selectedSpace.id}
                        members={members}
                        onUpdatePermissions={handleUpdatePermissions}
                        canManagePermissions={canManageMembers}
                      />
                    </TabsContent>

                    <TabsContent value="audit" className="space-y-6 mt-6">
                      <MemberAuditLog
                        spaceId={selectedSpace.id}
                        auditLogs={auditLogs}
                        loading={auditLogsLoading}
                      />
                    </TabsContent>
                  </Tabs>
                </div>
              </TabsContent>

              <TabsContent value="data-model" className="mt-0 space-y-6 w-full min-h-full">
                <DataModelBrowser spaceId={selectedSpace?.id || ''} />
              </TabsContent>
              <TabsContent value="data-sync" className="mt-0 space-y-6 w-full min-h-full">
                <DataSyncManagement spaceId={selectedSpace?.id || ''} />
              </TabsContent>

              <TabsContent value="attachments" className="mt-0 space-y-6 w-full min-h-full">
                <AttachmentBrowser spaceId={selectedSpace?.id || ''} />
              </TabsContent>

              <TabsContent value="danger" className="mt-0 space-y-6 w-full">
                <Card className="border-destructive/30">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2 text-destructive">
                      <AlertTriangle className="h-5 w-5" />
                      <span>Danger Zone</span>
                    </CardTitle>
                    <CardDescription>
                      Irreversible and destructive actions. Please proceed with caution.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border border-destructive/30 rounded-lg p-4 bg-destructive/10">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-destructive">Delete Space</h4>
                          <p className="text-sm text-destructive/80 mt-1">
                            Permanently delete this space and all its data. This action cannot be undone.
                          </p>
                        </div>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="destructive"
                              className="ml-4 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Space
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="text-destructive">Delete Space</DialogTitle>
                              <DialogDescription>
                                Are you absolutely sure you want to delete "{selectedSpace?.name}"? This will permanently delete:
                                <ul className="list-disc list-inside mt-2 space-y-1">
                                  <li>All data models and their data</li>
                                  <li>All dashboards and visualizations</li>
                                  <li>All space members and permissions</li>
                                  <li>All workflows and automation</li>
                                  <li>All imported/exported data</li>
                                </ul>
                                <strong className="text-destructive mt-3 block">
                                  This action cannot be undone.
                                </strong>
                              </DialogDescription>
                            </DialogHeader>
                            <DialogFooter>
                              <Button variant="outline" className="border-0" onClick={() => { }}>
                                Cancel
                              </Button>
                              <Button
                                variant="destructive"
                                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                                onClick={async () => {
                                  try {
                                    const response = await fetch(`/api/spaces/${selectedSpace.id}`, {
                                      method: 'DELETE',
                                    })

                                    if (!response.ok) {
                                      const error = await response.json()
                                      throw new Error(error.error || 'Failed to delete space')
                                    }

                                    showSuccess('Space deleted successfully')
                                    await refreshSpaces()

                                    // Redirect to spaces page or another space
                                    const remainingSpaces = spaces.filter(s => s.id !== selectedSpace.id)
                                    if (remainingSpaces.length > 0) {
                                      const defaultSpace = remainingSpaces.find(s => s.is_default) || remainingSpaces[0]
                                      window.location.href = `/${defaultSpace.slug || defaultSpace.id}/settings`
                                    } else {
                                      sessionStorage.setItem('navigate-to-spaces', 'true')
                                      window.location.href = '/spaces'
                                    }
                                  } catch (error) {
                                    console.error('Error deleting space:', error)
                                    showError(error instanceof Error ? error.message : 'Failed to delete space')
                                  }
                                }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Space
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </div>
          </div>
          {/* <style jsx>{`
              
              :global(input:not([class*="border"])) { 
                border: 1px solid hsl(var(--border)) !important; 
                background-color: hsl(var(--background)) !important; 
              }
              :global(textarea:not([class*="border"])) { 
                border: 1px solid hsl(var(--border)) !important; 
                background-color: hsl(var(--background)) !important; 
              }
              :global([data-state="active"]) { 
                border-bottom: none !important; 
              }
              :global(.tabs-trigger) { 
                border-bottom: none !important; 
              }
            `}</style> */}
        </Tabs>
      </div>

      {/* Attribute Detail Drawer */}
      <AttributeDetailDrawer
        open={showAttributeDrawer}
        onOpenChange={setShowAttributeDrawer}
        attribute={selectedAttribute}
        onSave={handleAttributeSave}
        onDelete={handleAttributeDelete}
        onReorder={handleAttributeReorder}
        allAttributes={attributes}
      />
    </div>
  )
}



