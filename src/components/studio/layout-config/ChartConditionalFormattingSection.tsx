'use client'

import { Palette, Plus } from 'lucide-react'
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ColorInput } from './ColorInput'
import type { PlacedWidget } from './widgets'

interface ChartConditionalFormattingSectionProps {
  widget: PlacedWidget
  updateProperty: (key: string, value: any) => void
}

const CONDITION_OPTIONS = [
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' },
  { value: 'equal_to', label: 'Equal to' },
  { value: 'not_equal_to', label: 'Not equal to' },
  { value: 'greater_or_equal', label: 'Greater or equal' },
  { value: 'less_or_equal', label: 'Less or equal' },
  { value: 'between', label: 'Between' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Not contains' },
]

export function ChartConditionalFormattingSection({
  widget,
  updateProperty,
}: ChartConditionalFormattingSectionProps) {
  const rules = widget.properties?.conditionalFormattingRules || []

  const updateRule = (index: number, updates: Record<string, any>) => {
    const updated = [...rules]
    updated[index] = { ...updated[index], ...updates }
    updateProperty('conditionalFormattingRules', updated)
  }

  const removeRule = (index: number) => {
    updateProperty('conditionalFormattingRules', rules.filter((_: any, itemIndex: number) => itemIndex !== index))
  }

  const addRule = () => {
    updateProperty('conditionalFormattingRules', [
      ...rules,
      {
        id: `rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        applyTo: 'cell',
        attribute: '',
        condition: 'greater_than',
        value: '',
        backgroundColor: '#ffffff',
        textColor: '#111827',
      },
    ])
  }

  return (
    <AccordionItem value="conditional-formatting" className="border-0">
      <AccordionTrigger className="text-xs font-semibold py-2 px-4 hover:no-underline">
        <div className="flex items-center gap-2 flex-1">
          <Palette className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Conditional formatting</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-3">
        <div className="space-y-3">
          <div className="space-y-2">
            {rules.map((rule: any, index: number) => (
              <div key={rule.id || index} className="border rounded p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-medium">Rule {index + 1}</Label>
                  <button
                    type="button"
                    onClick={() => removeRule(index)}
                    className="text-xs text-destructive hover:text-destructive/80"
                  >
                    Remove
                  </button>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Apply to</Label>
                      <Select
                        value={rule.applyTo || 'cell'}
                        onValueChange={(value) => updateRule(index, { applyTo: value })}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cell">Cell</SelectItem>
                          <SelectItem value="row">Row</SelectItem>
                          <SelectItem value="column">Column</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Attribute</Label>
                      <Input
                        value={rule.attribute || ''}
                        onChange={(event) => updateRule(index, { attribute: event.target.value })}
                        placeholder="Attribute name"
                        className="h-7 text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Condition</Label>
                      <Select
                        value={rule.condition || 'greater_than'}
                        onValueChange={(value) => updateRule(index, { condition: value })}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {CONDITION_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Value</Label>
                      <Input
                        type="text"
                        value={rule.value || ''}
                        onChange={(event) => updateRule(index, { value: event.target.value })}
                        placeholder="Value"
                        className="h-7 text-xs"
                      />
                    </div>
                    {rule.condition === 'between' ? (
                      <div className="space-y-1">
                        <Label className="text-xs font-medium">Value 2</Label>
                        <Input
                          type="text"
                          value={rule.value2 || ''}
                          onChange={(event) => updateRule(index, { value2: event.target.value })}
                          placeholder="Value 2"
                          className="h-7 text-xs"
                        />
                      </div>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Background color</Label>
                      <ColorInput
                        value={rule.backgroundColor || '#ffffff'}
                        onChange={(color) => updateRule(index, { backgroundColor: color })}
                        allowImageVideo={false}
                        className="relative"
                        placeholder="#ffffff"
                        inputClassName="h-7 text-xs pl-7 w-full"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs font-medium">Text color</Label>
                      <ColorInput
                        value={rule.textColor || '#111827'}
                        onChange={(color) => updateRule(index, { textColor: color })}
                        allowImageVideo={false}
                        className="relative"
                        placeholder="#111827"
                        inputClassName="h-7 text-xs pl-7 w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addRule}
              className="w-full px-3 py-2 text-xs border rounded hover:bg-accent flex items-center justify-center gap-2"
            >
              <Plus className="h-3 w-3" />
              Add rule
            </button>
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  )
}
