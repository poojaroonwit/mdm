import React from 'react'
import { FileIcon, LayoutDashboard, ClipboardList, Workflow, Layers, Settings, FileText } from 'lucide-react'
import { SpacesEditorPage } from '@/lib/space-studio-manager'

export interface IconResolution {
  Icon: React.ComponentType<{ className?: string }> | null
  displayContent: string | null
  displayColor: string | null
}

export function resolvePageIcon(
  page: SpacesEditorPage | undefined,
  allIcons: Array<{ name: string; icon: React.ComponentType<{ className?: string }>; library: string }>,
  reactIcons: Array<{ name: string; icon: React.ComponentType<{ className?: string }>; library: string }>
): IconResolution {
  let Icon: React.ComponentType<{ className?: string }> | null = null
  let displayContent: string | null = null
  let displayColor: string | null = null
  
  if (!page?.icon) {
    return { Icon: FileIcon, displayContent: null, displayColor: null }
  }
  
  // Check if it's a letter, number, roman, or color
  if (page.icon.startsWith('letter-')) {
    displayContent = page.icon.replace('letter-', '')
  } else if (page.icon.startsWith('number-')) {
    displayContent = page.icon.replace('number-', '')
  } else if (page.icon.startsWith('roman-')) {
    displayContent = page.icon.replace('roman-', '')
  } else if (page.icon.startsWith('color-')) {
    displayColor = page.icon.replace('color-', '')
  } else if (page.icon.startsWith('lucide-')) {
    // Lucide icon with prefix
    const iconName = page.icon.replace('lucide-', '')
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      LayoutDashboard,
      ClipboardList,
      Workflow,
      Layers,
      'File': FileIcon,
      Settings,
      FileText,
    }
    Icon = iconMap[iconName] || null
    
    // Try to find in allIcons if available
    if (!Icon && allIcons.length > 0) {
      const foundIcon = allIcons.find(i => i.name === iconName)
      if (foundIcon) {
        Icon = foundIcon.icon
      }
    }
    
    if (!Icon) {
      Icon = FileIcon
    }
  } else if (page.icon.includes('-') && !page.icon.startsWith('letter-') && !page.icon.startsWith('number-') && !page.icon.startsWith('roman-') && !page.icon.startsWith('color-')) {
    // React Icon (format: fa-*, md-*, etc.)
    // Try to find in already loaded reactIcons
    if (reactIcons.length > 0) {
      const foundIcon = reactIcons.find(i => i.name === page.icon)
      if (foundIcon) {
        Icon = foundIcon.icon
      }
    }
    
    if (!Icon) {
      Icon = FileIcon
    }
  } else {
    // Legacy lucide icon name (without prefix)
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      LayoutDashboard,
      ClipboardList,
      Workflow,
      Layers,
      'File': FileIcon,
      Settings,
      FileText,
    }
    Icon = iconMap[page.icon] || null
    
    // Try to find in allIcons if available
    if (!Icon && allIcons.length > 0) {
      const foundIcon = allIcons.find(i => i.name === page.icon)
      if (foundIcon) {
        Icon = foundIcon.icon
      }
    }
    
    // Default fallback
    if (!Icon) {
      Icon = FileIcon
    }
  }
  
  // Ensure we have something to display
  if (!Icon && !displayContent && !displayColor) {
    Icon = FileIcon
  }
  
  return { Icon, displayContent, displayColor }
}

