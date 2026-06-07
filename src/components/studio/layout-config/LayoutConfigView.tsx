// @ts-nocheck
'use client'

import React from 'react'
import toast from 'react-hot-toast'
import { SpacesEditorManager } from '@/lib/space-studio-manager'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import { SettingsPanelContent } from './SettingsPanelContent'
import { LayoutToolbar } from './LayoutToolbar'
import { Preview } from './Preview'
import { PermissionsDialog } from './PermissionsDialog'
import { LayoutVersionControlDialog } from './LayoutVersionControlDialog'
import { DataModelExplorer } from './DataModelExplorer'
import { MobileExportDialog } from '../mobile-export-dialog'

export function LayoutConfigView(props: any) {
  const {
    isMobileViewport, deviceMode, componentConfigs, setDeviceMode, setPreviewScale,
    handleComponentConfigUpdate, setSelectedComponent, handleSave, layoutName,
    setLayoutName, canvasMode, setCanvasMode, showGrid, setShowGrid, gridSize,
    setGridSize, spaceId, setVersionsDialogOpen, showDataModelPanel,
    setShowDataModelPanel, setMobileExportDialogOpen, pageType, setPageType,
    versionsDialogOpen, placedWidgets, allPages, selectedPageId, setComponentConfigs,
    setPlacedWidgetsState, setAllPages, setSelectedPageId, previewScale,
    selectedComponent, canvasRef, isDraggingWidget, selectedWidgetId,
    selectedWidgetIds, dragOffset, setPlacedWidgets, setSelectedWidgetId,
    setSelectedWidgetIds, setIsDraggingWidget, setDragOffset, clipboardWidget,
    clipboardWidgets, widgetPanelOpen, setWidgetPanelOpen, pages, expandedComponent,
    setPages, setExpandedComponent, setSelectedPageForPermissions, setPermissionsRoles,
    setPermissionsUserIds, setPermissionsGroupIds, setPermissionsDialogOpen,
    handlePageReorder, mobileSettingsOpen, setMobileSettingsOpen,
    permissionsDialogOpen, selectedPageForPermissions, spaceUsers, permissionsRoles,
    permissionsUserIds, permissionsGroupIds, userGroups, mobileExportDialogOpen,
  } = props

  return (
    <div className="flex flex-col h-full min-h-0">
      <LayoutToolbar
        isMobileViewport={isMobileViewport}
        deviceMode={deviceMode}
        componentConfigs={componentConfigs}
        setDeviceMode={setDeviceMode}
        setPreviewScale={setPreviewScale}
        handleComponentConfigUpdate={handleComponentConfigUpdate}
        setSelectedComponent={setSelectedComponent}
        handleSave={handleSave}
        layoutName={layoutName}
        setLayoutName={setLayoutName}
        canvasMode={canvasMode}
        setCanvasMode={setCanvasMode}
        showGrid={showGrid}
        setShowGrid={setShowGrid}
        gridSize={gridSize}
        setGridSize={setGridSize}
        onSaveLayoutName={async (newName: string) => {
              await SpacesEditorManager.saveLayoutConfig(spaceId, { ...componentConfigs, name: newName })
              toast.success('Layout name saved')
            }}
        onOpenVersions={() => setVersionsDialogOpen(true)}
        showDataModelPanel={showDataModelPanel}
        onToggleDataModelPanel={() => setShowDataModelPanel(!showDataModelPanel)}
        spaceId={spaceId}
        onExportMobile={() => setMobileExportDialogOpen(true)}
        pageType={pageType}
        onPageTypeChange={setPageType}
          />
          
      {/* Version Control Dialog */}
      <LayoutVersionControlDialog
        open={versionsDialogOpen}
        onOpenChange={setVersionsDialogOpen}
        spaceId={spaceId}
        currentLayoutConfig={{
          ...componentConfigs,
          name: layoutName,
          placedWidgets,
          allPages,
          selectedPageId,
        }}
        onVersionRestore={async (version) => {
          // Restore the version - handle both string (from DB) and object
          let restoredConfig = version.layout_config
          if (typeof restoredConfig === 'string') {
            try {
              restoredConfig = JSON.parse(restoredConfig)
            } catch {
              console.error('Failed to parse layout config')
              return
            }
          }
          
          if (restoredConfig) {
            // Update component configs
            setComponentConfigs(restoredConfig.componentConfigs || restoredConfig)
            
            // Update layout name if present
            if (restoredConfig.name) {
              setLayoutName(restoredConfig.name)
            }
            
            // Update widgets if present
            if (restoredConfig.placedWidgets) {
              setPlacedWidgetsState(restoredConfig.placedWidgets)
            }
            
            // Update pages if present
            if (restoredConfig.allPages) {
              setAllPages(restoredConfig.allPages)
            }
            
            if (restoredConfig.selectedPageId) {
              setSelectedPageId(restoredConfig.selectedPageId)
            }
            
            // Save the restored layout
            await SpacesEditorManager.saveLayoutConfig(spaceId, restoredConfig)
            toast.success(`Version ${version.version_number} restored`)
          }
        }}
      />

        {/* Layout: Preview area | Data model panel (optional) - Responsive */}
        <div className={`flex-1 ${isMobileViewport ? 'flex flex-col' : 'flex'} border overflow-hidden min-h-0 relative`}>
          {/* Body/Preview area - full width (minus data model if shown) */}
          <div 
            className={`${isMobileViewport ? 'w-full' : ''} overflow-hidden h-full flex flex-col min-h-0 border-r relative`}
            style={!isMobileViewport ? {
              width: showDataModelPanel 
                ? 'calc(100% - 20%)' 
                : '100%'
            } : {}}
          >
        <Preview
          isMobileViewport={isMobileViewport}
          deviceMode={deviceMode}
          previewScale={previewScale}
          componentConfigs={componentConfigs}
          selectedComponent={selectedComponent}
          allPages={allPages}
          selectedPageId={selectedPageId}
          canvasRef={canvasRef as React.RefObject<HTMLDivElement>}
          isDraggingWidget={isDraggingWidget}
          selectedWidgetId={selectedWidgetId}
          selectedWidgetIds={selectedWidgetIds}
          placedWidgets={placedWidgets}
          dragOffset={dragOffset}
          canvasMode={canvasMode}
          showGrid={showGrid}
          gridSize={gridSize}
          setSelectedComponent={setSelectedComponent}
          setSelectedPageId={setSelectedPageId}
          setPlacedWidgets={setPlacedWidgets}
          setSelectedWidgetId={setSelectedWidgetId}
          setSelectedWidgetIds={setSelectedWidgetIds}
          setIsDraggingWidget={setIsDraggingWidget}
          setDragOffset={setDragOffset}
          clipboardWidget={clipboardWidget}
          clipboardWidgets={clipboardWidgets}
          spaceId={spaceId}
        />
            </div>

          {/* Floating Widget Panel - Popover on right side */}
          {!isMobileViewport && widgetPanelOpen && (
            <div 
              className="absolute w-80 bg-background border rounded-lg shadow-lg overflow-auto z-40"
              style={{ top: '16px', right: '16px', bottom: '16px', maxHeight: 'calc(100% - 32px)' }}
            >
              <div className="sticky top-0 bg-background border-b px-3 py-2 flex justify-between items-center">
                <span className="font-semibold text-sm">Widget Properties</span>
                <button 
                  onClick={() => setWidgetPanelOpen(false)}
                  className="text-muted-foreground hover:text-foreground text-lg leading-none"
                >
                  ×
                </button>
              </div>
              <SettingsPanelContent
                spaceId={spaceId}
                isMobileViewport={isMobileViewport}
                allPages={allPages}
                pages={pages}
                selectedPageId={selectedPageId}
                selectedWidgetId={selectedWidgetId}
                selectedComponent={selectedComponent}
                placedWidgets={placedWidgets}
                componentConfigs={componentConfigs}
                expandedComponent={expandedComponent}
                setPages={setPages}
                setSelectedComponent={setSelectedComponent}
                setSelectedPageId={setSelectedPageId}
                setPlacedWidgets={setPlacedWidgets}
                setSelectedWidgetId={setSelectedWidgetId}
                setExpandedComponent={setExpandedComponent}
                setSelectedPageForPermissions={setSelectedPageForPermissions}
                setPermissionsRoles={setPermissionsRoles}
                setPermissionsUserIds={setPermissionsUserIds}
                setPermissionsGroupIds={setPermissionsGroupIds}
                setPermissionsDialogOpen={setPermissionsDialogOpen}
                handlePageReorder={handlePageReorder}
                handleComponentConfigUpdate={handleComponentConfigUpdate}
                setAllPages={setAllPages}
              />
            </div>
          )}

          {/* Toggle button to show widget panel when closed */}
          {!isMobileViewport && !widgetPanelOpen && (
            <button
              onClick={() => setWidgetPanelOpen(true)}
              className="absolute top-4 right-4 bg-background border rounded-lg shadow-lg px-3 py-2 text-sm font-medium hover:bg-muted z-40"
            >
              Widget Panel
            </button>
          )}


        


        {/* Data Model Panel - 20% */}
        {!isMobileViewport && showDataModelPanel && (
          <div className="w-[20%] overflow-auto min-h-0 bg-muted/50">
            {selectedWidgetId ? (
              <DataModelExplorer
                spaceId={spaceId}
                selectedDataModelId={placedWidgets.find(w => w.id === selectedWidgetId)?.properties?.dataModelId}
                onDataModelSelect={(modelId) => {
                  setPlacedWidgets(prev => prev.map(w => 
                    w.id === selectedWidgetId 
                      ? { ...w, properties: { ...w.properties, dataModelId: modelId || undefined } }
                      : w
                  ))
                }}
              />
            ) : (
              <div className="p-4 text-sm text-muted-foreground text-center">
                Select a widget to configure data model
              </div>
            )}
          </div>
        )}

      </div>

      {/* Mobile Settings Drawer */}
      {isMobileViewport && (
        <Drawer open={mobileSettingsOpen} onOpenChange={setMobileSettingsOpen}>
          <DrawerContent className="h-[85vh]">
            <DrawerHeader>
              <DrawerTitle>Settings</DrawerTitle>
              <DrawerDescription>Configure pages and components</DrawerDescription>
            </DrawerHeader>
            <div className="flex-1 overflow-y-auto p-4">
              <SettingsPanelContent
                spaceId={spaceId}
                isMobileViewport={isMobileViewport}
                allPages={allPages}
                pages={pages}
                selectedPageId={selectedPageId}
                selectedWidgetId={selectedWidgetId}
                selectedComponent={selectedComponent}
                placedWidgets={placedWidgets}
                componentConfigs={componentConfigs}
                expandedComponent={expandedComponent}
                setPages={setPages}
                setSelectedComponent={setSelectedComponent}
                setSelectedPageId={setSelectedPageId}
                setPlacedWidgets={setPlacedWidgets}
                setSelectedWidgetId={setSelectedWidgetId}
                setExpandedComponent={setExpandedComponent}
                setSelectedPageForPermissions={setSelectedPageForPermissions}
                setPermissionsRoles={setPermissionsRoles}
                setPermissionsUserIds={setPermissionsUserIds}
                setPermissionsGroupIds={setPermissionsGroupIds}
                setPermissionsDialogOpen={setPermissionsDialogOpen}
                handlePageReorder={handlePageReorder}
                handleComponentConfigUpdate={handleComponentConfigUpdate}
                setAllPages={setAllPages}
              />
            </div>
          </DrawerContent>
        </Drawer>
      )}

      <PermissionsDialog
        open={permissionsDialogOpen}
        onOpenChange={setPermissionsDialogOpen}
        spaceId={spaceId}
        selectedPageForPermissions={selectedPageForPermissions}
        spaceUsers={spaceUsers}
        permissionsRoles={permissionsRoles}
        permissionsUserIds={permissionsUserIds}
        permissionsGroupIds={permissionsGroupIds}
        userGroups={userGroups}
        setPermissionsRoles={setPermissionsRoles}
        setPermissionsUserIds={setPermissionsUserIds}
        setPermissionsGroupIds={setPermissionsGroupIds}
        setSelectedPageForPermissions={setSelectedPageForPermissions}
        setPages={setPages}
      />

      {/* Mobile Export Dialog */}
      <MobileExportDialog
        open={mobileExportDialogOpen}
        onOpenChange={setMobileExportDialogOpen}
        spaceId={spaceId}
        config={{
          id: `config_${spaceId}`,
          spaceId,
          pages: pages.map(page => ({
            ...page,
            components: page.id === selectedPageId ? placedWidgets : page.components,
          })),
          layoutConfig: componentConfigs,
          sidebarConfig: {
            items: [],
            background: '#ffffff',
            textColor: '#374151',
            fontSize: '14px',
          },
          version: '1.0.0',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }}
      />
    </div>
  )
}
