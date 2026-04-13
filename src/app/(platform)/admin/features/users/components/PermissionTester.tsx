'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  User,
  Shield,
  TestTube
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useSession } from 'next-auth/react'

export function PermissionTester() {
  const { data: session } = useSession()
  const [userId, setUserId] = useState(session?.user?.id || '')
  const [spaceId, setSpaceId] = useState('')
  const [permissionId, setPermissionId] = useState('')
  const [testResult, setTestResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [userPermissions, setUserPermissions] = useState<string[]>([])
  const [spaces, setSpaces] = useState<any[]>([])

  useEffect(() => {
    loadSpaces()
  }, [])

  const loadSpaces = async () => {
    try {
      const response = await fetch('/api/spaces')
      if (response.ok) {
        const data = await response.json()
        setSpaces(data.spaces || [])
      }
    } catch (error) {
      console.error('Error loading spaces:', error)
    }
  }

  const testPermission = async () => {
    if (!userId || !permissionId) {
      toast.error('Please enter user ID and permission ID')
      return
    }

    setLoading(true)
    try {
      const url = `/api/permissions/check?permissionId=${encodeURIComponent(permissionId)}${spaceId ? `&spaceId=${spaceId}` : ''}&userId=${userId}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setTestResult(data)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Permission check failed')
        setTestResult(null)
      }
    } catch (error) {
      console.error('Error testing permission:', error)
      toast.error('Permission check failed')
      setTestResult(null)
    } finally {
      setLoading(false)
    }
  }

  const loadUserPermissions = async () => {
    if (!userId) {
      toast.error('Please enter user ID')
      return
    }

    setLoading(true)
    try {
      const url = `/api/permissions/user?userId=${userId}${spaceId ? `&spaceId=${spaceId}` : ''}`
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setUserPermissions(data.permissions || [])
      } else {
        toast.error('Failed to load user permissions')
        setUserPermissions([])
      }
    } catch (error) {
      console.error('Error loading permissions:', error)
      toast.error('Failed to load user permissions')
      setUserPermissions([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <TestTube className="h-6 w-6" />
          Permission Tester
        </h2>
        <p className="text-muted-foreground">
          Test and debug user permissions
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Test Permission</CardTitle>
          <CardDescription>
            Check if a user has a specific permission
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="test-user-id">User ID</Label>
            <Input
              id="test-user-id"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID"
            />
          </div>
          <div>
            <Label htmlFor="test-space-id">Space ID (Optional)</Label>
            <Select value={spaceId} onValueChange={setSpaceId}>
              <SelectTrigger>
                <SelectValue placeholder="Select space (optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No space (global only)</SelectItem>
                {spaces.map(space => (
                  <SelectItem key={space.id} value={space.id}>
                    {space.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="test-permission">Permission ID</Label>
            <Input
              id="test-permission"
              value={permissionId}
              onChange={(e) => setPermissionId(e.target.value)}
              placeholder="e.g., space:edit, system:admin"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={testPermission} disabled={loading}>
              {loading ? 'Testing...' : 'Test Permission'}
            </Button>
            <Button variant="outline" onClick={loadUserPermissions} disabled={loading}>
              Load All Permissions
            </Button>
          </div>

          {testResult && (
            <div className={`p-4 border rounded ${testResult.hasPermission ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {testResult.hasPermission ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="font-semibold">
                  {testResult.hasPermission ? 'Permission Granted' : 'Permission Denied'}
                </span>
              </div>
              <div className="text-sm space-y-1">
                <p><strong>Source:</strong> {testResult.source || 'none'}</p>
                {testResult.role && <p><strong>Role:</strong> {testResult.role}</p>}
              </div>
            </div>
          )}

          {userPermissions.length > 0 && (
            <div className="mt-4">
              <Label>All User Permissions</Label>
              <ScrollArea className="h-48 border rounded p-4 mt-2">
                <div className="space-y-1">
                  {userPermissions.map((perm, idx) => (
                    <Badge key={idx} variant="outline" className="mr-2 mb-2">
                      {perm}
                    </Badge>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}




