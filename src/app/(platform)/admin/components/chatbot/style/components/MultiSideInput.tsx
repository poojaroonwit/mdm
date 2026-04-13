'use client'

import type { Chatbot } from '../../types'
import { MultiSideInput as SharedMultiSideInput } from '@/components/shared/MultiSideInput'

interface MultiSideInputProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
  label: string
  baseKey: string
  defaultValue?: string
  type?: 'sides' | 'corners'
}

export function MultiSideInput({
  formData,
  setFormData,
  label,
  baseKey,
  defaultValue = '0px',
  type = 'sides',
}: MultiSideInputProps) {
  return (
    <SharedMultiSideInput
      label={label}
      baseKey={baseKey}
      type={type}
      defaultValue={defaultValue}
      getValue={(side: string) => {
        const key = `${baseKey}${side.charAt(0).toUpperCase() + side.slice(1)}` as keyof Chatbot
        const baseValue = formData[baseKey as keyof typeof formData] as string || defaultValue
        return formData[key as keyof typeof formData] as string || baseValue
      }}
      setValue={(updates) => {
        setFormData({ ...formData, ...updates })
      }}
    />
  )
}

