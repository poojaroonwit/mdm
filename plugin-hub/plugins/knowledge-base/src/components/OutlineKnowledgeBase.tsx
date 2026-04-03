'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Settings,
  MoreVertical,
  ChevronRight,
  ChevronDown,
  FileText,
  Folder,
  Star,
  Share2,
  Users,
  BookOpen,
  Pin,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { useKnowledgeCollections } from '../hooks/useKnowledgeCollections'
import { useKnowledgeDocuments } from '../hooks/useKnowledgeDocuments'
import { KnowledgeCollection, KnowledgeDocument } from '../types'
import { EmptyState } from '@/shared/components/EmptyState'
import { LoadingSpinner } from '@/shared/components/LoadingSpinner'
import { OutlineDocumentEditor } from './OutlineDocumentEditor'
import { OutlineSearchDialog } from './OutlineSearchDialog'

export function OutlineKnowledgeBase({ spaceId }: { spaceId?: string }) {
  const { data: session } = useSession()
  const [selectedCollection, setSelectedCollection] = useState<KnowledgeCollection | null>(null)
  const [selectedDocument, setSelectedDocument] = useState<KnowledgeDocument | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewCollectionDialog, setShowNewCollectionDialog] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [newCollectionDescription, setNewCollectionDescription] = useState('')
  const [expandedDocuments, setExpandedDocuments] = useState<Set<string>>(new Set())
  const [showSearchDialog, setShowSearchDialog] = useState(false)
  const [showCollectionSettingsDialog, setShowCollectionSettingsDialog] = useState(false)
  const [collectionSettingsName, setCollectionSettingsName] = useState('')
  const [collectionSettingsDescription, setCollectionSettingsDescription] = useState('')
  const [collectionSettingsIcon, setCollectionSettingsIcon] = useState('')
  const [collectionSettingsColor, setCollectionSettingsColor] = useState('')

  const [showNewDocumentDialog, setShowNewDocumentDialog] = useState(false)
  const [newDocumentTitle, setNewDocumentTitle] = useState('')
  const [newDocumentParentId, setNewDocumentParentId] = useState<string | undefined>(undefined)

  const {
    collections,
    loading: collectionsLoading,
    createCollection,
    updateCollection,
    deleteCollection,
    refetch: refetchCollections,
  } = useKnowledgeCollections({ spaceId, search: searchQuery })

  const {
    documents,
    loading: documentsLoading,
    createDocument,
    updateDocument,
    deleteDocument,
    refetch: refetchDocuments,
  } = useKnowledgeDocuments({
    collectionId: selectedCollection?.id || '',
    spaceId,
    parentId: undefined,
    limit: 1000,
  })

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      toast.error('Collection name is required')
      return
    }

    const collection = await createCollection({
      name: newCollectionName.trim(),
      description: newCollectionDescription.trim() || undefined,
      spaceId: spaceId || undefined,
    })

    if (collection) {
      setShowNewCollectionDialog(false)
      setNewCollectionName('')
      setNewCollectionDescription('')
      setSelectedCollection(collection)
    }
  }

  const openCreateDocumentDialog = (parentId?: string) => {
    setNewDocumentParentId(parentId)
    setNewDocumentTitle('')
    setShowNewDocumentDialog(true)
  }

  const openCollectionSettingsDialog = () => {
    if (!selectedCollection) return

    setCollectionSettingsName(selectedCollection.name)
    setCollectionSettingsDescription(selectedCollection.description || '')
    setCollectionSettingsIcon(selectedCollection.icon || '')
    setCollectionSettingsColor(selectedCollection.color || '')
    setShowCollectionSettingsDialog(true)
  }

  const handleSaveCollectionSettings = async () => {
    if (!selectedCollection) return

    const nextName = collectionSettingsName.trim()
    if (!nextName) {
      toast.error('Collection name is required')
      return
    }

    const success = await updateCollection(selectedCollection.id, {
      name: nextName,
      description: collectionSettingsDescription.trim() || undefined,
      icon: collectionSettingsIcon.trim() || undefined,
      color: collectionSettingsColor.trim() || undefined,
      spaceId,
    })

    if (!success) {
      return
    }

    setSelectedCollection({
      ...selectedCollection,
      name: nextName,
      description: collectionSettingsDescription.trim() || undefined,
      icon: collectionSettingsIcon.trim() || undefined,
      color: collectionSettingsColor.trim() || undefined,
    })
    setShowCollectionSettingsDialog(false)
  }

  const handleCreateDocument = async () => {
    if (!selectedCollection) return

    if (!newDocumentTitle.trim()) {
      toast.error('Document title is required')
      return
    }

    const document = await createDocument({
      title: newDocumentTitle.trim(),
      content: `# ${newDocumentTitle.trim()}\n\nStart writing...`,
      parentId: newDocumentParentId,
    })

    if (document) {
      if (newDocumentParentId) {
        setExpandedDocuments((prev) => new Set(prev).add(newDocumentParentId))
      }
      setShowNewDocumentDialog(false)
      setNewDocumentTitle('')
      setNewDocumentParentId(undefined)
      setSelectedDocument(document)
      await Promise.all([refetchDocuments(), refetchCollections()])
    }
  }

  const handleDeleteDocument = async (id: string) => {
    const success = await deleteDocument(id)
    if (!success) return false

    if (selectedDocument?.id === id) {
      setSelectedDocument(null)
    }

    await Promise.all([refetchDocuments(), refetchCollections()])
    return true
  }

  const toggleDocumentExpanded = (docId: string) => {
    const newExpanded = new Set(expandedDocuments)
    if (newExpanded.has(docId)) {
      newExpanded.delete(docId)
    } else {
      newExpanded.add(docId)
    }
    setExpandedDocuments(newExpanded)
  }

  // Build document tree
  const buildDocumentTree = (parentId?: string): KnowledgeDocument[] => {
    return documents
      .filter((doc) => (doc.parentId ?? undefined) === parentId)
      .sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1
        if (!a.isPinned && b.isPinned) return 1
        return a.order - b.order
      })
      .map((doc) => ({
        ...doc,
        children: buildDocumentTree(doc.id),
      }))
  }

  const documentTree = buildDocumentTree()

  if (!selectedCollection) {
    return (
      <div className="h-screen flex flex-col bg-white dark:bg-gray-950">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Knowledge Base</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Organize and share your team's knowledge
              </p>
            </div>
            <Dialog open={showNewCollectionDialog} onOpenChange={setShowNewCollectionDialog}>
              <DialogTrigger asChild>
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Collection
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Collection</DialogTitle>
                  <DialogDescription>
                    Collections help organize your documents into groups
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Name</label>
                    <Input
                      placeholder="Collection name..."
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && newCollectionName.trim()) {
                          handleCreateCollection()
                        }
                      }}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Description (Optional)</label>
                    <Input
                      placeholder="Brief description..."
                      value={newCollectionDescription}
                      onChange={(e) => setNewCollectionDescription(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowNewCollectionDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCollection} className="bg-blue-600 hover:bg-blue-700 text-white">
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Search */}
        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-3">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search collections..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            />
          </div>
        </div>

        {/* Collections List */}
        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-6">
            {collectionsLoading ? (
              <div className="flex items-center justify-center py-16">
                <LoadingSpinner />
              </div>
            ) : collections.length === 0 ? (
              <EmptyState
                title="No collections yet"
                description="Create your first collection to get started"
                icon={<BookOpen className="h-16 w-16 text-gray-300 dark:text-gray-600" />}
                action={{
                  label: 'Create Collection',
                  onClick: () => setShowNewCollectionDialog(true),
                }}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {collections.map((collection) => (
                  <div
                    key={collection.id}
                    className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer bg-white dark:bg-gray-900"
                    onClick={() => setSelectedCollection(collection)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {collection.icon ? (
                          <span className="text-2xl">{collection.icon}</span>
                        ) : (
                          <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        )}
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {collection.name}
                        </h3>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            // Open edit dialog (can be enhanced with a proper edit dialog)
                            const newName = prompt('Enter new collection name:', collection.name)
                            if (newName && newName.trim() && newName !== collection.name) {
                              updateCollection(collection.id, { name: newName.trim() })
                            }
                          }}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation()
                              if (confirm('Are you sure you want to delete this collection?')) {
                                deleteCollection(collection.id)
                              }
                            }}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {collection.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                        {collection.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>{collection.documentCount || 0} documents</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{collection.memberCount || 0} members</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

      </div>
    )
  }

  // Document view
  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedCollection(null)
              setSelectedDocument(null)
            }}
          >
            ← Back
          </Button>
          <div className="flex items-center gap-2">
            {selectedCollection.icon && (
              <span className="text-xl">{selectedCollection.icon}</span>
            )}
            <h2 className="font-semibold text-gray-900 dark:text-white">
              {selectedCollection.name}
            </h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowSearchDialog(true)}
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => openCreateDocumentDialog()}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Document
          </Button>
          <Button variant="outline" size="sm" onClick={openCollectionSettingsDialog}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Document Tree */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col">
          <div className="p-3 border-b border-gray-200 dark:border-gray-800">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search documents..."
                className="pl-9 h-9 bg-white dark:bg-gray-800"
              />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {documentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : documentTree.length === 0 ? (
                <EmptyState
                  title="No documents"
                  description="Create your first document"
                  icon={<FileText className="h-12 w-12 text-gray-300 dark:text-gray-600" />}
                />
              ) : (
                <DocumentTree
                  documents={documentTree}
                  selectedDocument={selectedDocument}
                  expandedDocuments={expandedDocuments}
                  onSelectDocument={setSelectedDocument}
                  onToggleExpanded={toggleDocumentExpanded}
                  onCreateDocument={openCreateDocumentDialog}
                  onDeleteDocument={handleDeleteDocument}
                />
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {selectedDocument ? (
            <OutlineDocumentEditor
              document={selectedDocument}
              collection={selectedCollection}
              onUpdate={updateDocument}
              onClose={() => setSelectedDocument(null)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              <EmptyState
                title="Select a document"
                description="Choose a document from the sidebar to start editing"
                icon={<FileText className="h-16 w-16 text-gray-300 dark:text-gray-600" />}
              />
            </div>
          )}
        </div>
      </div>

      {/* Search Dialog */}
      <OutlineSearchDialog
        open={showSearchDialog}
        onOpenChange={setShowSearchDialog}
        onSelectDocument={(documentId, collectionId) => {
          // Find and select the collection and document
          const collection = collections.find(c => c.id === collectionId)
          if (collection) {
            setSelectedCollection(collection)
            // Fetch and select the document
            // This will be handled by the document editor
          }
        }}
        spaceId={spaceId}
      />

      <Dialog open={showCollectionSettingsDialog} onOpenChange={setShowCollectionSettingsDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Collection Settings</DialogTitle>
            <DialogDescription>
              Update the collection details shown in the knowledge base.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Name</label>
              <Input
                value={collectionSettingsName}
                onChange={(e) => setCollectionSettingsName(e.target.value)}
                placeholder="Collection name..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Description</label>
              <Input
                value={collectionSettingsDescription}
                onChange={(e) => setCollectionSettingsDescription(e.target.value)}
                placeholder="Brief description..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Icon</label>
                <Input
                  value={collectionSettingsIcon}
                  onChange={(e) => setCollectionSettingsIcon(e.target.value)}
                  placeholder="e.g. 📚"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Color</label>
                <Input
                  value={collectionSettingsColor}
                  onChange={(e) => setCollectionSettingsColor(e.target.value)}
                  placeholder="e.g. #2563eb"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCollectionSettingsDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCollectionSettings} className="bg-blue-600 hover:bg-blue-700 text-white">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {/* New Document Dialog */}
      <Dialog open={showNewDocumentDialog} onOpenChange={setShowNewDocumentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Document</DialogTitle>
            <DialogDescription>
              Create a new document in {selectedCollection?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Title</label>
              <Input
                placeholder="Document title..."
                value={newDocumentTitle}
                onChange={(e) => setNewDocumentTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newDocumentTitle.trim()) {
                    handleCreateDocument()
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDocumentDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateDocument} className="bg-blue-600 hover:bg-blue-700 text-white">
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Document Tree Component
interface DocumentTreeProps {
  documents: KnowledgeDocument[]
  selectedDocument: KnowledgeDocument | null
  expandedDocuments: Set<string>
  onSelectDocument: (doc: KnowledgeDocument) => void
  onToggleExpanded: (docId: string) => void
  onCreateDocument: (parentId?: string) => void
  onDeleteDocument: (id: string) => Promise<boolean>
}

function DocumentTree({
  documents,
  selectedDocument,
  expandedDocuments,
  onSelectDocument,
  onToggleExpanded,
  onCreateDocument,
  onDeleteDocument,
}: DocumentTreeProps) {
  return (
    <div className="space-y-1">
      {documents.map((doc) => {
        const hasChildren = doc.children && doc.children.length > 0
        const isExpanded = expandedDocuments.has(doc.id)
        const isSelected = selectedDocument?.id === doc.id

        return (
          <div key={doc.id}>
            <div
              className={cn(
                'flex items-center gap-1 group px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer',
                isSelected && 'bg-blue-50 dark:bg-blue-900/20'
              )}
              onClick={() => onSelectDocument(doc)}
            >
              {hasChildren ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleExpanded(doc.id)
                  }}
                  className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              ) : (
                <div className="w-5" />
              )}
              {doc.isPinned && <Pin className="h-3 w-3 text-yellow-500" />}
              <FileText className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">
                {doc.title}
              </span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onCreateDocument(doc.id)}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Sub-document
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this document?')) {
                        onDeleteDocument(doc.id)
                      }
                    }}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {hasChildren && isExpanded && (
              <div className="ml-6">
                <DocumentTree
                  documents={doc.children || []}
                  selectedDocument={selectedDocument}
                  expandedDocuments={expandedDocuments}
                  onSelectDocument={onSelectDocument}
                  onToggleExpanded={onToggleExpanded}
                  onCreateDocument={onCreateDocument}
                  onDeleteDocument={onDeleteDocument}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

