'use client'

import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { X } from 'lucide-react'

interface CustomerFilterDrawerProps {
  columnFilters: Record<string, any>
  companiesOptions: Array<{ id: string; name: string }>
  groupedAttributes: Record<string, any[]>
  loadingAttributes: boolean
  open: boolean
  openAccordionSections: string[]
  setColumnFilters: (filters: Record<string, any>) => void
  setOpen: (open: boolean) => void
  setOpenAccordionSections: (sections: string[]) => void
  onColumnFilter: (field: string, value: any) => void
  renderFilterInput: (attribute: any) => ReactNode
}

export function CustomerFilterDrawer({
  columnFilters,
  companiesOptions,
  groupedAttributes,
  loadingAttributes,
  open,
  openAccordionSections,
  setColumnFilters,
  setOpen,
  setOpenAccordionSections,
  onColumnFilter,
  renderFilterInput,
}: CustomerFilterDrawerProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50">
      <div className="fixed inset-0 bg-black/50" onClick={() => setOpen(false)} />

      <div className="fixed left-0 top-0 h-screen w-96 flex flex-col bg-background shadow-xl">
        <div className="flex items-center justify-between border-b border-border p-4">
          <h2 className="text-lg font-semibold">Filter Customers</h2>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loadingAttributes ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-sm text-muted-foreground">Loading attributes...</div>
            </div>
          ) : (
            <div className="w-full">
              <Accordion
                type="multiple"
                value={openAccordionSections}
                onValueChange={(value) => setOpenAccordionSections(Array.isArray(value) ? value : [value])}
              >
                {Object.entries(groupedAttributes).map(([modelKey, attributes]) => (
                  <AccordionItem key={modelKey} value={modelKey} className="border-b">
                    <AccordionTrigger className="text-sm font-medium text-gray-900 hover:no-underline">
                      <div className="flex items-center justify-between w-full">
                        <span>{attributes[0]?.dataModelName || modelKey.charAt(0).toUpperCase() + modelKey.slice(1)}</span>
                        <span className="text-xs text-gray-500 ml-2">
                          ({attributes.length} {attributes.length === 1 ? 'field' : 'fields'})
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-3">
                      <div className="space-y-3">
                        {attributes.map((attribute) => (
                          <div key={attribute.id || attribute.name}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {attribute.display_name || attribute.name}
                            </label>
                            {renderFilterInput(attribute)}
                          </div>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}

                {Object.keys(groupedAttributes).length === 0 && !loadingAttributes && (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <div className="text-sm text-muted-foreground mb-4">
                        No dynamic attributes found. Using basic customer fields.
                      </div>
                    </div>

                    <AccordionItem value="customer" className="border-b">
                      <AccordionTrigger className="text-sm font-medium text-gray-900 hover:no-underline">
                        <div className="flex items-center justify-between w-full">
                          <span>Customer</span>
                          <span className="text-xs text-gray-500 ml-2">(6 fields)</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pt-3">
                        <div className="space-y-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <Input
                              placeholder="Filter by first name"
                              value={columnFilters.first_name || ''}
                              onChange={(event) => onColumnFilter('first_name', event.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <Input
                              placeholder="Filter by last name"
                              value={columnFilters.last_name || ''}
                              onChange={(event) => onColumnFilter('last_name', event.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <Input
                              placeholder="Filter by email"
                              value={columnFilters.email || ''}
                              onChange={(event) => onColumnFilter('email', event.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                            <Input
                              placeholder="Filter by phone"
                              value={columnFilters.phone || ''}
                              onChange={(event) => onColumnFilter('phone', event.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <Select
                              value={columnFilters.is_active || ''}
                              onValueChange={(value) => onColumnFilter('is_active', value)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="All Status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">All Status</SelectItem>
                                <SelectItem value="true">Active</SelectItem>
                                <SelectItem value="false">Inactive</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                            <Combobox
                              options={[
                                { value: '', label: 'All Companies' },
                                ...companiesOptions.map((company) => ({
                                  value: company.name,
                                  label: company.name,
                                })),
                              ]}
                              value={columnFilters.company || ''}
                              onValueChange={(value) => onColumnFilter('company', value)}
                              placeholder="All Companies"
                            />
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </div>
                )}
              </Accordion>
            </div>
          )}
        </div>

        <div className="border-t border-border p-4 flex space-x-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              setColumnFilters({})
              setOpen(false)
            }}
          >
            Clear All
          </Button>
          <Button className="flex-1" onClick={() => setOpen(false)}>
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  )
}
