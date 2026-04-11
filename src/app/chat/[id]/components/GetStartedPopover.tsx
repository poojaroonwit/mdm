'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as Icons from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ChatbotConfig, ChatKitGetStarted, ChatKitTheme } from '../types'
import { cn } from '@/lib/utils'

interface GetStartedPopoverProps {
  chatbot: ChatbotConfig
  isOpen: boolean
  onStart: () => void
  onClose?: () => void
  theme?: ChatKitTheme
}

export function GetStartedPopover({ 
  chatbot, 
  isOpen, 
  onStart, 
  onClose,
  theme 
}: GetStartedPopoverProps) {
  const getStarted = chatbot.chatkitOptions?.getStarted as ChatKitGetStarted
  if (!getStarted?.enabled) return null

  const IconName = (getStarted.icon || 'MessageCircle') as keyof typeof Icons
  const Icon = Icons[IconName] || Icons.MessageCircle

  // Use primary color from theme or fallback
  const primaryColor = theme?.color?.accent?.primary || chatbot.primaryColor || '#000000'
  const textColor = theme?.color?.text || chatbot.fontColor || '#000000'
  const bgColor = theme?.color?.background || chatbot.backgroundColor || '#ffffff'

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className={cn(
            "absolute right-0 w-[350px] rounded-lg shadow-xl overflow-hidden z-[9990]",
            "border border-border/50 backdrop-blur-sm"
          )}
          style={{
            backgroundColor: bgColor,
            color: textColor,
            fontFamily: chatbot.fontFamily,
            bottom: getStarted.marginBottom || '80px',
          }}
        >
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-2 right-2 p-1 hover:bg-black/5 rounded-full transition-colors z-10"
          >
            <Icons.X className="h-4 w-4 opacity-50" />
          </button>

          <div className="p-6 flex flex-col items-start gap-4">
            {/* Header: Image or Icon */}
            {getStarted.image ? (
                <div className="w-full h-32 mb-2 rounded-lg overflow-hidden relative bg-muted/20">
                    <img 
                        src={getStarted.image} 
                        alt={getStarted.title || "Welcome"} 
                        className="w-full h-full object-cover"
                    />
                </div>
            ) : (
                <div 
                className="w-12 h-12 rounded-md flex items-center justify-center mb-2 shadow-lg"
                style={{ backgroundColor: primaryColor }}
                >
                <Icon className="h-6 w-6 text-white" />
                </div>
            )}

            {/* Texts */}
            <div className="space-y-1">
              {getStarted.title && (
                <h3 className="text-lg font-semibold leading-tight">
                  {getStarted.title}
                </h3>
              )}
              {getStarted.subTitle && (
                <p className="text-sm font-medium opacity-80">
                  {getStarted.subTitle}
                </p>
              )}
            </div>

            {getStarted.description && (
              <p className="text-sm opacity-70 leading-relaxed">
                {getStarted.description}
              </p>
            )}

            {/* Start Button */}
            <Button 
              onClick={onStart}
              className="w-full mt-2 font-medium transition-transform hover:scale-[1.02] active:scale-[0.98]"
              style={{
                backgroundColor: primaryColor,
                color: '#ffffff', // Ensure button text is white for contrast with primary brand color
                borderColor: primaryColor
              }}
            >
              {getStarted.buttonText || 'Start Chat'}
              <Icons.ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
