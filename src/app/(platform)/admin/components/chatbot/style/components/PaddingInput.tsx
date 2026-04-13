'use client'

import type { Chatbot } from '../../types'
import { MultiSideInput } from './MultiSideInput'

interface PaddingInputProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
  label: string
}

export function PaddingInput({
  formData,
  setFormData,
  label,
}: PaddingInputProps) {
  return (
    <MultiSideInput
      formData={formData}
      setFormData={setFormData}
      label={label}
      baseKey="botBubblePadding"
      defaultValue="12px"
      type="sides"
    />
  )
}

