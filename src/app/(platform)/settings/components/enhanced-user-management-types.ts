export interface User {
  id: string
  email: string
  name: string
  role: string
  is_active: boolean
  avatar?: string
  created_at: string
  updated_at: string
  default_space_id?: string
  default_space_name?: string
  spaces: Array<{
    id: string
    space_id: string
    role: string
    created_at: string
    space_name: string
    space_description?: string
    space_is_default: boolean
    space_is_active: boolean
  }>
}

export interface Space {
  id: string
  name: string
  description?: string
  is_default: boolean
  is_active: boolean
}

export interface EditUserForm {
  name: string
  email: string
  role: string
  is_active: boolean
  default_space_id: string
  spaces: Array<{ space_id: string; role: string }>
}
