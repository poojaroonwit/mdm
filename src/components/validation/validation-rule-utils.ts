import type { ValidationRule } from './ValidationRulesBuilder'

export function validateRule(rule: ValidationRule): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!rule.name.trim()) {
    errors.push('Rule name is required')
  }

  if (!rule.errorMessage.trim()) {
    errors.push('Error message is required')
  }

  switch (rule.type) {
    case 'min_length':
      if (!rule.config.minLength || rule.config.minLength < 0) {
        errors.push('Minimum length must be a positive number')
      }
      break
    case 'max_length':
      if (!rule.config.maxLength || rule.config.maxLength < 0) {
        errors.push('Maximum length must be a positive number')
      }
      break
    case 'pattern':
      if (!rule.config.pattern) {
        errors.push('Pattern is required')
      } else {
        try {
          new RegExp(rule.config.pattern)
        } catch {
          errors.push('Invalid regular expression')
        }
      }
      break
    case 'range':
      if (rule.config.minValue !== undefined && rule.config.maxValue !== undefined) {
        if (rule.config.minValue >= rule.config.maxValue) {
          errors.push('Minimum value must be less than maximum value')
        }
      }
      break
    case 'custom':
      if (!rule.config.code) {
        errors.push('Custom validation code is required')
      }
      break
  }

  return { valid: errors.length === 0, errors }
}
