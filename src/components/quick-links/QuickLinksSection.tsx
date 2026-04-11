'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { QuickLink, getQuickLinks, deleteQuickLink, getCategories } from '@/lib/quick-links'
import { getFaviconUrl } from '@/lib/favicon-utils'
import { QuickLinkDialog } from './QuickLinkDialog'
import { showSuccess, showError } from '@/lib/toast-utils'
import { Plus, ExternalLink, Edit2, Trash2 } from 'lucide-react'

export function QuickLinksSection() {
  const [links, setLinks] = useState<QuickLink[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showDialog, setShowDialog] = useState(false)
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null)

  const loadLinks = () => {
    const allLinks = getQuickLinks()
    setLinks(allLinks)
    const cats = getCategories()
    setCategories(cats)
  }

  useEffect(() => {
    loadLinks()
  }, [])

  const handleAddClick = () => {
    setEditingLink(null)
    setShowDialog(true)
  }

  const handleEditClick = (link: QuickLink) => {
    setEditingLink(link)
    setShowDialog(true)
  }

  const handleDeleteClick = (link: QuickLink) => {
    if (confirm(`Are you sure you want to delete "${link.name}"?`)) {
      try {
        deleteQuickLink(link.id)
        showSuccess('Quick link deleted successfully')
        loadLinks()
      } catch (error: any) {
        showError(error.message || 'Failed to delete quick link')
      }
    }
  }

  const handleLinkClick = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleDialogSuccess = () => {
    loadLinks()
  }

  // Filter links by category
  const filteredLinks = selectedCategory === 'all'
    ? links
    : links.filter(link =>
      selectedCategory === 'uncategorized'
        ? !link.category
        : link.category === selectedCategory
    )

  // Group links by category
  const groupedLinks: Record<string, QuickLink[]> = {}
  filteredLinks.forEach(link => {
    const category = link.category || 'Uncategorized'
    if (!groupedLinks[category]) {
      groupedLinks[category] = []
    }
    groupedLinks[category].push(link)
  })

  // Sort categories: Uncategorized last
  const sortedCategories = Object.keys(groupedLinks).sort((a, b) => {
    if (a === 'Uncategorized') return 1
    if (b === 'Uncategorized') return -1
    return a.localeCompare(b)
  })

  if (links.length === 0 && !showDialog) {
    return (
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Data Platform Collection</h2>
          <Button onClick={handleAddClick} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Link
          </Button>
        </div>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">
              No quick links yet. Add your first link to get started.
            </p>
            <Button onClick={handleAddClick} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Quick Link
            </Button>
          </CardContent>
        </Card>
        <QuickLinkDialog
          open={showDialog}
          onOpenChange={setShowDialog}
          link={editingLink}
          onSuccess={handleDialogSuccess}
        />
      </div>
    )
  }

  return (
    <div className="mb-8 mt-12 max-w-5xl">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Data Platform Collection</h2>
        <Button onClick={handleAddClick} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Link
        </Button>
      </div>

      {/* Category Filter */}
      {categories.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            All
          </Button>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </Button>
          ))}
          {links.some(link => !link.category) && (
            <Button
              variant={selectedCategory === 'uncategorized' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('uncategorized')}
            >
              Uncategorized
            </Button>
          )}
        </div>
      )}

      {/* Links Grid */}
      <div className="space-y-6">
        {sortedCategories.map((category) => (
          <div key={category}>
            {sortedCategories.length > 1 && (
              <h3 className="text-sm font-medium text-muted-foreground mb-3">
                {category}
              </h3>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {groupedLinks[category].map((link) => {
                const faviconUrl = link.faviconUrl || getFaviconUrl(link.url)
                return (
                  <Card
                    key={link.id}
                    className="hover:shadow-lg transition-shadow cursor-pointer group relative"
                  >
                    <CardContent className="p-4">
                      <button
                        onClick={() => handleLinkClick(link.url)}
                        aria-label={`Open ${link.name}`}
                        className="w-full flex flex-col items-center gap-3"
                      >
                        <div className="relative">
                          <img
                            src={faviconUrl}
                            alt={`${link.name} favicon`}
                            className="w-12 h-12 rounded-lg object-contain"
                            onError={(e) => {
                              // Fallback to a default icon if favicon fails to load
                              e.currentTarget.src = '/favicon.svg'
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="text-center w-full">
                          <p className="text-sm font-medium truncate">{link.name}</p>
                          {link.category && (
                            <Badge variant="secondary" className="mt-1 text-xs">
                              {link.category}
                            </Badge>
                          )}
                        </div>
                      </button>

                      {/* Edit/Delete buttons - shown on hover */}
                      <div className="absolute right-2 top-2 flex gap-1 opacity-100 transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
                        <Button
                          type="button"
                          variant="ghost"
                          aria-label={`Edit ${link.name}`}
                          className="h-10 w-10 rounded-md bg-white/95 shadow-lg dark:bg-zinc-950/95 md:h-9 md:w-9"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditClick(link)
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          aria-label={`Delete ${link.name}`}
                          className="h-10 w-10 rounded-md bg-white/95 text-destructive shadow-lg hover:text-destructive dark:bg-zinc-950/95 md:h-9 md:w-9"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteClick(link)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <QuickLinkDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        link={editingLink}
        onSuccess={handleDialogSuccess}
      />
    </div>
  )
}

