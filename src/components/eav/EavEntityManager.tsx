'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Upload, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff
} from 'lucide-react'
import { EavEntityFields } from './EavEntityFields'
import { getValueFieldName, type AttributeGroup, type EavAttribute, type EavEntity, type EntityType } from './eavEntityManagerModel'

interface EavEntityManagerProps {
  entityTypeId: string
  spaceId?: string
  onEntitySelect?: (entity: EavEntity) => void
  onEntityCreate?: (entity: EavEntity) => void
  onEntityUpdate?: (entity: EavEntity) => void
  onEntityDelete?: (entityId: string) => void
}

export function EavEntityManager({
  entityTypeId,
  spaceId,
  onEntitySelect,
  onEntityCreate,
  onEntityUpdate,
  onEntityDelete
}: EavEntityManagerProps) {
  const [entities, setEntities] = useState<EavEntity[]>([])
  const [attributes, setAttributes] = useState<EavAttribute[]>([])
  const [attributeGroups, setAttributeGroups] = useState<AttributeGroup[]>([])
  const [entityType, setEntityType] = useState<EntityType | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEntity, setSelectedEntity] = useState<EavEntity | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [formData, setFormData] = useState<Record<string, any>>({})
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<Record<string, any>>({})
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const itemsPerPage = 20

  useEffect(() => {
    loadData()
  }, [entityTypeId, currentPage, filters])

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Load entity type
      const entityTypeResponse = await fetch(`/api/eav/entity-types/${entityTypeId}`)
      if (entityTypeResponse.ok) {
        const entityTypeData = await entityTypeResponse.json()
        setEntityType(entityTypeData.entityType)
      }

      // Load attributes
      const attributesResponse = await fetch(`/api/eav/attributes?entity_type_id=${entityTypeId}`)
      if (attributesResponse.ok) {
        const attributesData = await attributesResponse.json()
        setAttributes(attributesData.attributes)
      }

      // Load attribute groups
      const groupsResponse = await fetch(`/api/eav/attribute-groups?entity_type_id=${entityTypeId}`)
      if (groupsResponse.ok) {
        const groupsData = await groupsResponse.json()
        setAttributeGroups(groupsData.attributeGroups)
      }

      // Load entities
      const entitiesResponse = await fetch(
        `/api/eav/entities?entity_type_id=${entityTypeId}&limit=${itemsPerPage}&offset=${(currentPage - 1) * itemsPerPage}`
      )
      if (entitiesResponse.ok) {
        const entitiesData = await entitiesResponse.json()
        setEntities(entitiesData.entities)
        setTotalCount(entitiesData.total)
        setTotalPages(Math.ceil(entitiesData.total / itemsPerPage))
      }

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEntitySelect = async (entity: EavEntity) => {
    try {
      const response = await fetch(`/api/eav/entities/${entity.id}?include_values=true`)
      if (response.ok) {
        const data = await response.json()
        setSelectedEntity(data.entity)
        onEntitySelect?.(data.entity)
      }
    } catch (error) {
      console.error('Error loading entity details:', error)
    }
  }

  const handleCreateEntity = async () => {
    try {
      const response = await fetch('/api/eav/entities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityTypeId,
          values: Object.entries(formData).map(([attributeName, value]) => {
            const attribute = attributes.find(attr => attr.name === attributeName)
            return {
              attributeId: attribute?.id,
              [getValueFieldName(attribute?.dataType || 'TEXT')]: value
            }
          })
        })
      })

      if (response.ok) {
        const data = await response.json()
        setEntities(prev => [data.entity, ...prev])
        setIsCreating(false)
        setFormData({})
        onEntityCreate?.(data.entity)
      }
    } catch (error) {
      console.error('Error creating entity:', error)
    }
  }

  const handleUpdateEntity = async () => {
    if (!selectedEntity) return

    try {
      const response = await fetch(`/api/eav/entities/${selectedEntity.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          values: Object.entries(formData).map(([attributeName, value]) => {
            const attribute = attributes.find(attr => attr.name === attributeName)
            return {
              attributeId: attribute?.id,
              [getValueFieldName(attribute?.dataType || 'TEXT')]: value
            }
          })
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedEntity(data.entity)
        setEntities(prev => prev.map(e => e.id === data.entity.id ? data.entity : e))
        onEntityUpdate?.(data.entity)
      }
    } catch (error) {
      console.error('Error updating entity:', error)
    }
  }

  const handleDeleteEntity = async (entityId: string) => {
    try {
      const response = await fetch(`/api/eav/entities/${entityId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setEntities(prev => prev.filter(e => e.id !== entityId))
        if (selectedEntity?.id === entityId) {
          setSelectedEntity(null)
        }
        onEntityDelete?.(entityId)
      }
    } catch (error) {
      console.error('Error deleting entity:', error)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{entityType?.displayName}</h2>
          {entityType?.description && (
            <p className="text-muted-foreground">{entityType.description}</p>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Entity
          </Button>
        </div>
      </div>

      <div className="space-y-4">
      <Tabs defaultValue="list">
        <TabsList>
          <TabsTrigger value="list">Entity List</TabsTrigger>
          <TabsTrigger value="form">Entity Form</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search entities..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filters
                </Button>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Entity List */}
          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {entities.map(entity => (
                  <div
                    key={entity.id}
                    className="p-4 hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleEntitySelect(entity)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{entity.externalId || entity.id}</h3>
                        <p className="text-sm text-muted-foreground">
                          Created {new Date(entity.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEntitySelect(entity)
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteEntity(entity.id)
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages} ({totalCount} total)
              </span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="form" className="space-y-4">
          {/* Entity Form */}
          <Card>
            <CardHeader>
              <CardTitle>
                {isCreating ? 'Create New Entity' : 'Edit Entity'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <EavEntityFields
                attributeGroups={attributeGroups}
                attributes={attributes}
                expandedGroups={expandedGroups}
                formData={formData}
                isCreating={isCreating}
                selectedEntity={selectedEntity}
                handleCreateEntity={handleCreateEntity}
                handleUpdateEntity={handleUpdateEntity}
                setExpandedGroups={setExpandedGroups}
                setFormData={setFormData}
                setIsCreating={setIsCreating}
                setSelectedEntity={setSelectedEntity}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  )
}
