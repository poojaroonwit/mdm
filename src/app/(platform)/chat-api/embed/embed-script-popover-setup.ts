export function buildEmbedPopoverSetupScript() {
  return `
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
    
`
}
