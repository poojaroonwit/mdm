import type { Component, Style } from './mobile-content-schema'

export interface InternalWidget {
  id: string
  type: string
  x: number
  y: number
  width: number
  height: number
  config?: any
  style?: any
  children?: InternalWidget[]
}

const WIDGET_TYPE_MAPPING: Record<string, string> = {
  container: 'container',
  row: 'row',
  column: 'column',
  group: 'container',
  section: 'container',
  text: 'text',
  label: 'text',
  header: 'text',
  paragraph: 'text',
  image: 'image',
  icon: 'icon',
  button: 'button',
  link: 'link',
  divider: 'divider',
  separator: 'divider',
  spacer: 'spacer',
  input: 'textInput',
  'text-input': 'textInput',
  textInput: 'textInput',
  textarea: 'textArea',
  'text-area': 'textArea',
  select: 'select',
  dropdown: 'select',
  checkbox: 'checkbox',
  radio: 'radio',
  switch: 'switch',
  toggle: 'switch',
  slider: 'slider',
  range: 'slider',
  'date-picker': 'datePicker',
  datePicker: 'datePicker',
  'time-picker': 'timePicker',
  timePicker: 'timePicker',
  'file-picker': 'filePicker',
  filePicker: 'filePicker',
  'file-upload': 'filePicker',
  list: 'list',
  table: 'table',
  'data-table': 'table',
  card: 'card',
  badge: 'badge',
  avatar: 'avatar',
  chip: 'chip',
  tag: 'chip',
  progress: 'progress',
  'progress-bar': 'progress',
  skeleton: 'skeleton',
  loading: 'skeleton',
  tabs: 'tabs',
  'tab-bar': 'tabs',
  'bottom-nav': 'bottomNav',
  drawer: 'drawer',
  sidebar: 'drawer',
  'app-bar': 'appBar',
  'header-bar': 'appBar',
  breadcrumb: 'breadcrumb',
  modal: 'modal',
  dialog: 'modal',
  toast: 'toast',
  notification: 'toast',
  alert: 'alert',
  tooltip: 'tooltip',
  'line-chart': 'lineChart',
  lineChart: 'lineChart',
  'bar-chart': 'barChart',
  barChart: 'barChart',
  'pie-chart': 'pieChart',
  pieChart: 'pieChart',
  'area-chart': 'areaChart',
  areaChart: 'areaChart',
  chart: 'lineChart',
  video: 'video',
  audio: 'audio',
  webview: 'webView',
  'web-view': 'webView',
  iframe: 'webView',
  map: 'map',
  custom: 'custom',
  widget: 'custom',
}

function convertStyle(internalStyle: any, widget: InternalWidget): Style {
  const style: Style = {}

  if (widget.width) style.width = widget.width
  if (widget.height) style.height = widget.height
  if (internalStyle?.width) style.width = internalStyle.width
  if (internalStyle?.height) style.height = internalStyle.height
  if (internalStyle?.minWidth) style.minWidth = internalStyle.minWidth
  if (internalStyle?.maxWidth) style.maxWidth = internalStyle.maxWidth
  if (internalStyle?.minHeight) style.minHeight = internalStyle.minHeight
  if (internalStyle?.maxHeight) style.maxHeight = internalStyle.maxHeight

  if (internalStyle?.padding !== undefined) {
    style.padding = typeof internalStyle.padding === 'object' ? internalStyle.padding : internalStyle.padding
  }
  if (internalStyle?.margin !== undefined) {
    style.margin = typeof internalStyle.margin === 'object' ? internalStyle.margin : internalStyle.margin
  }

  if (internalStyle?.backgroundColor) style.backgroundColor = internalStyle.backgroundColor
  if (internalStyle?.color || internalStyle?.textColor) {
    style.color = internalStyle.color || internalStyle.textColor
  }

  if (internalStyle?.borderWidth) style.borderWidth = internalStyle.borderWidth
  if (internalStyle?.borderColor) style.borderColor = internalStyle.borderColor
  if (internalStyle?.borderRadius) {
    style.borderRadius = typeof internalStyle.borderRadius === 'object'
      ? internalStyle.borderRadius
      : internalStyle.borderRadius
  }
  if (internalStyle?.borderStyle) style.borderStyle = internalStyle.borderStyle

  if (internalStyle?.fontSize) style.fontSize = internalStyle.fontSize
  if (internalStyle?.fontWeight) style.fontWeight = internalStyle.fontWeight
  if (internalStyle?.fontFamily) style.fontFamily = internalStyle.fontFamily
  if (internalStyle?.lineHeight) style.lineHeight = internalStyle.lineHeight
  if (internalStyle?.textAlign) style.textAlign = internalStyle.textAlign
  if (internalStyle?.textTransform) style.textTransform = internalStyle.textTransform

  if (internalStyle?.opacity !== undefined) style.opacity = internalStyle.opacity
  if (internalStyle?.shadow || internalStyle?.boxShadow) {
    const shadowValue = internalStyle.shadow || internalStyle.boxShadow
    if (typeof shadowValue === 'object') {
      style.shadow = shadowValue
    }
  }

  if (internalStyle?.display) style.display = internalStyle.display
  if (internalStyle?.overflow) style.overflow = internalStyle.overflow
  if (internalStyle?.flex !== undefined) style.flex = internalStyle.flex
  if (internalStyle?.flexDirection) style.flexDirection = internalStyle.flexDirection
  if (internalStyle?.justifyContent) style.justifyContent = internalStyle.justifyContent
  if (internalStyle?.alignItems) style.alignItems = internalStyle.alignItems
  if (internalStyle?.gap) style.gap = internalStyle.gap

  return style
}

export function convertWidget(widget: InternalWidget): Component {
  const mappedType = WIDGET_TYPE_MAPPING[widget.type] || 'custom'
  const component: Component = {
    id: widget.id,
    type: mappedType as any,
    name: widget.config?.name || widget.type,
    style: convertStyle(widget.style, widget),
  }
  const props: Record<string, any> = {}

  if (widget.config) {
    if (widget.config.text || widget.config.content || widget.config.label) {
      props.text = widget.config.text || widget.config.content || widget.config.label
    }
    if (widget.config.src || widget.config.imageUrl || widget.config.source) {
      props.source = widget.config.src || widget.config.imageUrl || widget.config.source
    }
    if (widget.config.placeholder) props.placeholder = widget.config.placeholder
    if (widget.config.value !== undefined) props.value = widget.config.value
    if (widget.config.options) props.options = widget.config.options
    if (widget.config.icon) props.icon = widget.config.icon
    if (widget.config.variant) props.variant = widget.config.variant

    if (widget.config.dataBinding || widget.config.dataSource) {
      component.dataBindings = [{
        id: `${widget.id}-binding`,
        type: 'api',
        source: widget.config.dataBinding || widget.config.dataSource,
        responsePath: widget.config.dataPath,
      }]
    }

    Object.keys(widget.config).forEach(key => {
      if (![
        'name',
        'text',
        'content',
        'label',
        'src',
        'imageUrl',
        'source',
        'placeholder',
        'value',
        'options',
        'icon',
        'variant',
        'dataBinding',
        'dataSource',
        'dataPath'
      ].includes(key)) {
        props[key] = widget.config[key]
      }
    })
  }

  if (Object.keys(props).length > 0) {
    component.props = props
  }

  if (widget.children && widget.children.length > 0) {
    component.children = widget.children.map(convertWidget)
  }

  return component
}
