'use client'

import { useEffect, useState } from 'react'

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [uiProtectionEnabled, setUiProtectionEnabled] = useState(false)

  useEffect(() => {
    // Fetch security settings on mount
    fetch('/api/settings')
      .then(res => {
        if (!res.ok) {
          throw new Error(`Failed to fetch settings: ${res.status} ${res.statusText}`)
        }
        return res.json()
      })
      .then(data => {
        // Fix: Properly parse boolean strings if they exist
        const isEnabled = data.uiProtectionEnabled === true || 
                          data.uiProtectionEnabled === 'true' ||
                          (data.disableRightClick === true || data.disableRightClick === 'true')
        
        if (isEnabled) {
          setUiProtectionEnabled(true)
        }
      })
      .catch(err => {
        // If it's a SyntaxError, it likely means we got HTML instead of JSON
        if (err instanceof SyntaxError) {
          console.error('Error parsing security settings JSON (likely received HTML):', err)
        } else {
          console.error('Error fetching security settings:', err)
        }
      })
  }, [])

  useEffect(() => {
    if (uiProtectionEnabled) {
      const handleContextMenu = (e: MouseEvent) => {
        e.preventDefault()
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        // Block F12
        if (e.key === 'F12') {
          e.preventDefault()
        }
        // Block Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (DevTools)
        if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'I'.toLowerCase() || e.key === 'J' || e.key === 'J'.toLowerCase() || e.key === 'C' || e.key === 'C'.toLowerCase())) {
          e.preventDefault()
        }
        // Block Ctrl+U (View Source)
        if (e.ctrlKey && (e.key === 'u' || e.key === 'U')) {
          e.preventDefault()
        }
      }
      
      document.addEventListener('contextmenu', handleContextMenu)
      document.addEventListener('keydown', handleKeyDown)
      
      return () => {
        document.removeEventListener('contextmenu', handleContextMenu)
        document.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [uiProtectionEnabled])

  return <>{children}</>
}
