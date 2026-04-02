'use client'

import { useState, useRef, useEffect } from 'react'
import {
  BarChart as RechartsBarChart,
  Bar,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart as RechartsLineChart,
  Pie,
  PieChart as RechartsPieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { MarkdownRenderer } from '@/components/knowledge-base/MarkdownRenderer'
import {
  Bot,
  Send,
  Download,
  BarChart3,
  Table,
  Image,
  FileText,
  RefreshCw,
  Copy,
  Trash2,
  Settings,
  Sparkles,
  TrendingUp,
  PieChart,
  LineChart,
  Activity,
  Database,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Loader2,
  CheckCircle,
  AlertCircle,
  Info,
  Plus,
  MessageSquare,
  Lock,
  Users,
  User,
  Clock,
  Menu,
  X,
  Edit2,
  MoreVertical,
  Paperclip
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  analysis?: {
    type: 'chart' | 'table' | 'text' | 'image'
    data?: any
    visualization?: any
  }
}

interface AnalysisResult {
  id: string
  title: string
  type: 'chart' | 'table' | 'text' | 'image'
  data: any
  visualization?: any
  insights: string[]
  exportable: boolean
}

interface ChatSession {
  id: string
  title: string
  description?: string
  isPrivate: boolean
  userId: string
  spaceId?: string
  modelId?: string
  messages: Message[]
  createdAt: Date
  updatedAt: Date
}

interface AIAnalystProps {
  installationId?: string
  config?: Record<string, any>
}

export function AIAnalyst({ installationId, config = {} }: AIAnalystProps) {
  // Authentication
  const { data: session, status } = useSession()
  const router = useRouter()

  // View state - either 'sessions' or 'chat'
  const [currentView, setCurrentView] = useState<'sessions' | 'chat'>('sessions')

  // Sidebar state (Open WebUI style)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [sidebarWidth, setSidebarWidth] = useState(280)

  // Chat state
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSpace, setSelectedSpace] = useState<string>('')
  const [spaces, setSpaces] = useState<any[]>([])
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([])
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [selectedExport, setSelectedExport] = useState<AnalysisResult | null>(null)
  const [availableModels, setAvailableModels] = useState<any[]>([])
  const [selectedModel, setSelectedModel] = useState<string>(config.defaultModelId || '')
  const [configuredProviders, setConfiguredProviders] = useState<any[]>([])
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([])
  const [currentChatId, setCurrentChatId] = useState<string>('')
  const [showNewChatDialog, setShowNewChatDialog] = useState(false)
  const [newChatTitle, setNewChatTitle] = useState('')
  const [newChatIsPrivate, setNewChatIsPrivate] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [reportData, setReportData] = useState<any>(null)
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [showReportDrawer, setShowReportDrawer] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // File attachment state
  const [attachments, setAttachments] = useState<Array<{ id: string; file: File; url: string; name: string; type: string; size: number; uploadedFile?: any }>>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingFile, setIsUploadingFile] = useState(false)

  // MCP server state - stored per model
  const [mcpServersByModel, setMcpServersByModel] = useState<Record<string, Array<{
    id: string
    name: string
    url?: string
    command?: string
    args?: string[]
    transport: 'hosted' | 'http-sse' | 'stdio'
    enabled: boolean
    toolFilter?: string[]
    cache?: boolean
  }>>>(config.mcpServersByModel || {})
  const [showMcpConfig, setShowMcpConfig] = useState(false)
  const [showPluginConfig, setShowPluginConfig] = useState(false)
  const [databaseConnections, setDatabaseConnections] = useState<any[]>([])
  const [isLoadingConnections, setIsLoadingConnections] = useState(false)
  const [selectedDatabaseConnectionId, setSelectedDatabaseConnectionId] = useState<string>(config.databaseConnectionId || '')
  const [preferGraphResponses, setPreferGraphResponses] = useState<boolean>(config.preferGraphResponses !== false)
  const [pluginApiKey, setPluginApiKey] = useState('')
  const [hasStoredApiKey, setHasStoredApiKey] = useState<boolean>(!!config.hasApiKey)
  const [isSavingPluginConfig, setIsSavingPluginConfig] = useState(false)

  // Get MCP servers for current model
  const mcpServers = selectedModel ? (mcpServersByModel[selectedModel] || []) : []

  // Set MCP servers for current model
  const setMcpServers = (servers: Array<{
    id: string
    name: string
    url?: string
    command?: string
    args?: string[]
    transport: 'hosted' | 'http-sse' | 'stdio'
    enabled: boolean
    toolFilter?: string[]
    cache?: boolean
  }>) => {
    if (selectedModel) {
      setMcpServersByModel(prev => ({
        ...prev,
        [selectedModel]: servers
      }))
    }
  }

  // Error and loading states
  const [error, setError] = useState<string | null>(null)
  const [isLoadingSpaces, setIsLoadingSpaces] = useState(false)
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [isLoadingSessions, setIsLoadingSessions] = useState(false)

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N for new chat
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault()
        setShowNewChatDialog(true)
      }

      // Ctrl/Cmd + K for clear chat (when in chat view)
      if ((e.ctrlKey || e.metaKey) && e.key === 'k' && currentView === 'chat') {
        e.preventDefault()
        clearChat()
      }

      // Escape to go back to sessions
      if (e.key === 'Escape' && currentView === 'chat') {
        e.preventDefault()
        backToSessions()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [currentView])

  // Authentication check
  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  useEffect(() => {
    if (!session) return

    loadSpaces()
    loadModels()
    loadConfiguredProviders()
    loadChatSessions()
    loadCurrentUser()
    if (currentView === 'chat') {
      scrollToBottom()
    }
  }, [messages, currentView, session])

  useEffect(() => {
    if (!selectedSpace || !session) return
    loadDatabaseConnections(selectedSpace)
  }, [selectedSpace, session])

  useEffect(() => {
    if (!installationId) return
    loadInstallationSettings()
  }, [installationId])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadSpaces = async () => {
    setIsLoadingSpaces(true)
    setError(null)
    try {
      const response = await fetch('/api/spaces')
      if (response.ok) {
        const data = await response.json()
        setSpaces(data.spaces || [])
        if (data.spaces?.length > 0) {
          setSelectedSpace(data.spaces[0].id)
        }
      } else if (response.status === 401) {
        toast.error('Please sign in to view spaces')
        router.push('/auth/signin')
      } else {
        throw new Error('Failed to load spaces')
      }
    } catch (error) {
      console.error('Error loading spaces:', error)
      setError('Failed to load spaces. Please try again.')
      toast.error('Failed to load spaces')
    } finally {
      setIsLoadingSpaces(false)
    }
  }

  const loadModels = async () => {
    setIsLoadingModels(true)
    try {
      const response = await fetch('/api/admin/ai-models')
      if (response.ok) {
        const data = await response.json()
        const models = data.models || []
        setAvailableModels(models)
        // Set default model if none selected
        if (!selectedModel && models.length > 0) {
          setSelectedModel(config.defaultModelId || models[0].id)
        }
      } else if (response.status === 401) {
        toast.error('Please sign in to view AI models')
        router.push('/auth/signin')
      } else {
        throw new Error('Failed to load AI models')
      }
    } catch (error) {
      console.error('Error loading AI models:', error)
      toast.error('Failed to load AI models')
    } finally {
      setIsLoadingModels(false)
    }
  }

  const loadDatabaseConnections = async (spaceId: string) => {
    setIsLoadingConnections(true)
    try {
      const response = await fetch(`/api/external-connections?space_id=${spaceId}`)
      if (response.ok) {
        const data = await response.json()
        const connections = (data.connections || []).filter((connection: any) => connection.connection_type === 'database')
        setDatabaseConnections(connections)

        if (!selectedDatabaseConnectionId && config.databaseConnectionId) {
          setSelectedDatabaseConnectionId(config.databaseConnectionId)
        }
      }
    } catch (error) {
      console.error('Error loading database connections:', error)
      toast.error('Failed to load database connections')
    } finally {
      setIsLoadingConnections(false)
    }
  }

  const loadInstallationSettings = async () => {
    if (!installationId) return

    try {
      const response = await fetch(`/api/marketplace/installations/${installationId}`)
      if (!response.ok) return

      const data = await response.json()
      const installation = data.installation
      const installationConfig = installation?.config || {}

      if (installationConfig.defaultModelId) {
        setSelectedModel((prev) => prev || installationConfig.defaultModelId)
      }

      if (installationConfig.databaseConnectionId) {
        setSelectedDatabaseConnectionId(installationConfig.databaseConnectionId)
      }

      if (installationConfig.preferGraphResponses !== undefined) {
        setPreferGraphResponses(installationConfig.preferGraphResponses !== false)
      }

      if (installationConfig.mcpServersByModel) {
        setMcpServersByModel(installationConfig.mcpServersByModel)
      }

      setHasStoredApiKey(!!installation?.credentials?.configured || !!installationConfig.hasApiKey)
    } catch (error) {
      console.error('Error loading installation settings:', error)
    }
  }

  const loadConfiguredProviders = async () => {
    try {
      const response = await fetch('/api/admin/ai-providers')
      if (response.ok) {
        const data = await response.json()
        setConfiguredProviders(data.providers?.filter((p: any) => p.isConfigured) || [])
      }
    } catch (error) {
      console.error('Error loading configured providers:', error)
    }
  }

  const savePluginSettings = async () => {
    if (!installationId) {
      toast.error('This settings panel is only available for marketplace installations')
      return
    }

    setIsSavingPluginConfig(true)
    try {
      const nextConfig = {
        ...config,
        defaultModelId: selectedModel || null,
        databaseConnectionId: selectedDatabaseConnectionId || null,
        preferGraphResponses,
        mcpServersByModel,
        hasApiKey: hasStoredApiKey || !!pluginApiKey.trim(),
      }

      const payload: Record<string, any> = {
        config: nextConfig,
        mergeConfig: false,
      }

      if (pluginApiKey.trim()) {
        payload.credentials = { apiKey: pluginApiKey.trim() }
      }

      const response = await fetch(`/api/marketplace/installations/${installationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to save plugin settings')
      }

      const data = await response.json()
      setHasStoredApiKey(!!data.installation?.credentials?.configured || hasStoredApiKey || !!pluginApiKey.trim())
      setPluginApiKey('')
      toast.success('Plugin settings saved')
    } catch (error) {
      console.error('Error saving plugin settings:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to save plugin settings')
    } finally {
      setIsSavingPluginConfig(false)
    }
  }

  const loadChatSessions = async () => {
    setIsLoadingSessions(true)
    try {
      const response = await fetch('/api/admin/chat-sessions')
      if (response.ok) {
        const data = await response.json()
        setChatSessions(data.sessions || [])
      } else if (response.status === 401) {
        toast.error('Please sign in to view chat sessions')
        router.push('/auth/signin')
      } else {
        throw new Error('Failed to load chat sessions')
      }
    } catch (error) {
      console.error('Error loading chat sessions:', error)
      toast.error('Failed to load chat sessions')
    } finally {
      setIsLoadingSessions(false)
    }
  }

  const switchToChat = (chatId: string) => {
    const chat = chatSessions.find(c => c.id === chatId)
    if (chat) {
      setCurrentChatId(chatId)
      setMessages(chat.messages || [])
      setCurrentView('chat')
    }
  }

  const backToSessions = () => {
    setCurrentView('sessions')
    setCurrentChatId('')
    setMessages([])
  }

  // File upload handler
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploadingFile(true)
    try {
      for (const file of Array.from(files)) {
        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024
        if (file.size > maxSize) {
          toast.error(`File ${file.name} exceeds 10MB limit`)
          continue
        }

        // Create preview URL
        const url = URL.createObjectURL(file)

        // Upload file to server if space is selected
        let uploadedFile: any = null
        if (selectedSpace) {
          try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('spaceId', selectedSpace)
            formData.append('attributeId', 'ai-analyst-attachment') // Temporary attribute ID

            const response = await fetch('/api/attachments/upload', {
              method: 'POST',
              body: formData
            })

            if (response.ok) {
              const data = await response.json()
              uploadedFile = data.attachment
            }
          } catch (error) {
            console.error('Error uploading file:', error)
            // Continue with local file if upload fails
          }
        }

        const attachment = {
          id: uploadedFile?.id || Date.now().toString() + Math.random(),
          file,
          url,
          name: file.name,
          type: file.type,
          size: file.size,
          uploadedFile
        }

        setAttachments(prev => [...prev, attachment])
      }
      toast.success(`Added ${files.length} file(s)`)
    } catch (error) {
      console.error('Error handling file:', error)
      toast.error('Failed to add file')
    } finally {
      setIsUploadingFile(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const removeAttachment = (id: string) => {
    setAttachments(prev => {
      const attachment = prev.find(a => a.id === id)
      if (attachment) {
        URL.revokeObjectURL(attachment.url)
      }
      return prev.filter(a => a.id !== id)
    })
  }

  const clearAttachments = () => {
    attachments.forEach(att => URL.revokeObjectURL(att.url))
    setAttachments([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if ((!input.trim() && attachments.length === 0) || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim() || `[${attachments.length} file(s) attached]`,
      timestamp: new Date(),
      analysis: attachments.length > 0 ? {
        type: 'text',
        data: {
          attachments: attachments.map(att => ({
            id: att.id,
            name: att.name,
            type: att.type,
            size: att.size,
            url: att.uploadedFile?.url || att.url,
            path: att.uploadedFile?.path
          }))
        }
      } : undefined
    }

    setMessages(prev => [...prev, userMessage])
    const currentInput = input.trim()
    const currentAttachments = [...attachments]
    setInput('')
    clearAttachments()

    setIsLoading(true)
    try {
      // Call AI analysis API with attachments and MCP servers
      const analysisResult = await performAIAnalysis(
        currentInput,
        selectedSpace,
        selectedModel,
        currentAttachments,
        mcpServers.filter(s => s.enabled)
      )

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: analysisResult.response || 'I\'ve analyzed your request. Let me help you with that.',
        timestamp: new Date(),
        analysis: analysisResult.analysis ? {
          type: analysisResult.analysis.type || 'text',
          data: analysisResult.analysis.data
        } : undefined
      }

      setMessages(prev => [...prev, aiMessage])

      // Add to analysis results if applicable
      if (analysisResult.title && analysisResult.insights) {
        setAnalysisResults(prev => [...prev, {
          id: Date.now().toString(),
          title: analysisResult.title,
          type: analysisResult.analysis?.type || 'text',
          insights: analysisResult.insights,
          exportable: true,
          data: analysisResult.analysis?.data || {}
        }])
      }
    } catch (error) {
      console.error('Error in AI analysis:', error)
      toast.error('Failed to get AI response')

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error processing your request. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const clearChat = () => {
    if (messages.length === 0) {
      toast('Chat is already empty')
      return
    }

    if (confirm('Are you sure you want to clear the chat? This action cannot be undone.')) {
      setMessages([])
      setAnalysisResults([])
      setReportData(null)
      toast.success('Chat cleared successfully')
    }
  }

  const loadCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setCurrentUser(data.user)
      }
    } catch (error) {
      console.error('Error loading current user:', error)
    }
  }


  const performAIAnalysis = async (
    query: string,
    spaceId: string,
    modelId: string,
    attachments: Array<{ id: string; file: File; url: string; name: string; type: string; size: number; uploadedFile?: any }> = [],
    mcpServers: Array<any> = []
  ): Promise<any> => {
    // Prepare attachments data
    const attachmentsData = attachments.map(att => ({
      id: att.uploadedFile?.id || att.id,
      name: att.name,
      type: att.type,
      size: att.size,
      url: att.uploadedFile?.url || att.url,
      path: att.uploadedFile?.path
    }))
    // Check if we have configured providers
    const hasPluginApiKey = hasStoredApiKey || !!pluginApiKey.trim()
    const hasAvailableAiConfiguration = configuredProviders.length > 0 || hasPluginApiKey

    if (!hasAvailableAiConfiguration) {
      return {
        response: 'No AI configuration is available yet. Save an API key in this plugin or configure an AI provider in Admin Integrations to use AI features.',
        title: 'Configuration Required',
        analysis: null,
        insights: ['Configure AI providers in Admin → Integrations → AI Configuration']
      }
    }

    // Check if selected model is available
    const selectedModelData = availableModels.find(m => m.id === modelId)
    if (!selectedModelData) {
      return {
        response: 'Selected AI model is not available. Please select a different model.',
        title: 'Model Not Available',
        analysis: null,
        insights: ['Select a different AI model from the dropdown']
      }
    }

    try {
      // Prepare attachments data
      const attachmentsData = attachments.map(att => ({
        id: att.uploadedFile?.id || att.id,
        name: att.name,
        type: att.type,
        size: att.size,
        url: att.uploadedFile?.url || att.url,
        path: att.uploadedFile?.path
      }))

      // Call the AI analysis API
      const response = await fetch('/api/admin/ai-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          spaceId,
          modelId,
          model: selectedModelData,
          attachments: attachmentsData,
          installationId,
          databaseConnectionId: selectedDatabaseConnectionId || undefined,
          preferGraphResponses,
          mcpServers: mcpServers.map(server => ({
            name: server.name,
            url: server.url,
            command: server.command,
            args: server.args,
            transport: server.transport,
            toolFilter: server.toolFilter,
            cache: server.cache !== false
          }))
        })
      })

      if (response.ok) {
        return await response.json()
      } else {
        const error = await response.json()
        return {
          response: `AI analysis failed: ${error.error || 'Unknown error'}`,
          title: 'Analysis Error',
          analysis: null,
          insights: ['Check AI provider configuration', 'Verify API keys are valid']
        }
      }
    } catch (error) {
      console.error('AI analysis error:', error)
      return {
        response: 'Failed to connect to AI service. Please check your configuration.',
        title: 'Connection Error',
        analysis: null,
        insights: ['Check AI provider configuration', 'Verify network connection']
      }
    }
  }





  const createNewChat = async () => {
    if (!newChatTitle.trim()) {
      toast.error('Please enter a chat title')
      return
    }

    try {
      const response = await fetch('/api/admin/chat-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newChatTitle.trim(),
          isPrivate: newChatIsPrivate,
          spaceId: selectedSpace,
          modelId: selectedModel
        })
      })

      if (response.ok) {
        const data = await response.json()
        setChatSessions(prev => [data.session, ...prev])
        setCurrentChatId(data.session.id)
        setMessages([])
        setAnalysisResults([])
        setShowNewChatDialog(false)
        setNewChatTitle('')
        setNewChatIsPrivate(false)
        setCurrentView('chat')
        toast.success('New chat created successfully')
      } else if (response.status === 401) {
        toast.error('Please sign in to create chat sessions')
        router.push('/auth/signin')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create chat')
      }
    } catch (error) {
      console.error('Error creating chat:', error)
      toast.error('Failed to create chat')
    }
  }



  const generateReport = async (messages: Message[], analysisResults: AnalysisResult[]) => {
    setIsGeneratingReport(true)
    try {
      // Generate report based on conversation and analysis results
      const report = {
        id: Date.now().toString(),
        title: `Analysis Report - ${new Date().toLocaleDateString()}`,
        generatedAt: new Date(),
        summary: {
          totalMessages: messages.length,
          totalAnalysis: analysisResults.length,
          keyInsights: analysisResults.flatMap(r => r.insights).slice(0, 5),
          dataTypes: Array.from(new Set(analysisResults.map(r => r.type))),
          spaceId: selectedSpace,
          modelUsed: availableModels.find(m => m.id === selectedModel)?.name || 'Unknown'
        },
        conversation: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          hasAnalysis: !!msg.analysis
        })),
        analysis: analysisResults.map(result => ({
          id: result.id,
          title: result.title,
          type: result.type,
          data: result.data,
          insights: result.insights,
          exportable: result.exportable
        })),
        recommendations: generateRecommendations(analysisResults),
        charts: analysisResults.filter(r => r.type === 'chart').map(r => r.data),
        tables: analysisResults.filter(r => r.type === 'table').map(r => r.data)
      }

      setReportData(report)
    } catch (error) {
      console.error('Error generating report:', error)
      toast.error('Failed to generate report')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const generateRecommendations = (results: AnalysisResult[]) => {
    const recommendations = []

    if (results.some(r => r.type === 'chart')) {
      recommendations.push({
        type: 'visualization',
        title: 'Data Visualization',
        description: 'Consider creating more visualizations to better understand data patterns',
        priority: 'medium'
      })
    }

    if (results.some(r => r.type === 'table')) {
      recommendations.push({
        type: 'data_quality',
        title: 'Data Quality Review',
        description: 'Review data quality and completeness based on table analysis',
        priority: 'high'
      })
    }

    if (results.length > 3) {
      recommendations.push({
        type: 'automation',
        title: 'Automated Analysis',
        description: 'Consider setting up automated analysis workflows for similar data',
        priority: 'low'
      })
    }

    return recommendations
  }

  // Auto-generate report when messages or analysis results change
  useEffect(() => {
    if (messages.length > 1 || analysisResults.length > 0) {
      generateReport(messages, analysisResults)
    }
  }, [messages, analysisResults])

  const exportReport = (report: any) => {
    try {
      const reportContent = {
        title: report.title,
        generatedAt: report.generatedAt,
        summary: report.summary,
        conversation: report.conversation,
        analysis: report.analysis,
        recommendations: report.recommendations,
        charts: report.charts,
        tables: report.tables
      }

      const content = JSON.stringify(reportContent, null, 2)
      const blob = new Blob([content], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      toast.success('Report exported successfully')
    } catch (error) {
      toast.error('Export failed. Please try again.')
    }
  }

  const downloadFile = (filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const toCsvRow = (values: Array<unknown>) => values.map((value) => {
    const normalized = value == null ? '' : String(value)
    return `"${normalized.replace(/"/g, '""')}"`
  }).join(',')

  const exportAnalysisResult = async (
    result: Pick<AnalysisResult, 'title' | 'type' | 'data'>,
    format: 'csv' | 'json' | 'png',
    chartElement?: HTMLElement | null
  ) => {
    try {
      const baseName = result.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'analysis'

      if (format === 'json') {
        downloadFile(`${baseName}.json`, JSON.stringify(result, null, 2), 'application/json')
        toast.success('Analysis exported as JSON')
        return
      }

      if (format === 'csv') {
        if (result.type === 'chart') {
          const labels = Array.isArray(result.data?.labels) ? result.data.labels : []
          const datasets = Array.isArray(result.data?.datasets) ? result.data.datasets : []
          const header = ['Label', ...datasets.map((dataset: any, index: number) => dataset.label || `Series ${index + 1}`)]
          const rows = labels.map((label: string, rowIndex: number) => ([
            label,
            ...datasets.map((dataset: any) => dataset?.data?.[rowIndex] ?? ''),
          ]))
          const csv = [toCsvRow(header), ...rows.map((row) => toCsvRow(row))].join('\n')
          downloadFile(`${baseName}.csv`, csv, 'text/csv;charset=utf-8')
          toast.success('Chart data exported as CSV')
          return
        }

        if (result.type === 'table') {
          const columns = Array.isArray(result.data?.columns) ? result.data.columns : []
          const rows = Array.isArray(result.data?.rows) ? result.data.rows : []
          const csv = [toCsvRow(columns), ...rows.map((row: unknown[]) => toCsvRow(row))].join('\n')
          downloadFile(`${baseName}.csv`, csv, 'text/csv;charset=utf-8')
          toast.success('Table exported as CSV')
          return
        }

        toast.error('CSV export is available for chart and table results only')
        return
      }

      if (format === 'png') {
        const svg = chartElement?.querySelector('svg')
        if (!svg) {
          toast.error('Chart image is not available for export')
          return
        }

        const svgMarkup = new XMLSerializer().serializeToString(svg)
        const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml;charset=utf-8' })
        const svgUrl = URL.createObjectURL(svgBlob)
        const image = new window.Image()

        await new Promise<void>((resolve, reject) => {
          image.onload = () => resolve()
          image.onerror = () => reject(new Error('Failed to render chart image'))
          image.src = svgUrl
        })

        const viewBox = svg.viewBox.baseVal
        const width = svg.clientWidth || viewBox.width || 960
        const height = svg.clientHeight || viewBox.height || 540
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const context = canvas.getContext('2d')

        if (!context) {
          URL.revokeObjectURL(svgUrl)
          throw new Error('Canvas export is not supported in this browser')
        }

        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, width, height)
        context.drawImage(image, 0, 0, width, height)
        URL.revokeObjectURL(svgUrl)

        const pngUrl = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.href = pngUrl
        link.download = `${baseName}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success('Chart exported as PNG')
      }
    } catch (error) {
      console.error('Error exporting analysis result:', error)
      toast.error(error instanceof Error ? error.message : 'Export failed. Please try again.')
    }
  }

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading AI Analyst...</p>
        </div>
      </div>
    )
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background text-foreground overflow-hidden">
      <div className="flex flex-1 min-h-0">
        {/* Sidebar - Open WebUI Style */}
        <div
          className={cn(
            "border-r border-border transition-all duration-300 flex flex-col",
            sidebarOpen ? "w-[280px]" : "w-0 overflow-hidden"
          )}
        >
          {sidebarOpen && (
            <>
              {/* Sidebar Header */}
              <div className="p-5 border-b border-border">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Chats</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewChatDialog(true)}
                    className="h-8 w-8 p-0 hover:bg-muted transition-all duration-200 ease-out hover:scale-110 active:scale-95"
                  >
                    <Plus className="h-4 w-4 transition-transform duration-200 hover:rotate-90" />
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="h-8 text-xs bg-muted border-border text-foreground" disabled={isLoadingModels}>
                      <SelectValue placeholder="Model" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {availableModels.map(model => (
                        <SelectItem key={model.id} value={model.id} className="text-foreground">
                          {model.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Chat Sessions List */}
              <ScrollArea className="flex-1">
                <div className="p-2.5 space-y-1.5">
                  {chatSessions.length === 0 ? (
                    <div className="text-center py-8 px-4 animate-in fade-in duration-300">
                      <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2 transition-transform duration-200 ease-out hover:scale-110" />
                      <p className="text-sm text-muted-foreground">No chats yet</p>
                    </div>
                  ) : (
                    chatSessions.map(chat => (
                      <button
                        key={chat.id}
                        onClick={() => switchToChat(chat.id)}
                        className={cn(
                          "w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ease-out",
                          "hover:bg-muted/50 hover:shadow-sm transform hover:scale-[1.02] active:scale-[0.98]",
                          currentChatId === chat.id && "bg-muted shadow-sm"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="truncate text-foreground">{chat.title}</span>
                        </div>
                        {chat.messages?.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {chat.messages[chat.messages.length - 1]?.content.substring(0, 30)}...
                          </p>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Top Bar */}
          <div className="h-14 border-b border-border flex items-center justify-between px-6 flex-shrink-0 transition-all duration-200 ease-out">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="h-8 w-8 p-0 hover:bg-muted transition-all duration-200 ease-out hover:scale-110 active:scale-95"
              >
                {sidebarOpen ? <ChevronLeft className="h-4 w-4 transition-transform duration-200" /> : <Menu className="h-4 w-4 transition-transform duration-200" />}
              </Button>
              <div className="flex items-center gap-2.5">
                <Bot className="h-5 w-5 text-primary transition-transform duration-200 ease-out hover:scale-110" />
                <span className="font-medium text-foreground">AI Analyst</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {currentView === 'chat' && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearChat}
                    className="h-8 text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 ease-out hover:scale-110 active:scale-95"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowReportDrawer(!showReportDrawer)}
                    className="h-8 text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 ease-out hover:scale-110 active:scale-95"
                  >
                    <FileText className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPluginConfig(!showPluginConfig)}
                className="h-8 text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-200 ease-out hover:scale-110 active:scale-95"
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Select value={selectedSpace} onValueChange={setSelectedSpace}>
                <SelectTrigger className="h-8 w-32 text-xs bg-muted border-border text-foreground" disabled={isLoadingSpaces}>
                  <SelectValue placeholder="Space" />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {spaces.map(space => (
                    <SelectItem key={space.id} value={space.id} className="text-foreground">
                      {space.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {showPluginConfig && (
            <div className="border-b border-border bg-muted/20 px-6 py-4">
              <div className="grid gap-4 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Plugin API Key</Label>
                  <Input
                    type="password"
                    value={pluginApiKey}
                    onChange={(e) => setPluginApiKey(e.target.value)}
                    placeholder={hasStoredApiKey ? 'Stored key configured' : 'sk-...'}
                  />
                  <p className="text-xs text-muted-foreground">
                    {hasStoredApiKey ? 'A key is already stored securely. Enter a new one only to replace it.' : 'Used by marketplace AI analysis if Admin API Configuration is not set.'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Database Connection</Label>
                  <Select value={selectedDatabaseConnectionId || '__none__'} onValueChange={(value) => setSelectedDatabaseConnectionId(value === '__none__' ? '' : value)}>
                    <SelectTrigger disabled={isLoadingConnections || !selectedSpace}>
                      <SelectValue placeholder="Select database" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">No database</SelectItem>
                      {databaseConnections.map((connection) => (
                        <SelectItem key={connection.id} value={connection.id}>
                          {connection.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Lets the AI inspect schema and run read-only SQL for this space.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Chart Preference</Label>
                  <div className="flex h-10 items-center justify-between rounded-md border border-border bg-background px-3">
                    <span className="text-sm">Prefer graphs in responses</span>
                    <Switch checked={preferGraphResponses} onCheckedChange={setPreferGraphResponses} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Helps the AI return chart-ready output for trends, comparisons, and distributions.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Persist Settings</Label>
                  <Button
                    onClick={savePluginSettings}
                    disabled={!installationId || isSavingPluginConfig}
                    className="w-full"
                  >
                    {isSavingPluginConfig ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Plugin Settings'
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Saves model defaults, MCP server setup, database connection, and optional API key for this marketplace install.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Chat Content */}
          {currentView === 'sessions' ? (
            <div className="flex-1 flex items-center justify-center bg-background">
              <div className="text-center max-w-md">
                <Bot className="h-16 w-16 text-primary mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Welcome to AI Analyst</h3>
                <p className="text-muted-foreground mb-6">Start a new conversation to begin analyzing your data</p>
                <Button
                  onClick={() => setShowNewChatDialog(true)}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Chat
                </Button>
              </div>
            </div>
          ) : (
            <ChatView
              messages={messages}
              input={input}
              setInput={setInput}
              isLoading={isLoading}
              onSubmit={handleSubmit}
              messagesEndRef={messagesEndRef}
              textareaRef={textareaRef}
              showReportDrawer={showReportDrawer}
              reportData={reportData}
              isGeneratingReport={isGeneratingReport}
              spaces={spaces}
              analysisResults={analysisResults}
              onExportReport={exportReport}
              selectedExport={selectedExport}
              setSelectedExport={setSelectedExport}
              showExportDialog={showExportDialog}
              setShowExportDialog={setShowExportDialog}
              onExportAnalysis={exportAnalysisResult}
              attachments={attachments}
              onFileSelect={handleFileSelect}
              removeAttachment={removeAttachment}
              fileInputRef={fileInputRef}
              isUploadingFile={isUploadingFile}
              mcpServers={mcpServers}
              setMcpServers={setMcpServers}
              showMcpConfig={showMcpConfig}
              setShowMcpConfig={setShowMcpConfig}
              selectedModel={selectedModel}
              availableModels={availableModels}
            />
          )}
        </div>
      </div>

      {/* New Chat Dialog */}
      <Dialog open={showNewChatDialog} onOpenChange={setShowNewChatDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Chat</DialogTitle>
            <DialogDescription>
              Start a new AI analysis conversation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="chat-title">Chat Title</Label>
              <Input
                id="chat-title"
                value={newChatTitle}
                onChange={(e) => setNewChatTitle(e.target.value)}
                placeholder="Enter chat title..."
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="private-chat"
                checked={newChatIsPrivate}
                onCheckedChange={setNewChatIsPrivate}
              />
              <Label htmlFor="private-chat" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Private Chat (only visible to you)
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewChatDialog(false)}>
              Cancel
            </Button>
            <Button onClick={createNewChat} disabled={!newChatTitle.trim()}>
              Create Chat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Chat Sessions List Component
function ChatSessionsList({
  chatSessions,
  currentUser,
  onChatSelect,
  onNewChat,
  isLoading
}: {
  chatSessions: ChatSession[]
  currentUser: any
  onChatSelect: (chatId: string) => void
  onNewChat: () => void
  isLoading: boolean
}) {
  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col bg-background">
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Chat Sessions</h2>
              <p className="text-muted-foreground mt-1">Loading your chat sessions...</p>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Loading chat sessions...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-background">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Chat Sessions</h2>
            <p className="text-muted-foreground mt-1">Select a chat session to continue your analysis</p>
          </div>
          <Button onClick={onNewChat} className="bg-primary hover:bg-primary/90 text-primary-foreground">
            <Plus className="h-4 w-4 mr-2" />
            New Chat
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          {chatSessions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No chat sessions yet</h3>
              <p className="text-muted-foreground mb-6">Start your first AI analysis conversation</p>
              <Button onClick={onNewChat} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Create First Chat
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chatSessions.map(chat => (
                <Card
                  key={chat.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow h-full flex flex-col"
                  onClick={() => onChatSelect(chat.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{chat.title}</CardTitle>
                        <CardDescription className="mt-1">
                          {chat.description || 'No description'}
                        </CardDescription>
                      </div>
                      {chat.isPrivate && (
                        <Lock className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MessageSquare className="h-4 w-4" />
                        <span>{chat.messages?.length || 0} messages</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Updated {new Date(chat.updatedAt).toLocaleDateString()}</span>
                      </div>
                      {chat.spaceId && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Database className="h-4 w-4" />
                          <span>Space: {chat.spaceId}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// Chat View Component
function ChatView({
  messages,
  input,
  setInput,
  isLoading,
  onSubmit,
  messagesEndRef,
  textareaRef,
  showReportDrawer,
  reportData,
  isGeneratingReport,
  spaces,
  analysisResults,
  onExportReport,
  selectedExport,
  setSelectedExport,
  showExportDialog,
  setShowExportDialog,
  onExportAnalysis,
  attachments,
  onFileSelect,
  removeAttachment,
  fileInputRef,
  isUploadingFile,
  mcpServers,
  setMcpServers,
  showMcpConfig,
  setShowMcpConfig,
  selectedModel,
  availableModels
}: {
  messages: Message[]
  input: string
  setInput: (value: string) => void
  isLoading: boolean
  onSubmit: (e: React.FormEvent) => void
  messagesEndRef: React.RefObject<HTMLDivElement | null>
  textareaRef: React.RefObject<HTMLTextAreaElement | null>
  showReportDrawer: boolean
  reportData: any
  isGeneratingReport: boolean
  spaces: any[]
  analysisResults: AnalysisResult[]
  onExportReport: (report: any) => void
  selectedExport: AnalysisResult | null
  setSelectedExport: (selectedExport: AnalysisResult | null) => void
  showExportDialog: boolean
  setShowExportDialog: (show: boolean) => void
  onExportAnalysis: (
    result: Pick<AnalysisResult, 'title' | 'type' | 'data'>,
    format: 'csv' | 'json' | 'png',
    chartElement?: HTMLElement | null
  ) => Promise<void>
  attachments: Array<{ id: string; file: File; url: string; name: string; type: string; size: number; uploadedFile?: any }>
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void
  removeAttachment: (id: string) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  isUploadingFile: boolean
  mcpServers: Array<{
    id: string
    name: string
    url?: string
    command?: string
    args?: string[]
    transport: 'hosted' | 'http-sse' | 'stdio'
    enabled: boolean
    toolFilter?: string[]
    cache?: boolean
  }>
  setMcpServers: (servers: Array<{
    id: string
    name: string
    url?: string
    command?: string
    args?: string[]
    transport: 'hosted' | 'http-sse' | 'stdio'
    enabled: boolean
    toolFilter?: string[]
    cache?: boolean
  }>) => void
  showMcpConfig: boolean
  setShowMcpConfig: (show: boolean) => void
  selectedModel: string
  availableModels: any[]
}) {
  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  // Handle Enter key (Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isLoading && (input.trim() || attachments.length > 0)) {
        onSubmit(e as any)
      }
    }
  }

  return (
    <div className="flex-1 flex min-h-0">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        {/* Messages Container */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 px-6 py-5 pb-28">
            <div className="max-w-4xl mx-auto">
              {messages.length === 0 ? (
                <div className="text-center py-16 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6 transition-transform duration-200 ease-out hover:scale-110">
                    <Bot className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">How can I help you today?</h3>
                  <p className="text-muted-foreground mb-8">Start a conversation to analyze your data, create visualizations, or generate insights</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl mx-auto">
                    {[
                      "Analyze sales trends",
                      "Create data visualizations",
                      "Generate insights report",
                      "Compare metrics"
                    ].map((suggestion, idx) => (
                      <button
                        key={idx}
                        onClick={() => setInput(suggestion)}
                        className="px-4 py-3 text-left text-sm rounded-lg bg-muted/50 hover:bg-muted border border-border text-foreground hover:text-foreground transition-all duration-200 ease-out transform hover:scale-[1.02] hover:shadow-md active:scale-[0.98]"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-5">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-200",
                        message.role === 'user' ? "justify-end" : "justify-start"
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center transition-transform duration-200 ease-out group-hover:scale-110 ring-2 ring-primary/20">
                          <Bot className="h-5 w-5 text-primary-foreground" />
                        </div>
                      )}
                      <div
                        className={cn(
                          "max-w-[85%] rounded-2xl px-4 py-3 transition-all duration-200 ease-out",
                          message.role === 'user'
                            ? "bg-primary text-primary-foreground rounded-br-sm hover:shadow-md"
                            : "bg-card border border-border text-foreground rounded-bl-sm hover:shadow-md"
                        )}
                      >
                        {message.role === 'assistant' ? (
                          <div className="prose prose-invert prose-sm max-w-none">
                            <MarkdownRenderer content={message.content} />
                          </div>
                        ) : (
                          <div className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</div>
                        )}
                        {message.analysis && (
                          <div className="mt-4">
                            <AnalysisVisualization
                              analysis={message.analysis}
                              title={message.analysis.type === 'chart' ? 'chart_analysis' : 'table_analysis'}
                              onExport={onExportAnalysis}
                            />
                          </div>
                        )}
                        <div className={cn(
                          "text-xs mt-2 opacity-60",
                          message.role === 'user' ? "text-primary-foreground/70" : "text-muted-foreground"
                        )}>
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      {message.role === 'user' && (
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-secondary flex items-center justify-center transition-transform duration-200 ease-out group-hover:scale-110 ring-2 ring-secondary/20">
                          <User className="h-5 w-5 text-secondary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-4 justify-start">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <Bot className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          <span className="text-sm text-muted-foreground">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Floating Input Area */}
        <div className="absolute bottom-4 left-4 right-4 z-50 transition-all duration-300 ease-out">
          <div className="max-w-4xl mx-auto">
            {/* Attachment Preview */}
            {attachments.length > 0 && (
              <div className="mb-2 px-2 animate-in slide-in-from-bottom-2 fade-in duration-200">
                <div className="flex flex-wrap gap-2">
                  {attachments.map((attachment) => (
                    <div key={attachment.id} className="relative group">
                      <div className="rounded-lg overflow-hidden border border-border bg-card p-2 transition-all duration-200 ease-out group-hover:shadow-md group-hover:scale-105">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="text-xs text-foreground truncate max-w-[150px]">{attachment.name}</span>
                          <span className="text-xs text-muted-foreground">{(attachment.size / 1024).toFixed(1)}KB</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(attachment.id)}
                        aria-label={`Remove ${attachment.name}`}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all duration-200 ease-out transform hover:scale-110 active:scale-95 shadow-md"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <form onSubmit={onSubmit} className="relative">
              <div className="relative flex items-center rounded-xl border border-border bg-background shadow-lg focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 focus-within:shadow-xl transition-all duration-200 ease-out min-h-[64px] overflow-hidden">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={onFileSelect}
                  className="hidden"
                  accept="*/*"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading || isUploadingFile}
                  className="h-full px-3 hover:bg-muted transition-all duration-200 ease-out hover:scale-105 active:scale-95 rounded-none border-0 flex-shrink-0"
                  title="Attach file"
                >
                  {isUploadingFile ? (
                    <Loader2 className="h-5 w-5 text-muted-foreground animate-spin" />
                  ) : (
                    <Paperclip className="h-5 w-5 text-muted-foreground transition-transform duration-200 group-hover:rotate-12" />
                  )}
                </Button>
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message... "
                  className="flex-1 min-h-[64px] max-h-[200px] resize-none bg-transparent border-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 px-3 py-4 text-sm transition-all duration-200"
                  disabled={isLoading}
                  rows={1}
                />
                <Button
                  type="submit"
                  disabled={isLoading || (!input.trim() && attachments.length === 0)}
                  size="sm"
                  className="h-full px-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-none border-0 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 ease-out hover:scale-105 active:scale-95 hover:shadow-lg flex-shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" />
                  )}
                </Button>
              </div>
              <div className="flex items-center justify-between mt-2 px-1">
                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground">Press Enter to send, Shift+Enter for new line</p>
                  {mcpServers.filter(s => s.enabled).length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      {mcpServers.filter(s => s.enabled).length} MCP server(s) active
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowMcpConfig(!showMcpConfig)}
                    className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Settings className="h-3 w-3 mr-1" />
                    MCP
                  </Button>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Ctrl+K</span>
                    <span>•</span>
                    <span>Clear</span>
                  </div>
                </div>
              </div>
            </form>

            {/* MCP Server Configuration */}
            {showMcpConfig && (
              <div className="mt-2 p-3 bg-card border border-border rounded-lg animate-in slide-in-from-bottom-2 fade-in duration-200">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-foreground">MCP Servers</h4>
                    {selectedModel && (
                      <Badge variant="outline" className="text-xs">
                        {availableModels.find(m => m.id === selectedModel)?.name || 'Model'}
                      </Badge>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (!selectedModel) {
                        toast.error('Please select a model first')
                        return
                      }
                      setMcpServers([...mcpServers, {
                        id: Date.now().toString(),
                        name: `MCP Server ${mcpServers.length + 1}`,
                        transport: 'hosted',
                        enabled: true
                      }])
                    }}
                    disabled={!selectedModel}
                    className="h-6 px-2 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Server
                  </Button>
                </div>
                {!selectedModel && (
                  <p className="text-xs text-muted-foreground mb-2 text-center py-1">
                    Select a model to configure MCP servers
                  </p>
                )}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {mcpServers.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-2">No MCP servers configured</p>
                  ) : (
                    mcpServers.map((server) => (
                      <div key={server.id} className="flex items-center gap-2 p-2 bg-muted/50 rounded border border-border">
                        <Switch
                          checked={server.enabled}
                          onCheckedChange={(checked) => {
                            setMcpServers(mcpServers.map(s => s.id === server.id ? { ...s, enabled: checked } : s))
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <Input
                            value={server.name}
                            onChange={(e) => {
                              setMcpServers(mcpServers.map(s => s.id === server.id ? { ...s, name: e.target.value } : s))
                            }}
                            placeholder="Server name"
                            className="h-7 text-xs"
                          />
                        </div>
                        <Select
                          value={server.transport}
                          onValueChange={(value) => {
                            const transportValue = value as 'hosted' | 'http-sse' | 'stdio'
                            setMcpServers(mcpServers.map(s => s.id === server.id ? { ...s, transport: transportValue } : s))
                          }}
                        >
                          <SelectTrigger className="h-7 w-24 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="hosted">Hosted</SelectItem>
                            <SelectItem value="http-sse">HTTP SSE</SelectItem>
                            <SelectItem value="stdio">Stdio</SelectItem>
                          </SelectContent>
                        </Select>
                        {server.transport !== 'stdio' && (
                          <Input
                            value={server.url || ''}
                            onChange={(e) => {
                              setMcpServers(mcpServers.map(s => s.id === server.id ? { ...s, url: e.target.value } : s))
                            }}
                            placeholder="Server URL"
                            className="h-7 flex-1 text-xs"
                          />
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setMcpServers(mcpServers.filter(s => s.id !== server.id))
                          }}
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Report Drawer */}
      {showReportDrawer && (
        <div className="w-[400px] border-l border-border bg-card flex flex-col">
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold flex items-center gap-2 text-foreground">
                <FileText className="h-4 w-4" />
                Live Report
              </h3>
              {isGeneratingReport && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Real-time analysis report
            </p>
          </div>

          <ScrollArea className="flex-1 p-4">
            {reportData ? (
              <div className="space-y-6">
                {/* Report Header */}
                <div className="bg-primary/10 p-4 rounded-lg border border-border">
                  <h4 className="font-semibold text-lg mb-2 text-foreground">{reportData.title}</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Generated: {new Date(reportData.generatedAt).toLocaleString()}</p>
                    <p>Space: {spaces.find(s => s.id === reportData.summary.spaceId)?.name || 'Unknown'}</p>
                    <p>Model: {reportData.summary.modelUsed}</p>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-primary">{reportData.summary.totalMessages}</div>
                    <div className="text-xs text-muted-foreground">Messages</div>
                  </div>
                  <div className="bg-secondary/10 border border-secondary/20 p-3 rounded-lg text-center">
                    <div className="text-2xl font-bold text-secondary-foreground">{reportData.summary.totalAnalysis}</div>
                    <div className="text-xs text-muted-foreground">Analyses</div>
                  </div>
                </div>

                {/* Key Insights */}
                {reportData.summary.keyInsights.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-3 flex items-center gap-2 text-foreground">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Key Insights
                    </h5>
                    <div className="space-y-2">
                      {reportData.summary.keyInsights.map((insight: string, index: number) => (
                        <div key={index} className="bg-[hsl(var(--warning))]/10 border border-[hsl(var(--warning))]/20 p-3 rounded-lg">
                          <p className="text-sm text-foreground">{insight}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Analysis Results */}
                {reportData.analysis.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-3 flex items-center gap-2 text-foreground">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      Analysis Results
                    </h5>
                    <div className="space-y-3">
                      {reportData.analysis.map((result: any, index: number) => (
                        <div key={index} className="bg-muted/50 border border-border p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <h6 className="font-medium text-sm text-foreground">{result.title}</h6>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs border-border text-muted-foreground">
                                {result.type}
                              </Badge>
                              {(result.type === 'chart' || result.type === 'table') && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2"
                                  onClick={() => onExportAnalysis(
                                    { title: result.title, type: result.type, data: result.data },
                                    result.type === 'chart' ? 'csv' : 'csv'
                                  )}
                                >
                                  <Download className="mr-1.5 h-3.5 w-3.5" />
                                  Export
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {result.insights.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {reportData.recommendations.length > 0 && (
                  <div>
                    <h5 className="font-medium mb-3 flex items-center gap-2 text-foreground">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      Recommendations
                    </h5>
                    <div className="space-y-2">
                      {reportData.recommendations.map((rec: any, index: number) => (
                        <div key={index} className="bg-primary/10 border border-primary/20 p-3 rounded-lg">
                          <div className="flex items-center justify-between mb-1">
                            <h6 className="font-medium text-sm text-foreground">{rec.title}</h6>
                            <Badge
                              variant="outline"
                              className={cn(
                                "text-xs border-border",
                                rec.priority === 'high' ? "text-destructive" :
                                  rec.priority === 'medium' ? "text-[hsl(var(--warning))]" : "text-muted-foreground"
                              )}
                            >
                              {rec.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{rec.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Export Button */}
                <div className="pt-4 border-t border-border">
                  <Button
                    onClick={() => onExportReport(reportData)}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                    variant="default"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No report data available</p>
                <p className="text-sm text-muted-foreground">Start a conversation to generate a report</p>
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  )
}

// Analysis Visualization Component
function AnalysisVisualization({
  analysis,
  title,
  onExport,
}: {
  analysis: any
  title: string
  onExport: (
    result: Pick<AnalysisResult, 'title' | 'type' | 'data'>,
    format: 'csv' | 'json' | 'png',
    chartElement?: HTMLElement | null
  ) => Promise<void>
}) {
  const { type, data, visualization } = analysis
  const chartContainerRef = useRef<HTMLDivElement>(null)

  if (type === 'chart') {
    const chartType = data?.chartType || 'bar'
    const labels = Array.isArray(data?.labels) ? data.labels : []
    const datasets = Array.isArray(data?.datasets) ? data.datasets : []
    const chartData = labels.map((label: string, index: number) => {
      const point: Record<string, any> = { label }
      datasets.forEach((dataset: any, datasetIndex: number) => {
        point[dataset.label || `Series ${datasetIndex + 1}`] = dataset?.data?.[index] ?? 0
      })
      return point
    })

    const palette = ['#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed']

    return (
      <div className="space-y-3 mt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">Chart Visualization</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onExport({ title, type: 'chart', data }, 'csv', chartContainerRef.current)}
            >
              <Download className="mr-2 h-3.5 w-3.5" />
              CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onExport({ title, type: 'chart', data }, 'png', chartContainerRef.current)}
            >
              <Image className="mr-2 h-3.5 w-3.5" />
              PNG
            </Button>
          </div>
        </div>
        <div ref={chartContainerRef} className="bg-muted/50 border border-border rounded-lg p-4">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'line' ? (
                <RechartsLineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d8" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip />
                  <Legend />
                  {datasets.map((dataset: any, index: number) => (
                    <Line
                      key={`${dataset.label}-${index}`}
                      type="monotone"
                      dataKey={dataset.label || `Series ${index + 1}`}
                      stroke={palette[index % palette.length]}
                      strokeWidth={2}
                    />
                  ))}
                </RechartsLineChart>
              ) : chartType === 'pie' && datasets[0] ? (
                <RechartsPieChart>
                  <RechartsTooltip />
                  <Legend />
                  <Pie
                    data={labels.map((label: string, index: number) => ({
                      name: label,
                      value: datasets[0]?.data?.[index] ?? 0,
                    }))}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={100}
                    label
                  >
                    {labels.map((label: string, index: number) => (
                      <Cell key={`${label}-${index}`} fill={palette[index % palette.length]} />
                    ))}
                  </Pie>
                </RechartsPieChart>
              ) : (
                <RechartsBarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d8" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip />
                  <Legend />
                  {datasets.map((dataset: any, index: number) => (
                    <Bar
                      key={`${dataset.label}-${index}`}
                      dataKey={dataset.label || `Series ${index + 1}`}
                      fill={palette[index % palette.length]}
                      radius={[4, 4, 0, 0]}
                    />
                  ))}
                </RechartsBarChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    )
  }

  if (type === 'table') {
    return (
      <div className="space-y-3 mt-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Table className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">Data Table</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onExport({ title, type: 'table', data }, 'csv')}
            >
              <Download className="mr-2 h-3.5 w-3.5" />
              CSV
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onExport({ title, type: 'table', data }, 'json')}
            >
              <FileText className="mr-2 h-3.5 w-3.5" />
              JSON
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-border rounded-lg">
            <thead className="bg-muted/50">
              <tr>
                {data.columns.map((col: string, idx: number) => (
                  <th key={idx} className="px-3 py-2 text-left font-medium text-foreground border-b border-border">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.rows.slice(0, 5).map((row: string[], rowIdx: number) => (
                <tr key={rowIdx} className="border-t border-border">
                  {row.map((cell: string, cellIdx: number) => (
                    <td key={cellIdx} className="px-3 py-2 text-muted-foreground">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {data.rows.length > 5 && (
            <div className="text-xs text-muted-foreground mt-2 text-center">
              Showing 5 of {data.rows.length} rows
            </div>
          )}
        </div>
      </div>
    )
  }

  if (type === 'text') {
    return (
      <div className="space-y-3 mt-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">Analysis Summary</span>
        </div>
        <div className="prose prose-invert prose-sm max-w-none text-foreground">
          <MarkdownRenderer content={data.content} />
        </div>
      </div>
    )
  }

  return null
}
