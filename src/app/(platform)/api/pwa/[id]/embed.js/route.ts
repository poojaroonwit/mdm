import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const pwa = await db.websitePWA.findUnique({
            where: { id },
        })

        if (!pwa) {
            return new NextResponse('console.error("[PWA] Configuration not found");', {
                status: 404,
                headers: { 'Content-Type': 'application/javascript' }
            })
        }

        // Get the origin from the request (MDM server origin)
        const serverOrigin = request.nextUrl.origin

        // Extract loading config
        const manifestParams = (pwa.manifestParams as any) || {}
        const loadingConfig = manifestParams.loadingConfig || {}
        const installBannerConfig = (pwa.installBannerConfig as any) || {}

        const script = `
(function() {
  'use strict';
  
  var pwaId = '${id}';
  var pwaName = ${JSON.stringify(pwa.name)};
  var serverOrigin = '${serverOrigin}';
  
  // Prevent multiple initializations
  if (window['pwaManagerLoaded_' + pwaId]) {
    console.warn('[PWA] Already initialized for:', pwaName);
    return;
  }
  window['pwaManagerLoaded_' + pwaId] = true;
  
  console.log('[PWA] Initializing PWA Manager for:', pwaName);
  
  // Configuration
  var config = {
    id: pwaId,
    name: pwaName,
    shortName: ${JSON.stringify(pwa.shortName || pwa.name)},
    themeColor: ${JSON.stringify(pwa.themeColor || '#ffffff')},
    bgColor: ${JSON.stringify(pwa.bgColor || '#ffffff')},
    iconUrl: ${JSON.stringify(pwa.iconUrl || '')},
    installMode: ${JSON.stringify(pwa.installMode || 'browser')},
    promptDelay: ${pwa.promptDelay || 0},
    loading: {
      backgroundColor: ${JSON.stringify(loadingConfig.backgroundColor || pwa.bgColor || '#ffffff')},
      spinnerColor: ${JSON.stringify(loadingConfig.spinnerColor || pwa.themeColor || '#000000')},
      text: ${JSON.stringify(loadingConfig.text || '')}
    },
    banner: ${JSON.stringify(installBannerConfig)}
  };
  
  // Inject manifest link if not present
  function injectManifest() {
    var existingManifest = document.querySelector('link[rel="manifest"]');
    if (!existingManifest) {
      var link = document.createElement('link');
      link.rel = 'manifest';
      link.href = serverOrigin + '/api/pwa/' + pwaId + '/manifest.json';
      link.crossOrigin = 'use-credentials';
      document.head.appendChild(link);
      console.log('[PWA] Manifest injected');
    }
  }
  
  // Inject theme-color meta tag
  function injectThemeColor() {
    var existingMeta = document.querySelector('meta[name="theme-color"]');
    if (!existingMeta) {
      var meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = config.themeColor;
      document.head.appendChild(meta);
    } else {
      existingMeta.content = config.themeColor;
    }
  }
  
  // Register Service Worker
  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register(serverOrigin + '/api/pwa/' + pwaId + '/sw.js', {
          scope: '/'
        })
        .then(function(registration) {
          console.log('[PWA] Service Worker registered:', registration.scope);
          
          // Handle updates
          registration.addEventListener('updatefound', function() {
            var newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', function() {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('[PWA] New version available');
                  // Could show update notification here
                }
              });
            }
          });
        })
        .catch(function(error) {
          console.error('[PWA] Service Worker registration failed:', error);
        });
    }
  }
  
  // Handle install prompt
  var deferredPrompt = null;
  
  function setupInstallPrompt() {
    window.addEventListener('beforeinstallprompt', function(e) {
      console.log('[PWA] Install prompt available');
      
      if (config.installMode === 'custom' || config.installMode === 'manual') {
        // Prevent the default prompt
        e.preventDefault();
        deferredPrompt = e;
        
        // Show custom install UI after delay
        if (config.installMode === 'custom' && config.promptDelay >= 0) {
          setTimeout(function() {
            showInstallBanner();
          }, config.promptDelay * 1000);
        }
      }
      // If installMode is 'browser', let the browser handle it naturally
    });
    
    window.addEventListener('appinstalled', function() {
      console.log('[PWA] App installed successfully');
      deferredPrompt = null;
      hideInstallBanner();
    });
  }
  
  // Custom install banner
  function showInstallBanner() {
    if (!deferredPrompt) return;
    
    // Check if already dismissed
    try {
      if (localStorage.getItem('pwa_dismissed_' + pwaId) === 'true') {
        return;
      }
    } catch (e) {}
    
    // Check if already in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      return;
    }
    
    var banner = document.getElementById('pwa-install-banner-' + pwaId);
    if (banner) return; // Already showing
    
    banner = document.createElement('div');
    banner.id = 'pwa-install-banner-' + pwaId;
    banner.style.cssText = 'position: fixed; bottom: 0; left: 0; right: 0; background: ' + config.loading.backgroundColor + '; color: ' + config.loading.spinnerColor + '; padding: 16px; display: flex; align-items: center; justify-content: space-between; box-shadow: 0 -2px 10px rgba(0,0,0,0.1); z-index: 999999; font-family: system-ui, sans-serif;';
    
    var content = document.createElement('div');
    content.style.cssText = 'display: flex; align-items: center; gap: 12px;';
    
    if (config.iconUrl) {
      var icon = document.createElement('img');
      icon.src = config.iconUrl;
      icon.alt = '';
      icon.style.cssText = 'width: 48px; height: 48px; border-radius: 8px;';
      content.appendChild(icon);
    }
    
    var text = document.createElement('div');
    text.innerHTML = '<strong>' + config.name + '</strong><br><small>Install for a better experience</small>';
    content.appendChild(text);
    
    var buttons = document.createElement('div');
    buttons.style.cssText = 'display: flex; gap: 8px;';
    
    var dismissBtn = document.createElement('button');
    dismissBtn.textContent = 'Not now';
    dismissBtn.style.cssText = 'padding: 8px 16px; border: none; background: transparent; color: inherit; cursor: pointer; opacity: 0.7;';
    dismissBtn.onclick = function() {
      hideInstallBanner();
      try {
        localStorage.setItem('pwa_dismissed_' + pwaId, 'true');
      } catch (e) {}
    };
    
    var installBtn = document.createElement('button');
    installBtn.textContent = 'Install';
    installBtn.style.cssText = 'padding: 8px 24px; border: none; background: ' + config.loading.spinnerColor + '; color: ' + config.loading.backgroundColor + '; border-radius: 4px; cursor: pointer; font-weight: 600;';
    installBtn.onclick = function() {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then(function(choiceResult) {
          if (choiceResult.outcome === 'accepted') {
            console.log('[PWA] User accepted install');
          }
          deferredPrompt = null;
          hideInstallBanner();
        });
      }
    };
    
    buttons.appendChild(dismissBtn);
    buttons.appendChild(installBtn);
    
    banner.appendChild(content);
    banner.appendChild(buttons);
    
    document.body.appendChild(banner);
  }
  
  function hideInstallBanner() {
    var banner = document.getElementById('pwa-install-banner-' + pwaId);
    if (banner) {
      banner.remove();
    }
  }
  
  // Expose API for manual install trigger
  window['installPWA_' + pwaId] = function() {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      return deferredPrompt.userChoice.then(function(result) {
        deferredPrompt = null;
        return result;
      });
    }
    return Promise.reject(new Error('Install prompt not available'));
  };
  
  // Initialize
  function init() {
    injectManifest();
    injectThemeColor();
    registerServiceWorker();
    setupInstallPrompt();
    console.log('[PWA] Initialization complete for:', pwaName);
  }
  
  // Run when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
`

        return new NextResponse(script, {
            headers: {
                'Content-Type': 'application/javascript',
                'Cache-Control': 'public, max-age=3600',
                'Access-Control-Allow-Origin': '*',
            },
        })
    } catch (error) {
        console.error('Error generating PWA embed script:', error)
        return new NextResponse('console.error("[PWA] Server error");', {
            status: 500,
            headers: { 'Content-Type': 'application/javascript' }
        })
    }
}
