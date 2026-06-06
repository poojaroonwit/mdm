'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import toast from 'react-hot-toast'

interface UserImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: () => void
}

type ImportResults = {
  success: any[]
  failed: any[]
}

export function UserImportDialog({
  open,
  onOpenChange,
  onImported,
}: UserImportDialogProps) {
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importing, setImporting] = useState(false)
  const [importResults, setImportResults] = useState<ImportResults | null>(null)

  const resetImport = () => {
    setImportFile(null)
    setImportResults(null)
  }

  const closeDialog = () => {
    onOpenChange(false)
    resetImport()
  }

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Please select a file')
      return
    }

    setImporting(true)
    try {
      const formData = new FormData()
      formData.append('file', importFile)

      const response = await fetch('/api/admin/users/import', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const data = await response.json()
        setImportResults(data.results)
        toast.success(`Imported ${data.results.success.length} user(s)`)
        if (data.results.failed.length > 0) {
          toast.error(`${data.results.failed.length} user(s) failed to import`)
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to import users')
      }
    } catch (error) {
      console.error('Error importing users:', error)
      toast.error('Failed to import users')
    } finally {
      setImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader>
          <DialogTitle>Import Users</DialogTitle>
          <DialogDescription>
            Upload a CSV file to import users. Required columns: name, email, password. Optional: role, isActive
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4 p-6 pt-2 pb-4">
          {!importResults ? (
            <>
              <div>
                <Label htmlFor="import-file">CSV File</Label>
                <Input
                  id="import-file"
                  type="file"
                  accept=".csv"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) {
                      setImportFile(file)
                    }
                  }}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  CSV format: name,email,password,role,isActive
                </p>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  <strong>Example CSV:</strong><br />
                  name,email,password,role,isActive<br />
                  John Doe,john@example.com,password123,USER,true<br />
                  Jane Smith,jane@example.com,password456,ADMIN,true
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-md">
                <p className="text-sm text-green-900 dark:text-green-200 font-semibold">
                  Successfully imported {importResults.success.length} user(s)
                </p>
              </div>
              {importResults.failed.length > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-md">
                  <p className="text-sm text-red-900 dark:text-red-200 font-semibold mb-2">
                    Failed to import {importResults.failed.length} user(s):
                  </p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {importResults.failed.map((failure, index) => (
                      <p key={index} className="text-xs text-red-800 dark:text-red-200">
                        {failure.email}: {failure.error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogBody>
        <DialogFooter>
          {importResults ? (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  closeDialog()
                  onImported()
                }}
              >
                Close
              </Button>
              <Button onClick={resetImport}>
                Import More
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={!importFile || importing}>
                {importing ? 'Importing...' : 'Import Users'}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
