'use client'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Download, Edit, Globe, Plus, Settings, Trash2, User, Users } from 'lucide-react'

export interface ExportProfilesListItem {
  id: string
  name: string
  description?: string
  data_model: string
  format: string
  columns: string[]
  filters: Array<{ attribute: string; operator: string; value: string }>
  is_public: boolean
  created_by: string
  created_at: string
  updated_at: string
  export_profile_sharing: Array<{
    id: string
    sharing_type: string
    target_id?: string
    target_group?: string
  }>
}

interface ExportProfilesListProps {
  exporting: string | null
  profiles: ExportProfilesListItem[]
  onCreateProfile: () => void
  onDeleteProfile: (profile: ExportProfilesListItem) => void
  onEditProfile: (profile: ExportProfilesListItem) => void
  onExportProfile: (profileId: string) => void
}

function getSharingIcon(type: string) {
  switch (type) {
    case 'all_users':
      return <Globe className="h-3 w-3" />
    case 'group':
      return <Users className="h-3 w-3" />
    case 'specific_users':
      return <User className="h-3 w-3" />
    default:
      return <Settings className="h-3 w-3" />
  }
}

function getSharingLabel(type: string) {
  switch (type) {
    case 'all_users':
      return 'All Users'
    case 'group':
      return 'Group'
    case 'specific_users':
      return 'Users'
    default:
      return type
  }
}

export function ExportProfilesList({
  exporting,
  profiles,
  onCreateProfile,
  onDeleteProfile,
  onEditProfile,
  onExportProfile,
}: ExportProfilesListProps) {
  if (profiles.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Settings className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No export profiles found</h3>
          <p className="text-muted-foreground text-center mb-4">
            Create your first export profile to get started with automated data exports.
          </p>
          <Button onClick={onCreateProfile}>
            <Plus className="mr-2 h-4 w-4" /> Create Profile
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Data Model</TableHead>
          <TableHead>Format</TableHead>
          <TableHead>Columns</TableHead>
          <TableHead>Sharing</TableHead>
          <TableHead>Public</TableHead>
          <TableHead>Created</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {profiles.map((profile) => (
          <TableRow key={profile.id}>
            <TableCell>
              <div>
                <div className="font-medium">{profile.name}</div>
                {profile.description && (
                  <div className="text-sm text-muted-foreground">{profile.description}</div>
                )}
              </div>
            </TableCell>
            <TableCell>{profile.data_model}</TableCell>
            <TableCell>
              <Badge variant="outline">{profile.format.toUpperCase()}</Badge>
            </TableCell>
            <TableCell>{profile.columns.length}</TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {profile.export_profile_sharing.map((share, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {getSharingIcon(share.sharing_type)}
                    <span className="ml-1">{getSharingLabel(share.sharing_type)}</span>
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell>
              <StatusBadge status={profile.is_public ? 'public' : 'private'} label={profile.is_public ? 'Yes' : 'No'} />
            </TableCell>
            <TableCell>
              <div className="text-sm text-muted-foreground">
                {new Date(profile.created_at).toLocaleDateString()}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExportProfile(profile.id)}
                  disabled={exporting === profile.id}
                >
                  {exporting === profile.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  {exporting === profile.id ? 'Exporting...' : 'Export'}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onEditProfile(profile)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => onDeleteProfile(profile)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
