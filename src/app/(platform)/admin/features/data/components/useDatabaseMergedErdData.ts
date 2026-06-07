// @ts-nocheck
'use client'

import toast from 'react-hot-toast'

export function useDatabaseMergedErdData(params: any) {
  const {
    databaseSchema,
    setErdModels,
    setErdRelationships,
    setIsLoadingERD,
  } = params

  const loadERDData = async () => {
    setIsLoadingERD(true)
    try {
      // First try to load data models
      const modelsRes = await fetch('/api/data-models')
      const modelsData = await modelsRes.json()

      const modelsWithAttributes: any[] = []

      for (const model of modelsData.dataModels || []) {
        try {
          const attrsRes = await fetch(`/api/data-models/${model.id}/attributes`)
          const attrsData = await attrsRes.json()

          modelsWithAttributes.push({
            ...model,
            attributes: (attrsData.attributes || []).map((attr: any) => ({
              id: attr.id,
              name: attr.name,
              display_name: attr.display_name || attr.name,
              type: attr.type || attr.data_type || 'TEXT',
              is_required: attr.is_required || false,
              is_unique: attr.is_unique || false,
              is_primary_key: attr.is_primary_key || false,
              is_foreign_key: attr.is_foreign_key || false,
              referenced_table: attr.referenced_table,
              referenced_column: attr.referenced_column
            }))
          })
        } catch (error) {
          console.error(`Error loading attributes for model ${model.id}:`, error)
          modelsWithAttributes.push({
            ...model,
            attributes: []
          })
        }
      }

      // If no data models, use database schema tables instead
      if (modelsWithAttributes.length === 0 && databaseSchema && databaseSchema.tables.length > 0) {
        const schemaModels = databaseSchema.tables.map((table, index) => ({
          id: `schema_${table.name}`,
          name: table.name,
          display_name: table.name,
          description: `Database table with ${table.columns.length} columns`,
          position: { x: (index % 4) * 300, y: Math.floor(index / 4) * 250 },
          attributes: table.columns.map((col, colIdx) => ({
            id: `${table.name}_${col.name}`,
            name: col.name,
            display_name: col.name,
            type: col.type,
            is_required: !col.nullable,
            is_unique: false,
            is_primary_key: col.name === 'id',
            is_foreign_key: col.name.endsWith('_id') && col.name !== 'id',
            referenced_table: col.name.endsWith('_id') && col.name !== 'id'
              ? col.name.replace(/_id$/, 's')
              : undefined
          }))
        }))
        setErdModels(schemaModels)

        // Auto-detect relationships from foreign keys
        const relationships: any[] = []
        schemaModels.forEach(model => {
          model.attributes.forEach((attr: any) => {
            if (attr.is_foreign_key && attr.referenced_table) {
              const targetModel = schemaModels.find(m =>
                m.name.toLowerCase() === attr.referenced_table?.toLowerCase() ||
                m.name.toLowerCase() === attr.referenced_table?.replace(/s$/, '').toLowerCase()
              )
              if (targetModel) {
                const targetAttr = targetModel.attributes.find((a: any) =>
                  a.name === 'id' || a.is_primary_key
                )
                if (targetAttr) {
                  relationships.push({
                    id: `${model.id}-${attr.id}-${targetModel.id}`,
                    fromModel: model.id,
                    toModel: targetModel.id,
                    fromAttribute: attr.id,
                    toAttribute: targetAttr.id,
                    type: 'one-to-many',
                    label: `${model.name} → ${targetModel.name}`
                  })
                }
              }
            }
          })
        })
        setErdRelationships(relationships)
        return
      }

      setErdModels(modelsWithAttributes)

      const relationships: any[] = []
      modelsWithAttributes.forEach(model => {
        model.attributes.forEach((attr: any) => {
          if (attr.is_foreign_key && attr.referenced_table) {
            const targetModel = modelsWithAttributes.find((m: any) =>
              m.name.toLowerCase() === attr.referenced_table?.toLowerCase()
            )
            if (targetModel) {
              const targetAttr = targetModel.attributes.find((a: any) =>
                a.name.toLowerCase() === attr.referenced_column?.toLowerCase() ||
                a.is_primary_key
              )
              if (targetAttr) {
                relationships.push({
                  id: `${model.id}-${attr.id}-${targetModel.id}-${targetAttr.id}`,
                  fromModel: model.id,
                  toModel: targetModel.id,
                  fromAttribute: attr.id,
                  toAttribute: targetAttr.id,
                  type: 'one-to-many',
                  label: `${model.display_name || model.name} → ${targetModel.display_name || targetModel.name}`
                })
              }
            }
          }
        })
      })

      setErdRelationships(relationships)
    } catch (error) {
      console.error('Error loading ERD data:', error)
      toast.error('Failed to load ERD data')
    } finally {
      setIsLoadingERD(false)
    }
  }



  return { loadERDData }
}
