export interface ExternalConnection {
    id: string
    name: string
    connection_type: string
    db_type: string
    host?: string
    database?: string
}

export interface DataModel {
    id: string
    name: string
    display_name: string
    slug: string
    description?: string
    source_type?: string
    external_connection_id?: string
    attributes?: Attribute[]
}

export interface Attribute {
    id: string
    name: string
    display_name: string
    type: string
    is_required?: boolean
    is_unique?: boolean
}

export interface TableInfo {
    table_name: string
    table_schema: string
}

export interface ColumnInfo {
    column_name: string
    data_type: string
    is_nullable: string
    column_default?: string
}

export const BUILTIN_CONNECTION_ID = 'builtin'
export const SPACE_MEMBERS_MODEL_ID = 'system-space-members'

export const SPACE_MEMBERS_MODEL: DataModel = {
    id: SPACE_MEMBERS_MODEL_ID,
    name: 'space_members',
    display_name: 'Space Members',
    slug: 'space-members',
    description: 'Members of this space',
    source_type: 'SYSTEM'
}

export const SPACE_MEMBERS_ATTRIBUTES: Attribute[] = [
    { id: 'sm-1', name: 'id', display_name: 'ID', type: 'text', is_required: true, is_unique: true },
    { id: 'sm-2', name: 'name', display_name: 'Name', type: 'text', is_required: true },
    { id: 'sm-3', name: 'email', display_name: 'Email', type: 'text', is_required: true, is_unique: true },
    { id: 'sm-4', name: 'role', display_name: 'Role', type: 'text', is_required: true },
    { id: 'sm-5', name: 'joined_at', display_name: 'Joined At', type: 'datetime' },
    { id: 'sm-6', name: 'avatar_url', display_name: 'Avatar URL', type: 'text' },
    { id: 'sm-7', name: 'status', display_name: 'Status', type: 'text' }
]
