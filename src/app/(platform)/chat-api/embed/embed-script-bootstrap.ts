interface EmbedScriptBootstrapArgs {
  chatbot: any
  chatbotId: string
  closeIconSvg: string
  iconSvg: string
  serverOrigin: string
  type: string
}

export function buildEmbedScriptBootstrap({
  chatbot,
  chatbotId,
  closeIconSvg,
  iconSvg,
  serverOrigin,
  type
}: EmbedScriptBootstrapArgs) {
  return `
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
  
`
}
