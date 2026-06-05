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

interface AccessibilityIssue {
  id: string
  type: 'error' | 'warning' | 'info'
  severity: 'high' | 'medium' | 'low'
  category: 'color' | 'contrast' | 'keyboard' | 'screen-reader' | 'focus' | 'alt-text' | 'semantic'
  title: string
  description: string
  element?: string
  suggestion: string
  automated: boolean
  fixed: boolean
}

interface AccessibilitySettings {
  highContrast: boolean
  largeText: boolean
  reducedMotion: boolean
  screenReader: boolean
  keyboardNavigation: boolean
  focusIndicators: boolean
  colorBlindSupport: boolean
  fontSize: number
  contrastRatio: number
  animationSpeed: number
  soundEffects: boolean
  voiceNavigation: boolean
  autoFocus: boolean
  skipLinks: boolean
  ariaLabels: boolean
  semanticHTML: boolean
}

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
        <div className="space-y-4">
          {/* Issue Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <Select defaultValue="all">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Issues</SelectItem>
                    <SelectItem value="high">High Priority</SelectItem>
                    <SelectItem value="medium">Medium Priority</SelectItem>
                    <SelectItem value="low">Low Priority</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="color">Color</SelectItem>
                    <SelectItem value="contrast">Contrast</SelectItem>
                    <SelectItem value="keyboard">Keyboard</SelectItem>
                    <SelectItem value="screen-reader">Screen Reader</SelectItem>
                    <SelectItem value="focus">Focus</SelectItem>
                    <SelectItem value="alt-text">Alt Text</SelectItem>
                    <SelectItem value="semantic">Semantic</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={onFixAllIssues} disabled={unfixedIssues.length === 0}>
                  <Zap className="h-4 w-4 mr-2" />
                  Fix All Issues
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Issues List */}
          <div className="space-y-3">
            {unfixedIssues.map(issue => (
              <Card key={issue.id} className={issue.fixed ? 'opacity-60' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0">
                      {getIssueIcon(issue.type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium">{issue.title}</h3>
                        <StatusBadge status={issue.severity} />
                        <Badge variant="outline">
                          {issue.category}
                        </Badge>
                        {issue.automated && (
                          <Badge variant="outline" className="text-primary">
                            Automated
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {issue.description}
                      </p>
                      {issue.element && (
                        <p className="text-xs text-muted-foreground mb-2">
                          Element: <code className="bg-muted px-1 rounded">{issue.element}</code>
                        </p>
                      )}
                      <div className="bg-primary/10 border border-primary/30 rounded p-3 mb-3">
                        <div className="text-sm font-medium text-primary mb-1">Suggestion:</div>
                        <div className="text-sm text-primary/80">{issue.suggestion}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => onFixIssue(issue.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Fix Issue
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedIssue(issue)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Accessibility Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Visual Settings */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Visual Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">High Contrast Mode</div>
                      <div className="text-sm text-muted-foreground">Increase contrast for better visibility</div>
                    </div>
                    <Switch
                      checked={settings.highContrast}
                      onCheckedChange={(checked) => onUpdateSettings({ highContrast: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Large Text</div>
                      <div className="text-sm text-muted-foreground">Increase text size for better readability</div>
                    </div>
                    <Switch
                      checked={settings.largeText}
                      onCheckedChange={(checked) => onUpdateSettings({ largeText: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Reduced Motion</div>
                      <div className="text-sm text-muted-foreground">Reduce animations and transitions</div>
                    </div>
                    <Switch
                      checked={settings.reducedMotion}
                      onCheckedChange={(checked) => onUpdateSettings({ reducedMotion: checked })}
                    />
                  </div>
                  <div>
                    <div className="font-medium mb-2">Font Size: {settings.fontSize}px</div>
                    <Slider
                      value={[settings.fontSize]}
                      onValueChange={(value) => onUpdateSettings({ fontSize: value[0] })}
                      min={12}
                      max={24}
                      step={1}
                    />
                  </div>
                  <div>
                    <div className="font-medium mb-2">Contrast Ratio: {settings.contrastRatio}:1</div>
                    <Slider
                      value={[settings.contrastRatio]}
                      onValueChange={(value) => onUpdateSettings({ contrastRatio: value[0] })}
                      min={3}
                      max={21}
                      step={1}
                    />
                  </div>
                </div>
              </div>

              {/* Navigation Settings */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Navigation Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Keyboard Navigation</div>
                      <div className="text-sm text-muted-foreground">Enable keyboard-only navigation</div>
                    </div>
                    <Switch
                      checked={settings.keyboardNavigation}
                      onCheckedChange={(checked) => onUpdateSettings({ keyboardNavigation: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Focus Indicators</div>
                      <div className="text-sm text-muted-foreground">Show visible focus indicators</div>
                    </div>
                    <Switch
                      checked={settings.focusIndicators}
                      onCheckedChange={(checked) => onUpdateSettings({ focusIndicators: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Auto Focus</div>
                      <div className="text-sm text-muted-foreground">Automatically focus on important elements</div>
                    </div>
                    <Switch
                      checked={settings.autoFocus}
                      onCheckedChange={(checked) => onUpdateSettings({ autoFocus: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Skip Links</div>
                      <div className="text-sm text-muted-foreground">Provide skip links for main content</div>
                    </div>
                    <Switch
                      checked={settings.skipLinks}
                      onCheckedChange={(checked) => onUpdateSettings({ skipLinks: checked })}
                    />
                  </div>
                </div>
              </div>

              {/* Screen Reader Settings */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Screen Reader Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Screen Reader Support</div>
                      <div className="text-sm text-muted-foreground">Optimize for screen readers</div>
                    </div>
                    <Switch
                      checked={settings.screenReader}
                      onCheckedChange={(checked) => onUpdateSettings({ screenReader: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">ARIA Labels</div>
                      <div className="text-sm text-muted-foreground">Add ARIA labels to interactive elements</div>
                    </div>
                    <Switch
                      checked={settings.ariaLabels}
                      onCheckedChange={(checked) => onUpdateSettings({ ariaLabels: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Semantic HTML</div>
                      <div className="text-sm text-muted-foreground">Use semantic HTML elements</div>
                    </div>
                    <Switch
                      checked={settings.semanticHTML}
                      onCheckedChange={(checked) => onUpdateSettings({ semanticHTML: checked })}
                    />
                  </div>
                </div>
              </div>

              {/* Audio Settings */}
              <div>
                <h3 className="text-lg font-semibold mb-4">Audio Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Sound Effects</div>
                      <div className="text-sm text-muted-foreground">Play sound effects for interactions</div>
                    </div>
                    <Switch
                      checked={settings.soundEffects}
                      onCheckedChange={(checked) => onUpdateSettings({ soundEffects: checked })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Voice Navigation</div>
                      <div className="text-sm text-muted-foreground">Enable voice commands</div>
                    </div>
                    <Switch
                      checked={settings.voiceNavigation}
                      onCheckedChange={(checked) => onUpdateSettings({ voiceNavigation: checked })}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
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
