'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, AlertCircle, XCircle, Code, Settings, List } from 'lucide-react'
import { CodeEditor } from '@/components/ui/code-editor'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import toast from 'react-hot-toast'
import { LintIssue, LintResult, LintRule } from '../types'

export function SQLLinting() {
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM users;')
  const [lintResult, setLintResult] = useState<LintResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [lintRules, setLintRules] = useState<LintRule[]>([])
  const [loadingRules, setLoadingRules] = useState(false)

  useEffect(() => {
    loadLintRules()
  }, [])

  const loadLintRules = async () => {
    setLoadingRules(true)
    try {
      const response = await fetch('/api/sql/lint')
      if (response.ok) {
        const data = await response.json()
        setLintRules(data.rules || [])
      }
    } catch (error) {
      console.error('Failed to load lint rules:', error)
    } finally {
      setLoadingRules(false)
    }
  }

  const lintQuery = async () => {
    if (!sqlQuery.trim()) {
      toast.error('Please enter a SQL query')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/sql/lint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: sqlQuery })
      })

      if (response.ok) {
        const result = await response.json()
        setLintResult(result)
      } else {
        toast.error('Failed to lint SQL query')
      }
    } catch (error) {
      console.error('Failed to lint SQL:', error)
      toast.error('Failed to lint SQL query')
    } finally {
      setLoading(false)
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      default:
        return <AlertCircle className="w-4 h-4 text-blue-500" />
    }
  }

  const getSeverityBadge = (severity: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      error: 'destructive',
      warning: 'default',
      info: 'secondary'
    }

    return (
      <Badge variant={variants[severity] || 'secondary'}>
        {severity.toUpperCase()}
      </Badge>
    )
  }

  const getCategoryBadge = (category: string) => {
    const colors: Record<string, string> = {
      security: 'bg-red-100 text-red-800',
      performance: 'bg-yellow-100 text-yellow-800',
      'best-practice': 'bg-blue-100 text-blue-800',
      style: 'bg-gray-100 text-gray-800',
      safety: 'bg-purple-100 text-purple-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <CheckCircle2 className="w-8 h-8" />
          SQL Linting
        </h1>
        <p className="text-muted-foreground mt-2">
          Review and validate SQL queries with 200+ lint rules
        </p>
      </div>

      <div className="w-full">
      <Tabs defaultValue="lint">
        <TabsList>
          <TabsTrigger value="lint">Lint Query</TabsTrigger>
          <TabsTrigger value="rules">Lint Rules ({lintRules.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="lint" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>SQL Query</CardTitle>
            <CardDescription>Enter your SQL query to lint</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <CodeEditor
              value={sqlQuery}
              onChange={setSqlQuery}
              language="sql"
              height="400px"
              options={{
                showLineNumbers: true,
                enableAutoComplete: true
              }}
            />
            <Button onClick={lintQuery} disabled={loading} className="w-full">
              <Code className="w-4 h-4 mr-2" />
              {loading ? 'Linting...' : 'Lint Query'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lint Results</CardTitle>
            <CardDescription>
              {lintResult ? (
                <div className="flex items-center gap-2 mt-2">
                  <span>Score: </span>
                  <Badge variant={lintResult.score >= 80 ? 'default' : lintResult.score >= 50 ? 'secondary' : 'destructive'}>
                    {lintResult.score}/100
                  </Badge>
                  {lintResult.valid && (
                    <Badge variant="default" className="bg-green-500">
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Valid
                    </Badge>
                  )}
                </div>
              ) : (
                'Lint results will appear here'
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {lintResult ? (
              <div className="space-y-4">
                {lintResult.issues.length === 0 ? (
                  <div className="text-center py-8 text-green-500">
                    <CheckCircle2 className="w-12 h-12 mx-auto mb-2" />
                    <p>No issues found! Your SQL query is clean.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {lintResult.issues.map((issue, idx) => (
                      <div key={idx} className="p-3 border rounded-lg">
                        <div className="flex items-start gap-2">
                          {getSeverityIcon(issue.severity)}
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {getSeverityBadge(issue.severity)}
                              {issue.rule && (
                                <span className="text-xs text-muted-foreground">({issue.rule})</span>
                              )}
                              {issue.line && (
                                <span className="text-xs text-muted-foreground">
                                  Line {issue.line}{issue.column && `, Col ${issue.column}`}
                                </span>
                              )}
                            </div>
                            <p className="text-sm">{issue.message}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Code className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Click "Lint Query" to analyze your SQL</p>
              </div>
            )}
          </CardContent>
        </Card>
        </div>
        </TabsContent>

        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <List className="w-5 h-5" />
                Available Lint Rules
              </CardTitle>
              <CardDescription>
                Configure and manage SQL linting rules
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingRules ? (
                <div className="text-center py-8">Loading rules...</div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {lintRules.map((rule) => (
                    <div key={rule.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{rule.name}</span>
                            <Badge className={getCategoryBadge(rule.category)}>
                              {rule.category}
                            </Badge>
                            <Badge variant={rule.severity === 'error' ? 'destructive' : rule.severity === 'warning' ? 'default' : 'secondary'}>
                              {rule.severity}
                            </Badge>
                            {rule.enabled ? (
                              <Badge variant="default" className="bg-green-500">Enabled</Badge>
                            ) : (
                              <Badge variant="secondary">Disabled</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{rule.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}

