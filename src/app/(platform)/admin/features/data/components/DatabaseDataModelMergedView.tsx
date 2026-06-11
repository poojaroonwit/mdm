// @ts-nocheck
'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Database, Folder, ChevronRight, Search, Table, RefreshCw, GitBranch, MoreVertical, Sparkles, Lock, Plus, Server, Code, Building2, Filter, X, LayoutGrid, LayoutList, Rows3 } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import ERDDiagram from '@/components/erd/ERDDiagram'
import { cn } from '@/lib/utils'
import { AddDatabaseConnectionDialog } from './AddDatabaseConnectionDialog'
import { DataModelTree } from './DataModelTree'
import { DataModelDetailDrawer } from './DataModelDetailDrawer'
import { DatabaseConnectionSidebar } from './DatabaseConnectionSidebar'
import { DatabaseSchemaContent } from './DatabaseSchemaContent'
import toast from 'react-hot-toast'

export function DatabaseDataModelMergedView(props: any) {
  const { connections, selectedDatabase, setSelectedDatabase, databaseTypes, isLoadingDatabases, spaces, selectedSpaceFilter, setSelectedSpaceFilter, showAddConnection, setShowAddConnection, isTestingConnection, connectionTestResult, newConnection, setNewConnection, discoveredTables, models, folders, isLoadingModels, searchValue, setSearchValue, expandedFolders, viewMode, setViewMode, databaseSchema, isLoadingSchema, schemaDisplayMode, setSchemaDisplayMode, modelQueries, setModelQueries, editingQueryModel, setEditingQueryModel, erdModels, setErdModels, erdRelationships, setErdRelationships, isLoadingERD, isDetailDrawerOpen, setIsDetailDrawerOpen, selectedDetailItem, selectedAttribute, setSelectedAttribute, modelAttributes, isLoadingAttributes, attributeOptions, isLoadingOptions, themeConfig, loadConnections, loadModels, loadERDData, getDatabaseIcon, getStatusIcon, createConnection, testNewConnection, resetNewConnection, openDetailDrawer, handleAttributeClick, closeDetailDrawer, treeStructure, rootModels, toggleFolder } = props

  const selectedConnection = connections.find(c => c.id === selectedDatabase)

  // Get theme colors - precise engineering approach
  const primaryColor = themeConfig?.primaryColor || '#007AFF'
  const uiBg = themeConfig?.uiBackgroundColor || themeConfig?.topMenuBackgroundColor || '#ffffff'
  const uiBorder = themeConfig?.uiBorderColor || 'rgba(0, 0, 0, 0.06)'
  const bodyText = themeConfig?.bodyTextColor || '#0F172A'
  const bodyBg = themeConfig?.bodyBackgroundColor || '#FAFAFA'

  // Precise border styling
  const borderColor = uiBorder
  const borderWidth = themeConfig?.globalStyling?.borderWidth || '0.5px'
  const borderRadius = themeConfig?.globalStyling?.borderRadius || '8px'

  // Subtle backdrop for panels
  const panelBg = `color-mix(in srgb, ${uiBg} 95%, transparent)`
  const panelBackdrop = 'blur(30px) saturate(200%)'

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col font-sans" style={{ fontFamily: themeConfig?.globalStyling?.fontFamily || '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Helvetica, Arial, sans-serif' }}>
      {/* Main Layout - Split View */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        <DatabaseConnectionSidebar {...{ connections, selectedDatabase, setSelectedDatabase, isLoadingDatabases, spaces, selectedSpaceFilter, setSelectedSpaceFilter, loadConnections, setShowAddConnection, primaryColor, bodyText, uiBorder, panelBg, panelBackdrop, borderRadius, borderColor, borderWidth, getDatabaseIcon, getStatusIcon }} />

        {/* Right Body - Data Models or Tables */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Precise Panel */}
          <div
            className="flex-1 flex flex-col overflow-hidden"
            style={{
              backgroundColor: panelBg,
              backdropFilter: panelBackdrop,
              borderRadius,
              borderColor,
              borderWidth,
              borderStyle: 'solid',
            }}
          >
            {/* Header */}
            <div
              className="px-6 py-4 border-b"
              style={{ borderColor: uiBorder }}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    {viewMode === 'schema' ? (
                      <Table className="h-5 w-5" style={{ color: primaryColor }} />
                    ) : viewMode === 'erd' ? (
                      <GitBranch className="h-5 w-5" style={{ color: primaryColor }} />
                    ) : (
                      <Folder className="h-5 w-5" style={{ color: primaryColor }} />
                    )}
                    <h2
                      className="text-lg font-semibold tracking-tight"
                      style={{ color: bodyText }}
                    >
                      {viewMode === 'schema' ? 'Database Schema' : viewMode === 'erd' ? 'ERD Diagram' : 'Data Models'}
                    </h2>
                  </div>
                  <p
                    className="text-xs ml-8"
                    style={{ color: bodyText, opacity: 0.6 }}
                  >
                    {viewMode === 'schema'
                      ? selectedConnection
                        ? `Schema for ${selectedConnection.name}`
                        : 'Select a database to view schema'
                      : viewMode === 'erd'
                        ? 'Entity Relationship Diagram'
                        : 'Organize your data models'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                    <SelectTrigger className="w-[140px] h-8 text-xs border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="model">
                        <div className="flex items-center gap-2">
                          <Code className="h-3.5 w-3.5" />
                          <span>Model</span>
                        </div>
                      </SelectItem>
                      {selectedDatabase ? (
                        <SelectItem value="schema">
                          <div className="flex items-center gap-2">
                            <Table className="h-3.5 w-3.5" />
                            <span>Schema</span>
                          </div>
                        </SelectItem>
                      ) : null}
                      <SelectItem value="erd">
                        <div className="flex items-center gap-2">
                          <GitBranch className="h-3.5 w-3.5" />
                          <span>ERD</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {viewMode === 'model' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadModels}
                      className="h-8 w-8 p-0 rounded-lg"
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5", isLoadingModels && "animate-spin")} />
                    </Button>
                  )}
                  {viewMode === 'erd' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadERDData}
                      className="h-8 w-8 p-0 rounded-lg"
                    >
                      <RefreshCw className={cn("h-3.5 w-3.5", isLoadingERD && "animate-spin")} />
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {viewMode === 'schema' ? (
                <DatabaseSchemaContent {...{ selectedDatabase, isLoadingSchema, databaseSchema, bodyText, schemaDisplayMode, setSchemaDisplayMode, primaryColor, uiBg, borderColor, borderWidth, borderRadius, openDetailDrawer }} />
              ) : viewMode === 'erd' ? (
                // ERD Diagram View
                <div className="h-full relative">
                  {isLoadingERD ? (
                    <div className="w-full space-y-3 p-4">
                        <Skeleton className="h-10 w-full rounded-md" />
                        <Skeleton className="h-32 w-full rounded-md" />
                    </div>
                  ) : erdModels.length === 0 ? (
                    <div
                      className="flex flex-col items-center justify-center h-full"
                      style={{ color: bodyText, opacity: 0.6 }}
                    >
                      <GitBranch className="h-12 w-12 mb-4 opacity-50" />
                      <p className="text-sm font-medium">No data models found</p>
                      <p className="text-xs mt-1">Create data models to visualize relationships</p>
                    </div>
                  ) : (
                    <ERDDiagram
                      models={erdModels.map(model => ({
                        id: model.id,
                        name: model.name,
                        display_name: model.display_name || model.name,
                        description: model.description,
                        attributes: model.attributes || [],
                        position: model.position
                      }))}
                      relationships={erdRelationships}
                      onUpdateModel={(updatedModel) => {
                        setErdModels(prev => prev.map(m => m.id === updatedModel.id ? { ...m, ...updatedModel } : m))
                      }}
                      onUpdateAttribute={async (modelId, attribute) => {
                        try {
                          const res = await fetch(`/api/data-models/${modelId}/attributes/${attribute.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(attribute)
                          })
                          if (res.ok) {
                            setErdModels(prev => prev.map(model =>
                              model.id === modelId
                                ? {
                                  ...model, attributes: model.attributes.map((attr: any) =>
                                    attr.id === attribute.id ? attribute : attr
                                  )
                                }
                                : model
                            ))
                          }
                        } catch (error) {
                          console.error('Error updating attribute:', error)
                          toast.error('Failed to update attribute')
                        }
                      }}
                      onDeleteAttribute={async (modelId, attributeId) => {
                        try {
                          const res = await fetch(`/api/data-models/${modelId}/attributes/${attributeId}`, {
                            method: 'DELETE'
                          })
                          if (res.ok) {
                            setErdModels(prev => prev.map(model =>
                              model.id === modelId
                                ? { ...model, attributes: model.attributes.filter((attr: any) => attr.id !== attributeId) }
                                : model
                            ))
                          }
                        } catch (error) {
                          console.error('Error deleting attribute:', error)
                          toast.error('Failed to delete attribute')
                        }
                      }}
                      onCreateRelationship={(relationship) => {
                        const newRelationship = {
                          ...relationship,
                          id: `${relationship.fromModel}-${relationship.fromAttribute}-${relationship.toModel}-${relationship.toAttribute}`
                        }
                        setErdRelationships(prev => [...prev, newRelationship])
                        toast.success('Relationship created')
                      }}
                      onUpdateRelationship={(relationship) => {
                        setErdRelationships(prev => prev.map(r => r.id === relationship.id ? relationship : r))
                        toast.success('Relationship updated')
                      }}
                      onDeleteRelationship={(relationshipId) => {
                        setErdRelationships(prev => prev.filter(r => r.id !== relationshipId))
                        toast.success('Relationship deleted')
                      }}
                    />
                  )}
                </div>
              ) : (
                // Data Model View
                <div className="flex flex-col h-full">
                  {/* Search Bar */}
                  <div
                    className="px-6 pt-4 pb-3 border-b"
                    style={{ borderColor: uiBorder }}
                  >
                    <div className="relative">
                      <Search
                        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
                        style={{ color: bodyText, opacity: 0.5 }}
                      />
                      <Input
                        placeholder={selectedDatabase === '__builtin__' ? "Search tables..." : "Search models..."}
                        value={searchValue}
                        onChange={(e) => setSearchValue(e.target.value)}
                        className="pl-10 h-9 backdrop-blur-sm text-sm"
                        style={{
                          backgroundColor: `color-mix(in srgb, ${uiBg} 98%, transparent)`,
                          borderColor,
                          borderWidth,
                          borderRadius,
                        }}
                      />
                    </div>
                  </div>

                  {/* Content - Data Models from Spaces */}
                  <ScrollArea className="flex-1">
                    <div className="p-4">
                      {/* Always show Data Models from API */}
                      {isLoadingModels ? (
                        <div className="w-full space-y-3 p-4">
                          <Skeleton className="h-10 w-full rounded-md" />
                          <Skeleton className="h-32 w-full rounded-md" />
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {/* Root Models */}
                          {rootModels.length > 0 && (
                            <div className="space-y-1 mb-4">
                              <div
                                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold uppercase tracking-wider"
                                style={{ color: bodyText, opacity: 0.6 }}
                              >
                                <Database className="h-3.5 w-3.5" />
                                <span>Data Models ({rootModels.length})</span>
                              </div>
                            </div>
                          )}

                          <DataModelTree
                            bodyText={bodyText}
                            borderRadius={borderRadius}
                            expandedFolders={expandedFolders}
                            folders={treeStructure}
                            primaryColor={primaryColor}
                            rootModels={rootModels}
                            onOpenDetail={openDetailDrawer}
                            onToggleFolder={toggleFolder}
                          />

                          {/* Empty State */}
                          {models.length === 0 && folders.length === 0 && (
                            <div
                              className="flex flex-col items-center justify-center py-16"
                              style={{ color: bodyText, opacity: 0.6 }}
                            >
                              <Folder className="h-12 w-12 mb-4 opacity-50" />
                              <p className="text-sm font-medium">No data models yet</p>
                              <p className="text-xs mt-1">Create your first data model to get started</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AddDatabaseConnectionDialog
        connectionTestResult={connectionTestResult}
        databaseTypes={databaseTypes}
        discoveredTables={discoveredTables}
        isTestingConnection={isTestingConnection}
        newConnection={newConnection}
        open={showAddConnection}
        spaces={spaces}
        setNewConnection={setNewConnection}
        onCreateConnection={createConnection}
        onOpenChange={(open) => {
          setShowAddConnection(open)
          if (!open) resetNewConnection()
        }}
        onResetConnection={resetNewConnection}
        onTestConnection={testNewConnection}
      />
      {/*
                  placeholder="••••••••"
      */}
      <DataModelDetailDrawer
        open={isDetailDrawerOpen}
        onOpenChange={setIsDetailDrawerOpen}
        selectedDetailItem={selectedDetailItem}
        selectedAttribute={selectedAttribute}
        setSelectedAttribute={setSelectedAttribute}
        modelAttributes={modelAttributes}
        isLoadingAttributes={isLoadingAttributes}
        attributeOptions={attributeOptions}
        isLoadingOptions={isLoadingOptions}
        databaseSchema={databaseSchema}
        primaryColor={primaryColor}
        onAttributeClick={handleAttributeClick}
      />
    </div >
  )
}




