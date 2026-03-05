import React, { useState } from 'react'
import { Check, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { HERO_ICONS_LIST } from './IconList'
import * as HeroIcons from '@heroicons/react/24/outline'

interface IconPickerPopoverProps {
  value?: string | null
  onChange: (iconName: string) => void
  label?: string
  placeholder?: string
}

export function IconPickerPopover({
  value,
  onChange,
  label = 'Icon',
  placeholder = 'Select an icon',
}: IconPickerPopoverProps) {
  const [open, setOpen] = useState(false)

  const SelectedIcon = value && (HeroIcons as any)[value] ? (HeroIcons as any)[value] : null

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
          {label}
        </label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              'w-full justify-between h-9 px-3 font-normal',
              !value && 'text-muted-foreground',
              open && 'ring-2 ring-primary/20 border-primary'
            )}
          >
            <div className="flex items-center gap-2 truncate">
              {SelectedIcon ? (
                <SelectedIcon className="w-4 h-4 text-muted-foreground" />
              ) : (
                <div className="w-4 h-4 rounded-full bg-muted border border-border" />
              )}
              <span className="text-xs truncate">{value || placeholder}</span>
            </div>
            <ChevronsUpDown className="w-4 h-4 opacity-50 shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <div className="flex items-center px-3 border-b">
              <Search className="w-4 h-4 opacity-50 shrink-0" />
              <CommandInput 
                placeholder="Search icons..." 
                className="h-9 border-none focus:ring-0 w-full text-xs" 
              />
            </div>
            <CommandEmpty className="py-2 text-xs text-center text-muted-foreground">
              Nothing found.
            </CommandEmpty>
            <CommandList>
              <CommandGroup className="max-h-60 overflow-y-auto w-full p-1 custom-scrollbar">
                {HERO_ICONS_LIST.map((iconName) => {
                  const IconComponent = (HeroIcons as any)[iconName]
                  return (
                    <CommandItem
                      key={iconName}
                      value={iconName}
                      onSelect={(currentValue) => {
                        onChange(iconName)
                        setOpen(false)
                      }}
                      className="flex items-center gap-2 py-2 px-3 text-xs cursor-pointer"
                    >
                      {IconComponent && (
                        <IconComponent 
                          className={cn(
                            "w-4 h-4 shrink-0", 
                            value === iconName ? "text-primary" : "text-muted-foreground"
                          )} 
                        />
                      )}
                      <span className="truncate flex-1">{iconName}</span>
                      <Check
                        className={cn(
                          'w-4 h-4 shrink-0 text-primary',
                          value === iconName ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
