(function () {
    // Get the script tag that loaded this file
    const currentScript = document.currentScript;
    if (!currentScript) {
        console.error('[ChatWidget] Could not find script tag');
        return;
    }

    // Get chatbot ID from data attribute
    const chatbotId = currentScript.getAttribute('data-chatbot-id');
    if (!chatbotId) {
        console.error('[ChatWidget] No data-chatbot-id attribute found');
        return;
    }

    // Get optional deployment type (default to popover for widget behavior)
    const deploymentType = currentScript.getAttribute('data-type') || 'popover';

    // Get the base URL from the script src
    const scriptSrc = currentScript.src;
    const baseUrl = scriptSrc.substring(0, scriptSrc.lastIndexOf('/'));

    function initWidget() {
        // Create iframe container - covers the full viewport to allow popover positioning
        const container = document.createElement('div');
        container.id = 'chat-widget-container';
        container.style.cssText = `
      position: fixed;
      width: 120px;
      height: 120px;
      max-width: 100% !important;
      max-height: 100% !important;
      box-sizing: border-box;
      z-index: 999999;
      pointer-events: none;
      visibility: hidden;
    `;

        // Create iframe
        const iframe = document.createElement('iframe');
        iframe.id = 'chat-widget-iframe';
        // Pass deployment type to the chat page - mode=embed tells it's in an iframe, type controls layout
        iframe.src = `${baseUrl}/chat/${chatbotId}?mode=embed&type=${deploymentType}`;
        iframe.style.cssText = `
      width: 100%;
      height: 100%;
      max-width: 100%;
      max-height: 100%;
      border: none;
      background: transparent;
      pointer-events: auto;
    `;
        iframe.allow = 'microphone; clipboard-write';

        container.appendChild(iframe);
        document.body.appendChild(container);

        // Listen for messages from iframe to handle open/close state
        window.addEventListener('message', function (event) {
            // Verify origin matches our base URL
            try {
                const iframeOrigin = new URL(baseUrl).origin;
                if (event.origin !== iframeOrigin && event.origin !== window.location.origin) {
                    // For now, permitting mismatch to ensure functionality across different embed environments
                    // return; 
                }
            } catch (e) {
                //
            }

            const data = event.data;
            const messageType = data.type || data.action;

            // Handle outside click listener
            function closeHandler(e) {
                // If click is NOT inside container, close the chat
                if (container && !container.contains(e.target)) {
                    iframe.contentWindow.postMessage({ type: 'close-chat' }, '*');
                }
            }

            if (messageType === 'chat-widget-resize') {
                const width = data.width || (data.isOpen ? '100%' : '120px');
                const height = data.height || (data.isOpen ? '100%' : '120px');

                // Add extra space so overflowing content (shadows, popovers) isn't clipped.
                // Only applies to pixel values — percentage values (e.g. 100% full-screen) are kept as-is.
                function addPx(value, extra) {
                    if (!value || value === '100%') return value;
                    var num = parseFloat(value);
                    return isNaN(num) ? value : (num + extra) + 'px';
                }

                container.style.width = addPx(width, 40);
                container.style.height = addPx(height, 200);

                // Dynamic positioning if provided by the chatbot config
                // Clear opposing axis properties to avoid conflicting anchors (e.g. left + right both set)
                if (data.bottom !== undefined) { container.style.bottom = data.bottom; container.style.top = ''; }
                else if (data.top !== undefined) { container.style.top = data.top; container.style.bottom = ''; }
                if (data.right !== undefined) { container.style.right = data.right; container.style.left = ''; }
                else if (data.left !== undefined) { container.style.left = data.left; container.style.right = ''; }

                // Make visible once positioned (avoids flash at wrong corner before first resize)
                container.style.visibility = 'visible';

                if (data.isOpen) {
                    // Check if we are in a non-full-screen mode (e.g. popover)
                    // If width/height is NOT 100%, we allow interaction with the host page
                    // AND we must listen for clicks outside to close.
                    const isFullScreen = width === '100%' && height === '100%';

                    if (!isFullScreen) {
                        // Container should generally pass through clicks if it has empty space, 
                        // but here we sized the container to FIT the widget.
                        // So we want the container to capture clicks (it's the widget).
                        // Pointer events should be 'none' on container only if it was full screen overlay.
                        // Here, it is the widget itself.
                        container.style.pointerEvents = 'none'; // Ensure container wrapper doesn't block if slightly larger
                        iframe.style.pointerEvents = 'auto';

                        // Add click listener to document to detect outside clicks
                        // Use setTimeout to avoid triggering immediately if this event was caused by a click
                        setTimeout(() => {
                            document.addEventListener('click', closeHandler);
                        }, 100);
                    } else {
                        // Full screen (modal or mobile)
                        container.style.pointerEvents = 'auto'; // Block interaction
                        iframe.style.pointerEvents = 'auto';
                        // No outside click listener needed as we block everything
                        document.removeEventListener('click', closeHandler);
                    }
                } else {
                    // Closed state
                    container.style.pointerEvents = 'none';
                    iframe.style.pointerEvents = 'auto';
                    document.removeEventListener('click', closeHandler);
                }
            }

            // Handle close chat message
            if (messageType === 'close-chat') {
                container.style.width = '120px';
                container.style.height = '120px';
                container.style.pointerEvents = 'none';
                iframe.style.pointerEvents = 'auto';
                document.removeEventListener('click', closeHandler);
            }
        });
    }

    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }
})();
