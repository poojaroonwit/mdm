import type { Dispatch, SetStateAction } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { AttributeGroup, EavAttribute, EavEntity } from './eavEntityManagerModel'

interface EavAttributeFieldsProps {
  attributeGroups: AttributeGroup[]
  attributes: EavAttribute[]
  expandedGroups: Set<string>
  formData: Record<string, any>
  isCreating: boolean
  selectedEntity: EavEntity | null
  handleCreateEntity: () => void
  handleUpdateEntity: () => void
  setExpandedGroups: Dispatch<SetStateAction<Set<string>>>
  setFormData: Dispatch<SetStateAction<Record<string, any>>>
  setIsCreating: Dispatch<SetStateAction<boolean>>
  setSelectedEntity: Dispatch<SetStateAction<EavEntity | null>>
}

export function EavEntityFields({
  attributeGroups,
  attributes,
  expandedGroups,
  formData,
  isCreating,
  selectedEntity,
  handleCreateEntity,
  handleUpdateEntity,
  setExpandedGroups,
  setFormData,
  setIsCreating,
  setSelectedEntity,
}: EavAttributeFieldsProps) {
  const renderAttributeInput = (attribute: EavAttribute) => {
    const value = formData[attribute.name] || selectedEntity?.values?.[attribute.name] || attribute.defaultValue || ''

    switch (attribute.dataType.toUpperCase()) {
      case 'TEXT':
      case 'EMAIL':
      case 'PHONE':
      case 'URL':
        return (
          <Input
            type={attribute.dataType.toLowerCase() === 'email' ? 'email' : 'text'}
            value={value}
            onChange={(e) => setFormData(prev => ({ ...prev, [attribute.name]: e.target.value }))}
            placeholder={attribute.placeholder}
          />
        )
      case 'TEXTAREA':
        return (
          <Textarea
            value={value}
            onChange={(e) => setFormData(prev => ({ ...prev, [attribute.name]: e.target.value }))}
            placeholder={attribute.placeholder}
          />
        )
      case 'NUMBER':
      case 'CURRENCY':
      case 'PERCENTAGE':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => setFormData(prev => ({ ...prev, [attribute.name]: parseFloat(e.target.value) || 0 }))}
            placeholder={attribute.placeholder}
          />
        )
      case 'BOOLEAN':
        return (
          <Select
            value={value ? 'true' : 'false'}
            onValueChange={(val) => setFormData(prev => ({ ...prev, [attribute.name]: val === 'true' }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        )
      case 'DATE':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => setFormData(prev => ({ ...prev, [attribute.name]: e.target.value }))}
          />
        )
      case 'DATETIME':
      case 'TIMESTAMP':
        return (
          <Input
            type="datetime-local"
            value={value}
            onChange={(e) => setFormData(prev => ({ ...prev, [attribute.name]: e.target.value }))}
          />
        )
      case 'SELECT':
        return (
          <Select
            value={value}
            onValueChange={(val) => setFormData(prev => ({ ...prev, [attribute.name]: val }))}
          >
            <SelectTrigger>
              <SelectValue placeholder={attribute.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {attribute.options?.choices
                ?.map((choice: any) => {
                  const choiceValue = String(choice.value ?? '')
                  return { choiceValue, choice }
                })
                .filter(({ choiceValue }: { choiceValue: string; choice: any }) => choiceValue !== '')
                .map(({ choiceValue, choice }: { choiceValue: string; choice: any }) => (
                  <SelectItem key={choiceValue} value={choiceValue}>
                    {choice.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        )
      case 'MULTI_SELECT':
        return (
          <div className="space-y-2">
            {attribute.options?.choices?.map((choice: any) => (
              <label key={choice.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) ? value.includes(choice.value) : false}
                  onChange={(e) => {
                    const currentValues = Array.isArray(value) ? value : []
                    const newValues = e.target.checked
                      ? [...currentValues, choice.value]
                      : currentValues.filter((v: any) => v !== choice.value)
                    setFormData(prev => ({ ...prev, [attribute.name]: newValues }))
                  }}
                />
                <span>{choice.label}</span>
              </label>
            ))}
          </div>
        )
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => setFormData(prev => ({ ...prev, [attribute.name]: e.target.value }))}
            placeholder={attribute.placeholder}
          />
        )
    }
  }

  const renderAttributeGroup = (group: AttributeGroup) => {
    const groupAttributes = attributes.filter(attr => attr.attributeGroupId === group.id)
    const isExpanded = expandedGroups.has(group.id)

    return (
      <Card key={group.id} className="mb-4">
        <CardHeader
          className="cursor-pointer"
          onClick={() => {
            setExpandedGroups(prev => {
              const newSet = new Set(prev)
              if (newSet.has(group.id)) {
                newSet.delete(group.id)
              } else {
                newSet.add(group.id)
              }
              return newSet
            })
          }}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              {group.isCollapsible && (
                isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
              )}
              <span>{group.displayName}</span>
              {group.isRequired && <Badge variant="destructive">Required</Badge>}
            </CardTitle>
            {group.description && (
              <p className="text-sm text-muted-foreground">{group.description}</p>
            )}
          </div>
        </CardHeader>

        {(!group.isCollapsible || isExpanded) && (
          <CardContent className="space-y-4">
            {groupAttributes.map(attribute => (
              <EavAttributeField key={attribute.id} attribute={attribute} renderAttributeInput={renderAttributeInput} />
            ))}
          </CardContent>
        )}
      </Card>
    )
  }

  return (
    <>
      {attributeGroups.length > 0 ? (
        attributeGroups
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(group => renderAttributeGroup(group))
      ) : (
        <div className="space-y-4">
          {attributes
            .filter(attr => attr.isVisible)
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map(attribute => (
              <EavAttributeField key={attribute.id} attribute={attribute} renderAttributeInput={renderAttributeInput} />
            ))}
        </div>
      )}

      <div className="flex items-center space-x-2">
        <Button onClick={isCreating ? handleCreateEntity : handleUpdateEntity}>
          {isCreating ? 'Create Entity' : 'Update Entity'}
        </Button>
        <Button variant="outline" onClick={() => {
          setIsCreating(false)
          setSelectedEntity(null)
          setFormData({})
        }}>
          Cancel
        </Button>
      </div>
    </>
  )
}

function EavAttributeField({
  attribute,
  renderAttributeInput,
}: {
  attribute: EavAttribute
  renderAttributeInput: (attribute: EavAttribute) => React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center space-x-2">
        <span>{attribute.displayName}</span>
        {attribute.isRequired && <Badge variant="destructive" className="text-xs">Required</Badge>}
        {attribute.isUnique && <Badge variant="outline" className="text-xs">Unique</Badge>}
      </Label>
      {renderAttributeInput(attribute)}
      {attribute.helpText && (
        <p className="text-sm text-muted-foreground">{attribute.helpText}</p>
      )}
    </div>
  )
}
