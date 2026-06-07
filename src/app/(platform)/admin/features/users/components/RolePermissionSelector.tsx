'use client'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Search, Shield } from 'lucide-react'

interface RolePermissionSelectorProps {
  filteredPermissions: any[]
  groupedPermissions: Record<string, any[]>
  searchQuery: string
  selectedPermissions: string[]
  setSearchQuery: (query: string) => void
  setSelectedPermissions: (permissions: string[]) => void
}

export function RolePermissionSelector({
  filteredPermissions,
  groupedPermissions,
  searchQuery,
  selectedPermissions,
  setSearchQuery,
  setSelectedPermissions,
}: RolePermissionSelectorProps) {
  return (
    <div>
      <Label className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Permissions</Label>
      <div className="mt-2 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search permissions..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="pl-9 h-10 rounded-xl"
          />
        </div>
        <ScrollArea className="h-[400px] border border-zinc-100 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/30 dark:bg-zinc-900/10">
          {Object.entries(groupedPermissions).map(([resource, perms]) => (
            <div key={resource} className="mb-6">
              <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
                {resource}
                <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {perms.map((perm) => (
                  <div key={perm.id} className="flex items-start space-x-3 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                    <Checkbox
                      id={`perm-${perm.id}`}
                      checked={selectedPermissions.includes(perm.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPermissions([...selectedPermissions, perm.id])
                        } else {
                          setSelectedPermissions(selectedPermissions.filter((id) => id !== perm.id))
                        }
                      }}
                      className="mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <label
                        htmlFor={`perm-${perm.id}`}
                        className="text-sm font-bold cursor-pointer text-zinc-900 dark:text-zinc-100"
                      >
                        {perm.name}
                      </label>
                      {perm.description && (
                        <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 leading-tight mt-0.5">{perm.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {filteredPermissions.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">No permissions found</p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  )
}
