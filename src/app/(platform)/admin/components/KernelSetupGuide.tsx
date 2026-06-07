'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { 
  BookOpen,
  Download,
  Copy,
  CheckCircle,
  AlertCircle,
  Info,
  Terminal,
  Server,
  Code,
  Database,
  FileCode,
  Globe,
  Shield,
  Key,
  Settings,
  Play,
  Square,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  XCircle,
  Eye,
  EyeOff,
  FileText,
  Package,
  Server as Docker,
  GitBranch,
  Zap,
  Monitor,
  Activity,
  HardDrive,
  Cpu,
  MemoryStick,
  Network
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { showSuccess, ToastMessages } from '@/lib/toast-utils'
import { kernelSetupScripts } from './kernelSetupScripts'

interface SetupGuideProps {
  onClose?: () => void
}

function KernelScriptTab({
  description,
  filename,
  icon,
  installLabel = 'What this script installs:',
  items,
  script,
  tab,
  title,
  onCopy,
  onDownload
}: {
  description: string
  filename: string
  icon: ReactNode
  installLabel?: string
  items: string[]
  script: string
  tab: string
  title: string
  onCopy: (script: string) => void
  onDownload: (script: string, filename: string) => void
}) {
  return (
    <TabsContent value={tab} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {icon}
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Button onClick={() => onDownload(script, filename)}>
              <Download className="h-4 w-4 mr-2" />
              Download Script
            </Button>
            <Button variant="outline" onClick={() => onCopy(script)}>
              <Copy className="h-4 w-4 mr-2" />
              Copy Script
            </Button>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <pre className="text-sm overflow-x-auto">{script}</pre>
          </div>

          <div className="space-y-3">
            <h4 className="font-semibold">{installLabel}</h4>
            <div className={tab === 'docker' ? 'space-y-2' : 'grid grid-cols-2 gap-2'}>
              {items.map((item) => (
                <div key={item} className="flex items-center gap-2">
                  {tab === 'docker' ? (
                    <Docker className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Package className={cn(
                      'h-4 w-4',
                      tab === 'r' ? 'text-purple-500' : tab === 'julia' ? 'text-red-500' : 'text-blue-500'
                    )} />
                  )}
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  )
}

export function KernelSetupGuide({ onClose }: SetupGuideProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['quick-start']))

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    showSuccess(ToastMessages.COPIED)
  }

  const downloadScript = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)
    showSuccess(`Downloaded ${filename}`)
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-blue-600" />
            Kernel Setup Guide
          </h1>
          <p className="text-muted-foreground mt-2">
            Comprehensive guide to setting up remote kernel servers for notebook execution
          </p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            <XCircle className="h-4 w-4 mr-2" />
            Close
          </Button>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Supported Languages</span>
            </div>
            <div className="text-2xl font-bold mt-1">4+</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Docker className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Docker Support</span>
            </div>
            <div className="text-2xl font-bold mt-1">Yes</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Security</span>
            </div>
            <div className="text-2xl font-bold mt-1">Enterprise</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">Setup Time</span>
            </div>
            <div className="text-2xl font-bold mt-1">5 min</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="w-full">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="python">Python</TabsTrigger>
          <TabsTrigger value="r">R</TabsTrigger>
          <TabsTrigger value="julia">Julia</TabsTrigger>
          <TabsTrigger value="docker">Docker</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                What are Kernel Servers?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Kernel servers are remote execution environments that run your code in isolated, 
                scalable containers. They provide the computational power for your notebook cells 
                and can be shared across multiple users and projects.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-green-700">Benefits</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Scalable compute resources
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Isolated execution environments
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Multi-language support
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Resource monitoring
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Easy deployment and management
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-semibold text-blue-700">Use Cases</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <Code className="h-4 w-4 text-blue-500" />
                      Data science and analytics
                    </li>
                    <li className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-blue-500" />
                      Machine learning model training
                    </li>
                    <li className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-blue-500" />
                      Statistical analysis and reporting
                    </li>
                    <li className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-blue-500" />
                      High-performance computing
                    </li>
                    <li className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-blue-500" />
                      Collaborative data science
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Start
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Option 1: Docker (Recommended)</h4>
                  <p className="text-blue-800 text-sm mb-3">
                    Fastest way to get started with pre-configured kernel servers
                  </p>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => downloadScript(kernelSetupScripts.docker, 'docker-kernels.sh')}>
                      <Download className="h-4 w-4 mr-1" />
                      Download Script
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(kernelSetupScripts.docker)}>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy Script
                    </Button>
                  </div>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-900 mb-2">Option 2: Manual Installation</h4>
                  <p className="text-green-800 text-sm mb-3">
                    Full control over the installation process and configuration
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button size="sm" onClick={() => setActiveTab('python')}>
                      <FileCode className="h-4 w-4 mr-1" />
                      Python
                    </Button>
                    <Button size="sm" onClick={() => setActiveTab('r')}>
                      <Database className="h-4 w-4 mr-1" />
                      R
                    </Button>
                    <Button size="sm" onClick={() => setActiveTab('julia')}>
                      <Zap className="h-4 w-4 mr-1" />
                      Julia
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <KernelScriptTab
          tab="python"
          title="Python Kernel Setup"
          description="Set up a Python kernel server with popular data science libraries"
          filename="python-kernel-setup.sh"
          icon={<Code className="h-5 w-5 text-blue-500" />}
          script={kernelSetupScripts.python}
          items={['Jupyter Lab', 'Pandas', 'NumPy', 'Matplotlib', 'Seaborn', 'Scikit-learn', 'Plotly', 'IPython Kernel']}
          onCopy={copyToClipboard}
          onDownload={downloadScript}
        />

        <KernelScriptTab
          tab="r"
          title="R Kernel Setup"
          description="Set up an R kernel server for statistical analysis and reporting"
          filename="r-kernel-setup.sh"
          icon={<Database className="h-5 w-5 text-purple-500" />}
          script={kernelSetupScripts.r}
          items={['R Base', 'RStudio Server', 'ggplot2', 'dplyr', 'tidyr', 'shiny', 'rmarkdown', 'knitr']}
          onCopy={copyToClipboard}
          onDownload={downloadScript}
        />

        <KernelScriptTab
          tab="julia"
          title="Julia Kernel Setup"
          description="Set up a Julia kernel server for high-performance computing"
          filename="julia-kernel-setup.sh"
          icon={<Zap className="h-5 w-5 text-red-500" />}
          script={kernelSetupScripts.julia}
          items={['Julia 1.9', 'IJulia', 'Plots', 'DataFrames', 'Flux', 'DifferentialEquations', 'JuMP', 'Jupyter Lab']}
          onCopy={copyToClipboard}
          onDownload={downloadScript}
        />

        <KernelScriptTab
          tab="docker"
          title="Docker-based Setup"
          description="Set up multiple kernel servers using Docker containers"
          filename="docker-kernels.sh"
          icon={<Docker className="h-5 w-5 text-blue-500" />}
          script={kernelSetupScripts.docker}
          installLabel="What this script creates:"
          items={['Python kernel container (port 8888)', 'R kernel container (port 8787)', 'Julia kernel container (port 8890)', 'Health checks for all containers', 'Volume mounts for notebooks and data']}
          onCopy={copyToClipboard}
          onDownload={downloadScript}
        />
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Advanced Configuration
              </CardTitle>
              <CardDescription>
                Advanced configuration options for production deployments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h4 className="font-semibold">Security Configuration</h4>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h5 className="font-medium text-yellow-900 mb-2">Authentication Methods</h5>
                  <ul className="space-y-1 text-sm text-yellow-800">
                    <li>• <strong>Token-based:</strong> Secure random tokens for API access</li>
                    <li>• <strong>OAuth 2.0:</strong> Enterprise SSO integration</li>
                    <li>• <strong>Basic Auth:</strong> Username/password authentication</li>
                    <li>• <strong>Certificate:</strong> Client certificate authentication</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Performance Tuning</h4>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h5 className="font-medium text-green-900 mb-2">Resource Limits</h5>
                  <ul className="space-y-1 text-sm text-green-800">
                    <li>• <strong>CPU:</strong> Set appropriate CPU limits for each kernel</li>
                    <li>• <strong>Memory:</strong> Configure memory limits to prevent OOM</li>
                    <li>• <strong>Disk:</strong> Set disk quotas for temporary files</li>
                    <li>• <strong>Network:</strong> Configure network bandwidth limits</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Monitoring & Logging</h4>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h5 className="font-medium text-blue-900 mb-2">Health Monitoring</h5>
                  <ul className="space-y-1 text-sm text-blue-800">
                    <li>• <strong>Health Checks:</strong> Regular endpoint monitoring</li>
                    <li>• <strong>Metrics:</strong> CPU, memory, and disk usage tracking</li>
                    <li>• <strong>Logging:</strong> Structured logging with different levels</li>
                    <li>• <strong>Alerting:</strong> Automated alerts for failures</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Scaling & Load Balancing</h4>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h5 className="font-medium text-purple-900 mb-2">Production Deployment</h5>
                  <ul className="space-y-1 text-sm text-purple-800">
                    <li>• <strong>Load Balancer:</strong> Distribute requests across multiple kernels</li>
                    <li>• <strong>Auto-scaling:</strong> Automatically scale based on demand</li>
                    <li>• <strong>High Availability:</strong> Multi-region deployment</li>
                    <li>• <strong>Backup:</strong> Regular backup of kernel configurations</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
