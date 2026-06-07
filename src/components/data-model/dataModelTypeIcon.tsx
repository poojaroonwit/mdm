import { Calendar, FileText, Hash, Link as LinkIcon, ToggleLeft, Type } from 'lucide-react'

export function getTypeIcon(type: string) {
    switch (type?.toLowerCase()) {
        case 'text':
        case 'string':
        case 'varchar':
        case 'character varying':
            return <Type className="h-4 w-4 text-blue-500" />
        case 'integer':
        case 'int':
        case 'bigint':
        case 'number':
            return <Hash className="h-4 w-4 text-green-500" />
        case 'boolean':
        case 'bool':
            return <ToggleLeft className="h-4 w-4 text-purple-500" />
        case 'date':
        case 'timestamp':
        case 'datetime':
            return <Calendar className="h-4 w-4 text-orange-500" />
        case 'reference':
        case 'relation':
            return <LinkIcon className="h-4 w-4 text-pink-500" />
        default:
            return <FileText className="h-4 w-4 text-muted-foreground" />
    }
}
