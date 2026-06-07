import type { CSSProperties, ReactNode } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Z_INDEX } from '@/lib/z-index'
import { ChatWidgetButton } from './ChatWidgetButton'
import { GetStartedPopover } from './GetStartedPopover'
import { WidgetChatContainer } from './WidgetChatContainer'
import { PWAInstallBanner } from './PWAInstallBanner'

interface ChatPageSurfaceProps {
  chatbot: any
  emulatorConfig: any
  isEmbed: boolean
  isOpen: boolean
  isPreview: boolean
  isInIframe: boolean
  isMobile: boolean
  previewDevice: string | null
  previewDeploymentType: 'popover' | 'fullpage' | 'popup-center'
  showGetStarted: boolean
  shouldShowWidgetButton: boolean
  shouldMountContainer: boolean
  shouldShowContainer: boolean
  isNativeChatKit: boolean
  useChatKitInRegularStyle: boolean
  shouldRenderChatKit: boolean
  effectiveDeploymentType: 'popover' | 'fullpage' | 'popup-center'
  widgetButtonStyle: CSSProperties
  popoverPositionStyle: CSSProperties
  containerStyle: CSSProperties
  chatStyle: CSSProperties
  overlayStyle: CSSProperties | null | undefined
  setPreviewDeploymentType: (type: 'popover' | 'fullpage' | 'popup-center') => void
  setIsOpen: (open: boolean) => void
  setShowGetStarted: (show: boolean | ((show: boolean) => boolean)) => void
  handleStartChat: () => void
  toggleChat: () => void
  resetChat: () => void
  handleClose: () => void
  renderChatContent: () => ReactNode
}

export function ChatPageSurface({
  chatbot,
  emulatorConfig,
  isEmbed,
  isOpen,
  isPreview,
  isInIframe,
  isMobile,
  previewDevice,
  previewDeploymentType,
  showGetStarted,
  shouldShowWidgetButton,
  shouldMountContainer,
  shouldShowContainer,
  isNativeChatKit,
  useChatKitInRegularStyle,
  shouldRenderChatKit,
  effectiveDeploymentType,
  widgetButtonStyle,
  popoverPositionStyle,
  containerStyle,
  chatStyle,
  overlayStyle,
  setPreviewDeploymentType,
  setIsOpen,
  setShowGetStarted,
  handleStartChat,
  toggleChat,
  resetChat,
  handleClose,
  renderChatContent,
}: ChatPageSurfaceProps) {
  const showDeviceFrame = isPreview && !isInIframe && (previewDevice === 'mobile' || previewDevice === 'tablet')

  const chatUI = (
    <>
      {overlayStyle && (
        <div style={overlayStyle} aria-hidden="true" onClick={() => setIsOpen(false)} />
      )}

      {isNativeChatKit && (
        <>
          {((chatbot as any).pwaInstallScope !== 'website') && (
            <PWAInstallBanner chatbot={chatbot} isMobile={isMobile} isPreview={isPreview} />
          )}
          {renderChatContent()}
        </>
      )}

      {shouldShowWidgetButton && (
        <div style={{ pointerEvents: 'auto', position: 'absolute', bottom: 0, right: 0, zIndex: Z_INDEX.chatWidget }}>
          {chatbot && (
            <GetStartedPopover
              chatbot={chatbot}
              isOpen={showGetStarted && !isOpen}
              onStart={handleStartChat}
              onClose={() => setShowGetStarted(false)}
              theme={(chatbot as any).chatkitOptions?.theme}
            />
          )}

          <ChatWidgetButton
            chatbot={chatbot}
            isOpen={isOpen}
            onClick={toggleChat}
            widgetButtonStyle={widgetButtonStyle}
            popoverPositionStyle={popoverPositionStyle}
            onDebugToggle={() => {
              setShowGetStarted(prev => !prev)
            }}
          />
        </div>
      )}

      {shouldMountContainer && (
        <WidgetChatContainer
          key="chat-container"
          chatbot={chatbot}
          containerStyle={containerStyle}
          chatStyle={chatStyle}
          emulatorConfig={emulatorConfig}
          isMobile={isMobile}
          isEmbed={isEmbed}
          isPreview={isPreview}
          useChatKitInRegularStyle={useChatKitInRegularStyle}
          shouldRenderChatKit={!!shouldRenderChatKit}
          effectiveDeploymentType={effectiveDeploymentType}
          handleClose={handleClose}
          isOpen={shouldShowContainer}
          onClearSession={resetChat}
        >
          {renderChatContent()}
        </WidgetChatContainer>
      )}

      {isPreview && ((chatbot as any).pwaInstallScope === 'website') && (
        <div style={{ pointerEvents: 'auto', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
          <PWAInstallBanner chatbot={chatbot} isMobile={isMobile} isPreview={isPreview} />
        </div>
      )}
    </>
  )

  return (
    <div
      className={showDeviceFrame ? 'flex items-center justify-center min-h-screen p-8' : ''}
      style={{
        position: 'relative',
        height: '100%',
        minHeight: showDeviceFrame ? '100vh' : 'auto',
        backgroundColor: isEmbed ? undefined : emulatorConfig.backgroundColor,
        backgroundImage: (!isEmbed && emulatorConfig.backgroundImage) ? `url(${emulatorConfig.backgroundImage})` : undefined,
        backgroundSize: (!isEmbed && emulatorConfig.backgroundImage) ? 'cover' : undefined,
        backgroundPosition: (!isEmbed && emulatorConfig.backgroundImage) ? 'center' : undefined,
        backgroundRepeat: (!isEmbed && emulatorConfig.backgroundImage) ? 'no-repeat' : undefined,
        pointerEvents: (isEmbed && !isOpen && !isPreview) ? 'none' : 'auto',
        isolation: isPreview ? 'isolate' : undefined,
      }}
    >
      {!isInIframe && (
        <div className="fixed top-4 right-4 flex items-center gap-2 bg-background/90 backdrop-blur-sm border rounded-md p-2 shadow-lg" style={{ zIndex: Z_INDEX.chatWidgetPreview }}>
          <Label className="text-xs whitespace-nowrap">Preview Type:</Label>
          <Select
            value={previewDeploymentType}
            onValueChange={(value: string) => {
              const deploymentType = value as 'popover' | 'fullpage' | 'popup-center'
              setPreviewDeploymentType(deploymentType)
              if (deploymentType === 'popover' || deploymentType === 'popup-center') {
                setIsOpen(false)
              } else {
                setIsOpen(true)
              }
            }}
          >
            <SelectTrigger className="h-8 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="popover">Popover</SelectItem>
              <SelectItem value="popup-center">Popup Center</SelectItem>
              <SelectItem value="fullpage">Full Page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {showDeviceFrame ? (
        <div
          className="relative shadow-2xl transition-all duration-300 ease-in-out flex flex-col overflow-hidden shrink-0"
          style={{
            width: previewDevice === 'mobile' ? '300px' : '500px',
            height: previewDevice === 'mobile' ? '600px' : '700px',
            borderRadius: previewDevice === 'mobile' ? '40px' : '32px',
            backgroundColor: '#f5f5f5',
            border: `${previewDevice === 'mobile' ? '8px' : '10px'} solid #e5e5e5`,
            transform: 'translateZ(0)',
          }}
        >
          <div
            className="h-8 w-full flex items-center justify-between px-6 text-[10px] font-bold shrink-0"
            style={{
              backgroundColor: chatbot.primaryColor || '#1e40af',
              color: '#fff',
            }}
          >
            <span>9:41</span>
            <div className="flex gap-1 items-center">
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 3L2 12h3v9h6v-6h2v6h6v-9h3L12 3z" /></svg>
              <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3c-1.65-1.66-4.34-1.66-6 0zm-4-4l2 2c2.76-2.76 7.24-2.76 10 0l2-2C15.14 9.14 8.87 9.14 5 13z" /></svg>
              <svg className="h-4 w-3" fill="currentColor" viewBox="0 0 24 24"><path d="M17 4h-3V2h-4v2H7v18h10V4zm-4 16h-2v-2h2v2z" /></svg>
            </div>
          </div>

          <div className="flex-1 w-full relative overflow-hidden bg-white">
            {chatUI}
          </div>

          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/50 rounded-full" style={{ zIndex: 60 }} />
        </div>
      ) : (
        chatUI
      )}
    </div>
  )
}
