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
import { formatDate } from '@/lib/date-formatters'
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
  Users,
  Calendar,
  MapPin
} from 'lucide-react'

// Mock data for demonstration
const mockEvents = [
  {
    id: '1',
    name: 'Tech Conference 2024',
    description: 'Annual technology conference featuring the latest innovations',
    startDate: '2024-06-15',
    endDate: '2024-06-17',
    location: 'San Francisco, CA',
    customerCount: 45,
    isActive: true,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-15'
  },
  {
    id: '2',
    name: 'Marketing Summit',
    description: 'Digital marketing summit for industry professionals',
    startDate: '2024-07-20',
    endDate: '2024-07-22',
    location: 'New York, NY',
    customerCount: 32,
    isActive: true,
    createdAt: '2024-01-08',
    updatedAt: '2024-01-14'
  },
  {
    id: '3',
    name: 'Startup Expo',
    description: 'Showcase of innovative startups and entrepreneurs',
    startDate: '2024-08-10',
    endDate: '2024-08-12',
    location: 'Austin, TX',
    customerCount: 28,
    isActive: true,
    createdAt: '2024-01-05',
    updatedAt: '2024-01-12'
  },
  {
    id: '4',
    name: 'Healthcare Innovation Forum',
    description: 'Healthcare technology and innovation conference',
    startDate: '2024-09-15',
    endDate: '2024-09-17',
    location: 'Boston, MA',
    customerCount: 15,
    isActive: false,
    createdAt: '2024-01-03',
    updatedAt: '2024-01-10'
  }
]

export default function EventsPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showEventDetail, setShowEventDetail] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState<any>(null)

  const handleEventClick = (event: any) => {
    setSelectedEvent(event)
    setShowEventDetail(true)
  }

  const filteredEvents = mockEvents.filter(event =>
    event.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    event.location.toLowerCase().includes(searchQuery.toLowerCase())
  )


  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Events</h1>
            <p className="text-muted-foreground">
              Manage events and associated customers
            </p>
          </div>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Events Table */}
        <Card>
          <CardHeader>
            <CardTitle>Events ({filteredEvents.length})</CardTitle>
            <CardDescription>
              Click on an event to view details and associated customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Date Range</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Customers</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow 
                    key={event.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleEventClick(event)}
                  >
                    <TableCell className="font-medium">
                      {event.name}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {event.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{formatDate(event.startDate)} - {formatDate(event.endDate)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{event.location}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{event.customerCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={event.isActive ? 'default' : 'secondary'}>
                        {event.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
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

        {/* Event Detail Modal */}
        <Dialog open={showEventDetail} onOpenChange={setShowEventDetail}>
          <DialogContent className="max-w-4xl h-[80vh]">
            <DialogHeader>
              <DialogTitle>{selectedEvent?.name}</DialogTitle>
              <DialogDescription>
                {selectedEvent?.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-3 gap-6 h-full">
              {/* Left Column - Event Information */}
              <div className="col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Event Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Name</label>
                        <p className="text-sm text-muted-foreground">{selectedEvent?.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Status</label>
                        <p className="text-sm text-muted-foreground">
                          <Badge variant={selectedEvent?.isActive ? 'default' : 'secondary'}>
                            {selectedEvent?.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Start Date</label>
                        <p className="text-sm text-muted-foreground">{formatDate(selectedEvent?.startDate || '')}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">End Date</label>
                        <p className="text-sm text-muted-foreground">{formatDate(selectedEvent?.endDate || '')}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium">Location</label>
                        <p className="text-sm text-muted-foreground">{selectedEvent?.location}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium">Description</label>
                        <p className="text-sm text-muted-foreground">{selectedEvent?.description}</p>
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
                        <div className="font-medium">Event created</div>
                        <div className="text-muted-foreground">2 days ago by Admin User</div>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">Event details updated</div>
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
                    <CardTitle>Associated Customers ({selectedEvent?.customerCount})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedEvent?.customerCount > 0 ? (
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
