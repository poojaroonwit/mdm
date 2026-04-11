'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import IconPickerPopover from '@/components/ui/icon-picker-popover'
import { ColorInput } from '@/components/studio/layout-config/ColorInput'

export interface DataModelFormData {
    name: string
    display_name: string
    slug: string
    description: string
    icon: string
    primary_color: string
    tags: string[]
    group_folder: string
    owner_name: string
}

interface DataModelFormProps {
    initialData?: Partial<DataModelFormData>
    onSubmit: (data: DataModelFormData) => void
    onCancel?: () => void
    isEditing?: boolean
}

export function DataModelForm({
    initialData,
    onSubmit,
    onCancel,
    isEditing = false
}: DataModelFormProps) {
    const [formData, setFormData] = useState<DataModelFormData>({
        name: '',
        display_name: '',
        slug: '',
        description: '',
        icon: '',
        primary_color: '#1e40af',
        tags: [],
        group_folder: '',
        owner_name: '',
        ...initialData
    })

    const [newTag, setNewTag] = useState('')

    // Update form data if initialData changes
    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }))
        }
    }, [initialData])

    const handleAddTag = () => {
        const tag = newTag.trim()
        if (tag && !formData.tags.includes(tag)) {
            setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }))
            setNewTag('')
        }
    }

    const handleRemoveTag = (tagToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags.filter(tag => tag !== tagToRemove)
        }))
    }

    const handleSubmit = () => {
        if (!formData.name) return // simple validation
        onSubmit(formData)
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Name</Label>
                    <Input
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. customer"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Display Name</Label>
                    <Input
                        value={formData.display_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, display_name: e.target.value }))}
                        placeholder="e.g. Customer"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Slug</Label>
                <Input
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value.toLowerCase() }))}
                    placeholder="auto-generated-from-name"
                />
            </div>

            <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Optional description"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Icon</Label>
                    <div className="mt-1">
                        <IconPickerPopover
                            value={formData.icon}
                            onChange={(icon) => setFormData(prev => ({ ...prev, icon }))}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <ColorInput
                        value={formData.primary_color}
                        onChange={(color) => setFormData(prev => ({ ...prev, primary_color: color }))}
                        allowImageVideo={false}
                        className="relative"
                        placeholder="#1e40af"
                        inputClassName="h-8 text-xs pl-7"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mt-1 mb-2">
                    {(formData.tags || []).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 text-xs rounded-full border flex items-center gap-1 bg-secondary/50">
                            {tag}
                            <button
                                className="text-muted-foreground hover:text-foreground ml-1"
                                onClick={() => handleRemoveTag(tag)}
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
                <div className="flex items-center gap-2">
                    <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Add tag"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault()
                                handleAddTag()
                            }
                        }}
                    />
                    <Button
                        variant="outline"
                        type="button"
                        onClick={handleAddTag}
                    >
                        Add
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label>Group Folder</Label>
                    <Input
                        value={formData.group_folder}
                        onChange={(e) => setFormData(prev => ({ ...prev, group_folder: e.target.value }))}
                        placeholder="e.g. CRM/Customers"
                    />
                </div>
                <div className="space-y-2">
                    <Label>Owner</Label>
                    <Input
                        value={formData.owner_name}
                        onChange={(e) => setFormData(prev => ({ ...prev, owner_name: e.target.value }))}
                        placeholder="Owner name or email"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
                {onCancel && (
                    <Button variant="outline" onClick={onCancel}>
                        Cancel
                    </Button>
                )}
                <Button onClick={handleSubmit}>
                    {isEditing ? 'Update Model' : 'Create Model'}
                </Button>
            </div>
        </div>
    )
}
