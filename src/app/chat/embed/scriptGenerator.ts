import { Z_INDEX } from '@/lib/z-index'
import { ChatbotConfig } from '../[id]/types'
import { WidgetConfig } from '../[id]/utils/widgetConfigHelper'
import { SHADOW_BUFFER, BUTTON_SHADOW_BUFFER } from '../[id]/utils/chatStyling'


/**
 * Simplified embed script generator.
 * 
 * Instead of manually creating widget buttons and containers using DOM manipulation,
 * this approach creates a transparent full-page iframe that loads the chat page.
 * The React components inside the iframe handle ALL rendering, ensuring 100% visual
 * parity with the emulator.
 */
export function generateEmbedScript(
  chatbotId: string,
  type: string,
  serverOrigin: string,
  chatbotConfig: ChatbotConfig,
  chatKitTheme: any,
  preCalculatedWidgetConfig: WidgetConfig
) {
  // Pass pre-calculated config to ensure consistency
  const injectedWidgetConfig = JSON.stringify(preCalculatedWidgetConfig);

  return `
(function() {
  var chatbotId = '${chatbotId}';
  var type = '${type}';
  var serverOrigin = '${serverOrigin}';
  var widgetConfig = ${injectedWidgetConfig};
  
  // Prevent multiple instances
  if (window['chatbotLoaded_' + chatbotId]) {
    return;
  }
  window['chatbotLoaded_' + chatbotId] = true;
  
  // DNS preconnect + prefetch so the browser opens a connection and pre-downloads
  // the chat page before the iframe is even created.
  (function() {
    var preconnect = document.createElement('link');
    preconnect.rel = 'preconnect';
    preconnect.href = serverOrigin;
    document.head.appendChild(preconnect);

    var prefetch = document.createElement('link');
    prefetch.rel = 'prefetch';
    prefetch.href = serverOrigin + '/chat/' + chatbotId + '?mode=embed&type=' + type;
    document.head.appendChild(prefetch);
  })();

  function initWidget() {
    var Z_INDEX = ${JSON.stringify(Z_INDEX)};
    var buttonShadowBuffer = ${BUTTON_SHADOW_BUFFER};

    // Create a container for the iframe
    var embedContainer = document.getElementById('chatbot-embed-' + chatbotId);
    if (!embedContainer) {
      embedContainer = document.createElement('div');
      embedContainer.id = 'chatbot-embed-' + chatbotId;
      embedContainer.setAttribute('aria-label', 'Chat widget');
      document.body.appendChild(embedContainer);
    }
    
    // Style the container to be a transparent overlay
    // Initial size is small (standard widget area) to prevent blocking the page before the widget loads/resizes
    // Compute initial position from widgetConfig so non-bottom-right widgets don't flash at the wrong corner
    var shadowBuffer = ${SHADOW_BUFFER};
    var wPos = widgetConfig.position || 'bottom-right';
    var wOffsetX = parseFloat(widgetConfig.offsetX || '20') || 20;
    var wOffsetY = parseFloat(widgetConfig.offsetY || '20') || 20;
    // Initial state is always closed (button only) — use buttonShadowBuffer to keep iframe tight
    var initOffsetX = Math.max(0, wOffsetX - buttonShadowBuffer) + 'px';
    var initOffsetY = Math.max(0, wOffsetY - buttonShadowBuffer) + 'px';
    var initWidgetSize = parseFloat(widgetConfig.size || '60') || 60;
    var initSize = (initWidgetSize + buttonShadowBuffer * 2) + 'px';
    var positionCss = 'position: fixed; ';
    if (wPos.indexOf('bottom') !== -1) { positionCss += 'bottom: ' + initOffsetY + '; top: auto; '; }
    else { positionCss += 'top: ' + initOffsetY + '; bottom: auto; '; }
    if (wPos.indexOf('right') !== -1) { positionCss += 'right: ' + initOffsetX + '; left: auto; '; }
    else if (wPos.indexOf('left') !== -1) { positionCss += 'left: ' + initOffsetX + '; right: auto; '; }
    else { positionCss += 'left: 50%; right: auto; transform: translateX(-50%); '; }
    embedContainer.style.cssText = positionCss + 'width: ' + initSize + '; height: ' + initSize + '; max-width: 100% !important; max-height: 100% !important; box-sizing: border-box; pointer-events: none; z-index: ' + (widgetConfig.zIndex || Z_INDEX.chatWidget) + '; border: none; overflow: visible;';
    
    // ── Instant placeholder button ──────────────────────────────────────────
    // Rendered immediately from pre-calculated widgetConfig so the user sees
    // the button at once instead of waiting for the full iframe to hydrate.
    var iframeReady = false;
    var wantOpen = false;

    var btnSize = initWidgetSize + 'px';
    var placeholder = document.createElement('div');
    placeholder.id = 'chatbot-placeholder-' + chatbotId;

    // Position inside the container (mirrors what the React button does)
    var phPos = 'position:absolute;box-sizing:border-box;';
    if (wPos.indexOf('bottom') !== -1) phPos += 'bottom:' + buttonShadowBuffer + 'px;top:auto;';
    else phPos += 'top:' + buttonShadowBuffer + 'px;bottom:auto;';
    if (wPos.indexOf('right') !== -1) phPos += 'right:' + buttonShadowBuffer + 'px;left:auto;';
    else if (wPos.indexOf('left') !== -1) phPos += 'left:' + buttonShadowBuffer + 'px;right:auto;';
    else phPos += 'left:50%;transform:translateX(-50%);';

    var phBg = widgetConfig.backgroundColor || '#1e40af';
    var phRadius = widgetConfig.borderRadius || '50%';
    var phBorder = (widgetConfig.borderWidth && widgetConfig.borderWidth !== '0px')
      ? widgetConfig.borderWidth + ' solid ' + (widgetConfig.borderColor || 'transparent') : 'none';
    var phShadow = (widgetConfig.boxShadow && widgetConfig.boxShadow !== 'none') ? widgetConfig.boxShadow : '';
    var phIconColor = widgetConfig.avatarIconColor || '#ffffff';

    // Icon: image or inline SVG chat-bubble
    var phIcon = '';
    if (widgetConfig.avatarType === 'image' && widgetConfig.avatarImageUrl) {
      phIcon = '<img src="' + widgetConfig.avatarImageUrl + '" style="width:60%;height:60%;object-fit:cover;border-radius:inherit;display:block;" />';
    } else {
      // Generic chat-bubble SVG (works without any external resources)
      phIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="55%" height="55%" viewBox="0 0 24 24" fill="none" stroke="' + phIconColor + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
    }

    placeholder.innerHTML = phIcon;
    placeholder.style.cssText = phPos +
      'width:' + btnSize + ';height:' + btnSize + ';' +
      'background:' + phBg + ';border-radius:' + phRadius + ';border:' + phBorder + ';' +
      (phShadow ? 'box-shadow:' + phShadow + ';' : '') +
      'display:flex;align-items:center;justify-content:center;' +
      'cursor:pointer;pointer-events:auto;z-index:2;overflow:hidden;';

    placeholder.addEventListener('click', function() {
      if (iframeReady) {
        iframe.contentWindow.postMessage({ type: 'open-chat' }, '*');
      } else {
        wantOpen = true; // Will open as soon as iframe is ready
      }
    });
    embedContainer.appendChild(placeholder);

    // ── iframe (loads invisibly in background) ───────────────────────────────
    var iframe = document.createElement('iframe');
    iframe.id = 'chatbot-iframe-' + chatbotId;
    // Pass parent viewport width so the chat page can correctly detect mobile.
    // window.screen.width inside the iframe can return desktop resolution in some browsers.
    var parentWidth = window.innerWidth;
    iframe.src = serverOrigin + '/chat/' + chatbotId + '?mode=embed&type=' + type + '&pw=' + parentWidth;
    console.log('[EmbedScript] Generated iframe src:', iframe.src);
    iframe.setAttribute('title', 'Chat widget');
    iframe.setAttribute('allow', 'microphone; camera; clipboard-write');
    iframe.setAttribute('sandbox', 'allow-scripts allow-forms allow-popups allow-same-origin');

    // Hidden until React is ready — pointer-events:none so placeholder click works
    iframe.style.cssText = 'width:100%;height:100%;max-width:100%;max-height:100%;border:none;background:transparent;pointer-events:none;opacity:0;transition:opacity 0.15s;';

    embedContainer.appendChild(iframe);
    
    // Inject responsive CSS for mobile full-screen behavior
    var style = document.createElement('style');
    style.innerHTML = '@media (max-width: 1023px) { #chatbot-embed-' + chatbotId + '.chat-open { width: 100% !important; height: 100% !important; top: 0 !important; left: 0 !important; bottom: auto !important; right: auto !important; transform: none !important; border-radius: 0 !important; } }';
    document.head.appendChild(style);
    
    // Send parent viewport width to iframe for accurate mobile detection.
    // Runs after React hydration completes and on device rotation/resize.
    function sendViewport() {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({ type: 'parent-viewport', width: window.innerWidth }, '*');
      }
    }
    iframe.addEventListener('load', function() { sendViewport(); });
    window.addEventListener('resize', function() { sendViewport(); });

    // Listen for messages from the iframe (e.g., resize, close requests)
    window.addEventListener('message', function(e) {
      if (!e.data) return;

      // Handle resizing request from the chat app
      if (e.data.type === 'chat-widget-resize') {
        // First message means React has hydrated — swap placeholder for iframe
        if (!iframeReady) {
          iframeReady = true;
          var ph = document.getElementById('chatbot-placeholder-' + chatbotId);
          if (ph) ph.style.display = 'none';
          iframe.style.opacity = '1';
          iframe.style.pointerEvents = 'auto';
          if (wantOpen) {
            wantOpen = false;
            iframe.contentWindow.postMessage({ type: 'open-chat' }, '*');
          }
        }

        var width = e.data.width;
        var height = e.data.height;
        var isOpen = e.data.isOpen;

        // Toggle open state for CSS media query
        if (isOpen) {
          embedContainer.classList.add('chat-open');
        } else {
          embedContainer.classList.remove('chat-open');
        }

        console.log('[EmbedScript] Received resize:', { width, height, isOpen, currentW: embedContainer.style.width, currentH: embedContainer.style.height });

        if (width && height) {
          if (embedContainer.style.width !== width || embedContainer.style.height !== height) {
            console.log('[EmbedScript] Applying resize:', { width, height });
            embedContainer.style.width = width;
            embedContainer.style.height = height;
          }
        }

        // Apply position data so non-default widget positions (bottom-left, top-right, etc.) work correctly
        if (e.data.bottom !== undefined) {
          embedContainer.style.bottom = e.data.bottom;
          embedContainer.style.top = 'auto';
        } else if (e.data.top !== undefined) {
          embedContainer.style.top = e.data.top;
          embedContainer.style.bottom = 'auto';
        }
        
        if (e.data.right !== undefined) {
          embedContainer.style.right = e.data.right;
          embedContainer.style.left = 'auto';
        } else if (e.data.left !== undefined) {
          embedContainer.style.left = e.data.left;
          embedContainer.style.right = 'auto';
        }

        if (e.data.transform !== undefined) {
          embedContainer.style.transform = e.data.transform;
        } else {
          embedContainer.style.transform = 'none';
        }

        // Manage pointer events
        embedContainer.style.pointerEvents = 'none';
      }
    });
  
    // Expose global functions for external control
    window['openChatbot_' + chatbotId] = function() {
      var ifr = document.getElementById('chatbot-iframe-' + chatbotId);
      if (ifr) ifr.contentWindow.postMessage({ type: 'open-chat' }, '*');
    };
    
    window['closeChatbot_' + chatbotId] = function() {
      iframe.contentWindow.postMessage({ type: 'close-chat' }, '*');
    };
    
    window['updateChatbotBadge_' + chatbotId] = function(count) {
      iframe.contentWindow.postMessage({ type: 'update-badge', count: count }, '*');
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initWidget);
  } else {
    initWidget();
  }
})();
`
}
