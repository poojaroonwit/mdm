'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { StatusBadge } from '@/components/ui/status-badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Edit, Globe, Hash, Plus, Settings, Share2, Trash2, User, Users } from 'lucide-react'

interface ImportProfile {
  id: string
  name: string
  description?: string
  data_model: string
  file_types: string[]
  header_row: number
  data_start_row: number
  chunk_size: number
  max_items?: number
  import_type: 'insert' | 'upsert' | 'delete'
  primary_key_attribute?: string
  date_format: string
  time_format: string
  boolean_format: string
  attribute_mapping: Record<string, string>
  attribute_options: Record<string, string[]>
  is_public: boolean
  created_by: string
  created_at: string
  updated_at: string
  import_profile_sharing: Array<{
    id: string
    sharing_type: string
    target_id?: string
    target_group?: string
  }>
}

interface ImportProfilesListProps {
  profiles: ImportProfile[]
  onCreateProfile: () => void
  onDeleteProfile: (profile: ImportProfile) => void
  onEditProfile: (profile: ImportProfile) => void
}

const getSharingIcon = (type: string) => {
  switch (type) {
    case 'all_users': return <Globe className="h-4 w-4" />
    case 'group': return <Users className="h-4 w-4" />
    case 'specific_users': return <User className="h-4 w-4" />
    default: return <Share2 className="h-4 w-4" />
  }
}

const getSharingLabel = (type: string) => {
  switch (type) {
    case 'all_users': return 'All Users'
    case 'group': return 'Group'
    case 'specific_users': return 'Specific Users'
    default: return type
  }
}

const getImportTypeColor = (type: string) => {
  switch (type) {
    case 'insert': return 'bg-blue-500'
    case 'upsert': return 'bg-green-500'
    case 'delete': return 'bg-red-500'
    default: return 'bg-gray-500'
  }
}

export function ImportProfilesList({
  profiles,
  onCreateProfile,
  onDeleteProfile,
  onEditProfile
}: ImportProfilesListProps) {
  if (profiles.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Settings className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No import profiles found</h3>
          <p className="text-muted-foreground text-center mb-4">
            Create your first import profile to get started with automated data imports.
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
          <TableHead>File Types</TableHead>
          <TableHead>Import Type</TableHead>
          <TableHead>Chunk Size</TableHead>
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
              <div className="flex flex-wrap gap-1">
                {profile.file_types.map((type, index) => (
                  <Badge key={index} variant="outline" className="text-xs">
                    {type.toUpperCase()}
                  </Badge>
                ))}
              </div>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className={`${getImportTypeColor(profile.import_type)} text-white`}>
                {profile.import_type}
              </Badge>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Hash className="h-3 w-3" />
                {profile.chunk_size.toLocaleString()}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap gap-1">
                {profile.import_profile_sharing.map((share, index) => (
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
