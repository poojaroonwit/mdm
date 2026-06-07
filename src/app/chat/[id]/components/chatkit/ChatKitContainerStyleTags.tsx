export function ChatKitContainerStyleTags() {
  return (
    <>
      <style>{`
        #chatbot-native-container {
            border-radius: var(--container-border-radius) !important;
            border: var(--container-border) !important;
            outline: var(--container-outline) !important;
            width: var(--container-width) !important;
            height: var(--container-height) !important;
            max-height: var(--container-max-height) !important;
            max-width: var(--container-max-width) !important;
            min-height: var(--container-min-height) !important;
            min-width: var(--container-min-width) !important;
            overflow: var(--container-overflow, visible) !important;
        }

        #chatbot-native-inner {
            width: 100%;
            height: 100%;
            margin: 0 !important;
            padding: 0 !important;
            border-radius: var(--container-border-radius) !important;
            overflow: var(--container-overflow, visible) !important;
            display: flex;
            flex-direction: column;
            background: inherit;
            box-shadow: var(--container-box-shadow) !important;
        }
        
        #chatbot-content-wrapper {
            width: 100%;
            height: 100%;
            margin: 0 !important;
            padding: 0 !important;
            border-radius: inherit;
            overflow: hidden !important;
            display: flex;
            flex-direction: column;
            background: inherit;
            -webkit-mask-image: -webkit-radial-gradient(white, black) !important;
        }
        
        #chatbot-native-inner iframe {
            border: none !important;
            outline: none !important;
            box-shadow: none !important;
        }
      `}</style>
      <style>{`
        @keyframes chatbotPopoverFadeIn {
          from {
              opacity: 0;
              transform: translateY(20px) scale(0.95);
          }
          to {
              opacity: 1;
              transform: translateY(0) scale(1);
          }
        }

        @keyframes chatbotPopoverFadeOut {
          from {
              opacity: 1;
              transform: translateY(0) scale(1);
          }
          to {
              opacity: 0;
              transform: translateY(20px) scale(0.95);
          }
        }

        .chatbot-popover-container {
          transition: opacity 0.2s ease-in-out, transform 0.2s ease-in-out;
        }

        .chatbot-popover-enter {
          animation: chatbotPopoverFadeIn 0.25s ease-out forwards;
        }

        .chatbot-popover-exit {
          animation: chatbotPopoverFadeOut 0.2s ease-in forwards;
        }
      `}</style>
    </>
  )
}
