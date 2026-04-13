import { NextRequest, NextResponse } from 'next/server'
import { Z_INDEX } from '@/lib/z-index'
import { db } from '@/lib/db'
import { mergeVersionConfig, sanitizeChatbotConfig, validateDomain } from '@/lib/chatbot-helper'
// import { renderToStaticMarkup } from 'react-dom/server'
import * as Icons from 'lucide-react'
import React from 'react'

export async function GET(request: NextRequest) {
  // Dynamically import renderToStaticMarkup to avoid build errors with Next.js Edge/Server boundary checks
  const { renderToStaticMarkup } = await import('react-dom/server')

  const searchParams = request.nextUrl.searchParams
  const chatbotId = searchParams.get('id')
  const type = searchParams.get('type') || 'popover'

  if (!chatbotId) {
    return new NextResponse("Missing chatbot ID", { status: 400 })
  }

  try {
    // Fetch chatbot configuration server-side (including versions for merged config)
    const rawChatbot = await db.chatbot.findFirst({
      where: { 
        id: chatbotId,
        deletedAt: null
      },
      include: {
        versions: {
          where: { isPublished: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    })

    if (!rawChatbot) {
      return new NextResponse("Chatbot not found", { status: 404 })
    }

    // Merge version config into chatbot object (this includes chatkitOptions, widgetBackgroundColor, etc.)
    const chatbot = await sanitizeChatbotConfig(mergeVersionConfig(rawChatbot))

    // Generate Icon SVG if needed
    let iconSvg = ''
    if (chatbot.avatarType !== 'image') {
      const IconName = (chatbot.avatarIcon || 'Bot') as keyof typeof Icons
      // @ts-ignore - Dynamic access to icons
      const IconComponent = Icons[IconName] || Icons.Bot
      const iconColor = chatbot.avatarIconColor || '#ffffff'
      // Render SVG with white color (or configured color) as it usually appears on a colored button
      // forcing white for the button icon usually looks best on colored backgrounds, 
      // but ChatPage uses avatarIconColor. We'll use the configured color.
      iconSvg = renderToStaticMarkup(React.createElement(IconComponent as any, {
        size: 24,
        color: iconColor,
        strokeWidth: 2
      }))
    }

    // Render Close Icon (X) server-side to match emulator style
    const closeIconColor = chatbot.avatarIconColor || '#ffffff'
    const closeIconSvg = renderToStaticMarkup(React.createElement(Icons.X, {
      size: 24,
      color: closeIconColor,
      strokeWidth: 2
    }))

    // SECURITY: Domain Whitelisting
    const domainValidation = validateDomain(chatbot, request)
    if (!domainValidation.allowed) {
      console.warn(`[Embed API] ${domainValidation.error}`)
      return new NextResponse(`console.error("[Chatbot Error] ${domainValidation.error}");`, {
        headers: { 'Content-Type': 'application/javascript' }
      })
    }

    // Check if chatbot is enabled (default to true if not set)
    const chatbotEnabled = chatbot.chatbotEnabled !== false
    if (!chatbotEnabled) {
      console.log(`[Embed API] Chatbot ${chatbotId} is disabled`)
      // Return an empty script that does nothing
      return new NextResponse(`/* Chatbot is disabled */`, {
        headers: { 
          'Content-Type': 'application/javascript',
          'Cache-Control': 'no-store, max-age=0',
        }
      })
    }

    // Get the origin from the request (this is the MDM server origin)
    const serverOrigin = request.nextUrl.origin

    const script = `
(function() {
  var chatbotId = '${chatbotId}';
  var type = '${type}';
  
  // Try to determine origin dynamically from the script source
  // This handles cases where the server is behind a proxy or accessed via a different hostname
  var scriptUrl = document.currentScript ? document.currentScript.src : null;
  if (!scriptUrl) {
    // Fallback for async injected scripts (document.currentScript is null for them)
    // We look for a script tag that matches our endpoint and chatbot ID
    var scripts = document.querySelectorAll('script[src*="/api/embed"], script[src*="/chat-handler/embed"], script[src*="/chat-api/embed"]');
    for (var i = 0; i < scripts.length; i++) {
      if (scripts[i].src.indexOf(chatbotId) !== -1) {
        scriptUrl = scripts[i].src;
        break;
      }
    }
  }
  
  var dynamicOrigin = scriptUrl ? new URL(scriptUrl).origin : null;
  // Fallback to server-detected origin
  var serverOrigin = dynamicOrigin || '${serverOrigin}';
  
  console.log('[Chatbot] Initializing widget for:', chatbotId);
  console.log('[Chatbot] Server origin:', serverOrigin);
  if (dynamicOrigin) {
    console.log('[Chatbot] Detected origin from script:', dynamicOrigin);
  } else {
    console.log('[Chatbot] Using fallback server origin');
  }

  // Prevent multiple instances
  if (window['chatbotLoaded_' + chatbotId]) {
    console.warn('[Chatbot] Widget already loaded');
    return;
  }
  window['chatbotLoaded_' + chatbotId] = true;
  
  // Inject server-fetched config directly
  var chatbot = ${JSON.stringify(chatbot)};
  var iconSvg = ${JSON.stringify(iconSvg)};
  var closeIconSvg = ${JSON.stringify(closeIconSvg)};

  if (!chatbot) {
    console.error('Chatbot config missing');
    return;
  }

  // Rewrite any image URLs that point to /api/assets to use the dynamic serverOrigin.
  // The baked-in URLs use NEXTAUTH_URL as base (which may be localhost or an internal IP).
  // serverOrigin is detected from the script tag src, so it's always correct for the browser.
  function fixImageUrl(url) {
    if (!url || typeof url !== 'string') return url;
    if (url.indexOf('/api/assets') !== -1) {
      try {
        var parsed = new URL(url);
        return serverOrigin + parsed.pathname + parsed.search;
      } catch(e) {}
    }
    if (url.charAt(0) === '/') return serverOrigin + url;
    return url;
  }
  var _imgFields = ['widgetAvatarImageUrl','avatarImageUrl','widgetCloseImageUrl','headerLogo','headerAvatarImageUrl','logo'];
  for (var _f = 0; _f < _imgFields.length; _f++) {
    if (chatbot[_imgFields[_f]]) chatbot[_imgFields[_f]] = fixImageUrl(chatbot[_imgFields[_f]]);
  }

  // Legacy load check (keep for compatibility if needed, but we have config now)
  console.log('[Chatbot] Config loaded server-side for:', chatbotId);
  
    if (type === 'popover') {
    // Create popover widget (Facebook Messenger style)
    var widgetContainer = document.getElementById('chatbot-widget-' + chatbotId);
    if (!widgetContainer) {
      widgetContainer = document.createElement('div');
      widgetContainer.id = 'chatbot-widget-' + chatbotId;
      widgetContainer.setAttribute('aria-label', 'Chat widget');
      // Fix: Ensure container doesn't block clicks on the page
      widgetContainer.style.cssText = 'position: fixed; bottom: 0; right: 0; width: 0; height: 0; pointer-events: none; overflow: visible; z-index: 99999;';
      document.body.appendChild(widgetContainer);
    }
    
    // Get widget configuration - use config values only, no hardcoded defaults
    // For ChatKit, use theme accent color if available
    var isChatKit = chatbot.engineType === 'chatkit';
    var ckTheme = (isChatKit && chatbot.chatkitOptions && chatbot.chatkitOptions.theme) || {};
    var ckColor = ckTheme.color || {};
    var ckAccent = ckColor.accent || {};
    var ckTypography = ckTheme.typography || {};
    
    var chatKitAccentColor = isChatKit && (ckAccent.primary || ckTheme.primaryColor) 
      ? (ckAccent.primary || ckTheme.primaryColor)
      : null;
      
    var chatKitBorderColor = isChatKit && (ckColor.border || ckTheme.borderColor) 
      ? (ckColor.border || ckTheme.borderColor)
      : null;

    var chatKitIconColor = isChatKit && (ckAccent.icon || ckTheme.iconColor)
      ? (ckAccent.icon || ckTheme.iconColor)
      : null;
      
    var chatKitBgColor = isChatKit && (ckColor.background || ckTheme.backgroundColor) 
      ? (ckColor.background || ckTheme.backgroundColor)
      : null;
      
    var chatKitTextColor = isChatKit && (ckColor.text || ckTheme.textColor) 
      ? (ckColor.text || ckTheme.textColor)
      : null;
      
    var chatKitFontFamily = isChatKit && (ckTypography.fontFamily || ckTheme.fontFamily) 
      ? (ckTypography.fontFamily || ckTheme.fontFamily)
      : null;
      
    var chatKitFontSize = isChatKit && (ckTypography.fontSize || ckTheme.fontSize) 
      ? (ckTypography.fontSize || ckTheme.fontSize)
      : null;
    
    var chatKitBorderRadius = isChatKit && (ckTheme.radius || ckTheme.borderRadius) 
      ? (ckTheme.radius || ckTheme.borderRadius)
      : null;

    // Determine default borderRadius based on avatarStyle
    // For circle style, always use 50% regardless of widgetBorderRadius setting
    var defaultBorderRadiusForConfig = chatbot.widgetAvatarStyle === 'circle'
      ? '50%'
      : chatbot.widgetAvatarStyle === 'rounded-diagonal'
        ? '30px 0px 30px 0px'
        : chatbot.widgetAvatarStyle === 'square'
          ? (chatbot.widgetBorderRadius || '8px')
          : (chatbot.widgetBorderRadius || '50%');
    
    var widgetConfig = {
      avatarStyle: chatbot.widgetAvatarStyle || 'circle',
      avatarType: chatbot.widgetAvatarType || chatbot.avatarType || 'icon',
      avatarImageUrl: chatbot.widgetAvatarImageUrl || chatbot.avatarImageUrl || '',
      avatarIcon: chatbot.widgetAvatarIcon || chatbot.avatarIcon || 'Bot',
      avatarIconColor: chatbot.avatarIconColor || chatKitIconColor || '#ffffff',
      position: chatbot.widgetPosition || 'bottom-right',
      size: chatbot.widgetSize || '60px',
      backgroundColor: chatbot.widgetBackgroundColor || chatKitAccentColor || chatbot.primaryColor,
      borderColor: chatKitBorderColor || chatbot.widgetBorderColor || 'transparent',
      borderWidth: chatbot.widgetBorderWidth || '0px',
      borderRadius: defaultBorderRadiusForConfig,
      shadowColor: chatbot.widgetShadowColor || 'rgba(0,0,0,0.2)',
      shadowBlur: chatbot.widgetShadowBlur || '0px',
      shadowX: chatbot.widgetShadowX || '0px',
      shadowY: chatbot.widgetShadowY || '0px',
      shadowSpread: chatbot.widgetShadowSpread || '0px',
      labelText: chatbot.widgetLabelText || 'Chat',
      labelColor: chatbot.widgetLabelColor || '#ffffff',
      logo: chatbot.logo,
      animation: chatbot.widgetAnimation || 'scale',
      autoShow: chatbot.widgetAutoShow !== undefined ? chatbot.widgetAutoShow : true,
      autoShowDelay: chatbot.widgetAutoShowDelay || 0,
      offsetX: chatbot.widgetOffsetX || '20px',
      offsetY: chatbot.widgetOffsetY || '20px',
      zIndex: chatbot.widgetZIndex || 99999,
      showBadge: chatbot.showNotificationBadge,
      badgeColor: chatbot.notificationBadgeColor || '#ff0000',
      chatWidth: chatbot.chatWindowWidth || '380px',
      chatHeight: chatbot.chatWindowHeight || '600px',
      popoverPosition: chatbot.popoverPosition || 'top',
      popoverMargin: chatbot.widgetPopoverMargin || '10px',
      widgetBlur: chatbot.widgetBackgroundBlur || 0,
      widgetOpacity: chatbot.widgetBackgroundOpacity !== undefined ? chatbot.widgetBackgroundOpacity : 100,
      chatBlur: chatbot.chatWindowBackgroundBlur || 0,
      chatOpacity: chatbot.chatWindowBackgroundOpacity !== undefined ? chatbot.chatWindowBackgroundOpacity : 100,
      overlayEnabled: chatbot.overlayEnabled || false,
      overlayColor: chatbot.overlayColor || '#000000',
      overlayOpacity: chatbot.overlayOpacity !== undefined ? chatbot.overlayOpacity : 50,
      overlayBlur: chatbot.overlayBlur || 0
    };
    
    // Add animation keyframes
    if (widgetConfig.animation !== 'none') {
      var style = document.createElement('style');
      style.textContent = '@keyframes fadeIn { to { opacity: 1; } } @keyframes slideIn { to { transform: translateY(0); opacity: 1; } } @keyframes bounceIn { 0% { transform: scale(0.3); opacity: 0; } 50% { transform: scale(1.05); } 70% { transform: scale(0.9); } 100% { transform: scale(1); opacity: 1; } }';
      document.head.appendChild(style);
    }
    
    // Inject Google Font if specified
    var fontFamily = chatKitFontFamily || chatbot.fontFamily;
    if (fontFamily && fontFamily !== 'Inter' && fontFamily !== 'sans-serif' && fontFamily !== 'serif' && fontFamily !== 'monospace') {
      var link = document.createElement('link');
      link.href = 'https://fonts.googleapis.com/css2?family=' + fontFamily.replace(/ /g, '+') + ':wght@400;500;600;700&display=swap';
      link.rel = 'stylesheet';
      document.head.appendChild(link);
    }
    
    // Helper to ensure dimensions have units
    function formatDim(val) {
      if (!val) return '0px';
      var s = val.toString();
      if (s.match(/^-?\\d+$/)) return s + 'px';
      return s;
    }

    // Calculate position with custom offsets
    var positionStyle = '';
    var baseWidgetTransform = '';
    var offsetX = formatDim(widgetConfig.offsetX);
    var offsetY = formatDim(widgetConfig.offsetY);
    
    if (widgetConfig.position === 'bottom-right') {
      positionStyle = 'bottom: ' + offsetY + '; right: ' + offsetX + ';';
    } else if (widgetConfig.position === 'bottom-left') {
      positionStyle = 'bottom: ' + offsetY + '; left: ' + offsetX + ';';
    } else if (widgetConfig.position === 'top-right') {
      positionStyle = 'top: ' + offsetY + '; right: ' + offsetX + ';';
    } else if (widgetConfig.position === 'top-left') {
      positionStyle = 'top: ' + offsetY + '; left: ' + offsetX + ';';
    } else if (widgetConfig.position === 'bottom-center') {
      positionStyle = 'bottom: ' + offsetY + '; left: 50%;';
      baseWidgetTransform = 'translateX(-50%)';
    } else if (widgetConfig.position === 'top-center') {
      positionStyle = 'top: ' + offsetY + '; left: 50%;';
      baseWidgetTransform = 'translateX(-50%)';
    }
    
    // Determine border radius based on avatar style and granular props
    // For circle style, always use 50% regardless of widgetBorderRadius setting
    var defaultBorderRadius = widgetConfig.avatarStyle === 'circle' ? '50%' 
      : widgetConfig.avatarStyle === 'square' ? '8px' 
      : '50%'; // circle-with-label defaults to 50%
    
    // Only use widgetConfig.borderRadius if avatarStyle is not 'circle'
    var baseBorderRadius = widgetConfig.avatarStyle === 'circle' 
      ? '50%' 
      : (widgetConfig.borderRadius || defaultBorderRadius);
    
    var avatarBorderRadius = getGranularRadius(
      baseBorderRadius,
      chatbot.widgetBorderRadiusTopLeft,
      chatbot.widgetBorderRadiusTopRight,
      chatbot.widgetBorderRadiusBottomRight,
      chatbot.widgetBorderRadiusBottomLeft,
      defaultBorderRadius
    );
    
    // Animation styles
    var animationStyle = '';
    if (widgetConfig.animation === 'fade') {
      animationStyle = 'opacity: 0; animation: fadeIn 0.5s ease-in forwards;';
    } else if (widgetConfig.animation === 'slide') {
      animationStyle = 'transform: translateY(' + (widgetConfig.position.indexOf('bottom') !== -1 ? '20px' : '-20px') + '); opacity: 0; animation: slideIn 0.5s ease-out forwards;';
    } else if (widgetConfig.animation === 'bounce') {
      animationStyle = 'opacity: 0; animation: bounceIn 0.6s ease-out forwards;';
    }
    
    // Create floating button/container
    var buttonContainer = document.createElement('div');
    buttonContainer.id = 'chatbot-button-container-' + chatbotId;
    // Fix: Add pointer-events: none to container so the empty space doesn't block clicks
    buttonContainer.style.cssText = 'position: fixed; ' + positionStyle + ' z-index: ' + widgetConfig.zIndex + '; display: ' + (widgetConfig.autoShow && (!widgetConfig.autoShowDelay || widgetConfig.autoShowDelay <= 0) ? 'flex' : 'none') + '; flex-direction: column; align-items: center; gap: 8px; ' + animationStyle + ' pointer-events: none;';
    
    var button = document.createElement('button');
    button.id = 'chatbot-button-' + chatbotId;
    button.setAttribute('aria-label', 'Open chat');
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('type', 'button');
    // Fix: pointer-events: auto for the actual button
    button.style.pointerEvents = 'auto';
    
    // Helper function to convert hex to RGB
    function hexToRgb(hex) {
      hex = hex.replace('#', '');
      if (hex.length === 3) {
        hex = hex.split('').map(function(char) { return char + char; }).join('');
      }
      var r = parseInt(hex.substring(0, 2), 16);
      var g = parseInt(hex.substring(2, 4), 16);
      var b = parseInt(hex.substring(4, 6), 16);
      return r + ', ' + g + ', ' + b;
    }
    
    // Helper to build widget background style with glassmorphism
    function getWidgetBackgroundStyle(bgValue, blur, opacity) {
      var style = '';
      if (blur > 0) {
        style += 'backdrop-filter: blur(' + blur + 'px); -webkit-backdrop-filter: blur(' + blur + 'px); ';
      }
      // Check if it's an image URL (starts with url(, http://, https://, or /)
      if (bgValue && (bgValue.startsWith('url(') || bgValue.startsWith('http://') || bgValue.startsWith('https://') || bgValue.startsWith('/'))) {
        var imageUrl = bgValue.startsWith('url(') ? bgValue : 'url(' + bgValue + ')';
        style += 'background-image: ' + imageUrl + '; ';
        style += 'background-size: cover; ';
        style += 'background-position: center; ';
        style += 'background-repeat: no-repeat; ';
        if (opacity < 100) {
          style += 'background-color: rgba(255, 255, 255, ' + (opacity / 100) + '); ';
        }
      } else {
        // It's a color value
        if (opacity < 100) {
          style += 'background-color: rgba(' + hexToRgb(bgValue) + ', ' + (opacity / 100) + '); ';
        } else {
          style += 'background-color: ' + bgValue + '; ';
        }
      }
      return style;
    }
    
    // Create button content based on avatar style
    // iconSvg is pre-rendered server-side and passed to this script
    if (widgetConfig.avatarStyle === 'circle-with-label') {
      var iconHtml = widgetConfig.logo ? '<img src="' + widgetConfig.logo + '" style="width: 100%; height: 100%; border-radius: ' + avatarBorderRadius + '; object-fit: cover;" onerror="this.style.display=\\'none\\'; this.parentElement.innerHTML=\\'' + (iconSvg || '') + '\\';">' : (widgetConfig.avatarType === 'image' && widgetConfig.avatarImageUrl ? '<img src="' + widgetConfig.avatarImageUrl + '" style="width: 100%; height: 100%; border-radius: ' + avatarBorderRadius + '; object-fit: cover;">' : (iconSvg || '<span style="font-size: 24px; color: ' + (widgetConfig.avatarIconColor || 'white') + ';"></span>'));
      
      button.innerHTML = iconHtml;
      var buttonBgStyle = getWidgetBackgroundStyle(widgetConfig.backgroundColor, widgetConfig.widgetBlur, widgetConfig.widgetOpacity);
      var shadowX = parseFloat(widgetConfig.shadowX) || 0;
      var shadowY = parseFloat(widgetConfig.shadowY) || 0;
      var shadowBlur = parseFloat(widgetConfig.shadowBlur) || 0;
      var shadowSpread = parseFloat(widgetConfig.shadowSpread) || 0;
      var boxShadow = (shadowBlur !== 0 || shadowX !== 0 || shadowY !== 0 || shadowSpread !== 0)
        ? shadowX + 'px ' + shadowY + 'px ' + shadowBlur + 'px ' + shadowSpread + 'px ' + widgetConfig.shadowColor
        : 'none';
      button.style.cssText = 'width: ' + widgetConfig.size + '; height: ' + widgetConfig.size + '; border-radius: ' + avatarBorderRadius + '; ' + buttonBgStyle + 'border: ' + widgetConfig.borderWidth + ' solid ' + widgetConfig.borderColor + '; color: white; cursor: pointer; box-shadow: ' + boxShadow + '; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; padding: 0; margin: 0;';
      
      var label = document.createElement('div');
      var labelBgStyle = getWidgetBackgroundStyle(widgetConfig.backgroundColor, widgetConfig.widgetBlur, widgetConfig.widgetOpacity);
      label.style.cssText = labelBgStyle + 'color: ' + widgetConfig.labelColor + '; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; white-space: nowrap; pointer-events: auto;';
      label.textContent = widgetConfig.labelText;
      buttonContainer.appendChild(button);
      buttonContainer.appendChild(label);
    } else {
      // iconSvg is pre-rendered server-side and passed to this script
      var iconHtml = widgetConfig.logo ? '<img src="' + widgetConfig.logo + '" style="width: 100%; height: 100%; border-radius: ' + avatarBorderRadius + '; object-fit: cover;" onerror="this.parentElement.innerHTML=\\'' + (iconSvg || '💬') + '\\';">' : (widgetConfig.avatarType === 'image' && widgetConfig.avatarImageUrl ? '<img src="' + widgetConfig.avatarImageUrl + '" style="width: 100%; height: 100%; border-radius: ' + avatarBorderRadius + '; object-fit: cover;">' : (iconSvg || '<span style="font-size: 24px; color: ' + (widgetConfig.avatarIconColor || 'white') + ';">💬</span>'));
      
      button.innerHTML = iconHtml;
      var buttonBgStyle = getWidgetBackgroundStyle(widgetConfig.backgroundColor, widgetConfig.widgetBlur, widgetConfig.widgetOpacity);
      var shadowX = parseFloat(widgetConfig.shadowX) || 0;
      var shadowY = parseFloat(widgetConfig.shadowY) || 0;
      var shadowBlur = parseFloat(widgetConfig.shadowBlur) || 0;
      var shadowSpread = parseFloat(widgetConfig.shadowSpread) || 0;
      var boxShadow = (shadowBlur !== 0 || shadowX !== 0 || shadowY !== 0 || shadowSpread !== 0)
        ? shadowX + 'px ' + shadowY + 'px ' + shadowBlur + 'px ' + shadowSpread + 'px ' + widgetConfig.shadowColor
        : 'none';
      button.style.cssText = 'width: ' + widgetConfig.size + '; height: ' + widgetConfig.size + '; border-radius: ' + avatarBorderRadius + '; ' + buttonBgStyle + 'border: ' + widgetConfig.borderWidth + ' solid ' + widgetConfig.borderColor + '; color: white; cursor: pointer; box-shadow: ' + boxShadow + '; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; padding: 0; margin: 0; position: relative;';
      buttonContainer.appendChild(button);
    }
    
    // Add notification badge if enabled
    if (widgetConfig.showBadge) {
      var badge = document.createElement('div');
      badge.id = 'chatbot-badge-' + chatbotId;
      badge.style.cssText = 'position: absolute; top: -5px; right: -5px; background-color: ' + widgetConfig.badgeColor + '; color: white; border-radius: 50%; min-width: 20px; height: 20px; padding: 0 4px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 2px solid white; box-sizing: border-box;';
      badge.textContent = '1';
      badge.style.display = 'none'; // Hidden by default, can be shown via API
      // Expose function to update badge count
      window['updateChatbotBadge_' + chatbotId] = function(count) {
        if (badge && count > 0) {
          badge.textContent = count > 99 ? '99+' : count.toString();
          badge.style.display = 'flex';
          badge.style.borderRadius = count > 9 ? '10px' : '50%';
        } else if (badge) {
          badge.style.display = 'none';
        }
      };
      button.style.position = 'relative';
      button.appendChild(badge);
    }
    
    button.onmouseover = function() { 
      this.style.transform = baseWidgetTransform + ' scale(1.1)'; 
    };
    button.onmouseout = function() { 
      this.style.transform = baseWidgetTransform || 'scale(1)';
    };
    
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
})();
`

    return new NextResponse(script, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Private-Network': 'true',
      },
    })
  } catch (error) {
    console.error('Error generating embed script:', error)
    return new NextResponse(`console.error("[Embed API Error] Server failed to generate script:", ${JSON.stringify(error instanceof Error ? error.message : String(error))});`, {
      headers: {
        'Content-Type': 'application/javascript',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Private-Network': 'true',
      }
    })
  }
}
