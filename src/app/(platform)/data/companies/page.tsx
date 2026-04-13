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
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Users
} from 'lucide-react'

// Mock data for demonstration
const mockCompanies = [
  {
    id: '1',
    name: 'Tech Corp',
    description: 'Leading technology company specializing in software development',
    customerCount: 45,
    isActive: true,
    createdAt: '2024-01-10',
    updatedAt: '2024-01-15'
  },
  {
    id: '2',
    name: 'Marketing Solutions',
    description: 'Digital marketing agency providing comprehensive marketing services',
    customerCount: 32,
    isActive: true,
    createdAt: '2024-01-08',
    updatedAt: '2024-01-14'
  },
  {
    id: '3',
    name: 'Event Planners Inc',
    description: 'Professional event planning and management services',
    customerCount: 28,
    isActive: true,
    createdAt: '2024-01-05',
    updatedAt: '2024-01-12'
  },
  {
    id: '4',
    name: 'Consulting Group',
    description: 'Business consulting and advisory services',
    customerCount: 15,
    isActive: false,
    createdAt: '2024-01-03',
    updatedAt: '2024-01-10'
  }
]

export default function CompaniesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showCompanyDetail, setShowCompanyDetail] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<any>(null)

  const handleCompanyClick = (company: any) => {
    setSelectedCompany(company)
    setShowCompanyDetail(true)
  }

  const filteredCompanies = mockCompanies.filter(company =>
    company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    company.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
            <p className="text-muted-foreground">
              Manage company data and associated customers
            </p>
          </div>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Company
          </Button>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Companies Table */}
        <Card>
          <CardHeader>
            <CardTitle>Companies ({filteredCompanies.length})</CardTitle>
            <CardDescription>
              Click on a company to view details and associated customers
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
                {filteredCompanies.map((company) => (
                  <TableRow 
                    key={company.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleCompanyClick(company)}
                  >
                    <TableCell className="font-medium">
                      {company.name}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {company.description}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{company.customerCount}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={company.isActive ? 'default' : 'secondary'}>
                        {company.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>{company.createdAt}</TableCell>
                    <TableCell>{company.updatedAt}</TableCell>
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

        {/* Company Detail Modal */}
        <Dialog open={showCompanyDetail} onOpenChange={setShowCompanyDetail}>
          <DialogContent className="max-w-4xl h-[80vh]">
            <DialogHeader>
              <DialogTitle>{selectedCompany?.name}</DialogTitle>
              <DialogDescription>
                {selectedCompany?.description}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-3 gap-6 h-full">
              {/* Left Column - Company Information */}
              <div className="col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Company Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Name</label>
                        <p className="text-sm text-muted-foreground">{selectedCompany?.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Status</label>
                        <p className="text-sm text-muted-foreground">
                          <Badge variant={selectedCompany?.isActive ? 'default' : 'secondary'}>
                            {selectedCompany?.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium">Description</label>
                        <p className="text-sm text-muted-foreground">{selectedCompany?.description}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Created</label>
                        <p className="text-sm text-muted-foreground">{selectedCompany?.createdAt}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Updated</label>
                        <p className="text-sm text-muted-foreground">{selectedCompany?.updatedAt}</p>
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
                        <div className="font-medium">Company created</div>
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
                    <CardTitle>Associated Customers ({selectedCompany?.customerCount})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedCompany?.customerCount > 0 ? (
                        <>
                          {[
                            { name: 'John Doe', email: 'john.doe@techcorp.com', position: 'CEO' },
                            { name: 'Jane Smith', email: 'jane.smith@techcorp.com', position: 'CTO' },
                            { name: 'Mike Johnson', email: 'mike.johnson@techcorp.com', position: 'CFO' }
                          ].map((customer, index) => (
                            <div
                              key={index}
                              className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-sm">{customer.name}</div>
                                <div className="text-xs text-muted-foreground">{customer.email}</div>
                                <div className="text-xs text-muted-foreground">{customer.position}</div>
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
