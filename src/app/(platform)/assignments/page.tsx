'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { useSpace } from '@/contexts/space-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Plus, 
  Calendar, 
  User, 
  Clock, 
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  List,
  Kanban
} from 'lucide-react'

// Mock data for demonstration
const mockAssignments = [
  {
    id: '1',
    title: 'Follow up with Tech Corp',
    description: 'Schedule a demo call with the CTO',
    status: 'TODO',
    priority: 'HIGH',
    assignedTo: { name: 'John Doe', avatar: null },
    dueDate: '2024-01-20',
    startDate: '2024-01-15',
    completedAt: null,
    customers: [
      { id: '1', name: 'John Doe', email: 'john.doe@techcorp.com' }
    ]
  },
  {
    id: '2',
    title: 'Prepare proposal for Marketing Solutions',
    description: 'Create detailed proposal for their digital marketing needs',
    status: 'IN_PROGRESS',
    priority: 'MEDIUM',
    assignedTo: { name: 'Jane Smith', avatar: null },
    dueDate: '2024-01-22',
    startDate: '2024-01-16',
    completedAt: null,
    customers: [
      { id: '2', name: 'Jane Smith', email: 'jane.smith@marketingsolutions.com' }
    ]
  },
  {
    id: '3',
    title: 'Event planning consultation',
    description: 'Discuss requirements for upcoming conference',
    status: 'REVIEW',
    priority: 'LOW',
    assignedTo: { name: 'Mike Johnson', avatar: null },
    dueDate: '2024-01-25',
    startDate: '2024-01-18',
    completedAt: null,
    customers: [
      { id: '3', name: 'Mike Johnson', email: 'mike.johnson@eventplanners.com' }
    ]
  },
  {
    id: '4',
    title: 'Contract negotiation',
    description: 'Finalize contract terms with ABC Corp',
    status: 'DONE',
    priority: 'HIGH',
    assignedTo: { name: 'Sarah Wilson', avatar: null },
    dueDate: '2024-01-18',
    startDate: '2024-01-10',
    completedAt: '2024-01-18',
    customers: [
      { id: '4', name: 'Sarah Wilson', email: 'sarah.wilson@abccorp.com' }
    ]
  }
]

const statusColumns = [
  { id: 'TODO', title: 'To Do', color: 'bg-gray-100' },
  { id: 'IN_PROGRESS', title: 'In Progress', color: 'bg-blue-100' },
  { id: 'REVIEW', title: 'Review', color: 'bg-yellow-100' },
  { id: 'DONE', title: 'Done', color: 'bg-green-100' }
]

const priorityColors = {
  LOW: 'bg-gray-500',
  MEDIUM: 'bg-yellow-500',
  HIGH: 'bg-orange-500',
  URGENT: 'bg-red-500'
}

export default function AssignmentsPage() {
  const { currentSpace } = useSpace()
  const disabled = !!currentSpace && (currentSpace.features?.assignments === false || (currentSpace as any).enable_assignments === false)
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
  const [showAssignmentDetail, setShowAssignmentDetail] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null)

  const handleAssignmentClick = (assignment: any) => {
    setSelectedAssignment(assignment)
    setShowAssignmentDetail(true)
  }

  const getAssignmentsByStatus = (status: string) => {
    return mockAssignments.filter(assignment => assignment.status === status)
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
            {disabled ? (
              <p className="text-muted-foreground">This feature is disabled for the current space.</p>
            ) : (
              <p className="text-muted-foreground">Manage your tasks and assignments</p>
            )}
          </div>
          {!disabled && (
          <div className="flex items-center space-x-2">
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('kanban')}
              >
                <Kanban className="mr-2 h-4 w-4" />
                Kanban
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="mr-2 h-4 w-4" />
                List
              </Button>
            </div>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Assignment
            </Button>
          </div>
          )}
        </div>

        {/* Kanban View */}
        {!disabled && viewMode === 'kanban' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {statusColumns.map((column) => (
              <Card key={column.id} className="h-fit">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {column.title}
                    </CardTitle>
                    <Badge variant="secondary" className="text-xs">
                      {getAssignmentsByStatus(column.id).length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {getAssignmentsByStatus(column.id).map((assignment) => (
                    <Card
                      key={assignment.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => handleAssignmentClick(assignment)}
                    >
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <h4 className="font-medium text-sm line-clamp-2">
                              {assignment.title}
                            </h4>
                            <div className="flex items-center space-x-1">
                              <div className={`w-2 h-2 rounded-full ${priorityColors[assignment.priority as keyof typeof priorityColors]}`} />
                              <Button variant="ghost" size="icon" className="h-6 w-6">
                                <MoreHorizontal className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {assignment.description}
                          </p>
                          
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>{assignment.dueDate}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>{assignment.assignedTo.name}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex -space-x-1">
                              {assignment.customers.slice(0, 3).map((customer) => (
                                <Avatar key={customer.id} className="h-6 w-6 border-2 border-background">
                                  <AvatarFallback className="text-xs">
                                    {customer.name.split(' ').map(n => n[0]).join('')}
                                  </AvatarFallback>
                                </Avatar>
                              ))}
                              {assignment.customers.length > 3 && (
                                <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center">
                                  <span className="text-xs">+{assignment.customers.length - 3}</span>
                                </div>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {assignment.priority}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <Card>
            <CardHeader>
              <CardTitle>All Assignments</CardTitle>
              <CardDescription>
                View all assignments in a list format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAssignments.map((assignment) => (
                  <Card
                    key={assignment.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleAssignmentClick(assignment)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium">{assignment.title}</h4>
                            <Badge variant="outline">{assignment.status}</Badge>
                            <Badge variant="secondary">{assignment.priority}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {assignment.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>{assignment.assignedTo.name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3" />
                              <span>Due: {assignment.dueDate}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>Started: {assignment.startDate}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="flex -space-x-1">
                            {assignment.customers.slice(0, 3).map((customer) => (
                              <Avatar key={customer.id} className="h-8 w-8 border-2 border-background">
                                <AvatarFallback className="text-xs">
                                  {customer.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                            ))}
                          </div>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Assignment Detail Modal */}
        <Dialog open={showAssignmentDetail} onOpenChange={setShowAssignmentDetail}>
          <DialogContent className="max-w-4xl h-[80vh]">
            <DialogHeader>
              <DialogTitle>{selectedAssignment?.title}</DialogTitle>
              <DialogDescription>
                {selectedAssignment?.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-3 gap-6 h-full">
              {/* Left Column - Assignment Details */}
              <div className="col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Assignment Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Status</label>
                        <p className="text-sm text-muted-foreground">
                          <Badge variant="outline">{selectedAssignment?.status}</Badge>
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Priority</label>
                        <p className="text-sm text-muted-foreground">
                          <Badge variant="secondary">{selectedAssignment?.priority}</Badge>
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Assigned To</label>
                        <p className="text-sm text-muted-foreground">{selectedAssignment?.assignedTo.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Due Date</label>
                        <p className="text-sm text-muted-foreground">{selectedAssignment?.dueDate}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Start Date</label>
                        <p className="text-sm text-muted-foreground">{selectedAssignment?.startDate}</p>
                      </div>
                      {selectedAssignment?.completedAt && (
                        <div>
                          <label className="text-sm font-medium">Completed At</label>
                          <p className="text-sm text-muted-foreground">{selectedAssignment.completedAt}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Comments & Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-sm">
                        <div className="font-medium">Assignment created</div>
                        <div className="text-muted-foreground">2 days ago by Admin User</div>
                      </div>
                      <div className="text-sm">
                        <div className="font-medium">Status updated to In Progress</div>
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
                    <CardTitle>Associated Customers</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedAssignment?.customers.map((customer: any) => (
                        <div
                          key={customer.id}
                          className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs">
                              {customer.name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="font-medium text-sm">{customer.name}</div>
                            <div className="text-xs text-muted-foreground">{customer.email}</div>
                          </div>
                        </div>
                      ))}
                      <Button variant="outline" size="sm" className="w-full">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Customer
                      </Button>
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
