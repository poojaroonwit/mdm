import React from 'react'
import { Image as ImageIcon, Video as VideoIcon } from 'lucide-react'
import { computeWidgetStyle, WidgetStyleProps } from './widgetStyles'
import DOMPurify from 'dompurify'

interface BasicWidgetProps extends WidgetStyleProps {
  widget: {
    type: string
    width?: number
    height?: number
  }
  isMobile?: boolean
}

export function TextWidget({ props, style }: { props: BasicWidgetProps; style: React.CSSProperties }) {
  return (
    <div
      className="w-full h-full flex items-center p-2"
      style={style}
    >
      <span style={{
        fontSize: (props as any).titleFontSize ? `${(props as any).titleFontSize}px` : style.fontSize,
        fontWeight: props.fontWeight || 'normal',
      }}>
        {(props as any).text || 'Text Widget'}
      </span>
    </div>
  )
}

export function ImageWidget({ props, style }: { props: BasicWidgetProps; style: React.CSSProperties }) {
  return (
    <div className="w-full h-full flex items-center justify-center p-2" style={style}>
      {(props as any).imageUrl ? (
        <img
          src={(props as any).imageUrl}
          alt={(props as any).imageAlt || 'Image'}
          className="max-w-full max-h-full object-contain"
          style={{ objectFit: (props as any).objectFit || 'contain' }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-muted-foreground">
          <ImageIcon className="h-8 w-8 mb-2" />
          <span className="text-xs">No image</span>
        </div>
      )}
    </div>
  )
}

export function VideoWidget({ props, style }: { props: BasicWidgetProps; style: React.CSSProperties }) {
  return (
    <div className="w-full h-full flex items-center justify-center p-2" style={style}>
      {(props as any).videoUrl ? (
        <video
          src={(props as any).videoUrl}
          controls
          autoPlay={(props as any).autoplay}
          loop={(props as any).loop}
          muted={(props as any).muted}
          className="w-full h-full object-contain"
        />
      ) : (
        <div className="flex flex-col items-center justify-center text-muted-foreground">
          <VideoIcon className="h-8 w-8 mb-2" />
          <span className="text-xs">No video</span>
        </div>
      )}
    </div>
  )
}

export function IframeWidget({ props, style }: { props: BasicWidgetProps; style: React.CSSProperties }) {
  return (
    <div className="w-full h-full p-2" style={style}>
      {(props as any).iframeUrl ? (
        <iframe
          src={(props as any).iframeUrl}
          className="w-full h-full border-0 rounded"
          allowFullScreen={(props as any).allowFullscreen}
          title="Embedded Content"
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <ImageIcon className="h-8 w-8 mb-2" />
          <span className="text-xs">No URL</span>
        </div>
      )}
    </div>
  )
}

export function LinkWidget({ props, style }: { props: BasicWidgetProps; style: React.CSSProperties }) {
  return (
    <div className="w-full h-full flex items-center justify-center p-2" style={style}>
      <a
        href={(props as any).linkUrl || '#'}
        target={(props as any).target || '_self'}
        className="text-primary hover:underline"
        style={{ color: props.textColor || '#1e40af' }}
      >
        {(props as any).linkText || 'Link'}
      </a>
    </div>
  )
}

export function ButtonWidget({ props, style }: { props: BasicWidgetProps; style: React.CSSProperties }) {
  return (
    <div className="w-full h-full flex items-center justify-center p-2" style={style}>
      <button
        className="px-4 py-2 rounded transition-colors"
        style={{
          backgroundColor: props.backgroundColor || '#1e40af',
          color: props.textColor || '#ffffff',
          fontSize: props.fontSize ? `${props.fontSize}px` : undefined,
          fontWeight: props.fontWeight || '500',
          borderColor: props.borderColor,
          borderWidth: props.borderWidth ? `${props.borderWidth}px` : undefined,
          borderStyle: props.borderStyle || 'solid',
          borderRadius: props.borderRadius ? `${typeof props.borderRadius === 'number' ? props.borderRadius : 4}px` : '4px',
        }}
      >
        {(props as any).buttonText || 'Button'}
      </button>
    </div>
  )
}

export function HtmlWidget({ props, style }: { props: BasicWidgetProps; style: React.CSSProperties }) {
  // Sanitize HTML to prevent XSS attacks
  const sanitizedHtml = typeof window !== 'undefined'
    ? DOMPurify.sanitize((props as any).html || '<p>HTML content</p>')
    : (props as any).html || '<p>HTML content</p>'

  return (
    <div
      className="w-full h-full overflow-auto p-2"
      style={style}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  )
}

export function ContainerWidget({ props, style }: { props: BasicWidgetProps; style: React.CSSProperties }) {
  return (
    <div
      className="w-full h-full p-2"
      style={style}
    >
      {/* Container for nesting other widgets */}
      <div className="text-xs text-muted-foreground text-center">Container</div>
    </div>
  )
}

export function EmbedWidget({ props, style }: { props: BasicWidgetProps; style: React.CSSProperties }) {
  return (
    <div className="w-full h-full p-2" style={style}>
      {(props as any).embedUrl || (props as any).iframeUrl ? (
        <iframe
          src={(props as any).embedUrl || (props as any).iframeUrl}
          className="w-full h-full border-0 rounded"
          allowFullScreen={(props as any).allowFullscreen}
          title="Embedded Content"
        />
      ) : (
        <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
          <ImageIcon className="h-8 w-8 mb-2" />
          <span className="text-xs">No embed URL</span>
        </div>
      )}
    </div>
  )
}

