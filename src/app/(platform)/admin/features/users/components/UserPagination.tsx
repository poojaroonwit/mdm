'use client'

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface UserPaginationProps {
  limit: number
  page: number
  pages: number
  total: number
  onPageChange: (page: number) => void
}

export function UserPagination({ limit, page, pages, total, onPageChange }: UserPaginationProps) {
  if (pages <= 1) return null

  return (
    <div className="flex items-center justify-between mt-6 pt-6 border-t border-border">
      <div className="text-sm text-muted-foreground">
        Showing <span className="font-medium text-foreground">{((page - 1) * limit) + 1}</span> to{' '}
        <span className="font-medium text-foreground">{Math.min(page * limit, total)}</span> of{' '}
        <span className="font-medium text-foreground">{total}</span> users
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="h-8"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-1">
          {Array.from({ length: Math.min(5, pages) }, (_, i) => {
            let pageNum
            if (pages <= 5) {
              pageNum = i + 1
            } else if (page <= 3) {
              pageNum = i + 1
            } else if (page >= pages - 2) {
              pageNum = pages - 4 + i
            } else {
              pageNum = page - 2 + i
            }

            return (
              <Button
                key={pageNum}
                variant={page === pageNum ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className="h-8 w-8 p-0"
              >
                {pageNum}
              </Button>
            )
          })}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(Math.min(pages, page + 1))}
          disabled={page === pages}
          className="h-8"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
