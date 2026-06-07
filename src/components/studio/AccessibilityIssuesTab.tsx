import type { ReactNode } from 'react'
import { CheckCircle, Eye, Zap } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/ui/status-badge'

import type { AccessibilityIssue } from './accessibility-manager-types'

interface AccessibilityIssuesTabProps {
  issues: AccessibilityIssue[]
  onFixIssue: (issueId: string) => void
  onFixAllIssues: () => void
  onSelectIssue: (issue: AccessibilityIssue) => void
  getIssueIcon: (type: AccessibilityIssue['type']) => ReactNode
}

export function AccessibilityIssuesTab({
  issues,
  onFixIssue,
  onFixAllIssues,
  onSelectIssue,
  getIssueIcon
}: AccessibilityIssuesTabProps) {
  return (
    <div className="space-y-4">
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
            <Button onClick={onFixAllIssues} disabled={issues.length === 0}>
              <Zap className="mr-2 h-4 w-4" />
              Fix All Issues
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {issues.map((issue) => (
          <Card key={issue.id} className={issue.fixed ? 'opacity-60' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">{getIssueIcon(issue.type)}</div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <h3 className="font-medium">{issue.title}</h3>
                    <StatusBadge status={issue.severity} />
                    <Badge variant="outline">{issue.category}</Badge>
                    {issue.automated && (
                      <Badge variant="outline" className="text-primary">
                        Automated
                      </Badge>
                    )}
                  </div>
                  <p className="mb-2 text-sm text-muted-foreground">{issue.description}</p>
                  {issue.element && (
                    <p className="mb-2 text-xs text-muted-foreground">
                      Element: <code className="rounded bg-muted px-1">{issue.element}</code>
                    </p>
                  )}
                  <div className="mb-3 rounded border border-primary/30 bg-primary/10 p-3">
                    <div className="mb-1 text-sm font-medium text-primary">Suggestion:</div>
                    <div className="text-sm text-primary/80">{issue.suggestion}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => onFixIssue(issue.id)}>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Fix Issue
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onSelectIssue(issue)}>
                      <Eye className="mr-2 h-4 w-4" />
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
  )
}
