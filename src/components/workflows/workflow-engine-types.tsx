import React from 'react'
import {
  Activity,
  Clock,
  Database,
  Edit,
  Mail,
  Plus,
  Trash2,
  Webhook,
  Zap
} from 'lucide-react'

export interface WorkflowNode {
  id: string
  type: 'trigger' | 'condition' | 'action' | 'delay'
  name: string
  description: string
  config: Record<string, any>
  position: { x: number; y: number }
  connections: string[]
}

export interface Workflow {
  id: string
  name: string
  description: string
  status: 'draft' | 'active' | 'paused' | 'archived'
  nodes: WorkflowNode[]
  triggers: WorkflowTrigger[]
  isSystem: boolean
  created_at: Date
  updated_at: Date
}

export interface WorkflowTrigger {
  id: string
  type: 'record_created' | 'record_updated' | 'record_deleted' | 'scheduled' | 'webhook'
  name: string
  config: Record<string, any>
  enabled: boolean
}

export interface WorkflowExecution {
  id: string
  workflow_id: string
  status: 'running' | 'completed' | 'failed' | 'paused'
  started_at: Date
  completed_at?: Date
  error_message?: string
  context: Record<string, any>
}

export const NODE_TYPES = [
  {
    type: 'trigger',
    name: 'Trigger',
    description: 'Start a workflow',
    icon: <Zap className="h-4 w-4" />,
    color: 'bg-blue-500'
  },
  {
    type: 'condition',
    name: 'Condition',
    description: 'Check if condition is met',
    icon: <Activity className="h-4 w-4" />,
    color: 'bg-yellow-500'
  },
  {
    type: 'action',
    name: 'Action',
    description: 'Perform an action',
    icon: <Database className="h-4 w-4" />,
    color: 'bg-green-500'
  },
  {
    type: 'delay',
    name: 'Delay',
    description: 'Wait for specified time',
    icon: <Clock className="h-4 w-4" />,
    color: 'bg-purple-500'
  }
]

export const TRIGGER_TYPES = [
  {
    type: 'record_created',
    name: 'Record Created',
    description: 'Triggered when a new record is created',
    icon: <Database className="h-4 w-4" />
  },
  {
    type: 'record_updated',
    name: 'Record Updated',
    description: 'Triggered when a record is updated',
    icon: <Edit className="h-4 w-4" />
  },
  {
    type: 'record_deleted',
    name: 'Record Deleted',
    description: 'Triggered when a record is deleted',
    icon: <Trash2 className="h-4 w-4" />
  },
  {
    type: 'scheduled',
    name: 'Scheduled',
    description: 'Triggered on a schedule',
    icon: <Clock className="h-4 w-4" />
  },
  {
    type: 'webhook',
    name: 'Webhook',
    description: 'Triggered by external webhook',
    icon: <Webhook className="h-4 w-4" />
  }
]

export const ACTION_TYPES = [
  {
    type: 'send_email',
    name: 'Send Email',
    description: 'Send an email notification',
    icon: <Mail className="h-4 w-4" />
  },
  {
    type: 'update_record',
    name: 'Update Record',
    description: 'Update a data record',
    icon: <Database className="h-4 w-4" />
  },
  {
    type: 'create_record',
    name: 'Create Record',
    description: 'Create a new data record',
    icon: <Plus className="h-4 w-4" />
  },
  {
    type: 'webhook_call',
    name: 'Webhook Call',
    description: 'Call an external webhook',
    icon: <Webhook className="h-4 w-4" />
  }
]
