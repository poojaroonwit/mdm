'use client'

import { useState } from 'react'
import { ApiRequest, HttpMethod, BodyType, KeyValuePair } from '../types'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { CodeEditor } from '@/components/ui/code-editor'
import { GraphQLSchemaExplorer } from './GraphQLSchemaExplorer'
import { RequestAuthTab } from './RequestAuthTab'
import { Plus, Trash2, X } from 'lucide-react'

interface RequestBuilderProps {
  request: ApiRequest
  onChange: (request: ApiRequest) => void
  environmentVariables?: KeyValuePair[]
}

export function RequestBuilder({ request, onChange, environmentVariables = [] }: RequestBuilderProps) {
  const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body' | 'auth' | 'pre-script' | 'tests'>('params')

  const updateRequest = (updates: Partial<ApiRequest>) => {
    onChange({ ...request, ...updates })
  }

  const addKeyValue = (type: 'headers' | 'params') => {
    const current = request[type] || []
    updateRequest({
      [type]: [...current, { key: '', value: '', enabled: true }],
    })
  }

  const updateKeyValue = (type: 'headers' | 'params', index: number, updates: Partial<KeyValuePair>) => {
    const current = request[type] || []
    const updated = [...current]
    updated[index] = { ...updated[index], ...updates }
    updateRequest({ [type]: updated })
  }

  const removeKeyValue = (type: 'headers' | 'params', index: number) => {
    const current = request[type] || []
    const updated = current.filter((_, i) => i !== index)
    updateRequest({ [type]: updated })
  }

  const resolveVariable = (text: string): string => {
    let resolved = text
    environmentVariables
      .filter((v) => v.enabled)
      .forEach((variable) => {
        const regex = new RegExp(`\\{\\{${variable.key}\\}\\}`, 'g')
        resolved = resolved.replace(regex, variable.value)
      })
    return resolved
  }

  const httpMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

  return (
    <div className="h-full flex flex-col">
      {/* Method and URL */}
      <div className="p-4 border-b border-border space-y-4">
        <div className="flex gap-2">
          <Select
            value={request.method}
            onValueChange={(value) => updateRequest({ method: value as HttpMethod })}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {httpMethods.map((method) => (
                <SelectItem key={method} value={method}>
                  {method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            value={request.url}
            onChange={(e) => updateRequest({ url: e.target.value })}
            placeholder="https://api.example.com/endpoint"
            className="flex-1"
          />
          <Select
            value={request.requestType}
            onValueChange={(value) => updateRequest({ requestType: value as any })}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="REST">REST</SelectItem>
              <SelectItem value="GraphQL">GraphQL</SelectItem>
              <SelectItem value="WebSocket">WebSocket</SelectItem>
              <SelectItem value="SSE">SSE</SelectItem>
              <SelectItem value="SocketIO">Socket.IO</SelectItem>
              <SelectItem value="MQTT">MQTT</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {request.requestType === 'GraphQL' && (
          <div className="grid grid-cols-2 gap-2 h-96">
            <div className="space-y-2">
              <CodeEditor
                value={request.graphqlQuery || ''}
                onChange={(value) => updateRequest({ graphqlQuery: value })}
                language="graphql"
                height="150px"
                placeholder="query { ... }"
              />
              <CodeEditor
                value={request.graphqlVariables || '{}'}
                onChange={(value) => updateRequest({ graphqlVariables: value })}
                language="json"
                height="100px"
                placeholder='{ "key": "value" }'
              />
            </div>
            <div className="border border-border rounded">
              <GraphQLSchemaExplorer
                url={request.url}
                headers={request.headers.reduce((acc, h) => {
                  if (h.enabled) acc[h.key] = h.value
                  return acc
                }, {} as Record<string, string>)}
                onSelectField={(field, type) => {
                  // Insert field into query editor
                  const currentQuery = request.graphqlQuery || ''
                  const fieldText = field.name
                  updateRequest({ graphqlQuery: currentQuery + fieldText })
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex-1 flex flex-col">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="border-b border-border">
          <TabsTrigger value="params">Params</TabsTrigger>
          <TabsTrigger value="headers">Headers</TabsTrigger>
          {!['GET', 'HEAD', 'OPTIONS'].includes(request.method) && (
            <TabsTrigger value="body">Body</TabsTrigger>
          )}
          <TabsTrigger value="auth">Auth</TabsTrigger>
          <TabsTrigger value="pre-script">Pre-request</TabsTrigger>
          <TabsTrigger value="tests">Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="params" className="flex-1 overflow-auto p-4 m-0">
          <div className="space-y-2">
            {(request.params || []).map((param, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  value={param.key}
                  onChange={(e) => updateKeyValue('params', index, { key: e.target.value })}
                  placeholder="Key"
                  className="flex-1"
                />
                <Input
                  value={resolveVariable(param.value)}
                  onChange={(e) => updateKeyValue('params', index, { value: e.target.value })}
                  placeholder="Value"
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => updateKeyValue('params', index, { enabled: !param.enabled })}
                  className={param.enabled ? '' : 'opacity-50'}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeKeyValue('params', index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addKeyValue('params')}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Param
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="headers" className="flex-1 overflow-auto p-4 m-0">
          <div className="space-y-2">
            {(request.headers || []).map((header, index) => (
              <div key={index} className="flex gap-2 items-center">
                <Input
                  value={header.key}
                  onChange={(e) => updateKeyValue('headers', index, { key: e.target.value })}
                  placeholder="Header name"
                  className="flex-1"
                />
                <Input
                  value={resolveVariable(header.value)}
                  onChange={(e) => updateKeyValue('headers', index, { value: e.target.value })}
                  placeholder="Header value"
                  className="flex-1"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => updateKeyValue('headers', index, { enabled: !header.enabled })}
                  className={header.enabled ? '' : 'opacity-50'}
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeKeyValue('headers', index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => addKeyValue('headers')}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Header
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="body" className="flex-1 overflow-auto p-4 m-0">
          <div className="space-y-4 h-full flex flex-col">
            <Select
              value={request.bodyType || 'json'}
              onValueChange={(value) => updateRequest({ bodyType: value as BodyType })}
            >
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">JSON</SelectItem>
                <SelectItem value="form-data">Form Data</SelectItem>
                <SelectItem value="x-www-form-urlencoded">x-www-form-urlencoded</SelectItem>
                <SelectItem value="raw">Raw</SelectItem>
                <SelectItem value="binary">Binary</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex-1">
              <CodeEditor
                value={request.body || ''}
                onChange={(value) => updateRequest({ body: value })}
                language={request.bodyType === 'json' ? 'json' : 'text'}
                height="100%"
                placeholder={
                  request.bodyType === 'json'
                    ? '{\n  "key": "value"\n}'
                    : 'Enter request body...'
                }
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="auth" className="flex-1 overflow-auto p-4 m-0">
          <RequestAuthTab request={request} updateRequest={updateRequest} />
        </TabsContent>
        <TabsContent value="pre-script" className="flex-1 overflow-auto p-4 m-0">
          <div className="h-full">
            <CodeEditor
              value={request.preRequestScript || ''}
              onChange={(value) => updateRequest({ preRequestScript: value })}
              language="javascript"
              height="100%"
              placeholder="// Pre-request script\nsetEnvironmentVariable('token', 'abc123');"
            />
          </div>
        </TabsContent>

        <TabsContent value="tests" className="flex-1 overflow-auto p-4 m-0">
          <div className="h-full">
            <CodeEditor
              value={request.testScript || ''}
              onChange={(value) => updateRequest({ testScript: value })}
              language="javascript"
              height="100%"
              placeholder="// Test script\nexpect(response.statusCode).toBe(200);"
            />
          </div>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}


