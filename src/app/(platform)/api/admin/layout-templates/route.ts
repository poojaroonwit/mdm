
import { NextResponse } from 'next/server'
import { withErrorHandling } from '@/lib/api-middleware'

async function getHandler() {
  // Static list of system templates
  const templates = [
    {
      id: 'blank',
      name: 'Blank Canvas',
      description: 'Start with an empty page',
      config: {
        layoutId: 'blank',
        placedWidgets: []
      }
    },
    {
      id: 'standard-page',
      name: 'Standard Page',
      description: 'Header, main content area, and footer',
      config: {
        layoutId: 'standard',
        placedWidgets: []
      }
    },
    {
      id: 'dashboard-grid',
      name: 'Dashboard Grid',
      description: 'A responsive grid layout for widgets',
      config: {
        layoutId: 'grid',
        placedWidgets: []
      }
    },
    {
      id: 'sidebar-layout',
      name: 'Sidebar Layout',
      description: 'Page with a left sidebar navigation',
      config: {
        layoutId: 'sidebar',
        placedWidgets: []
      }
    }
  ]

  return NextResponse.json({ templates })
}

export const GET = withErrorHandling(getHandler, 'GET /api/admin/layout-templates')
