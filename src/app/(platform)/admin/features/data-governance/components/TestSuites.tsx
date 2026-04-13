'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { 
  TestTube, 
  Plus,
  Play,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  RefreshCw,
  Edit,
  Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'

interface TestCase {
  id: string
  name: string
  description?: string
  testDefinition: {
    testType: string
    config: Record<string, any>
  }
  entityLink: string
  testSuite: string
  parameterValues?: Array<{ name: string; value: any }>
  status: 'active' | 'inactive'
  lastRun?: Date
  lastRunStatus?: 'success' | 'failed' | 'warning'
}

interface TestSuite {
  id: string
  name: string
  description?: string
  executableEntityReference: string
  testCases: TestCase[]
  lastRun?: Date
  lastRunStatus?: 'success' | 'failed' | 'warning'
}

export function TestSuites() {
  const [testSuites, setTestSuites] = useState<TestSuite[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateSuite, setShowCreateSuite] = useState(false)
  const [showCreateTestCase, setShowCreateTestCase] = useState(false)
  const [selectedSuite, setSelectedSuite] = useState<TestSuite | null>(null)
  const [selectedTestCase, setSelectedTestCase] = useState<TestCase | null>(null)

  const [newSuite, setNewSuite] = useState({
    name: '',
    description: '',
    executableEntityReference: ''
  })

  const [newTestCase, setNewTestCase] = useState({
    name: '',
    description: '',
    testType: 'columnValueToBeBetween',
    entityLink: '',
    parameterValues: [] as Array<{ name: string; value: any }>
  })

  useEffect(() => {
    loadTestSuites()
  }, [])

  const loadTestSuites = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/data-governance/test-suites')
      if (response.ok) {
        const data = await response.json()
        setTestSuites(data.testSuites || [])
      }
    } catch (error) {
      console.error('Error loading test suites:', error)
      toast.error('Failed to load test suites')
    } finally {
      setIsLoading(false)
    }
  }

  const createTestSuite = async () => {
    if (!newSuite.name) {
      toast.error('Test suite name is required')
      return
    }

    try {
      const response = await fetch('/api/admin/data-governance/test-suites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSuite)
      })

      if (response.ok) {
        toast.success('Test suite created')
        setShowCreateSuite(false)
        setNewSuite({ name: '', description: '', executableEntityReference: '' })
        loadTestSuites()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to create test suite')
      }
    } catch (error) {
      console.error('Error creating test suite:', error)
      toast.error('Failed to create test suite')
    }
  }

  const runTestSuite = async (suiteId: string) => {
    try {
      const response = await fetch(`/api/admin/data-governance/test-suites/${suiteId}/run`, {
        method: 'POST'
      })

      if (response.ok) {
        toast.success('Test suite execution started')
        loadTestSuites()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to run test suite')
      }
    } catch (error) {
      console.error('Error running test suite:', error)
      toast.error('Failed to run test suite')
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <TestTube className="h-6 w-6" />
            Data Quality Test Suites
          </h2>
          <p className="text-muted-foreground">
            Create and manage test suites to monitor data quality
          </p>
        </div>
        <Button onClick={() => setShowCreateSuite(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Test Suite
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {testSuites.map((suite) => (
          <Card key={suite.id} className="cursor-pointer hover:shadow-md transition-all">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{suite.name}</CardTitle>
                {getStatusIcon(suite.lastRunStatus)}
              </div>
              {suite.description && (
                <CardDescription>{suite.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Test Cases:</span>
                  <Badge variant="outline">{suite.testCases.length}</Badge>
                </div>
                {suite.lastRun && (
                  <div className="text-sm text-muted-foreground">
                    Last run: {new Date(suite.lastRun).toLocaleString()}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setSelectedSuite(suite)
                      runTestSuite(suite.id)
                    }}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Run
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setSelectedSuite(suite)
                      setShowCreateTestCase(true)
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {testSuites.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <TestTube className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">No test suites configured</p>
            <Button onClick={() => setShowCreateSuite(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Test Suite
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Test Suite Dialog */}
      <Dialog open={showCreateSuite} onOpenChange={setShowCreateSuite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Test Suite</DialogTitle>
            <DialogDescription>
              Create a new test suite to group related data quality tests
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="suite-name">Test Suite Name</Label>
              <Input
                id="suite-name"
                value={newSuite.name}
                onChange={(e) => setNewSuite({ ...newSuite, name: e.target.value })}
                placeholder="e.g., Customer Data Quality"
              />
            </div>
            <div>
              <Label htmlFor="suite-description">Description</Label>
              <Textarea
                id="suite-description"
                value={newSuite.description}
                onChange={(e) => setNewSuite({ ...newSuite, description: e.target.value })}
                placeholder="Describe the purpose of this test suite"
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="suite-entity">Entity Reference (FQN)</Label>
              <Input
                id="suite-entity"
                value={newSuite.executableEntityReference}
                onChange={(e) => setNewSuite({ ...newSuite, executableEntityReference: e.target.value })}
                placeholder="database.service.table"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateSuite(false)}>
              Cancel
            </Button>
            <Button onClick={createTestSuite}>Create Suite</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

