'use client'

import { useRef, useEffect, useState } from 'react'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ExternalLink, Settings, Monitor, Tablet, Smartphone, Code, GripVertical, Square, Circle, Triangle, Signal, Wifi, Battery } from 'lucide-react'
import { Chatbot } from './types'
import { EmulatorConfigDrawer } from './EmulatorConfigDrawer'
import { Z_INDEX } from '@/lib/z-index'
import { generateEmbedCode } from './utils'
import toast from 'react-hot-toast'

interface ChatbotEmulatorProps {
  selectedChatbot: Chatbot | null
  previewMode: 'popover' | 'fullpage' | 'popup-center'
  onPreviewModeChange: (mode: 'popover' | 'fullpage' | 'popup-center') => void
  formData: Partial<Chatbot>
  onFormDataChange?: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
}

export function ChatbotEmulator({
  selectedChatbot,
  previewMode,
  onPreviewModeChange,
  formData,
  onFormDataChange
}: ChatbotEmulatorProps) {
  const emulatorRef = useRef<HTMLIFrameElement | null>(null)
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false)
  const [deviceType, setDeviceType] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')
  const [platform, setPlatform] = useState<'ios' | 'android'>('android')
  const [emulatorWidth, setEmulatorWidth] = useState<number | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const startXRef = useRef<number>(0)
  const startWidthRef = useRef<number>(0)
  const [previewSource, setPreviewSource] = useState<'draft' | 'live'>('draft')

  // Handle resize drag
  const handleResizeStart = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    startXRef.current = e.clientX
    startWidthRef.current = containerRef.current?.offsetWidth || 500
  }

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const delta = startXRef.current - e.clientX
      const newWidth = Math.max(320, Math.min(1920, startWidthRef.current + delta))
      setEmulatorWidth(newWidth)
      setDeviceType('desktop') // Switch to desktop mode to allow custom width
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isResizing])

  // Map formData fields to emulator config
  const emulatorConfig = {
    backgroundColor: (formData as any).pageBackgroundColor || '#ffffff',
    backgroundImage: (formData as any).pageBackgroundImage || '',
    text: (formData as any).pageTitle || '',
    description: (formData as any).pageDescription || ''
  }

  // Handle emulator config changes by updating formData
  const handleEmulatorConfigChange = (newConfig: any) => {
    if (!onFormDataChange) return

    onFormDataChange(prev => ({
      ...prev,
      pageBackgroundColor: newConfig.backgroundColor,
      pageBackgroundImage: newConfig.backgroundImage,
      pageTitle: newConfig.text,
      pageDescription: newConfig.description
    }))
  }

  // Send preview mode to iframe ONLY when previewMode changes (not on every formData change)
  useEffect(() => {
    if (!selectedChatbot?.id || !emulatorRef.current) return

    const sendPreviewMode = () => {
      try {
        if (emulatorRef.current?.contentWindow) {
          // console.log('[ChatbotEmulator] Sending preview mode:', previewMode)
          emulatorRef.current.contentWindow.postMessage({ type: 'chatbot-preview-mode', value: previewMode }, window.location.origin)
        }
      } catch (err) {
        console.error('[ChatbotEmulator] Failed to send preview mode:', err)
      }
    }

    // Small delay to ensure iframe is ready
    const timer = setTimeout(sendPreviewMode, 100)
    return () => clearTimeout(timer)
  }, [previewMode, selectedChatbot?.id])

  // Send initial messages when iframe loads
  useEffect(() => {
    if (!selectedChatbot?.id || !emulatorRef.current) return

    const iframe = emulatorRef.current
    const handleLoad = () => {
      setTimeout(() => {
        try {
          if (!iframe.contentWindow) return
          
          // Send preview mode
          // console.log('[ChatbotEmulator] Sending initial preview mode:', previewMode)
          iframe.contentWindow.postMessage({ type: 'chatbot-preview-mode', value: previewMode }, window.location.origin)
          
          // Send emulator config (page background, etc.)
          // console.log('[ChatbotEmulator] Sending initial emulator config')
          iframe.contentWindow.postMessage(
            {
              type: 'emulator-config-update',
              id: selectedChatbot.id,
              emulatorConfig: emulatorConfig,
            },
            window.location.origin
          )
          
          // IMPORTANT: Send chatbot config (widget styles, etc.) on initial load
          // This ensures the iframe receives the formData styles even if the useEffect
          // for formData changes ran before the iframe was ready
          const activeConfig = previewSource === 'live' 
            ? (selectedChatbot.versions?.find(v => v.isPublished)?.config || selectedChatbot)
            : formData
          
          // console.log('[ChatbotEmulator] Sending initial chatbot config')
          iframe.contentWindow.postMessage(
            {
              type: 'chatbot-config-update',
              id: selectedChatbot.id,
              config: {
                ...activeConfig,
                id: selectedChatbot.id,
              },
            },
            window.location.origin
          )
        } catch (err) {
          console.error('[ChatbotEmulator] Failed to send initial messages:', err)
        }
      }, 200)
    }

    iframe.addEventListener('load', handleLoad)

    return () => {
      iframe.removeEventListener('load', handleLoad)
    }
  }, [selectedChatbot?.id, formData, previewSource, deviceType]) // Include formData and deviceType to ensure latest config is sent on load and when device changes

  // Push realtime style updates to emulator via postMessage
  useEffect(() => {
    if (!selectedChatbot?.id || !emulatorRef.current || !formData) return
    const iframe = emulatorRef.current
    
    // If previewSource is 'live', we want to show the latest published version
    const activeConfig = previewSource === 'live' 
      ? (selectedChatbot.versions?.find(v => v.isPublished)?.config || selectedChatbot)
      : formData

    try {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage(
          {
            type: 'chatbot-config-update',
            id: selectedChatbot.id,
            config: {
              ...activeConfig,
              id: selectedChatbot.id,
            },
          },
          window.location.origin
        )
      }
    } catch (e) {
      console.error('[ChatbotEmulator] Failed to send config update:', e)
    }
  }, [selectedChatbot?.id, formData, previewSource, selectedChatbot?.versions])

  // Send emulator config updates to iframe
  useEffect(() => {
    if (!selectedChatbot?.id || !emulatorRef.current) return
    const iframe = emulatorRef.current
    try {
      if (iframe.contentWindow) {
        // console.log('[ChatbotEmulator] Sending emulator config update')
        iframe.contentWindow.postMessage(
          {
            type: 'emulator-config-update',
            id: selectedChatbot.id,
            emulatorConfig: emulatorConfig,
          },
          window.location.origin
        )
      }
    } catch (e) {
      console.error('[ChatbotEmulator] Failed to send emulator config update:', e)
    }
  }, [selectedChatbot?.id, emulatorConfig])



  return (
    <div ref={containerRef} className="min-h-[800px] overflow-visible relative bg-muted/10 h-full flex flex-col" style={{ borderColor: formData.borderColor }}>
      {/* Draggable resize handle on left border */}
      <div
        className={`absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize group flex items-center justify-center bg-border hover:bg-primary/20 transition-colors ${isResizing ? 'bg-primary/30' : ''}`}
        onMouseDown={handleResizeStart}
        title="Drag to resize"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="flex items-center justify-between px-3 py-2 border-b bg-background z-10" style={{ borderColor: formData.borderColor }}>
        <div className="flex items-center gap-2">
          {/* Live/Draft Toggle */}
          <div className="flex items-center bg-muted/50 rounded-lg p-0.5 mr-2">
            <Button
              variant={previewSource === 'draft' ? 'secondary' : 'ghost'}
              size="sm"
              className={`h-7 px-3 text-xs font-medium rounded-md transition-all ${previewSource === 'draft' ? 'bg-background shadow-lg' : 'text-muted-foreground'}`}
              onClick={() => setPreviewSource('draft')}
            >
              Draft
            </Button>
            <Button
              variant={previewSource === 'live' ? 'secondary' : 'ghost'}
              size="sm"
              className={`h-7 px-3 text-xs font-medium rounded-md transition-all ${previewSource === 'live' ? 'bg-background shadow-lg' : 'text-muted-foreground'}`}
              onClick={() => setPreviewSource('live')}
              disabled={!selectedChatbot?.isPublished}
              title={!selectedChatbot?.isPublished ? "Publish the chatbot to preview the live version" : ""}
            >
              Live
            </Button>
          </div>
          <div className="w-px h-4 bg-border mx-1" />
          <div className="text-sm font-medium">Emulator</div>
          <div className="w-px h-4 bg-border mx-1" />
          <div className="flex rounded-lg p-0.5 gap-0.5">
            <Button
              variant={deviceType === 'desktop' ? 'default' : 'ghost'}
              size="icon"
              className={`h-7 w-7 rounded-md transition-all ${deviceType === 'desktop' ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-muted'}`}
              onClick={() => setDeviceType('desktop')}
              title="Desktop View"
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={deviceType === 'tablet' ? 'default' : 'ghost'}
              size="icon"
              className={`h-7 w-7 rounded-md transition-all ${deviceType === 'tablet' ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-muted'}`}
              onClick={() => setDeviceType('tablet')}
              title="Tablet View"
            >
              <Tablet className="h-4 w-4" />
            </Button>
            <Button
              variant={deviceType === 'mobile' ? 'default' : 'ghost'}
              size="icon"
              className={`h-7 w-7 rounded-md transition-all ${deviceType === 'mobile' ? 'bg-primary text-primary-foreground shadow-lg' : 'hover:bg-muted'}`}
              onClick={() => setDeviceType('mobile')}
              title="Mobile View"
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
          {deviceType !== 'desktop' && (
            <>
              <div className="w-px h-4 bg-border mx-1" />
              <div className="flex rounded-lg p-0.5 gap-0.5">
                <Button
                  variant={platform === 'ios' ? 'secondary' : 'ghost'}
                  size="sm"
                  className={`h-7 px-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${platform === 'ios' ? 'bg-secondary text-secondary-foreground shadow-lg' : 'hover:bg-muted text-muted-foreground'}`}
                  onClick={() => setPlatform('ios')}
                >
                  iOS
                </Button>
                <Button
                  variant={platform === 'android' ? 'secondary' : 'ghost'}
                  size="sm"
                  className={`h-7 px-2 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${platform === 'android' ? 'bg-secondary text-secondary-foreground shadow-lg' : 'hover:bg-muted text-muted-foreground'}`}
                  onClick={() => setPlatform('android')}
                >
                  Android
                </Button>
              </div>
            </>
          )}
          {emulatorWidth && deviceType === 'desktop' && (
            <span className="text-xs text-muted-foreground">{emulatorWidth}px</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs">Preview as</Label>
          <Select value={previewMode} onValueChange={(v: any) => onPreviewModeChange(v)}>
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popover">Popover</SelectItem>
              <SelectItem value="popup-center">Popup Center</SelectItem>
              <SelectItem value="fullpage">Full Page</SelectItem>
            </SelectContent>
          </Select>
          {selectedChatbot?.id && (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 hover:bg-muted"
                onClick={async () => {
                  const chatbot = {
                    ...formData,
                    id: selectedChatbot.id,
                    deploymentType: formData.deploymentType || previewMode,
                    customEmbedDomain: formData.customEmbedDomain
                  } as Chatbot
                  const code = generateEmbedCode(chatbot)
                  const { copyToClipboard } = await import('@/lib/clipboard')
                  const success = await copyToClipboard(code)
                  if (success) {
                    toast.success('Embed code copied to clipboard!')
                  } else {
                    toast.error('Failed to copy to clipboard')
                  }
                }}
                title="Copy Embed Code"
              >
                <Code className="h-4 w-4 mr-2" />
                Embed
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-muted"
                onClick={() => setConfigDrawerOpen(true)}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 hover:bg-muted"
                onClick={() => window.open(`/chat/${selectedChatbot.id}?preview=true&deploymentType=${previewMode}&previewDevice=${deviceType}`, '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                New Tab
              </Button>
            </>
          )}
        </div>
      </div>

      {selectedChatbot?.id ? (
        <div
          className="relative w-full flex-1 overflow-auto flex items-center justify-center p-8 bg-muted/10 transition-all duration-300"
          style={{
            backgroundColor: (formData as any).pageBackgroundColor,
            backgroundImage: (formData as any).pageBackgroundImage ? `url(${(formData as any).pageBackgroundImage})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          {deviceType === 'desktop' ? (
            // Desktop view - browser-like frame
            <div
              className="relative bg-background transition-all duration-300 ease-in-out flex flex-col overflow-hidden shrink-0 rounded-lg shadow-2xl"
              style={{
                width: emulatorWidth ? `${emulatorWidth}px` : '100%',
                height: '100%',
                maxHeight: '100%',
                border: '1px solid #e0e0e0'
              }}
            >
              {/* Browser Chrome */}
              <div className="h-10 bg-gradient-to-b from-[#f5f5f5] to-[#e8e8e8] border-b border-[#d0d0d0] flex items-center px-3 gap-2 shrink-0">
                {/* Traffic Lights */}
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e] shadow-inner" />
                  <div className="w-3 h-3 rounded-full bg-[#febc2e] border border-[#dea123] shadow-inner" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840] border border-[#1aab29] shadow-inner" />
                </div>
                {/* URL Bar */}
                <div className="flex-1 mx-4">
                  <div className="bg-white rounded-md border border-[#c0c0c0] px-3 py-1 text-xs text-gray-500 flex items-center gap-2 shadow-inner">
                    <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span className="truncate">{typeof window !== 'undefined' ? window.location.origin : ''}/chat/{selectedChatbot.id}</span>
                  </div>
                </div>
              </div>
              <iframe
                ref={emulatorRef}
                src={`/chat/${selectedChatbot.id}?preview=true&deploymentType=${previewMode}&previewDevice=${deviceType}`}
                className="w-full flex-1 border-0 bg-background"
                title="Chat Emulator"
                style={{ position: 'relative', zIndex: Z_INDEX.content }}
              />
            </div>
          ) : (
            // Mobile/Tablet view - realistic device frame
            <div
              className="relative transition-all duration-300 ease-in-out flex flex-col overflow-hidden shrink-0"
              style={{
                width: deviceType === 'mobile' ? '320px' : '520px',
                height: deviceType === 'mobile' ? '660px' : '740px',
                borderRadius: deviceType === 'mobile' ? '48px' : '40px',
                background: platform === 'ios' 
                  ? 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 50%, #0f0f0f 100%)'
                  : 'linear-gradient(145deg, #1f1f1f 0%, #121212 100%)',
                padding: deviceType === 'mobile' ? '12px' : '14px',
                boxShadow: `
                  0 0 0 1px rgba(255,255,255,0.1),
                  0 25px 50px -12px rgba(0,0,0,0.5),
                  0 12px 24px -8px rgba(0,0,0,0.3),
                  inset 0 1px 1px rgba(255,255,255,0.05)
                `,
                transform: 'translateZ(0)'
              }}
            >
              {/* Side Buttons (Volume + Power) */}
              {platform === 'ios' && deviceType === 'mobile' && (
                <>
                  {/* Mute Switch */}
                  <div 
                    className="absolute"
                    style={{
                      left: '-3px',
                      top: '100px',
                      width: '3px',
                      height: '24px',
                      background: 'linear-gradient(90deg, #1a1a1a, #2a2a2a)',
                      borderRadius: '2px 0 0 2px'
                    }}
                  />
                  {/* Volume Up */}
                  <div 
                    className="absolute"
                    style={{
                      left: '-3px',
                      top: '140px',
                      width: '3px',
                      height: '50px',
                      background: 'linear-gradient(90deg, #1a1a1a, #2a2a2a)',
                      borderRadius: '2px 0 0 2px'
                    }}
                  />
                  {/* Volume Down */}
                  <div 
                    className="absolute"
                    style={{
                      left: '-3px',
                      top: '200px',
                      width: '3px',
                      height: '50px',
                      background: 'linear-gradient(90deg, #1a1a1a, #2a2a2a)',
                      borderRadius: '2px 0 0 2px'
                    }}
                  />
                  {/* Power Button */}
                  <div 
                    className="absolute"
                    style={{
                      right: '-3px',
                      top: '160px',
                      width: '3px',
                      height: '70px',
                      background: 'linear-gradient(90deg, #2a2a2a, #1a1a1a)',
                      borderRadius: '0 2px 2px 0'
                    }}
                  />
                </>
              )}

              {/* Inner Screen Container */}
              <div 
                className="relative flex-1 flex flex-col overflow-hidden"
                style={{
                  borderRadius: deviceType === 'mobile' ? '38px' : '30px',
                  background: '#000',
                  boxShadow: 'inset 0 0 2px rgba(0,0,0,0.5)'
                }}
              >
                {/* Status Bar with Notch/Dynamic Island */}
                <div
                  className="w-full flex items-center justify-between shrink-0 relative"
                  style={{
                    height: platform === 'ios' ? '54px' : '28px',
                    backgroundColor: '#000',
                    paddingLeft: '24px',
                    paddingRight: '24px',
                    paddingTop: platform === 'ios' ? '12px' : '4px'
                  }}
                >
                  {platform === 'ios' ? (
                    <>
                      {/* Time - Left */}
                      <span className="text-white text-[14px] font-semibold" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text"' }}>
                        9:41
                      </span>
                      
                      {/* Dynamic Island */}
                      <div 
                        className="absolute left-1/2 -translate-x-1/2"
                        style={{
                          top: '12px',
                          width: deviceType === 'mobile' ? '120px' : '100px',
                          height: '34px',
                          background: '#000',
                          borderRadius: '20px',
                          boxShadow: '0 0 0 1px rgba(255,255,255,0.05)'
                        }}
                      >
                        {/* Camera */}
                        <div 
                          className="absolute"
                          style={{
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            width: '10px',
                            height: '10px',
                            background: 'radial-gradient(circle, #1a3a5c 0%, #0d1f30 60%, #000 100%)',
                            borderRadius: '50%',
                            boxShadow: 'inset 0 0 2px rgba(255,255,255,0.2)'
                          }}
                        />
                      </div>
                      
                      {/* Status Icons - Right */}
                      <div className="flex gap-1.5 items-center">
                        <Signal className="h-4 w-4 text-white" />
                        <Wifi className="h-4 w-4 text-white" />
                        <Battery className="h-5 w-4 text-white" />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Android - Time Left */}
                      <span className="text-white/90 text-[12px] font-medium">9:41</span>
                      
                      {/* Punch Hole Camera */}
                      <div 
                        className="absolute left-1/2 -translate-x-1/2"
                        style={{
                          top: '8px',
                          width: '12px',
                          height: '12px',
                          background: 'radial-gradient(circle, #1a3a5c 0%, #000 100%)',
                          borderRadius: '50%',
                          boxShadow: '0 0 0 2px #000'
                        }}
                      />
                      
                      {/* Status Icons - Right */}
                      <div className="flex gap-1 items-center">
                        <Signal className="h-3.5 w-3.5 text-white/90" />
                        <Wifi className="h-3.5 w-3.5 text-white/90" />
                        <span className="text-white/90 text-[11px] font-medium">85%</span>
                        <Battery className="h-4 w-3.5 text-white/90" />
                      </div>
                    </>
                  )}
                </div>

                {/* Content Area */}
                <div className="flex-1 w-full relative overflow-hidden bg-white">
                  <iframe
                    ref={emulatorRef}
                    src={`/chat/${selectedChatbot.id}?preview=true&deploymentType=${previewMode}&previewDevice=${deviceType}`}
                    className="w-full h-full border-0"
                    title="Chat Emulator"
                    style={{
                      position: 'relative',
                      zIndex: Z_INDEX.content,
                      backgroundColor: '#ffffff',
                      isolation: 'isolate'
                    }}
                  />
                </div>

                {/* Navigation Bar / Home Indicator */}
                {platform === 'android' ? (
                  <div 
                    className="w-full flex items-center justify-center shrink-0"
                    style={{
                      height: '40px',
                      background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.7))'
                    }}
                  >
                    {/* Gesture Navigation Bar */}
                    <div 
                      className="rounded-full"
                      style={{
                        width: '100px',
                        height: '4px',
                        background: 'rgba(255,255,255,0.8)'
                      }}
                    />
                  </div>
                ) : (
                  <div 
                    className="w-full flex items-center justify-center shrink-0 bg-white"
                    style={{ height: '24px' }}
                  >
                    <div 
                      className="rounded-full"
                      style={{
                        width: '120px',
                        height: '5px',
                        background: '#000'
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="h-full flex items-center justify-center text-muted-foreground p-6 text-sm">
          Save the chatbot first to enable the live emulator preview here.
        </div>
      )}

      <EmulatorConfigDrawer
        open={configDrawerOpen}
        onOpenChange={setConfigDrawerOpen}
        config={emulatorConfig}
        onConfigChange={handleEmulatorConfigChange}
      />
    </div>
  )
}

