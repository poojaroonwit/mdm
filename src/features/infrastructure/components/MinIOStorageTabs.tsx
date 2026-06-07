import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Database, File, Loader, Plus, RefreshCw } from 'lucide-react'

interface MinIOBucketsTabProps {
  buckets: any[]
  loading: boolean
  error?: string | null
  selectedBucket: string | null
  onSelectBucket: (bucket: string) => void
  onRefresh: () => void
}

export function MinIOBucketsTab({
  buckets,
  loading,
  error,
  selectedBucket,
  onSelectBucket,
  onRefresh
}: MinIOBucketsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">MinIO Buckets</h3>
          <p className="text-sm text-muted-foreground">
            Manage your object storage buckets
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Create Bucket
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              {error}
            </div>
          </CardContent>
        </Card>
      ) : buckets.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8 text-muted-foreground">
              No buckets found. Create your first bucket to get started.
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buckets.map((bucket: any) => (
            <Card
              key={bucket.name}
              className={selectedBucket === bucket.name ? 'ring-2 ring-primary' : ''}
            >
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Database className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-lg">{bucket.name}</CardTitle>
                </div>
                <CardDescription>
                  Created: {bucket.creationDate
                    ? new Date(bucket.creationDate).toLocaleDateString()
                    : 'Unknown'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {bucket.size && (
                    <div className="text-sm text-muted-foreground">
                      Size: {bucket.size}
                    </div>
                  )}
                  {bucket.objectCount !== undefined && (
                    <div className="text-sm text-muted-foreground">
                      Objects: {bucket.objectCount}
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => onSelectBucket(bucket.name)}
                  >
                    <File className="h-4 w-4 mr-2" />
                    View Objects
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

interface MinIOObjectsTabProps {
  selectedBucket: string | null
}

export function MinIOObjectsTab({ selectedBucket }: MinIOObjectsTabProps) {
  if (!selectedBucket) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            Please select a bucket to view objects
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">Objects in {selectedBucket}</h3>
          <p className="text-sm text-muted-foreground">
            Browse and manage objects in this bucket
          </p>
        </div>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Upload Object
        </Button>
      </div>
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-muted-foreground">
            Object browser will be implemented here
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
