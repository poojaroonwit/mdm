import { LucideIcon } from 'lucide-react'

export interface RouteMetadata {
  name: string
  icon: string // Icon name from lucide-react
  color: string // Hex color
  category: 'tools' | 'admin' | 'system' | 'content' | 'overview'
  description?: string
}

// Centralized route metadata configuration
export const routeMetadata: Record<string, RouteMetadata> = {
  // Overview
  '/': {
    name: 'Home',
    icon: 'Home',
    color: '#6b7280',
    category: 'overview',
    description: 'Platform homepage and overview',
  },

  // Tools
  '/tools/bigquery': {
    name: 'SQL Query',
    icon: 'Database',
    color: '#1e40af',
    category: 'tools',
    description: 'Query data across all spaces',
  },
  '/tools/notebook': {
    name: 'Data Science Notebooks',
    icon: 'BarChart3',
    color: '#16a34a',
    category: 'tools',
    description: 'Interactive notebooks for analysis',
  },
  '/tools/ai-analyst': {
    name: 'Chat with AI',
    icon: 'MessageCircle',
    color: '#9333ea',
    category: 'tools',
    description: 'AI-powered data analysis',
  },
  '/tools/ai-chat-ui': {
    name: 'Agent Embed GUI',
    icon: 'Bot',
    color: '#10b981',
    category: 'tools',
    description: 'Chatbot configuration interface',
  },
  '/tools/projects': {
    name: 'Project Management',
    icon: 'Kanban',
    color: '#8b5cf6',
    category: 'tools',
    description: 'Manage tickets and projects',
  },
  '/tools/bi': {
    name: 'Business Intelligence',
    icon: 'BarChart3',
    color: '#ea580c',
    category: 'tools',
    description: 'BI reports and analytics',
  },
  '/tools/storage': {
    name: 'Storage Management',
    icon: 'HardDrive',
    color: '#0891b2',
    category: 'tools',
    description: 'Manage storage and files',
  },
  '/tools/data-governance': {
    name: 'Data Governance',
    icon: 'Shield',
    color: '#059669',
    category: 'tools',
    description: 'Data quality and governance',
  },

  // Knowledge & Content
  '/knowledge': {
    name: 'Knowledge Base',
    icon: 'BookOpen',
    color: '#14b8a6',
    category: 'content',
    description: 'Documentation and wiki',
  },
  '/marketplace': {
    name: 'Marketplace',
    icon: 'Package',
    color: '#ec4899',
    category: 'content',
    description: 'Discover and install plugins',
  },
  '/infrastructure': {
    name: 'Infrastructure',
    icon: 'Server',
    color: '#f59e0b',
    category: 'content',
    description: 'Infrastructure overview',
  },

  // System - Users & Permissions
  '/system/users': {
    name: 'User Management',
    icon: 'Users',
    color: '#dc2626',
    category: 'system',
    description: 'Manage users and permissions',
  },
  '/system/roles': {
    name: 'Role & Permission Management',
    icon: 'Shield',
    color: '#d97706',
    category: 'system',
    description: 'Manage roles and permissions',
  },
  '/system/permission-tester': {
    name: 'Permission Tester',
    icon: 'TestTube',
    color: '#a855f7',
    category: 'system',
    description: 'Test and debug permissions',
  },

  // System - Spaces
  '/system/space-layouts': {
    name: 'Space Layouts',
    icon: 'Layout',
    color: '#4f46e5',
    category: 'system',
    description: 'Manage layout templates',
  },
  '/system/space-settings': {
    name: 'Space Settings',
    icon: 'Building2',
    color: '#0891b2',
    category: 'system',
    description: 'Configure space settings',
  },
  '/admin/space-selection': {
    name: 'Space Selection',
    icon: 'Building2',
    color: '#0284c7',
    category: 'admin',
    description: 'Select and manage spaces',
  },

  // System - Content & Data
  '/system/attachments': {
    name: 'Attachment Manager',
    icon: 'Paperclip',
    color: '#ea580c',
    category: 'system',
    description: 'Manage file attachments',
  },
  '/system/data': {
    name: 'Data Model Management',
    icon: 'Database',
    color: '#0ea5e9',
    category: 'system',
    description: 'Manage data models',
  },
  '/system/database': {
    name: 'Database Management',
    icon: 'Database',
    color: '#6366f1',
    category: 'system',
    description: 'Database administration',
  },
  '/system/change-requests': {
    name: 'Change Requests',
    icon: 'GitPullRequest',
    color: '#8b5cf6',
    category: 'system',
    description: 'Manage content changes',
  },

  // System - Development
  '/system/kernels': {
    name: 'Kernel Management',
    icon: 'Cpu',
    color: '#7c3aed',
    category: 'system',
    description: 'Manage notebook kernels',
  },
  '/system/sql-linting': {
    name: 'SQL Linting',
    icon: 'Code',
    color: '#0d9488',
    category: 'system',
    description: 'SQL code quality checks',
  },
  '/system/schema-migrations': {
    name: 'Schema Migrations',
    icon: 'RefreshCw',
    color: '#0891b2',
    category: 'system',
    description: 'Database schema migrations',
  },
  '/system/data-masking': {
    name: 'Data Masking',
    icon: 'EyeOff',
    color: '#7c3aed',
    category: 'system',
    description: 'Data privacy and masking',
  },

  // System - Monitoring & Performance
  '/system/logs': {
    name: 'Log Management',
    icon: 'FileText',
    color: '#64748b',
    category: 'system',
    description: 'View and manage logs',
  },
  '/system/audit': {
    name: 'Audit Logs',
    icon: 'Shield',
    color: '#dc2626',
    category: 'system',
    description: 'Security audit logs',
  },
  '/system/cache': {
    name: 'Cache Management',
    icon: 'Zap',
    color: '#eab308',
    category: 'system',
    description: 'Manage application cache',
  },

  // System - Storage & Backup
  '/system/backup': {
    name: 'Backup & Recovery',
    icon: 'Database',
    color: '#0284c7',
    category: 'system',
    description: 'Backup and restore data',
  },

  // System - Security & Integration
  '/system/security': {
    name: 'Security Features',
    icon: 'Lock',
    color: '#dc2626',
    category: 'system',
    description: 'Security settings and features',
  },
  '/system/api': {
    name: 'API Management',
    icon: 'Code',
    color: '#0891b2',
    category: 'system',
    description: 'API configuration and keys',
  },


  // System - Configuration
  '/system/settings': {
    name: 'System Settings',
    icon: 'Settings',
    color: '#6b7280',
    category: 'system',
    description: 'Global system configuration',
  },
  '/system/page-templates': {
    name: 'Page Templates',
    icon: 'FileText',
    color: '#6366f1',
    category: 'system',
    description: 'Manage page templates',
  },
  '/system/notifications': {
    name: 'Notification Center',
    icon: 'Bell',
    color: '#f59e0b',
    category: 'system',
    description: 'Notification settings',
  },
  '/system/export': {
    name: 'Data Export/Import',
    icon: 'Download',
    color: '#16a34a',
    category: 'system',
    description: 'Export and import data',
  },

  // Other Routes
  '/dashboard': {
    name: 'Dashboard',
    icon: 'LayoutDashboard',
    color: '#1e40af',
    category: 'overview',
    description: 'Main dashboard',
  },
  '/dashboards': {
    name: 'Dashboards',
    icon: 'LayoutDashboard',
    color: '#06b6d4',
    category: 'content',
    description: 'Custom dashboards',
  },
  '/reports': {
    name: 'Reports',
    icon: 'FileText',
    color: '#8b5cf6',
    category: 'content',
    description: 'View and manage reports',
  },
  '/workflows': {
    name: 'Workflows',
    icon: 'Workflow',
    color: '#7c3aed',
    category: 'content',
    description: 'Workflow automation',
  },
}

/**
 * Get route metadata by path
 */
export function getRouteMetadata(path: string): RouteMetadata | null {
  return routeMetadata[path] || null
}

/**
 * Get route metadata with fallback for dynamic routes
 */
export function getRouteMetadataWithFallback(path: string): RouteMetadata {
  // Try exact match first
  if (routeMetadata[path]) {
    return routeMetadata[path]
  }

  // Try matching parent paths for dynamic routes
  const segments = path.split('/').filter(Boolean)
  for (let i = segments.length; i > 0; i--) {
    const parentPath = '/' + segments.slice(0, i).join('/')
    if (routeMetadata[parentPath]) {
      return routeMetadata[parentPath]
    }
  }

  // Default fallback
  return {
    name: 'Page',
    icon: 'FileText',
    color: '#6b7280',
    category: 'content',
  }
}

/**
 * Get all routes for a specific category
 */
export function getRoutesByCategory(category: RouteMetadata['category']): Array<{ path: string; metadata: RouteMetadata }> {
  return Object.entries(routeMetadata)
    .filter(([_, metadata]) => metadata.category === category)
    .map(([path, metadata]) => ({ path, metadata }))
}
