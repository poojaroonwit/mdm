import type { Chatbot } from '../../types'

export interface SectionProps {
  formData: Partial<Chatbot>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Chatbot>>>
  chatkitOptions: any
}

