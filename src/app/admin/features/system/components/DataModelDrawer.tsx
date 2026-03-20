'use client'

import { useState } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer'
import { Button } from '@/components/ui/button'
import { Database, Type, History } from 'lucide-react'
import { DataModelForm, DataModelFormData } from './DataModelForm'
import { DraggableAttributeList } from '@/components/attribute-management/DraggableAttributeList'

interface DataModelDrawerProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    initialData?: any // Using any for now to match existing model structure, ideally should be a typed interface
    onSubmit: (data: DataModelFormData) => Promise<void>
    onAttributesChange?: (attributes: any[]) => void // If we need to lift this state up
}

type TabType = 'details' | 'attributes' | 'activity'

export function DataModelDrawer({
    open,
    onOpenChange,
    initialData,
    onSubmit,
}: DataModelDrawerProps) {
    const [activeTab, setActiveTab] = useState<TabType>('details')
    const isEditing = !!initialData

    return (
        <Drawer open={open} onOpenChange={onOpenChange}>
            <DrawerContent widthClassName="w-[720px]">
                <DrawerHeader>
                    <DrawerTitle>{isEditing ? 'Edit Data Model' : 'New Data Model'}</DrawerTitle>
                    <DrawerDescription>
                        {isEditing ? 'Update details' : 'Create a model for this space'}
                    </DrawerDescription>
                </DrawerHeader>

                <div className="space-y-4">
                    {/* Tabs Header */}
                    <div className="border-b">
                        <div className="flex space-x-8 justify-start">
                            <button
                                onClick={() => setActiveTab('details')}
                                className={`flex items-center gap-2 px-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details'
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
                                    }`}
                            >
                                <Database className="h-4 w-4" />
                                Details
                            </button>
                            {isEditing && (
                                <>
                                    <button
                                        onClick={() => setActiveTab('attributes')}
                                        className={`flex items-center gap-2 px-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'attributes'
                                                ? 'border-primary text-primary'
                                                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
                                            }`}
                                    >
                                        <Type className="h-4 w-4" />
                                        Attributes
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('activity')}
                                        className={`flex items-center gap-2 px-1 py-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'activity'
                                                ? 'border-primary text-primary'
                                                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/50'
                                            }`}
                                    >
                                        <History className="h-4 w-4" />
                                        Activity
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="mt-4">
                        {activeTab === 'details' && (
                            <DataModelForm
                                initialData={initialData ? {
                                    name: initialData.name,
                                    display_name: initialData.display_name,
                                    slug: initialData.slug,
                                    description: initialData.description,
                                    icon: initialData.icon,
                                    primary_color: initialData.primary_color,
                                    tags: initialData.tags,
                                    group_folder: initialData.group_folder,
                                    owner_name: initialData.owner_name
                                } : undefined}
                                onSubmit={onSubmit}
                                onCancel={() => onOpenChange(false)}
                                isEditing={isEditing}
                            />
                        )}

                        {activeTab === 'attributes' && isEditing && (
                            <DraggableAttributeList
                                modelId={initialData.id}
                                onAttributesChange={() => {
                                    // This component handles its own state updates via API but might need a callback to refresh parent
                                }}
                            />
                        )}

                        {activeTab === 'activity' && isEditing && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Activity</h3>
                                <div className="text-center py-8 text-muted-foreground">
                                    <History className="h-12 w-12 mx-auto mb-2 opacity-50" />
                                    <p className="text-lg font-medium">No activity yet</p>
                                    <p className="text-sm">Activity will appear here as you make changes</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </DrawerContent>
        </Drawer>
    )
}
