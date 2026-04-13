'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { UserInviteInput } from '@/components/ui/user-invite-input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Mail, Users, UserPlus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function InvitationDemoPage() {
  const [invitations, setInvitations] = useState<Array<{
    id: string
    user: any
    role: string
    timestamp: Date
    type: 'existing' | 'new'
  }>>([])

  const handleInvite = async (user: any, role: string) => {
    const invitation: {
      id: string
      user: any
      role: string
      timestamp: Date
      type: 'existing' | 'new'
    } = {
      id: Math.random().toString(36).substr(2, 9),
      user,
      role,
      timestamp: new Date(),
      type: user.id ? 'existing' : 'new'
    }

    setInvitations(prev => [invitation, ...prev])
    
    if (user.id) {
      toast.success(`Added ${user.name || user.email} as ${role}`)
    } else {
      toast.success(`Invitation sent to ${user.email} as ${role}`)
    }
  }

  const clearInvitations = () => {
    setInvitations([])
    toast('Invitations cleared')
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Space Invitation System Demo</h1>
        <p className="text-muted-foreground">
          Test the new space member invitation system with autocomplete and email invitations.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Invitation Input */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite Users
            </CardTitle>
            <CardDescription>
              Type a name or email to search for existing users, or enter a new email to send an invitation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserInviteInput
              spaceId="demo-space"
              onInvite={handleInvite}
              disabled={false}
            />
          </CardContent>
        </Card>

        {/* Features Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="font-semibold">For Existing Users</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Real-time search with autocomplete</li>
                  <li>• Instant addition to space</li>
                  <li>• Role selection (Member/Admin)</li>
                  <li>• Visual user preview</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold">For New Users</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Email validation</li>
                  <li>• SMTP invitation emails</li>
                  <li>• Account creation flow</li>
                  <li>• Token-based security</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Invitation History */}
        {invitations.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5" />
                  Recent Invitations
                </CardTitle>
                <Button variant="outline" size="sm" onClick={clearInvitations}>
                  Clear All
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        {invitation.type === 'existing' ? (
                          <Users className="h-4 w-4 text-blue-600" />
                        ) : (
                          <Mail className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">
                          {invitation.user.name || invitation.user.email}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {invitation.type === 'existing' ? 'Existing user' : 'New user invitation'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{invitation.role}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {invitation.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">1. Test Existing User Search</h4>
                <p className="text-sm text-muted-foreground">
                  Type a name or email of an existing user. You should see suggestions appear in the dropdown.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">2. Test New User Invitation</h4>
                <p className="text-sm text-muted-foreground">
                  Type a new email address (e.g., "newuser@example.com"). The system should detect it as a new user and prepare to send an invitation.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">3. Test Role Selection</h4>
                <p className="text-sm text-muted-foreground">
                  Select different roles (Member/Admin) and see how they appear in the invitation history.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
