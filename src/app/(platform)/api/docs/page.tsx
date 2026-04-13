'use client'

import { MainLayout } from '@/components/layout/main-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  FileText, 
  Code, 
  Database, 
  Users, 
  Settings,
  Download,
  Upload,
  ClipboardList
} from 'lucide-react'

export default function APIDocsPage() {
  const apiEndpoints = [
    {
      method: 'GET',
      path: '/api/customers',
      description: 'Get all customers with optional filtering',
      parameters: [
        { name: 'page', type: 'number', required: false, description: 'Page number for pagination' },
        { name: 'limit', type: 'number', required: false, description: 'Number of items per page' },
        { name: 'search', type: 'string', required: false, description: 'Search term for filtering' }
      ]
    },
    {
      method: 'POST',
      path: '/api/customers',
      description: 'Create a new customer',
      parameters: [
        { name: 'firstName', type: 'string', required: true, description: 'Customer first name' },
        { name: 'lastName', type: 'string', required: true, description: 'Customer last name' },
        { name: 'email', type: 'string', required: false, description: 'Customer email address' },
        { name: 'phone', type: 'string', required: false, description: 'Customer phone number' }
      ]
    },
    {
      method: 'PUT',
      path: '/api/customers/[id]',
      description: 'Update an existing customer',
      parameters: [
        { name: 'id', type: 'string', required: true, description: 'Customer ID' },
        { name: 'firstName', type: 'string', required: false, description: 'Customer first name' },
        { name: 'lastName', type: 'string', required: false, description: 'Customer last name' }
      ]
    },
    {
      method: 'DELETE',
      path: '/api/customers/[id]',
      description: 'Delete a customer (soft delete)',
      parameters: [
        { name: 'id', type: 'string', required: true, description: 'Customer ID' }
      ]
    }
  ]

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-green-500'
      case 'POST': return 'bg-blue-500'
      case 'PUT': return 'bg-yellow-500'
      case 'DELETE': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">API Documentation</h1>
          <p className="text-muted-foreground">
            Complete API reference for the Unified Data Platform
          </p>
        </div>

        <div className="space-y-6">
        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="authentication">Authentication</TabsTrigger>
            <TabsTrigger value="examples">Examples</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>API Overview</span>
                </CardTitle>
                <CardDescription>
                  The Unified Data Platform provides a RESTful API for programmatic access to all system features.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">Base URL</h4>
                    <code className="block p-2 bg-muted rounded text-sm">
                      https://your-domain.com/api
                    </code>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">API Version</h4>
                    <code className="block p-2 bg-muted rounded text-sm">
                      v1
                    </code>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h4 className="font-medium">Response Format</h4>
                  <p className="text-sm text-muted-foreground">
                    All API responses are returned in JSON format with appropriate HTTP status codes.
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Rate Limiting</h4>
                  <p className="text-sm text-muted-foreground">
                    API requests are limited to 1000 requests per hour per user.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Users className="h-8 w-8 text-blue-500" />
                    <div>
                      <h4 className="font-medium">Customer API</h4>
                      <p className="text-sm text-muted-foreground">Manage customer data</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <ClipboardList className="h-8 w-8 text-green-500" />
                    <div>
                      <h4 className="font-medium">Assignment API</h4>
                      <p className="text-sm text-muted-foreground">Task management</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Database className="h-8 w-8 text-purple-500" />
                    <div>
                      <h4 className="font-medium">Data Model API</h4>
                      <p className="text-sm text-muted-foreground">Dynamic data models</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <Settings className="h-8 w-8 text-orange-500" />
                    <div>
                      <h4 className="font-medium">System API</h4>
                      <p className="text-sm text-muted-foreground">System configuration</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Endpoints Tab */}
          <TabsContent value="endpoints" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Endpoints</CardTitle>
                <CardDescription>
                  Complete list of available API endpoints
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {apiEndpoints.map((endpoint, index) => (
                    <Card key={index} className="border-l-4 border-l-blue-500">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <Badge className={`${getMethodColor(endpoint.method)} text-white`}>
                              {endpoint.method}
                            </Badge>
                            <code className="text-sm font-mono">{endpoint.path}</code>
                          </div>
                        </div>
                        
                        <p className="text-sm text-muted-foreground mb-3">
                          {endpoint.description}
                        </p>
                        
                        <div className="space-y-2">
                          <h5 className="font-medium text-sm">Parameters:</h5>
                          <div className="space-y-1">
                            {endpoint.parameters.map((param, paramIndex) => (
                              <div key={paramIndex} className="flex items-center space-x-2 text-sm">
                                <code className="bg-muted px-2 py-1 rounded text-xs">
                                  {param.name}
                                </code>
                                <span className="text-muted-foreground">({param.type})</span>
                                {param.required && (
                                  <Badge variant="destructive" className="text-xs">Required</Badge>
                                )}
                                <span className="text-muted-foreground">- {param.description}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Authentication Tab */}
          <TabsContent value="authentication" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Authentication</CardTitle>
                <CardDescription>
                  The API uses JWT tokens for authentication
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Authentication Methods</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    <li>JWT Bearer Token</li>
                    <li>Session-based authentication</li>
                    <li>Azure AD SSO integration</li>
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Getting an Access Token</h4>
                  <div className="bg-muted p-4 rounded-lg">
                    <code className="text-sm">
                      POST /api/auth/signin<br/>
                      Content-Type: application/json<br/><br/>
                      {`{
  "email": "user@example.com",
  "password": "password123"
}`}
                    </code>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Using the Token</h4>
                  <div className="bg-muted p-4 rounded-lg">
                    <code className="text-sm">
                      Authorization: Bearer YOUR_JWT_TOKEN
                    </code>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Token Expiration</h4>
                  <p className="text-sm text-muted-foreground">
                    JWT tokens expire after 8 hours of inactivity. Refresh tokens are provided for seamless re-authentication.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Examples Tab */}
          <TabsContent value="examples" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Examples</CardTitle>
                <CardDescription>
                  Common API usage examples
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Create a Customer</h4>
                    <div className="bg-muted p-4 rounded-lg">
                      <code className="text-sm">
                        <div className="text-green-600">POST /api/customers</div>
                        <div className="text-gray-600">Content-Type: application/json</div>
                        <div className="text-gray-600">Authorization: Bearer YOUR_TOKEN</div><br/>
                        <div className="text-blue-600">{`{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "+1-555-0123",
  "company": "Tech Corp"
}`}</div>
                      </code>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Get Customers with Pagination</h4>
                    <div className="bg-muted p-4 rounded-lg">
                      <code className="text-sm">
                        <div className="text-green-600">GET /api/customers?page=1&limit=10&search=john</div>
                        <div className="text-gray-600">Authorization: Bearer YOUR_TOKEN</div>
                      </code>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Update a Customer</h4>
                    <div className="bg-muted p-4 rounded-lg">
                      <code className="text-sm">
                        <div className="text-yellow-600">PUT /api/customers/123</div>
                        <div className="text-gray-600">Content-Type: application/json</div>
                        <div className="text-gray-600">Authorization: Bearer YOUR_TOKEN</div><br/>
                        <div className="text-blue-600">{`{
  "email": "john.doe.updated@example.com",
  "phone": "+1-555-0124"
}`}</div>
                      </code>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button onClick={() => window.open('/openapi.json', '_blank')}>
                    <Download className="mr-2 h-4 w-4" />
                    Download OpenAPI Specification
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </MainLayout>
  )
}
