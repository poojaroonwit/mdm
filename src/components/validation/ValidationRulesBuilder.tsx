'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle, 
  Settings,
} from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { validateRule } from './validation-rule-utils'

export interface ValidationRule {
  id: string
  name: string
  description: string
  type: 'required' | 'min_length' | 'max_length' | 'pattern' | 'range' | 'custom'
  config: Record<string, any>
  errorMessage: string
  enabled: boolean
}

export interface ValidationRulesBuilderProps {
  rules: ValidationRule[]
  onRulesChange: (rules: ValidationRule[]) => void
  attributeType?: string
}

const VALIDATION_TYPES = [
  {
    value: 'required',
    label: 'Required',
    description: 'Field must have a value',
    icon: '⚠️'
  },
  {
    value: 'min_length',
    label: 'Minimum Length',
    description: 'Minimum number of characters',
    icon: '📏'
  },
  {
    value: 'max_length',
    label: 'Maximum Length',
    description: 'Maximum number of characters',
    icon: '📐'
  },
  {
    value: 'pattern',
    label: 'Pattern Match',
    description: 'Must match a regular expression',
    icon: '🔍'
  },
  {
    value: 'range',
    label: 'Range',
    description: 'Numeric value within range',
    icon: '📊'
  },
  {
    value: 'custom',
    label: 'Custom Rule',
    description: 'Custom JavaScript validation',
    icon: '⚙️'
  }
]

const COMMON_PATTERNS = [
  {
    name: 'Email',
    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
    description: 'Valid email address'
  },
  {
    name: 'Phone',
    pattern: '^\\+?[1-9]\\d{1,14}$',
    description: 'International phone number'
  },
  {
    name: 'URL',
    pattern: '^https?:\\/\\/(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)$',
    description: 'Valid URL'
  },
  {
    name: 'Alphanumeric',
    pattern: '^[a-zA-Z0-9]+$',
    description: 'Only letters and numbers'
  }
]

export function ValidationRulesBuilder({ rules, onRulesChange }: ValidationRulesBuilderProps) {
  const [selectedRule, setSelectedRule] = useState<ValidationRule | null>(null)
  const [showBuilder, setShowBuilder] = useState(false)
  const [newRule, setNewRule] = useState<Partial<ValidationRule>>({
    name: '',
    description: '',
    type: 'required',
    config: {},
    errorMessage: '',
    enabled: true
  })

  const addRule = () => {
    if (!newRule.name || !newRule.type) return

    const rule: ValidationRule = {
      id: `rule_${Date.now()}`,
      name: newRule.name,
      description: newRule.description || '',
      type: newRule.type as any,
      config: newRule.config || {},
      errorMessage: newRule.errorMessage || `Invalid ${newRule.name}`,
      enabled: newRule.enabled ?? true
    }

    onRulesChange([...rules, rule])
    setNewRule({
      name: '',
      description: '',
      type: 'required',
      config: {},
      errorMessage: '',
      enabled: true
    })
    setShowBuilder(false)
  }

  const updateRule = (id: string, updates: Partial<ValidationRule>) => {
    const updatedRules = rules.map(rule => 
      rule.id === id ? { ...rule, ...updates } : rule
    )
    onRulesChange(updatedRules)
  }

  const deleteRule = (id: string) => {
    onRulesChange(rules.filter(rule => rule.id !== id))
  }

  const getRuleConfigComponent = (rule: ValidationRule) => {
    switch (rule.type) {
      case 'required':
        return (
          <div className="space-y-2">
            <Label>Required Field</Label>
            <p className="text-sm text-muted-foreground">
              This field must have a value before saving
            </p>
          </div>
        )

      case 'min_length':
        return (
          <div className="space-y-2">
            <Label htmlFor="min-length">Minimum Length</Label>
            <Input
              id="min-length"
              type="number"
              value={rule.config.minLength || ''}
              onChange={(e) => updateRule(rule.id, {
                config: { ...rule.config, minLength: parseInt(e.target.value) || 0 }
              })}
              placeholder="Enter minimum length"
            />
          </div>
        )

      case 'max_length':
        return (
          <div className="space-y-2">
            <Label htmlFor="max-length">Maximum Length</Label>
            <Input
              id="max-length"
              type="number"
              value={rule.config.maxLength || ''}
              onChange={(e) => updateRule(rule.id, {
                config: { ...rule.config, maxLength: parseInt(e.target.value) || 0 }
              })}
              placeholder="Enter maximum length"
            />
          </div>
        )

      case 'pattern':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pattern">Regular Expression</Label>
              <Input
                id="pattern"
                value={rule.config.pattern || ''}
                onChange={(e) => updateRule(rule.id, {
                  config: { ...rule.config, pattern: e.target.value }
                })}
                placeholder="Enter regex pattern"
              />
            </div>
            <div className="space-y-2">
              <Label>Common Patterns</Label>
              <div className="grid grid-cols-2 gap-2">
                {COMMON_PATTERNS.map((pattern) => (
                  <Button
                    key={pattern.name}
                    variant="outline"
                    size="sm"
                    onClick={() => updateRule(rule.id, {
                      config: { ...rule.config, pattern: pattern.pattern }
                    })}
                  >
                    {pattern.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )

      case 'range':
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="min-value">Minimum Value</Label>
              <Input
                id="min-value"
                type="number"
                value={rule.config.minValue || ''}
                onChange={(e) => updateRule(rule.id, {
                  config: { ...rule.config, minValue: parseFloat(e.target.value) || 0 }
                })}
                placeholder="Min value"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max-value">Maximum Value</Label>
              <Input
                id="max-value"
                type="number"
                value={rule.config.maxValue || ''}
                onChange={(e) => updateRule(rule.id, {
                  config: { ...rule.config, maxValue: parseFloat(e.target.value) || 0 }
                })}
                placeholder="Max value"
              />
            </div>
          </div>
        )

      case 'custom':
        return (
          <div className="space-y-2">
            <Label htmlFor="custom-code">Custom Validation Code</Label>
            <Textarea
              id="custom-code"
              value={rule.config.code || ''}
              onChange={(e) => updateRule(rule.id, {
                config: { ...rule.config, code: e.target.value }
              })}
              placeholder="function validate(value) { return true; }"
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Custom function should return true for valid values, false or error message for invalid values
            </p>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Validation Rules</h3>
          <p className="text-sm text-muted-foreground">
            Define validation rules for this attribute
          </p>
        </div>
        <Button onClick={() => setShowBuilder(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>

      {rules.length > 0 && (
        <div className="space-y-3">
          {rules.map((rule) => {
            const validation = validateRule(rule)
            return (
              <Card key={rule.id} className={!validation.valid ? 'border-red-200 dark:border-red-800' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {validation.valid ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-medium">{rule.name}</span>
                        <Badge variant="outline">{rule.type}</Badge>
                        {!rule.enabled && (
                          <Badge variant="secondary">Disabled</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={rule.enabled}
                        onCheckedChange={(enabled) => updateRule(rule.id, { enabled })}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedRule(rule)}
                      >
                        <Settings className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {rule.description && (
                    <p className="text-sm text-muted-foreground">{rule.description}</p>
                  )}
                  {!validation.valid && (
                    <div className="text-sm text-red-600">
                      {validation.errors.join(', ')}
                    </div>
                  )}
                </CardHeader>
                {selectedRule?.id === rule.id && (
                  <CardContent>
                    <div className="w-full">
                    <Tabs defaultValue="config">
                      <TabsList>
                        <TabsTrigger value="config">Configuration</TabsTrigger>
                        <TabsTrigger value="preview">Preview</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="config" className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="rule-name">Rule Name</Label>
                            <Input
                              id="rule-name"
                              value={rule.name}
                              onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="error-message">Error Message</Label>
                            <Input
                              id="error-message"
                              value={rule.errorMessage}
                              onChange={(e) => updateRule(rule.id, { errorMessage: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="rule-description">Description</Label>
                          <Textarea
                            id="rule-description"
                            value={rule.description}
                            onChange={(e) => updateRule(rule.id, { description: e.target.value })}
                            rows={2}
                          />
                        </div>
                        {getRuleConfigComponent(rule)}
                      </TabsContent>
                      
                      <TabsContent value="preview" className="space-y-4">
                        <div className="p-4 bg-muted rounded-lg">
                          <h4 className="font-medium mb-2">Rule Preview</h4>
                          <pre className="text-sm font-mono">
                            {JSON.stringify({
                              type: rule.type,
                              config: rule.config,
                              errorMessage: rule.errorMessage
                            }, null, 2)}
                          </pre>
                        </div>
                      </TabsContent>
                    </Tabs>
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {showBuilder && (
        <Card>
          <CardHeader>
            <CardTitle>Add Validation Rule</CardTitle>
            <CardDescription>
              Create a new validation rule for this attribute
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-rule-name">Rule Name</Label>
                <Input
                  id="new-rule-name"
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  placeholder="Enter rule name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-rule-type">Rule Type</Label>
                <Select
                  value={newRule.type}
                  onValueChange={(type) => setNewRule({ ...newRule, type: type as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {VALIDATION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <span>{type.icon}</span>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">{type.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-rule-description">Description</Label>
              <Textarea
                id="new-rule-description"
                value={newRule.description}
                onChange={(e) => setNewRule({ ...newRule, description: e.target.value })}
                placeholder="Enter rule description"
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="new-rule-error">Error Message</Label>
              <Input
                id="new-rule-error"
                value={newRule.errorMessage}
                onChange={(e) => setNewRule({ ...newRule, errorMessage: e.target.value })}
                placeholder="Enter error message"
              />
            </div>

            <div className="flex items-center gap-4">
              <Button onClick={addRule} disabled={!newRule.name || !newRule.type}>
                Add Rule
              </Button>
              <Button variant="outline" onClick={() => setShowBuilder(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
