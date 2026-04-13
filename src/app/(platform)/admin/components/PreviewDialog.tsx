'use client'

import React from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Rocket } from 'lucide-react'

type Chatbot = any

interface PreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedChatbot: Chatbot | null
  onPublish: (bot: Chatbot) => void
}

export function PreviewDialog({ open, onOpenChange, selectedChatbot, onPublish }: PreviewDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Chatbot Preview</DialogTitle>
          <DialogDescription>
            Preview how your chatbot will look to users
          </DialogDescription>
        </DialogHeader>
        {selectedChatbot && (
          <div className="border rounded-lg p-4" style={{
            backgroundColor: selectedChatbot.messageBoxColor,
            borderColor: selectedChatbot.borderColor,
            borderWidth: selectedChatbot.borderWidth,
            borderRadius: selectedChatbot.borderRadius,
            boxShadow: `0 0 ${selectedChatbot.shadowBlur} ${selectedChatbot.shadowColor}`,
            fontFamily: selectedChatbot.fontFamily,
            fontSize: selectedChatbot.fontSize,
            color: selectedChatbot.fontColor
          }}>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {selectedChatbot.logo && (
                  <img src={selectedChatbot.logo} alt="Logo" className="h-8 w-8 rounded" />
                )}
                <h3 className="font-semibold">{selectedChatbot.name}</h3>
              </div>
              <div className="space-y-2">
                <div className="p-3 rounded-lg" style={{ backgroundColor: selectedChatbot.primaryColor, color: 'white' }}>
                  {selectedChatbot.conversationOpener}
                </div>
                {selectedChatbot.followUpQuestions && selectedChatbot.followUpQuestions.length > 0 && (
                  <div className="space-y-2">
                    {selectedChatbot.followUpQuestions.map((question: string, index: number) => (
                      <button
                        key={index}
                        className="w-full text-left p-2 border rounded hover:bg-muted"
                        style={{ borderColor: selectedChatbot.borderColor }}
                      >
                        {question}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={() => { if (selectedChatbot) { onPublish(selectedChatbot); onOpenChange(false) } }}>
            <Rocket className="h-4 w-4 mr-2" />
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


