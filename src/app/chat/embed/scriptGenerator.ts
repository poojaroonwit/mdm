import { Z_INDEX } from '@/lib/z-index'
import { ChatbotConfig } from '../[id]/types'
import { WidgetConfig } from '../[id]/utils/widgetConfigHelper'


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
  
  function initWidget() {
    var Z_INDEX = ${JSON.stringify(Z_INDEX)};
    
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
    var shadowBuffer = 20;
    var wPos = widgetConfig.position || 'bottom-right';
    var wOffsetX = parseFloat(widgetConfig.offsetX || '20') || 20;
    var wOffsetY = parseFloat(widgetConfig.offsetY || '20') || 20;
    var initOffsetX = Math.max(0, wOffsetX - shadowBuffer) + 'px';
    var initOffsetY = Math.max(0, wOffsetY - shadowBuffer) + 'px';
    var initWidgetSize = parseFloat(widgetConfig.size || '60') || 60;
    var initSize = (initWidgetSize + shadowBuffer * 2) + 'px';
    var positionCss = 'position: fixed; ';
    if (wPos.indexOf('bottom') !== -1) { positionCss += 'bottom: ' + initOffsetY + '; top: auto; '; }
    else { positionCss += 'top: ' + initOffsetY + '; bottom: auto; '; }
    if (wPos.indexOf('right') !== -1) { positionCss += 'right: ' + initOffsetX + '; left: auto; '; }
    else if (wPos.indexOf('left') !== -1) { positionCss += 'left: ' + initOffsetX + '; right: auto; '; }
    else { positionCss += 'left: 50%; right: auto; transform: translateX(-50%); '; }
    embedContainer.style.cssText = positionCss + 'width: ' + initSize + '; height: ' + initSize + '; max-width: 100% !important; max-height: 100% !important; box-sizing: border-box; pointer-events: none; z-index: ' + (widgetConfig.zIndex || Z_INDEX.chatWidget) + '; border: none; overflow: visible;';
    
    // Create the iframe that loads the full chat page
    // The chat page will render the widget button and container with React components
    var iframe = document.createElement('iframe');
    iframe.id = 'chatbot-iframe-' + chatbotId;
    iframe.src = serverOrigin + '/chat/' + chatbotId + '?mode=embed&type=' + type;
    console.log('[EmbedScript] Generated iframe src:', iframe.src);
    iframe.setAttribute('title', 'Chat widget');
    iframe.setAttribute('allow', 'microphone; camera; clipboard-write');
    iframe.setAttribute('sandbox', 'allow-scripts allow-forms allow-popups allow-same-origin');
    
    // Style iframe to cover full viewport but be transparent except for widget
    iframe.style.cssText = 'width: 100%; height: 100%; max-width: 100%; max-height: 100%; border: none; background: transparent; pointer-events: auto;';
    
    embedContainer.appendChild(iframe);
    
    // Inject responsive CSS for mobile full-screen behavior
    var style = document.createElement('style');
    style.innerHTML = '@media (max-width: 1023px) { #chatbot-embed-' + chatbotId + '.chat-open { width: 100% !important; height: 100% !important; top: 0 !important; left: 0 !important; bottom: 0 !important; right: 0 !important; transform: none !important; border-radius: 0 !important; margin: 0 !important; } }';
    document.head.appendChild(style);
    
    // Listen for messages from the iframe (e.g., resize, close requests)
    window.addEventListener('message', function(e) {
      if (!e.data) return;
      
      // Handle resizing request from the chat app
      if (e.data.type === 'chat-widget-resize') {
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
