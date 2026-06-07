import { useEffect, useLayoutEffect, useRef, useState } from 'react'

interface UseChatPageEnvironmentParams {
  isEmbed: boolean
  isPreview: boolean
  parentWidthParam: string | null
  previewDevice: string | null
  showGetStarted: boolean
  setShowGetStarted: (show: boolean) => void
}

export function useChatPageEnvironment({
  isEmbed,
  isPreview,
  parentWidthParam,
  previewDevice,
  showGetStarted,
  setShowGetStarted,
}: UseChatPageEnvironmentParams) {
  const [isInIframe, setIsInIframe] = useState(isEmbed)
  const [isMobile, setIsMobile] = useState(false)
  const isMobileRef = useRef(false)
  const latestParentWidthRef = useRef<number | null>(null)

  useEffect(() => {
    const checkMobile = () => {
      if (isPreview && previewDevice) {
        const mobile = previewDevice === 'mobile' || previewDevice === 'tablet'
        setIsMobile(mobile)
        isMobileRef.current = mobile
        return
      }

      let width: number
      if (isEmbed && !isPreview) {
        const latestPw = latestParentWidthRef.current
        const initialPw = parentWidthParam !== null ? parseInt(parentWidthParam, 10) : NaN
        width = latestPw !== null && !isNaN(latestPw)
          ? latestPw
          : (!isNaN(initialPw) ? initialPw : window.screen.width)
      } else {
        width = window.innerWidth
      }

      const mobile = width < 1024
      setIsMobile(mobile)
      isMobileRef.current = mobile
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [isEmbed, isPreview, parentWidthParam, previewDevice])

  useEffect(() => {
    if (isMobile && showGetStarted) {
      setShowGetStarted(false)
    }
  }, [isMobile, showGetStarted, setShowGetStarted])

  useEffect(() => {
    setIsInIframe(window.self !== window.top)
  }, [])

  useLayoutEffect(() => {
    document.documentElement.style.removeProperty('color-scheme')
    if (isEmbed) {
      document.documentElement.classList.add('chat-embed-mode')
      document.documentElement.style.backgroundColor = 'transparent'
    } else {
      document.documentElement.classList.remove('chat-embed-mode')
      document.documentElement.style.backgroundColor = ''
    }
    return () => {
      document.documentElement.classList.remove('chat-embed-mode')
      document.documentElement.style.backgroundColor = ''
    }
  }, [isEmbed])

  return {
    isInIframe,
    setIsInIframe,
    isMobile,
    setIsMobile,
    isMobileRef,
    latestParentWidthRef,
  }
}
