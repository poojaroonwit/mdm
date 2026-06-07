'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/ui/status-badge'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { AccessibilityIssuesTab } from './AccessibilityIssuesTab'
import { AccessibilitySettingsTab } from './AccessibilitySettingsTab'
import type { AccessibilityIssue, AccessibilitySettings } from './accessibility-manager-types'
import { 
  Accessibility,
  Eye,
  EyeOff,
  Volume2,
  VolumeX,
  Keyboard,
  MousePointer,
  Contrast,
  Type,
  Focus,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Zap,
  Shield,
  Users,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Headphones,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  Wifi,
  WifiOff
} from 'lucide-react'

interface AccessibilityManagerProps {
  issues: AccessibilityIssue[]
  settings: AccessibilitySettings
  onUpdateSettings: (settings: Partial<AccessibilitySettings>) => void
  onFixIssue: (issueId: string) => void
  onFixAllIssues: () => void
  onScanPage: () => void
  onTestKeyboardNavigation: () => void
  onTestScreenReader: () => void
  onGenerateReport: () => void
}

export function AccessibilityManager({
  issues,
  settings,
  onUpdateSettings,
  onFixIssue,
  onFixAllIssues,
  onScanPage,
  onTestKeyboardNavigation,
  onTestScreenReader,
  onGenerateReport
}: AccessibilityManagerProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'issues' | 'settings' | 'testing' | 'report'>('overview')
  const [selectedIssue, setSelectedIssue] = useState<AccessibilityIssue | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [scanProgress, setScanProgress] = useState(0)

  const getIssueIcon = useCallback((type: AccessibilityIssue['type']) => {
    switch (type) {
      case 'error': return <XCircle className="h-4 w-4 text-destructive" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-warning" />
      case 'info': return <CheckCircle className="h-4 w-4 text-primary" />
    }
  }, [])

  const getCategoryIcon = useCallback((category: AccessibilityIssue['category']) => {
    switch (category) {
      case 'color': return <Contrast className="h-4 w-4" />
      case 'contrast': return <Contrast className="h-4 w-4" />
      case 'keyboard': return <Keyboard className="h-4 w-4" />
      case 'screen-reader': return <Volume2 className="h-4 w-4" />
      case 'focus': return <Focus className="h-4 w-4" />
      case 'alt-text': return <Eye className="h-4 w-4" />
      case 'semantic': return <Type className="h-4 w-4" />
      default: return <Accessibility className="h-4 w-4" />
    }
  }, [])

  const handleScanPage = useCallback(async () => {
    setIsScanning(true)
    setScanProgress(0)
    
    // Simulate scanning progress
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200))
      setScanProgress(i)
    }
    
    onScanPage()
    setIsScanning(false)
  }, [onScanPage])

  const unfixedIssues = issues.filter(issue => !issue.fixed)
  const highSeverityIssues = unfixedIssues.filter(issue => issue.severity === 'high')
  const mediumSeverityIssues = unfixedIssues.filter(issue => issue.severity === 'medium')
  const lowSeverityIssues = unfixedIssues.filter(issue => issue.severity === 'low')

  const accessibilityScore = Math.max(0, 100 - (highSeverityIssues.length * 10) - (mediumSeverityIssues.length * 5) - (lowSeverityIssues.length * 2))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Accessibility className="h-6 w-6" />
            Accessibility Manager
          </h2>
          <p className="text-muted-foreground">
            Ensure your pages are accessible to all users
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setActiveTab('testing')}
          >
            <Play className="h-4 w-4 mr-2" />
            Test
          </Button>
          <Button
            variant="outline"
            onClick={handleScanPage}
            disabled={isScanning}
          >
            <Zap className={`h-4 w-4 mr-2 ${isScanning ? 'animate-pulse' : ''}`} />
            {isScanning ? 'Scanning...' : 'Scan Page'}
          </Button>
          <Button onClick={onGenerateReport}>
            <Shield className="h-4 w-4 mr-2" />
            Generate Report
          </Button>
        </div>
      </div>

      {/* Accessibility Score */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Accessibility Score</h3>
              <p className="text-muted-foreground">
                {accessibilityScore >= 90 ? 'Excellent' : 
                 accessibilityScore >= 70 ? 'Good' : 
                 accessibilityScore >= 50 ? 'Needs Improvement' : 'Poor'}
              </p>
            </div>
            <div className="text-4xl font-bold">
              {accessibilityScore}/100
            </div>
          </div>
          <div className="mt-4 w-full bg-muted rounded-full h-3">
            <div
              className={`h-3 rounded-full ${
                accessibilityScore >= 90 ? 'bg-primary' :
                accessibilityScore >= 70 ? 'bg-warning' : 'bg-destructive'
              }`}
              style={{ width: `${accessibilityScore}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Issue Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              <div>
                <div className="text-2xl font-bold">{highSeverityIssues.length}</div>
                <div className="text-sm text-muted-foreground">High Priority</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <div>
                <div className="text-2xl font-bold">{mediumSeverityIssues.length}</div>
                <div className="text-sm text-muted-foreground">Medium Priority</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{lowSeverityIssues.length}</div>
                <div className="text-sm text-muted-foreground">Low Priority</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <div className="text-2xl font-bold">{issues.filter(i => i.fixed).length}</div>
                <div className="text-sm text-muted-foreground">Fixed</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-muted rounded-lg p-1">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('overview')}
        >
          <Accessibility className="h-4 w-4 mr-2" />
          Overview
        </Button>
        <Button
          variant={activeTab === 'issues' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('issues')}
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          Issues
          {unfixedIssues.length > 0 && (
            <Badge variant="destructive" className="ml-2 text-xs">
              {unfixedIssues.length}
            </Badge>
          )}
        </Button>
        <Button
          variant={activeTab === 'settings' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('settings')}
        >
          <Settings className="h-4 w-4 mr-2" />
          Settings
        </Button>
        <Button
          variant={activeTab === 'testing' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('testing')}
        >
          <Play className="h-4 w-4 mr-2" />
          Testing
        </Button>
        <Button
          variant={activeTab === 'report' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('report')}
        >
          <Shield className="h-4 w-4 mr-2" />
          Report
        </Button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  onClick={handleScanPage}
                  disabled={isScanning}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Zap className={`h-6 w-6 mb-2 ${isScanning ? 'animate-pulse' : ''}`} />
                  {isScanning ? `Scanning... ${scanProgress}%` : 'Scan Page'}
                </Button>
                <Button
                  variant="outline"
                  onClick={onTestKeyboardNavigation}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Keyboard className="h-6 w-6 mb-2" />
                  Test Keyboard Navigation
                </Button>
                <Button
                  variant="outline"
                  onClick={onTestScreenReader}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Volume2 className="h-6 w-6 mb-2" />
                  Test Screen Reader
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Issue Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Issue Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {['color', 'contrast', 'keyboard', 'screen-reader', 'focus', 'alt-text', 'semantic'].map(category => {
                  const categoryIssues = unfixedIssues.filter(issue => issue.category === category)
                  return (
                    <div key={category} className="p-4 border rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        {getCategoryIcon(category as any)}
                        <span className="font-medium capitalize">{category.replace('-', ' ')}</span>
                      </div>
                      <div className="text-2xl font-bold">{categoryIssues.length}</div>
                      <div className="text-sm text-muted-foreground">Issues found</div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Issues Tab */}
      {activeTab === 'issues' && (
        <AccessibilityIssuesTab
          issues={unfixedIssues}
          onFixIssue={onFixIssue}
          onFixAllIssues={onFixAllIssues}
          onSelectIssue={setSelectedIssue}
          getIssueIcon={getIssueIcon}
        />
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <AccessibilitySettingsTab settings={settings} onUpdateSettings={onUpdateSettings} />
      )}

      {/* Testing Tab */}
      {activeTab === 'testing' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                Accessibility Testing Tools
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={onTestKeyboardNavigation}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Keyboard className="h-6 w-6 mb-2" />
                  Keyboard Navigation Test
                </Button>
                <Button
                  variant="outline"
                  onClick={onTestScreenReader}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Volume2 className="h-6 w-6 mb-2" />
                  Screen Reader Test
                </Button>
                <Button
                  variant="outline"
                  onClick={handleScanPage}
                  disabled={isScanning}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Zap className={`h-6 w-6 mb-2 ${isScanning ? 'animate-pulse' : ''}`} />
                  {isScanning ? 'Scanning...' : 'Automated Scan'}
                </Button>
                <Button
                  variant="outline"
                  onClick={onGenerateReport}
                  className="h-20 flex flex-col items-center justify-center"
                >
                  <Shield className="h-6 w-6 mb-2" />
                  Generate Report
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Testing Results */}
          <Card>
            <CardHeader>
              <CardTitle>Testing Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <span>Keyboard Navigation</span>
                  </div>
                  <StatusBadge status="passed" label="Passed" />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-warning" />
                    <span>Screen Reader Compatibility</span>
                  </div>
                  <StatusBadge status="warning" label="Warning" />
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-destructive" />
                    <span>Color Contrast</span>
                  </div>
                  <StatusBadge status="failed" label="Failed" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Report Tab */}
      {activeTab === 'report' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Accessibility Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Generate Accessibility Report</h3>
                <p className="text-muted-foreground mb-4">
                  Create a comprehensive accessibility report for your page
                </p>
                <Button onClick={onGenerateReport}>
                  <Shield className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
