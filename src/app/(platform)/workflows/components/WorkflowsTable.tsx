'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Clock, Edit, Play, Settings, Trash2, Zap } from 'lucide-react'

type Workflow = {
  id: string
  name: string
  description?: string
  trigger_type: 'SCHEDULED' | 'EVENT_BASED' | 'MANUAL'
  status: 'ACTIVE' | 'INACTIVE' | 'PAUSED' | 'ERROR'
  is_active: boolean
  created_at: string
  updated_at: string
  data_model_name: string
  data_model_display_name: string
  created_by_name: string
  execution_count: number
  successful_executions: number
  failed_executions: number
}

interface WorkflowsTableProps {
  workflows: Workflow[]
  onDeleteWorkflow: (workflow: Workflow) => void
  onEditWorkflow: (workflow: Workflow) => void
  onExecuteWorkflow: (workflow: Workflow) => void
}

const getTriggerIcon = (trigger: string) => {
  switch (trigger) {
    case 'SCHEDULED': return <Clock className="h-4 w-4" />
    case 'EVENT_BASED': return <Zap className="h-4 w-4" />
    case 'MANUAL': return <Play className="h-4 w-4" />
    default: return <Settings className="h-4 w-4" />
  }
}

export function WorkflowsTable({
  workflows,
  onDeleteWorkflow,
  onEditWorkflow,
  onExecuteWorkflow
}: WorkflowsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflows</CardTitle>
        <CardDescription>Manage your automated workflows</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Data Model</TableHead>
              <TableHead>Trigger</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Executions</TableHead>
              <TableHead>Created By</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workflows.map((workflow) => (
              <TableRow key={workflow.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{workflow.name}</div>
                    {workflow.description && (
                      <div className="text-sm text-muted-foreground">{workflow.description}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{workflow.data_model_display_name}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {getTriggerIcon(workflow.trigger_type)}
                    <span className="capitalize">{workflow.trigger_type.toLowerCase().replace('_', ' ')}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={workflow.status} label={workflow.status} />
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>Total: {workflow.execution_count}</div>
                    <div className="text-green-600">Success: {workflow.successful_executions}</div>
                    <div className="text-red-600">Failed: {workflow.failed_executions}</div>
                  </div>
                </TableCell>
                <TableCell>{workflow.created_by_name}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onExecuteWorkflow(workflow)}
                    disabled={workflow.status !== 'ACTIVE'}
                  >
                    <Play className="mr-1 h-4 w-4" />
                    Execute
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onEditWorkflow(workflow)}>
                    <Edit className="mr-1 h-4 w-4" />
                    Edit
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => onDeleteWorkflow(workflow)}>
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {!workflows.length && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No workflows found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
