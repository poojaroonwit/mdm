'use client'

import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Edit,
  Eye,
  MoreHorizontal,
  Trash2,
} from 'lucide-react'

export type CustomerTableCustomer = {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  is_active: boolean
  created_at?: string
  updated_at?: string
  companies?: { name?: string | null } | null
  positions?: { name?: string | null } | null
  sources?: { name?: string | null } | null
  industries?: { name?: string | null } | null
}

type SortDirection = 'asc' | 'desc'
type FilterType = 'text' | 'select' | 'date' | 'number'

interface CustomersTableProps {
  customers: CustomerTableCustomer[]
  getColumnFilterComponent: (field: string, type: FilterType) => ReactNode
  limit: number
  loading: boolean
  page: number
  selectedCustomers: string[]
  sortDirection: SortDirection
  sortField: string
  totalCount: number
  onCustomerClick: (customer: CustomerTableCustomer) => void
  onLimitChange: (limit: number) => void
  onPageChange: (page: number) => void
  onSelectedCustomersChange: (ids: string[]) => void
  onSort: (field: string) => void
}

const columns: Array<{
  filterField: string
  filterType: FilterType
  label: string
  sortField: string
}> = [
  { label: 'Name', sortField: 'first_name', filterField: 'name', filterType: 'text' },
  { label: 'Email', sortField: 'email', filterField: 'email', filterType: 'text' },
  { label: 'Phone', sortField: 'phone', filterField: 'phone', filterType: 'text' },
  { label: 'Company', sortField: 'company', filterField: 'company', filterType: 'select' },
  { label: 'Position', sortField: 'position', filterField: 'position', filterType: 'select' },
  { label: 'Source', sortField: 'source', filterField: 'source', filterType: 'select' },
  { label: 'Industry', sortField: 'industry', filterField: 'industry', filterType: 'select' },
  { label: 'Status', sortField: 'is_active', filterField: 'status', filterType: 'select' },
  { label: 'Last Contact', sortField: 'updated_at', filterField: 'last_contact', filterType: 'date' },
]

function SortIcon({
  active,
  direction,
}: {
  active: boolean
  direction: SortDirection
}) {
  if (!active) return <ArrowUpDown className="h-3 w-3" />
  return direction === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
}

export function CustomersTable({
  customers,
  getColumnFilterComponent,
  limit,
  loading,
  page,
  selectedCustomers,
  sortDirection,
  sortField,
  totalCount,
  onCustomerClick,
  onLimitChange,
  onPageChange,
  onSelectedCustomersChange,
  onSort,
}: CustomersTableProps) {
  const totalPages = Math.max(1, Math.ceil(totalCount / limit))

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <input
                type="checkbox"
                className="rounded border-gray-300"
                checked={customers.length > 0 && selectedCustomers.length === customers.length}
                onChange={(event) => {
                  onSelectedCustomersChange(event.target.checked ? customers.map((customer) => customer.id) : [])
                }}
              />
            </TableHead>
            {columns.map((column) => (
              <TableHead key={column.sortField} className="relative">
                <div className="flex items-center">
                  <button
                    onClick={() => onSort(column.sortField)}
                    className="flex items-center space-x-1 hover:text-gray-600"
                  >
                    <span>{column.label}</span>
                    <SortIcon active={sortField === column.sortField} direction={sortDirection} />
                  </button>
                  {getColumnFilterComponent(column.filterField, column.filterType)}
                </div>
              </TableHead>
            ))}
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center py-8">
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="text-muted-foreground text-lg">No data</div>
                  <div className="text-sm text-muted-foreground">
                    {loading ? 'Loading...' : 'No customers found'}
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            customers.map((customer) => (
              <TableRow
                key={customer.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => onCustomerClick(customer)}
              >
                <TableCell>
                  <input
                    type="checkbox"
                    className="rounded border-gray-300"
                    checked={selectedCustomers.includes(customer.id)}
                    onChange={(event) => {
                      event.stopPropagation()
                      onSelectedCustomersChange(
                        event.target.checked
                          ? [...selectedCustomers, customer.id]
                          : selectedCustomers.filter((id) => id !== customer.id),
                      )
                    }}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  {customer.first_name} {customer.last_name}
                </TableCell>
                <TableCell>{customer.email || '-'}</TableCell>
                <TableCell>{customer.phone || '-'}</TableCell>
                <TableCell>{customer.companies?.name || '-'}</TableCell>
                <TableCell>{customer.positions?.name || '-'}</TableCell>
                <TableCell>{customer.sources?.name || '-'}</TableCell>
                <TableCell>{customer.industries?.name || '-'}</TableCell>
                <TableCell>
                  <StatusBadge status={customer.is_active ? 'active' : 'inactive'} />
                </TableCell>
                <TableCell>{customer.updated_at?.slice(0, 10) || customer.created_at?.slice(0, 10) || '-'}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(event) => event.stopPropagation()}>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem
                        onClick={(event) => {
                          event.stopPropagation()
                          onCustomerClick(customer)
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {loading && (
        <div className="text-sm text-muted-foreground mt-4">Loading...</div>
      )}

      <div className="mt-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Page {page} of {totalPages}
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={String(limit)}
            onValueChange={(value) => {
              onPageChange(1)
              onLimitChange(parseInt(value))
            }}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="25">25 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
              <SelectItem value="100">100 / page</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))}>
            Prev
          </Button>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}
