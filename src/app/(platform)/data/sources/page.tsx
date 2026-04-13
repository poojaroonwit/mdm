'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Users
} from 'lucide-react'

// Mock data for demonstration
const mockSources = [
  {
    id: '1',
    name: 'Website',
    description: 'Company website contact forms',
    customerCount: 120,
    isActive: true,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-15'
  },
  {
    id: '2',
    name: 'Social Media',
    description: 'Social media platforms and campaigns',
    customerCount: 85,
    isActive: true,
    createdAt: '2024-01-08',
    updatedAt: '2024-01-14'
  },
  {
    id: '3',
    name: 'Referral',
    description: 'Customer referrals and recommendations',
    customerCount: 45,
    isActive: true,
    createdAt: '2024-01-05',
    updatedAt: '2024-01-12'
  },
  {
    id: '4',
    name: 'Event',
    description: 'Trade shows and events',
    customerCount: 32,
    isActive: true,
    createdAt: '2024-01-03',
    updatedAt: '2024-01-10'
  },
  {
    id: '5',
    name: 'Cold Call',
    description: 'Cold calling and outreach',
    customerCount: 18,
    isActive: false,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-08'
  }
]

export default function SourcesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showSourceDetail, setShowSourceDetail] = useState(false)
  const [selectedSource, setSelectedSource] = useState<any>(null)

  const handleSourceClick = (source: any) => {
    setSelectedSource(source)
    setShowSourceDetail(true)
  }

  const filteredSources = mockSources.filter(source =>
    source.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    source.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sources</h1>
            <p className="text-muted-foreground">
              Manage customer acquisition sources
            </p>
          </div>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Source
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search sources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Sources Table */}
        <Card>
          <CardHeader>
            <CardTitle>Sources ({filteredSources.length})</CardTitle>
            <CardDescription>
              Click on a source to view details and associated customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Customers</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSources.map((source) => (
                  <TableRow 
                    key={source.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleSourceClick(source)}
                  >
                    <TableCell className="font-medium">
                      {source.name}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {source.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{source.customerCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={source.isActive ? 'default' : 'secondary'}>
                        {source.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{source.createdAt}</TableCell>
                    <TableCell>{source.updatedAt}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Source Detail Modal */}
        <Dialog open={showSourceDetail} onOpenChange={setShowSourceDetail}>
          <DialogContent className="max-w-4xl h-[80vh]">
            <DialogHeader>
              <DialogTitle>{selectedSource?.name}</DialogTitle>
              <DialogDescription>
                {selectedSource?.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-3 gap-6 h-full">
              {/* Left Column - Source Information */}
              <div className="col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Source Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Name</label>
                        <p className="text-sm text-muted-foreground">{selectedSource?.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Status</label>
                        <p className="text-sm text-muted-foreground">
                          <Badge variant={selectedSource?.isActive ? 'default' : 'secondary'}>
                            {selectedSource?.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium">Description</label>
                        <p className="text-sm text-muted-foreground">{selectedSource?.description}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Created</label>
                        <p className="text-sm text-muted-foreground">{selectedSource?.createdAt}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Updated</label>
                        <p className="text-sm text-muted-foreground">{selectedSource?.updatedAt}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Activity Logs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm">
                        <div className="font-medium">Source created</div>
                        <div className="text-muted-foreground">2 days ago by Admin User</div>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">Description updated</div>
                        <div className="text-muted-foreground">1 day ago by Manager User</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column - Associated Customers */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Associated Customers ({selectedSource?.customerCount})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedSource?.customerCount > 0 ? (
                        <>
                          {[
                            { name: 'John Doe', email: 'john.doe@example.com', company: 'Tech Corp' },
                            { name: 'Jane Smith', email: 'jane.smith@example.com', company: 'Marketing Solutions' },
                            { name: 'Mike Johnson', email: 'mike.johnson@example.com', company: 'Event Planners' }
                          ].map((customer, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-sm">{customer.name}</div>
                                <div className="text-xs text-muted-foreground">{customer.email}</div>
                                <div className="text-xs text-muted-foreground">{customer.company}</div>
                              </div>
                            </div>
                          ))}
                          <Button variant="outline" size="sm" className="w-full">
                            View All Customers
                          </Button>
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground mt-2">No customers associated</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  )
}
