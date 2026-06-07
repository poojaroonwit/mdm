import React from 'react'

export function createTableWidgetRenderHelpers(
  props: any,
  displayNames: Record<string, Record<string, string>>,
  typeSettings: Record<string, Record<string, any>>
) {  const getDisplayName = (attrName: string, dimKey?: string): string => {
    if (dimKey && displayNames[dimKey] && displayNames[dimKey][attrName]) {
      return displayNames[dimKey][attrName]
    }
    // Search all dimensions
    for (const key of Object.keys(displayNames)) {
      if (displayNames[key] && displayNames[key][attrName]) {
        return displayNames[key][attrName]
      }
    }
    return attrName
  }

  // Calculate min/max per attribute for proper scaling (best practice: scale per column)
  const calculateMinMax = (data: any[], attrNames: string[]): Record<string, { min: number; max: number }> => {
    const result: Record<string, { min: number; max: number }> = {}
    attrNames.forEach(attr => {
      const nums = data
        .map(row => {
          const val = row[attr]
          const n = typeof val === 'number' ? val : parseFloat(String(val))
          return isFinite(n) ? n : null
        })
        .filter((n): n is number => n !== null)
      if (nums.length > 0) {
        result[attr] = { min: Math.min(...nums), max: Math.max(...nums) }
      }
    })
    return result
  }

  const getAttrStyleConfig = (attrName: string, isValue: boolean): any => {
    // Prefer settings from the dimension where the attribute is placed
    const sources: string[] = isValue ? ['values', 'rows', 'columns'] : ['rows', 'columns', 'values']
    for (const key of sources) {
      const s = (typeSettings[key] && typeSettings[key][attrName] && typeSettings[key][attrName].style) || undefined
      if (s) return s
    }
    return {}
  }

  // Get dimension-level styles (applies to all attributes in that dimension)
  const getDimensionStyle = (dimKey: 'rows' | 'columns' | 'values'): any => {
    return (props.chartDimensionStyles && props.chartDimensionStyles[dimKey]) || {}
  }

  // Evaluate conditional formatting rules and return matching rule
  const evaluateConditionalFormatting = (cellValue: any, attrName: string, rowData: any, allRowData: any[]): any => {
    const rules = (props.conditionalFormattingRules || []) as any[]
    if (!rules.length) return null

    for (const rule of rules) {
      if (!rule.attribute || rule.attribute !== attrName) continue

      let matches = false
      const value = cellValue
      const ruleValue = rule.value
      const ruleValue2 = rule.value2

      switch (rule.condition) {
        case 'equals':
          matches = String(value) === String(ruleValue)
          break
        case 'not_equals':
          matches = String(value) !== String(ruleValue)
          break
        case 'greater_than':
          matches = Number(value) > Number(ruleValue)
          break
        case 'less_than':
          matches = Number(value) < Number(ruleValue)
          break
        case 'greater_or_equal':
          matches = Number(value) >= Number(ruleValue)
          break
        case 'less_or_equal':
          matches = Number(value) <= Number(ruleValue)
          break
        case 'between':
          matches = Number(value) >= Number(ruleValue) && Number(value) <= Number(ruleValue2 || ruleValue)
          break
        case 'contains':
          matches = String(value || '').toLowerCase().includes(String(ruleValue || '').toLowerCase())
          break
        case 'not_contains':
          matches = !String(value || '').toLowerCase().includes(String(ruleValue || '').toLowerCase())
          break
        case 'is_empty':
          matches = value === null || value === undefined || value === ''
          break
        case 'is_not_empty':
          matches = value !== null && value !== undefined && value !== ''
          break
        default:
          matches = false
      }

      if (matches) {
        return rule
      }
    }

    return null
  }

  // Helper to format numbers in table cells based on attribute type settings
  const formatCellNumber = (num: number | string, attrName: string, isValueCell: boolean): string => {
    if (typeof num === 'string') {
      const parsed = parseFloat(num)
      if (isNaN(parsed)) return num
      num = parsed
    }
    if (!isFinite(num)) return String(num)
    
    // Get attribute type settings
    const sources: string[] = isValueCell ? ['values', 'rows', 'columns'] : ['rows', 'columns', 'values']
    for (const key of sources) {
      const settings = (typeSettings[key] && typeSettings[key][attrName]) || undefined
      if (settings) {
        // Check for percent format
        if (settings.format === 'percent') {
          const decimals = 2
          return `${(num * 100).toFixed(decimals)}%`
        }
        // Check for currency format
        if (settings.format === 'currency') {
          const decimals = 2
          const symbol = '$'
          const formatted = num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
          return `${symbol}${formatted}`
        }
      }
    }
    
    // Check dimension-level number format
    const dimKey = isValueCell ? 'values' : 'rows'
    const dimStyle = getDimensionStyle(dimKey)
    if (dimStyle.numberFormat === 'percent') {
      const decimals = 2
      return `${(num * 100).toFixed(decimals)}%`
    }
    if (dimStyle.numberFormat === 'currency') {
      const decimals = 2
      const symbol = '$'
      const formatted = num.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
      return `${symbol}${formatted}`
    }
    
    // Default: format with thousands separator if large number
    if (Math.abs(num) >= 1000) {
      return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
    }
    
    return String(num)
  }

  const renderCellContent = (rawValue: any, attrName: string, isValueCell: boolean, minMax?: { min: number; max: number }, rowData?: any, allRowData?: any[]) => {
    const styleCfg = getAttrStyleConfig(attrName, isValueCell)
    const value = rawValue
    const isEmpty = value === undefined || value === null || value === ''

    // Handle empty values
    if (isEmpty) {
      return <span className="text-muted-foreground/50">—</span>
    }

    // Format number if it's a numeric value
    const num = typeof value === 'number' ? value : parseFloat(String(value))
    const isNumeric = isFinite(num)
    const strValue = isNumeric ? formatCellNumber(num, attrName, isValueCell) : String(value)
    
    // Check conditional formatting
    const condRule = allRowData ? evaluateConditionalFormatting(value, attrName, rowData || {}, allRowData) : null
    
    // Auto-detect links if link mode is enabled
    let textEl: React.ReactNode = strValue
    if (styleCfg.link === 'url' || (styleCfg.link === 'none' && /^https?:\/\//i.test(strValue))) {
      textEl = <a href={strValue} target="_blank" rel="noreferrer" className="text-primary hover:underline">{strValue}</a>
    } else if (styleCfg.link === 'email' || (styleCfg.link === 'none' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strValue))) {
      textEl = <a href={`mailto:${strValue}`} className="text-primary hover:underline">{strValue}</a>
    }

    // Badge styling
    if (styleCfg.badge && styleCfg.badge !== 'none') {
      const badgeClass = styleCfg.badge === 'pill' ? 'rounded-full' : 'rounded-[2px]'
      const bgColor = styleCfg.background || (styleCfg.badge === 'pill' ? '#e5e7eb' : '#f3f4f6')
      const textColor = styleCfg.color || '#111827'
      textEl = (
        <span className={`inline-flex items-center ${badgeClass} px-2 py-0.5 text-[10px] font-medium`}
          style={{ background: bgColor, color: textColor }}
        >{strValue}</span>
      )
    }

    // Value visualizations (best practice: scale per column using min/max)
    if (isValueCell && styleCfg.valueViz && styleCfg.valueViz !== 'none') {
      const num = Number(value)
      const isValidNum = isFinite(num)
      const color = styleCfg.valueColor || '#1e40af'
      const showNumber = styleCfg.valueShowNumber !== false
      
      if (isValidNum && minMax && minMax.min !== undefined && minMax.max !== undefined) {
        const range = minMax.max - minMax.min
        const pct = range > 0 ? Math.min(100, Math.max(0, ((num - minMax.min) / range) * 100)) : 50
        
        // Data bar (best practice: horizontal bar in cell)
        if (styleCfg.valueViz === 'data_bar') {
          return (
            <div className="relative w-full flex items-center gap-2">
              <div className="flex-1 h-4 bg-muted rounded-[2px] overflow-hidden">
                <div className="h-full rounded-[2px]" style={{ width: `${pct}%`, background: color }} />
              </div>
              {showNumber && <span className="text-xs font-medium">{textEl}</span>}
            </div>
          )
        }
        
        // Color scale (best practice: gradient background)
        if (styleCfg.valueViz === 'color_scale') {
          const intensity = pct / 100
          // Handle both hex and rgba colors
          let r = 59, g = 130, b = 246 // default blue
          if (color.startsWith('#')) {
            const hex = color.replace('#', '')
            r = parseInt(hex.substring(0, 2), 16)
            g = parseInt(hex.substring(2, 4), 16)
            b = parseInt(hex.substring(4, 6), 16)
          } else if (color.startsWith('rgb')) {
            const match = color.match(/\d+/g)
            if (match && match.length >= 3) {
              r = parseInt(match[0])
              g = parseInt(match[1])
              b = parseInt(match[2])
            }
          }
          const bgColor = `rgba(${r}, ${g}, ${b}, ${0.1 + intensity * 0.3})`
          return (
            <div className="w-full rounded-[2px] px-2 py-1" style={{ background: bgColor }}>
              {showNumber ? textEl : null}
            </div>
          )
        }
        
        // Icon set (best practice: thresholds-based icons)
        if (styleCfg.valueViz === 'icon_set') {
          const isGood = pct >= 70
          const isWarning = pct >= 30 && pct < 70
          const isBad = pct < 30
          const icon = isGood ? '▲' : isBad ? '▼' : '●'
          const iconColor = isGood ? '#10b981' : isBad ? '#ef4444' : '#f59e0b'
          return (
            <span className="inline-flex items-center gap-1.5">
              <span style={{ color: iconColor, fontSize: 12, lineHeight: 1 }}>{icon}</span>
              {showNumber ? <span>{textEl}</span> : null}
            </span>
          )
        }
      }
    }

    // Apply conditional formatting text color if rule matches
    if (condRule && condRule.textColor) {
      textEl = <span style={{ color: condRule.textColor }}>{textEl}</span>
    }

    return textEl
  }
  return {
    getDisplayName,
    calculateMinMax,
    getAttrStyleConfig,
    getDimensionStyle,
    evaluateConditionalFormatting,
    renderCellContent,
  }
}
