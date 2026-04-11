import { Skeleton } from '@/components/ui/skeleton'
import { useState, useEffect, forwardRef, useImperativeHandle } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Loader2, Mail, Save } from 'lucide-react'
import toast from 'react-hot-toast'
import { NotificationTemplate } from '../types'

interface EmailTemplatesProps {
  hideHeader?: boolean
}

export const EmailTemplates = forwardRef<{ handleSave: () => Promise<void> }, EmailTemplatesProps>((props, ref) => {
  const { hideHeader = false } = props
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<NotificationTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/admin/notification-templates')
      if (res.ok) {
        const data = await res.json()
        setTemplates(data)
        if (data.length > 0 && !selectedTemplate) {
          setSelectedTemplate(data[0])
        }
      } else {
        toast.error('Failed to load templates')
      }
    } catch (error) {
      console.error(error)
      toast.error('Error loading templates')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!selectedTemplate) return
    setIsSaving(true)
    try {
      const res = await fetch(`/api/admin/notification-templates/${selectedTemplate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           subject: selectedTemplate.subject,
           content: selectedTemplate.content,
           isActive: selectedTemplate.isActive,
           variables: selectedTemplate.variables
        })
      })

      if (res.ok) {
        toast.success('Template saved successfully')
        // Update list
        setTemplates(templates.map(t => t.id === selectedTemplate.id ? selectedTemplate : t))
      } else {
        toast.error('Failed to save template')
      }
    } catch (error) {
      console.error(error)
      toast.error('Error saving template')
    } finally {
      setIsSaving(false)
    }
  }

  // Expose the handleSave method to parent components
  useImperativeHandle(ref, () => ({
    handleSave
  }))

  if (isLoading) {
    return (
      <div className="w-full space-y-3 p-4">
        <Skeleton className="h-10 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-12 gap-6 h-[600px]">
      <div className="col-span-4 border-r pr-6 space-y-4 overflow-y-auto max-h-full">
         <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Templates</h3>
         </div>
         <div className="space-y-2">
            {templates.map(template => (
               <div 
                 key={template.id}
                 className={`p-3 rounded-md cursor-pointer border transition-colors ${selectedTemplate?.id === template.id ? 'bg-primary/10 border-primary' : 'hover:bg-muted border-transparent'}`}
                 onClick={() => setSelectedTemplate(template)}
               >
                  <div className="font-medium flex items-center gap-2">
                     <Mail className="h-4 w-4" />
                     {template.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 truncate">
                    {template.subject}
                  </div>
               </div>
            ))}
         </div>
      </div>

      <div className="col-span-8 flex flex-col h-full overflow-hidden">
         {selectedTemplate ? (
            <div className="space-y-4 flex flex-col h-full">
               <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">{selectedTemplate.name}</h3>
                    <p className="text-sm text-muted-foreground">Key: {selectedTemplate.key}</p>
                  </div>
                  {!hideHeader && (
                    <Button onClick={handleSave} disabled={isSaving}>
                      {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Changes
                    </Button>
                  )}
               </div>
               
               <div className="grid gap-4 flex-1 overflow-y-auto pr-2 pb-4">
                  <div className="space-y-2">
                    <Label>Subject</Label>
                    <Input 
                      value={selectedTemplate.subject || ''} 
                      onChange={e => setSelectedTemplate({...selectedTemplate, subject: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2 flex-1 flex flex-col min-h-[300px]">
                    <Label className="flex items-center justify-between">
                       <span>HTML Content</span>
                       <Badge variant="outline" className="text-xs">HTML Supported</Badge>
                    </Label>
                    <Textarea 
                       className="font-mono text-sm flex-1 min-h-[300px]"
                       value={selectedTemplate.content}
                       onChange={e => setSelectedTemplate({...selectedTemplate, content: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                     <Label>Available Variables</Label>
                     <div className="flex flex-wrap gap-2">
                        {selectedTemplate.variables.map(v => (
                           <Badge key={v} variant="secondary" className="font-mono">{`{{${v}}}`}</Badge>
                        ))}
                     </div>
                  </div>

                  <div className="flex items-center space-x-2 pt-4 border-t">
                    <Switch 
                       checked={selectedTemplate.isActive}
                       onCheckedChange={checked => setSelectedTemplate({...selectedTemplate, isActive: checked})}
                    />
                    <Label>Active</Label>
                  </div>
               </div>
            </div>
         ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground">
               Select a template to edit
            </div>
         )}
      </div>
    </div>
  )
})

EmailTemplates.displayName = 'EmailTemplates'
