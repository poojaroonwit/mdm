import { Z_INDEX } from '@/lib/z-index'

export function buildEmbedPopoverBehaviorScript() {
  return `
    // Calculate chat window position based on widget position and popover position preference
    var chatWindowPosition = '';
    var baseChatTransform = '';
    var popoverPos = widgetConfig.popoverPosition || 'left';
    var offsetX = formatDim(widgetConfig.offsetX);
    var offsetY = formatDim(widgetConfig.offsetY);
    
    // Parse widget size to get numeric value for calculations
    var widgetSizePx = parseFloat(widgetConfig.size) || 60;
    if (typeof widgetConfig.size === 'string' && widgetConfig.size.includes('px')) {
      widgetSizePx = parseFloat(widgetConfig.size);
    }
    
    // Parse popover margin to get numeric value
    var popoverMarginPx = parseFloat(widgetConfig.popoverMargin) || 10;
    if (typeof widgetConfig.popoverMargin === 'string' && widgetConfig.popoverMargin.includes('px')) {
      popoverMarginPx = parseFloat(widgetConfig.popoverMargin);
    }
    
    // Match positioning logic from chatStyling.ts (Emulator) to ensure consistency
    if (popoverPos === 'top') {
      // Position popover above the widget button (Stacked)
      if (widgetConfig.position === 'bottom-right') {
        chatWindowPosition = 'bottom: calc(' + offsetY + ' + ' + widgetSizePx + 'px + ' + popoverMarginPx + 'px); right: ' + offsetX + ';';
      } else if (widgetConfig.position === 'bottom-left') {
        chatWindowPosition = 'bottom: calc(' + offsetY + ' + ' + widgetSizePx + 'px + ' + popoverMarginPx + 'px); left: ' + offsetX + ';';
      } else if (widgetConfig.position === 'top-right') {
        chatWindowPosition = 'top: calc(' + offsetY + ' + ' + widgetSizePx + 'px + ' + popoverMarginPx + 'px); right: ' + offsetX + ';';
      } else if (widgetConfig.position === 'top-left') {
        chatWindowPosition = 'top: calc(' + offsetY + ' + ' + widgetSizePx + 'px + ' + popoverMarginPx + 'px); left: ' + offsetX + ';';
      } else if (widgetConfig.position === 'bottom-center') {
        chatWindowPosition = 'bottom: calc(' + offsetY + ' + ' + widgetSizePx + 'px + ' + popoverMarginPx + 'px); left: 50%;';
        baseChatTransform = 'translateX(-50%)';
      } else if (widgetConfig.position === 'top-center') {
        chatWindowPosition = 'top: calc(' + offsetY + ' + ' + widgetSizePx + 'px + ' + popoverMarginPx + 'px); left: 50%;';
        baseChatTransform = 'translateX(-50%)';
      }
    } else {
      // Position popover to the left/right of widget button (Side-by-Side)
      if (widgetConfig.position === 'bottom-right') {
        chatWindowPosition = 'bottom: ' + offsetY + '; right: calc(' + offsetX + ' + ' + widgetSizePx + 'px + ' + popoverMarginPx + 'px);';
      } else if (widgetConfig.position === 'bottom-left') {
        chatWindowPosition = 'bottom: ' + offsetY + '; left: calc(' + offsetX + ' + ' + widgetSizePx + 'px + ' + popoverMarginPx + 'px);';
      } else if (widgetConfig.position === 'top-right') {
        chatWindowPosition = 'top: ' + offsetY + '; right: calc(' + offsetX + ' + ' + widgetSizePx + 'px + ' + popoverMarginPx + 'px);';
      } else if (widgetConfig.position === 'top-left') {
        chatWindowPosition = 'top: ' + offsetY + '; left: calc(' + offsetX + ' + ' + widgetSizePx + 'px + ' + popoverMarginPx + 'px);';
      } else if (widgetConfig.position === 'bottom-center') {
        chatWindowPosition = 'bottom: ' + offsetY + '; left: calc(50% + ' + (widgetSizePx / 2) + 'px + ' + popoverMarginPx + 'px);';
        baseChatTransform = 'translateX(0)';
      } else if (widgetConfig.position === 'top-center') {
        chatWindowPosition = 'top: ' + offsetY + '; left: calc(50% + ' + (widgetSizePx / 2) + 'px + ' + popoverMarginPx + 'px);';
        baseChatTransform = 'translateX(0)';
      }
    }
    
    // Detect mobile
    var isMobile = window.innerWidth <= 768;
    
    // Sizing and responsive position
    var chatWindowWidth = isMobile ? '100vw' : formatDim(widgetConfig.chatWidth);
    var chatWindowHeight = isMobile ? '100vh' : formatDim(widgetConfig.chatHeight);
    var chatWindowPositionMobile = isMobile ? 'top: 0; left: 0; right: 0; bottom: 0;' : chatWindowPosition;
    var currentBaseChatTransform = isMobile ? 'none' : baseChatTransform;
    
    // Helper for granular border radius
    function getGranularRadius(all, tl, tr, br, bl, defaultVal) {
      if (tl || tr || br || bl) {
        return (tl || all || defaultVal || '0') + ' ' + (tr || all || defaultVal || '0') + ' ' + (br || all || defaultVal || '0') + ' ' + (bl || all || defaultVal || '0');
      }
      return all || defaultVal;
    }

    var chatWindowBorderRadius = isMobile ? '0' : getGranularRadius(
      chatKitBorderRadius || chatbot.chatWindowBorderRadius || chatbot.borderRadius,
      chatbot.chatWindowBorderRadiusTopLeft,
      chatbot.chatWindowBorderRadiusTopRight,
      chatbot.chatWindowBorderRadiusBottomRight,
      chatbot.chatWindowBorderRadiusBottomLeft,
      '8px'
    );
    
    // Styling variables for the chat window
    var chatWindowShadowColor = chatbot.chatWindowShadowColor || chatbot.shadowColor || '#000000';
    var chatWindowShadowBlur = chatbot.chatWindowShadowBlur || chatbot.shadowBlur || '4px';
    var chatBgColor = chatKitBgColor || chatbot.messageBoxColor || '#ffffff';
    var chatBgStyle = '';
    if (widgetConfig.chatBlur > 0) {
      chatBgStyle += 'backdrop-filter: blur(' + widgetConfig.chatBlur + 'px); -webkit-backdrop-filter: blur(' + widgetConfig.chatBlur + 'px); ';
    }
    if (widgetConfig.chatOpacity < 100) {
      chatBgStyle += 'background-color: rgba(' + hexToRgb(chatBgColor) + ', ' + (widgetConfig.chatOpacity / 100) + '); ';
    } else {
      chatBgStyle += 'background-color: ' + chatBgColor + '; ';
    }
    
    var borderWidth = chatbot.chatWindowBorderWidth || chatbot.borderWidth || '1px';
    var borderColor = chatbot.chatWindowBorderColor || chatbot.borderColor || '#e5e7eb';
    
    // Create chat window
    var chatWindow = document.createElement('div');
    chatWindow.id = 'chatbot-window-' + chatbotId;
    // Fix: Add pointer-events: auto
    chatWindow.style.cssText = 'position: fixed; ' + chatWindowPositionMobile + ' width: ' + chatWindowWidth + '; height: ' + chatWindowHeight + '; ' + chatBgStyle + 'border-radius: ' + chatWindowBorderRadius + '; box-shadow: 0 0 ' + chatWindowShadowBlur + ' ' + chatWindowShadowColor + '; border: ' + borderWidth + ' solid ' + borderColor + '; font-family: ' + (chatKitFontFamily || chatbot.fontFamily || 'Inter') + '; font-size: ' + (chatKitFontSize || chatbot.fontSize || '14px') + '; color: ' + (chatKitTextColor || chatbot.fontColor || '#000000') + '; display: none; flex-direction: column; z-index: ' + (widgetConfig.zIndex >= ${Z_INDEX.chatWidget} ? widgetConfig.zIndex + 1 : ${Z_INDEX.chatWidgetWindow}) + '; transition: opacity 0.3s ease, transform 0.3s ease; opacity: 0; transform: ' + (currentBaseChatTransform !== 'none' ? currentBaseChatTransform + ' scale(0.9)' : (isMobile ? 'translateY(20px)' : 'scale(0.9)')) + '; pointer-events: auto;';
    
    // Event listener for closing the chat via postMessage from the iframe
    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'close-chat') {
        closeChat();
      }
    });

    // Create iframe for chat
    var iframe = document.createElement('iframe');
    iframe.src = serverOrigin + '/chat/' + chatbotId + '?mode=embed&type=' + type;
    iframe.style.cssText = 'width: 100%; flex: 1; border: none; border-radius: ' + chatWindowBorderRadius + '; background: transparent;';
    iframe.style.border = 'none';
    iframe.setAttribute('allowTransparency', 'true');
    iframe.allow = 'microphone; clipboard-write';
    
    // PWA Separate Iframe Logic (Host Website scope)
    // FIXED: Use screen.width instead of window.innerWidth to detect actual device size
    // window.innerWidth can be deceiving when the script loads before the page is fully laid out
    // or when the parent page has specific styling/viewports
    var screenWidth = window.screen ? window.screen.width : window.innerWidth;
    var isMobileOrTablet = screenWidth <= 1024;
    
    // Additional check using touch capability and user agent as fallback
    var hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    var isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Consider device mobile if screen width is small OR it has touch + mobile UA
    isMobileOrTablet = isMobileOrTablet || (hasTouchScreen && isMobileUA);
    
    var pwaIframe = null;
    var pwaEnabled = chatbot.pwaEnabled || false;
    var isWebsiteOverlayScope = (chatbot.pwaInstallScope === 'website') && isMobileOrTablet;
    
    console.log('[Chatbot] PWA Check:', { pwaEnabled: pwaEnabled, scope: chatbot.pwaInstallScope, isMobileOrTablet: isMobileOrTablet });

    if (pwaEnabled && isWebsiteOverlayScope) {
      var pwaDismissedKey = 'pwa_dismissed_' + chatbotId;
      var pwaDismissed = false;
      try {
        pwaDismissed = localStorage.getItem(pwaDismissedKey) === 'true';
      } catch (e) {}
      
      var isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
      
      console.log('[Chatbot] PWA Banner Conditions:', { dismissed: pwaDismissed, standalone: isStandalone });

      if (!pwaDismissed && !isStandalone) {
        console.log('[Chatbot] Creating PWA Iframe...');
        pwaIframe = document.createElement('iframe');
        pwaIframe.id = 'chatbot-pwa-iframe-' + chatbotId;
        pwaIframe.src = serverOrigin + '/chat/' + chatbotId + '?mode=pwa-only&id=' + chatbotId;
        pwaIframe.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; width: 100%; height: 120px; border: none; z-index: 999999; background: transparent; pointer-events: auto; transition: opacity 0.3s;';
        
        if (document.body) {
           document.body.appendChild(pwaIframe);
        } else {
           window.addEventListener('DOMContentLoaded', function() { document.body.appendChild(pwaIframe); });
        }
      }
    }

    chatWindow.appendChild(iframe);
    
    // Create overlay element
    var overlay = null;
    if (widgetConfig.overlayEnabled) {
      overlay = document.createElement('div');
      overlay.id = 'chatbot-overlay-' + chatbotId;
      var overlayBgColor = widgetConfig.overlayColor;
      var overlayBgStyle = '';
      if (widgetConfig.overlayBlur > 0) {
        overlayBgStyle += 'backdrop-filter: blur(' + widgetConfig.overlayBlur + 'px); -webkit-backdrop-filter: blur(' + widgetConfig.overlayBlur + 'px); ';
      }
      if (overlayBgColor.startsWith('rgba') || overlayBgColor.startsWith('rgb')) {
        // Extract RGB values and apply new opacity
        var rgbMatch = overlayBgColor.match(/(\d+),\s*(\d+),\s*(\d+)/);
        if (rgbMatch) {
          overlayBgStyle += 'background-color: rgba(' + rgbMatch[1] + ', ' + rgbMatch[2] + ', ' + rgbMatch[3] + ', ' + (widgetConfig.overlayOpacity / 100) + '); ';
        } else {
          // If we can't parse, use the color as-is (might already have opacity)
          overlayBgStyle += 'background-color: ' + overlayBgColor + '; ';
        }
      } else {
        // Convert hex to rgba
        overlayBgStyle += 'background-color: rgba(' + hexToRgb(overlayBgColor) + ', ' + (widgetConfig.overlayOpacity / 100) + '); ';
      }
      overlay.style.cssText = 'position: fixed; inset: 0; ' + overlayBgStyle + 'z-index: ' + (widgetConfig.zIndex >= ${Z_INDEX.chatWidget} ? widgetConfig.zIndex - 1 : ${Z_INDEX.chatWidgetOverlay}) + '; display: none; pointer-events: auto;';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.onclick = function() { closeChat(); };
    }
    
    // Append to document
    widgetContainer.appendChild(buttonContainer);
    if (overlay) {
      widgetContainer.appendChild(overlay);
    }
    widgetContainer.appendChild(chatWindow);
    
    // Event listener for closing the PWA banner
    window.addEventListener('message', function(event) {
      if (event.data && event.data.type === 'close-pwa-banner') {
        if (pwaIframe) {
          pwaIframe.remove();
          try {
            localStorage.setItem('pwa_dismissed_' + chatbotId, 'true');
          } catch (err) {}
        }
      }
    });
    
    // Auto-show with delay
    if (widgetConfig.autoShow) {
      setTimeout(function() {
        buttonContainer.style.display = 'flex';
      }, widgetConfig.autoShowDelay * 1000);
    }

    
    var isOpen = false;
    var originalButtonHTML = button.innerHTML;
    
    function openChat() {
      isOpen = true;
      chatWindow.style.display = 'flex';
      button.setAttribute('aria-expanded', 'true');
      
      // Show overlay if enabled
      if (overlay && widgetConfig.overlayEnabled) {
        overlay.style.display = 'block';
      }
      
      // Prevent body scroll on mobile when chat is open
      if (isMobile) {
        document.body.style.overflow = 'hidden';
        // HIDE launcher button on mobile to avoid overlap/clutter (internal header has close button)
        buttonContainer.style.display = 'none';
      } else {
        // Change button to close icon on desktop
        button.innerHTML = closeIconSvg || '✕';
      }

      setTimeout(function() {
        chatWindow.style.opacity = '1';
        chatWindow.style.transform = isMobile ? 'translateY(0)' : (currentBaseChatTransform !== 'none' ? currentBaseChatTransform + ' scale(1)' : 'scale(1)');
      }, 10);
      
      // Hide badge when chat is open
      if (widgetConfig.showBadge) {
        var badge = document.getElementById('chatbot-badge-' + chatbotId);
        if (badge) badge.style.display = 'none';
      }
      // Tell the iframe to open its chat content
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'open-chat' }, '*');
      }
      // Focus management
      setTimeout(function() {
        iframe.focus();
      }, 100);
    }

    function closeChat() {
      isOpen = false;
      button.setAttribute('aria-expanded', 'false');
      // Tell the iframe to close its chat content
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'close-chat' }, '*');
      }
      
      // Hide overlay if enabled
      if (overlay && widgetConfig.overlayEnabled) {
        overlay.style.display = 'none';
      }
      
      // Restore body scroll
      document.body.style.overflow = '';
      
      // Restore launcher button if it was hidden (mobile)
      if (isMobile) {
        buttonContainer.style.display = 'flex';
      }
      button.innerHTML = originalButtonHTML;

      chatWindow.style.opacity = '0';
      chatWindow.style.transform = isMobile ? 'translateY(20px)' : (currentBaseChatTransform !== 'none' ? currentBaseChatTransform + ' scale(0.9)' : 'scale(0.9)');
      setTimeout(function() {
        chatWindow.style.display = 'none';
      }, 300);
      
      // Return focus to button
      setTimeout(function() {
        button.focus();
      }, 350);
    }
    
    button.onclick = function() {
      if (isOpen) {
        closeChat();
      } else {
        openChat();
      }
    };

    // Expose control functions globally
    window['openChatbot_' + chatbotId] = function() { openChat(); };
    window['closeChatbot_' + chatbotId] = function() { closeChat(); };
    
    
    // Close on outside click (only if not mobile, or if mobile and clicked outside)
    document.addEventListener('click', function(e) {
      if (isOpen && !chatWindow.contains(e.target) && !buttonContainer.contains(e.target)) {
        if (!isMobile || (isMobile && e.target === chatWindow)) {
          closeChat();
        }
      }
    });
    
    // Close on ESC key
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isOpen) {
        closeChat();
      }
    });
    
    // Handle window resize for mobile
    var resizeTimer;
    window.addEventListener('resize', function() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function() {
        var wasMobile = isMobile;
        isMobile = window.innerWidth <= 768;
        if (wasMobile !== isMobile && isOpen) {
          // Update chat window size on resize
          chatWindow.style.width = isMobile ? '100vw' : widgetConfig.chatWidth;
          chatWindow.style.height = isMobile ? '100vh' : widgetConfig.chatHeight;
          chatWindow.style.borderRadius = isMobile ? '0' : (chatbot.borderRadius || '8px');
          if (isMobile) {
            chatWindow.style.top = '0';
            chatWindow.style.left = '0';
            chatWindow.style.right = '0';
            chatWindow.style.bottom = '0';
            chatWindow.style.transform = 'none';
          } else {
            chatWindow.style.cssText = chatWindow.style.cssText.replace(/top:[^;]+;|left:[^;]+;|right:[^;]+;|bottom:[^;]+;/g, '');
            chatWindow.style.cssText += chatWindowPosition;
          }
        }
      }, 100);
    });
    
    // Cleanup on page unload
    window.addEventListener('beforeunload', function() {
      if (isOpen) {
        document.body.style.overflow = '';
      }
    });
    }
`
}
