(function () {
   const SCRIPT_TAG = document.currentScript;
   const PWA_ID = SCRIPT_TAG ? SCRIPT_TAG.getAttribute('data-pwa-id') : null;
   const API_BASE = SCRIPT_TAG ? new URL(SCRIPT_TAG.src).origin : 'https://mdm-app.com';

   if (!PWA_ID) {
      console.error('PWA Embed: Missing data-pwa-id attribute.');
      return;
   }

   // Inject Manifest
   const manifestLink = document.createElement('link');
   manifestLink.rel = 'manifest';
   manifestLink.href = `${API_BASE}/api/pwa/${PWA_ID}/manifest.json`;
   document.head.appendChild(manifestLink);

   async function fetchConfig() {
      try {
         const res = await fetch(`${API_BASE}/api/pwa/${PWA_ID}`);
         const data = await res.json();
         return data.pwa;
      } catch (e) {
         console.error('PWA Embed: Failed to load config', e);
         return null;
      }
   }

   async function initPWA() {
      const config = await fetchConfig();
      if (!config) return;

      let deferredPrompt;
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      const isAndroid = /Android/.test(navigator.userAgent);
      const isMobile = isIOS || isAndroid;

      // Check standalone
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator.standalone);
      if (isStandalone) return;

      const container = document.createElement('div');
      container.id = 'pwa-install-container';
      document.body.appendChild(container);

      const shadow = container.attachShadow({ mode: 'open' });

      // Config Extraction
      const styles = config.installBannerConfig || {};
      const bannerBg = styles.bannerBgColor || config.bgColor || '#ffffff';
      const bannerText = styles.bannerTextColor || config.themeColor || '#000000';

      // Button Styles
      const btnBg = styles.buttonBgColor || '#000000';
      const btnText = styles.buttonTextColor || '#ffffff';
      const btnHoverBg = styles.buttonHoverBgColor || styles.buttonBgColor || '#333333';
      const btnHoverText = styles.buttonHoverTextColor || btnText;

      // Position Logic
      const isTop = styles.bannerPosition === 'top';
      const isFloating = true; // Always floating for embed script usually, or match logic

      const bannerPadding = styles.bannerPadding || '12px';
      const bannerMargin = styles.bannerMargin || '16px';
      const bannerRadius = styles.bannerBorderRadius || '12px';
      const bannerShadow = styles.bannerShadow || '0 4px 12px rgba(0,0,0,0.15)';

      const positionStyles = isTop
         ? `top: 0; left: 0; right: 0; transform: translateY(-120%); margin: ${bannerMargin};`
         : `bottom: 0; left: 0; right: 0; transform: translateY(120%); margin: ${bannerMargin};`;

      // Dynamic instructions
      const instructionsTitle = isIOS ? 'Install on iOS' : 'Install App';
      const step1Icon = isIOS ? 'Share Icon' : 'Menu Icon (⋮)';
      const step1Text = isIOS ? 'Tap the <strong>Share</strong> icon in the menu bar.' : 'Tap the <strong>Menu</strong> icon (⋮) in the browser.';
      const step2Text = isIOS ? 'Scroll down and select <strong>Add to Home Screen</strong>.' : 'Select <strong>Install App</strong> or <strong>Add to Home screen</strong>.';

      const styleSheet = document.createElement('style');
      styleSheet.textContent = `
       :host {
         all: initial;
         display: block;
         font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
         z-index: 2147483647; 
         position: fixed;
         pointer-events: none;
         left: 0;
         right: 0;
         top: 0;
         bottom: 0;
       }
       .banner {
          pointer-events: auto;
          position: fixed;
          ${positionStyles}
          background: ${bannerBg};
          color: ${bannerText};
          padding: ${bannerPadding};
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: ${bannerShadow};
          border-radius: ${bannerRadius};
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          border: ${styles.bannerBorderWidth ? `${styles.bannerBorderWidth} solid ${styles.bannerBorderColor || 'transparent'}` : 'none'};
          box-sizing: border-box;
       }
       .banner.visible {
          transform: translateY(0);
       }
       .content-group {
          display: flex;
          align-items: center;
          gap: 12px;
          overflow: hidden;
       }
       .app-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: #f3f4f6;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 1px solid rgba(0,0,0,0.05);
          flex-shrink: 0;
       }
       .app-icon img {
          width: 100%;
          height: 100%;
          object-fit: cover;
       }
       .app-icon span {
          font-size: 10px;
          font-weight: 600;
          color: #9ca3af;
          text-transform: uppercase;
       }
       .text-info {
          display: flex;
          flex-direction: column;
          min-width: 0;
       }
       .title {
          font-size: 14px;
          font-weight: 600;
          line-height: 1.25;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
       }
       .desc {
          font-size: 12px;
          opacity: 0.7;
          line-height: 1.25;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 2px;
       }
       .action-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
          margin-left: 12px;
       }
       .install-btn {
          background: ${btnBg};
          color: ${btnText};
          border: none;
          padding: 0 16px;
          height: 32px;
          border-radius: ${styles.buttonBorderRadius || '4px'};
          font-weight: 500;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          white-space: nowrap;
       }
       .install-btn:hover {
          background: ${btnHoverBg};
          color: ${btnHoverText};
       }
       .close-btn {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          color: inherit;
          opacity: 0.5;
          cursor: pointer;
          border-radius: 9999px;
          transition: all 0.2s;
          padding: 0;
       }
       .close-btn:hover {
          background: rgba(0,0,0,0.05);
          opacity: 1;
       }
       .close-btn svg {
          width: 16px;
          height: 16px;
       }

       /* Modal */
       .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0,0,0,0.5);
          backdrop-filter: blur(2px);
          z-index: 50;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.3s;
       }
       .modal-overlay.visible {
          opacity: 1;
          pointer-events: auto;
       }
       .instruction-modal {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: white;
          padding: 24px;
          border-radius: 24px 24px 0 0;
          box-shadow: 0 -10px 40px rgba(0,0,0,0.1);
          transform: translateY(100%);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          z-index: 51;
          color: #1f2937;
          pointer-events: auto;
       }
       .instruction-modal.open {
          transform: translateY(0);
       }
       .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
       }
       .modal-title { font-weight: 600; font-size: 18px; }
       .instruction-step {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          margin-bottom: 20px;
          font-size: 15px;
          line-height: 1.5;
       }
       .step-icon { font-size: 24px; line-height: 1; }
    `;
      shadow.appendChild(styleSheet);

      const banner = document.createElement('div');
      banner.className = 'banner';

      // Icon Logic
      const iconHtml = config.iconUrl
         ? `<img src="${config.iconUrl}" alt="App" />`
         : `<span>App</span>`;

      banner.innerHTML = `
      <div class="content-group">
         <div class="app-icon">
            ${iconHtml}
         </div>
         <div class="text-info">
            <span class="title">${styles.titleText || config.name || 'Install App'}</span>
            <span class="desc">${styles.descriptionText || 'Add to home screen'}</span>
         </div>
      </div>
      <div class="action-group">
         <button class="install-btn">Install</button>
         <button class="close-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
         </button>
      </div>
    `;
      shadow.appendChild(banner);

      // Modal Components
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      shadow.appendChild(overlay);

      const modal = document.createElement('div');
      modal.className = 'instruction-modal';
      modal.innerHTML = `
      <div class="modal-header">
         <span class="modal-title">${instructionsTitle}</span>
         <button class="close-btn">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
         </button>
      </div>
      <div class="instruction-step">
         <span class="step-icon">1️⃣</span>
         <span>${step1Text}</span>
      </div>
      <div class="instruction-step">
         <span class="step-icon">2️⃣</span>
         <span>${step2Text}</span>
      </div>
    `;
      shadow.appendChild(modal);

      // Event Listeners
      const installBtn = banner.querySelector('.install-btn');
      const closeBtn = banner.querySelector('.close-btn');
      const modalCloseBtn = modal.querySelector('.close-btn');

      window.addEventListener('beforeinstallprompt', (e) => {
         e.preventDefault();
         deferredPrompt = e;
         banner.classList.add('visible');
      });

      // Force Show on Mobile (iOS + Android)
      if (isMobile && !sessionStorage.getItem('pwa-banner-dismissed')) {
         setTimeout(() => {
            banner.classList.add('visible');
         }, 2000);
      }

      installBtn.addEventListener('click', async () => {
         if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
               deferredPrompt = null;
               banner.classList.remove('visible');
            }
         } else {
            overlay.classList.add('visible');
            modal.classList.add('open');
         }
      });

      const hideBanner = () => {
         banner.classList.remove('visible');
         sessionStorage.setItem('pwa-banner-dismissed', 'true');
      };
      closeBtn.addEventListener('click', hideBanner);

      const closeModal = () => {
         overlay.classList.remove('visible');
         modal.classList.remove('open');
      };
      modalCloseBtn.addEventListener('click', closeModal);
      overlay.addEventListener('click', closeModal);
   }

   initPWA();
})();
