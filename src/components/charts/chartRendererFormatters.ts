export function createChartFormatters(config: any) {
  const getDisplayName = (attrName: string, dimKey?: string): string => {
    if (!config?.chartDimensionDisplayNames || !attrName) return attrName

    if (dimKey && config.chartDimensionDisplayNames[dimKey]?.[attrName]) {
      return config.chartDimensionDisplayNames[dimKey][attrName]
    }

    for (const dim of Object.keys(config.chartDimensionDisplayNames)) {
      if (config.chartDimensionDisplayNames[dim]?.[attrName]) {
        return config.chartDimensionDisplayNames[dim][attrName]
      }
    }

    return attrName
  }

  const getAttributeStyle = (attrName: string, dimKey?: string): any => {
    if (!config?.chartDimensionTypeSettings || !attrName) return {}

    if (dimKey && config.chartDimensionTypeSettings[dimKey]?.[attrName]?.style) {
      return config.chartDimensionTypeSettings[dimKey][attrName].style
    }

    for (const dim of Object.keys(config.chartDimensionTypeSettings)) {
      if (config.chartDimensionTypeSettings[dim]?.[attrName]?.style) {
        return config.chartDimensionTypeSettings[dim][attrName].style
      }
    }

    return {}
  }

  const getAttributeTypeSettings = (attrName: string, dimKey?: string): any => {
    if (!config?.chartDimensionTypeSettings || !attrName) return {}

    if (dimKey && config.chartDimensionTypeSettings[dimKey]?.[attrName]) {
      return config.chartDimensionTypeSettings[dimKey][attrName]
    }

    for (const dim of Object.keys(config.chartDimensionTypeSettings)) {
      if (config.chartDimensionTypeSettings[dim]?.[attrName]) {
        return config.chartDimensionTypeSettings[dim][attrName]
      }
    }

    return {}
  }

  const formatLabelWithType = (attrName: string, dimKey?: string): string => {
    const displayName = getDisplayName(attrName, dimKey)
    if (displayName !== attrName) return displayName

    if (!config?.chartDimensionsEffectiveTypes || !attrName) return attrName

    let effectiveType: string | undefined
    if (dimKey && config.chartDimensionsEffectiveTypes[dimKey]?.[attrName]) {
      effectiveType = config.chartDimensionsEffectiveTypes[dimKey][attrName]
    } else {
      for (const dim of Object.keys(config.chartDimensionsEffectiveTypes)) {
        if (config.chartDimensionsEffectiveTypes[dim]?.[attrName]) {
          effectiveType = config.chartDimensionsEffectiveTypes[dim][attrName]
          break
        }
      }
    }

    return effectiveType ? `${attrName} [${effectiveType}]` : attrName
  }

  const formatNumber = (value: number | string, attrName?: string, dimKey?: string): string => {
    if (value === null || value === undefined || value === '') return ''

    const num = typeof value === 'string' ? parseFloat(value) : value
    if (isNaN(num)) return String(value)

    if (attrName) {
      const typeSettings = getAttributeTypeSettings(attrName, dimKey)
      if (typeSettings.format === 'percent') {
        const decimals = config?.numberFormat?.decimalPlaces ?? 2
        return `${(num * 100).toFixed(decimals)}%`
      }
      if (typeSettings.format === 'currency') {
        const decimals = config?.numberFormat?.decimalPlaces ?? 2
        const symbol = config?.numberFormat?.currencySymbol || '$'
        const useSeparator = config?.numberFormat?.thousandsSeparator ?? true
        let formatted = num.toFixed(decimals)
        if (useSeparator) {
          formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        }
        return `${symbol}${formatted}`
      }
    }

    const formatConfig = config?.numberFormat
    if (!formatConfig || formatConfig.type === 'auto') {
      return String(num)
    }

    const decimals = formatConfig.decimalPlaces ?? 2
    const useSeparator = formatConfig.thousandsSeparator ?? true

    switch (formatConfig.type) {
      case 'currency': {
        let formatted = num.toFixed(decimals)
        if (useSeparator) {
          formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        }
        return `${formatConfig.currencySymbol || '$'}${formatted}`
      }
      case 'percentage':
        return `${(num * 100).toFixed(decimals)}%`
      case 'scientific':
        return num.toExponential(decimals)
      case 'number':
      default: {
        let formatted = num.toFixed(decimals)
        if (useSeparator) {
          formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
        }
        return formatted
      }
    }
  }

  return {
    formatLabelWithType,
    formatNumber,
    getAttributeStyle,
  }
}
