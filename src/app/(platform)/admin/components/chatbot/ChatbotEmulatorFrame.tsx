'use client'

import type { RefObject } from 'react'
import { Battery, Signal, Wifi } from 'lucide-react'

import { Z_INDEX } from '@/lib/z-index'
import type { Chatbot } from './types'

export type ChatbotEmulatorDeviceType = 'desktop' | 'tablet' | 'mobile'
export type ChatbotEmulatorPlatform = 'ios' | 'android'
export type ChatbotEmulatorPreviewMode = 'popover' | 'fullpage' | 'popup-center'

interface ChatbotEmulatorFrameProps {
  selectedChatbot: Chatbot
  previewMode: ChatbotEmulatorPreviewMode
  deviceType: ChatbotEmulatorDeviceType
  platform: ChatbotEmulatorPlatform
  emulatorWidth: number | null
  emulatorRef: RefObject<HTMLIFrameElement | null>
}

export function ChatbotEmulatorFrame({
  selectedChatbot,
  previewMode,
  deviceType,
  platform,
  emulatorWidth,
  emulatorRef
}: ChatbotEmulatorFrameProps) {
  const iframeSrc = `/chat/${selectedChatbot.id}?preview=true&deploymentType=${previewMode}&previewDevice=${deviceType}`

  if (deviceType === 'desktop') {
    return (
      <div
        className="relative bg-background transition-all duration-300 ease-in-out flex flex-col overflow-hidden shrink-0 rounded-lg shadow-2xl"
        style={{
          width: emulatorWidth ? `${emulatorWidth}px` : '100%',
          height: '100%',
          minHeight: '768px',
          maxHeight: '100%',
          border: '1px solid #e0e0e0'
        }}
      >
        <div className="h-10 bg-gradient-to-b from-[#f5f5f5] to-[#e8e8e8] border-b border-[#d0d0d0] flex items-center px-3 gap-2 shrink-0">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57] border border-[#e0443e] shadow-inner" />
            <div className="w-3 h-3 rounded-full bg-[#febc2e] border border-[#dea123] shadow-inner" />
            <div className="w-3 h-3 rounded-full bg-[#28c840] border border-[#1aab29] shadow-inner" />
          </div>
          <div className="flex-1 mx-4">
            <div className="flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1 text-xs text-muted-foreground shadow-inner">
              <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="truncate">{typeof window !== 'undefined' ? window.location.origin : ''}/chat/{selectedChatbot.id}</span>
            </div>
          </div>
        </div>
        <iframe
          ref={emulatorRef}
          src={iframeSrc}
          className="w-full flex-1 border-0 bg-background"
          title="Chat Emulator"
          style={{ position: 'relative', zIndex: Z_INDEX.content }}
        />
      </div>
    )
  }

  return (
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
      {platform === 'ios' && deviceType === 'mobile' && (
        <>
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

      <div
        className="relative flex-1 flex flex-col overflow-hidden"
        style={{
          borderRadius: deviceType === 'mobile' ? '38px' : '30px',
          background: '#000',
          boxShadow: 'inset 0 0 2px rgba(0,0,0,0.5)'
        }}
      >
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
              <span className="text-white text-[14px] font-semibold" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text"' }}>
                9:41
              </span>

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

              <div className="flex gap-1.5 items-center">
                <Signal className="h-4 w-4 text-white" />
                <Wifi className="h-4 w-4 text-white" />
                <Battery className="h-5 w-4 text-white" />
              </div>
            </>
          ) : (
            <>
              <span className="text-white/90 text-[12px] font-medium">9:41</span>

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

              <div className="flex gap-1 items-center">
                <Signal className="h-3.5 w-3.5 text-white/90" />
                <Wifi className="h-3.5 w-3.5 text-white/90" />
                <span className="text-white/90 text-[11px] font-medium">85%</span>
                <Battery className="h-4 w-3.5 text-white/90" />
              </div>
            </>
          )}
        </div>

        <div className="relative flex-1 w-full overflow-hidden bg-background">
          <iframe
            ref={emulatorRef}
            src={iframeSrc}
            className="w-full h-full border-0"
            title="Chat Emulator"
            style={{
              position: 'relative',
              zIndex: Z_INDEX.content,
              backgroundColor: 'hsl(var(--background))',
              isolation: 'isolate'
            }}
          />
        </div>

        {platform === 'android' ? (
          <div
            className="w-full flex items-center justify-center shrink-0"
            style={{
              height: '40px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.9), rgba(0,0,0,0.7))'
            }}
          >
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
            className="w-full shrink-0 flex items-center justify-center bg-background"
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
  )
}
