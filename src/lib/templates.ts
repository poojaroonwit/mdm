export interface DataModelTemplate {
  id: string
  name: string
  description: string
  category: string
  icon: string
  color: string
  attributes: AttributeTemplate[]
  isSystem: boolean
  tags: string[]
}

export interface AttributeTemplate {
  name: string
  display_name: string
  type: string
  description: string
  is_required: boolean
  is_unique: boolean
  default_value?: string
  validation_rules?: any
  options?: any[]
  order: number
}

export const DATA_MODEL_TEMPLATES: DataModelTemplate[] = [
  {
    id: 'crm_customer',
    name: 'CRM Customer',
    description: 'Complete customer management system with contact info, status tracking, and sales pipeline',
    category: 'CRM',
    icon: 'Users',
    color: 'bg-blue-500',
    isSystem: true,
    tags: ['crm', 'customer', 'sales', 'business'],
    attributes: [
      {
        name: 'customer_id',
        display_name: 'Customer ID',
        type: 'text',
        description: 'Unique customer identifier',
        is_required: true,
        is_unique: true,
        order: 1
      },
      {
        name: 'company_name',
        display_name: 'Company Name',
        type: 'text',
        description: 'Name of the customer company',
        is_required: true,
        is_unique: false,
        order: 2
      },
      {
        name: 'contact_person',
        display_name: 'Contact Person',
        type: 'text',
        description: 'Primary contact person name',
        is_required: true,
        is_unique: false,
        order: 3
      },
      {
        name: 'email',
        display_name: 'Email Address',
        type: 'email',
        description: 'Primary email address',
        is_required: true,
        is_unique: true,
        order: 4
      },
      {
        name: 'phone',
        display_name: 'Phone Number',
        type: 'text',
        description: 'Primary phone number',
        is_required: false,
        is_unique: false,
        order: 5
      },
      {
        name: 'status',
        display_name: 'Customer Status',
        type: 'select',
        description: 'Current customer status',
        is_required: true,
        is_unique: false,
        options: [
          { value: 'lead', label: 'Lead', color: '#1e40af' },
          { value: 'prospect', label: 'Prospect', color: '#10B981' },
          { value: 'customer', label: 'Customer', color: '#F59E0B' },
          { value: 'inactive', label: 'Inactive', color: '#6B7280' }
        ],
        order: 6
      },
      {
        name: 'created_date',
        display_name: 'Created Date',
        type: 'date',
        description: 'Date when customer was added',
        is_required: true,
        is_unique: false,
        default_value: 'now()',
        order: 7
      }
    ]
  },
  {
    id: 'inventory_product',
    name: 'Product Inventory',
    description: 'Product catalog with inventory tracking, pricing, and supplier information',
    category: 'Inventory',
    icon: 'Package',
    color: 'bg-green-500',
    isSystem: true,
    tags: ['inventory', 'product', 'catalog', 'ecommerce'],
    attributes: [
      {
        name: 'product_id',
        display_name: 'Product ID',
        type: 'text',
        description: 'Unique product identifier',
        is_required: true,
        is_unique: true,
        order: 1
      },
      {
        name: 'product_name',
        display_name: 'Product Name',
        type: 'text',
        description: 'Name of the product',
        is_required: true,
        is_unique: false,
        order: 2
      },
      {
        name: 'description',
        display_name: 'Description',
        type: 'textarea',
        description: 'Detailed product description',
        is_required: false,
        is_unique: false,
        order: 3
      },
      {
        name: 'category',
        display_name: 'Category',
        type: 'select',
        description: 'Product category',
        is_required: true,
        is_unique: false,
        options: [
          { value: 'electronics', label: 'Electronics', color: '#1e40af' },
          { value: 'clothing', label: 'Clothing', color: '#10B981' },
          { value: 'books', label: 'Books', color: '#F59E0B' },
          { value: 'home', label: 'Home & Garden', color: '#8B5CF6' }
        ],
        order: 4
      },
      {
        name: 'price',
        display_name: 'Price',
        type: 'number',
        description: 'Product price',
        is_required: true,
        is_unique: false,
        order: 5
      },
      {
        name: 'stock_quantity',
        display_name: 'Stock Quantity',
        type: 'number',
        description: 'Current stock quantity',
        is_required: true,
        is_unique: false,
        default_value: '0',
        order: 6
      },
      {
        name: 'supplier',
        display_name: 'Supplier',
        type: 'text',
        description: 'Product supplier name',
        is_required: false,
        is_unique: false,
        order: 7
      }
    ]
  },
  {
    id: 'project_management',
    name: 'Project Management',
    description: 'Project tracking with tasks, deadlines, and team assignments',
    category: 'Project Management',
    icon: 'Calendar',
    color: 'bg-purple-500',
    isSystem: true,
    tags: ['project', 'management', 'tasks', 'team'],
    attributes: [
      {
        name: 'project_id',
        display_name: 'Project ID',
        type: 'text',
        description: 'Unique project identifier',
        is_required: true,
        is_unique: true,
        order: 1
      },
      {
        name: 'project_name',
        display_name: 'Project Name',
        type: 'text',
        description: 'Name of the project',
        is_required: true,
        is_unique: false,
        order: 2
      },
      {
        name: 'description',
        display_name: 'Description',
        type: 'textarea',
        description: 'Project description and objectives',
        is_required: false,
        is_unique: false,
        order: 3
      },
      {
        name: 'status',
        display_name: 'Status',
        type: 'select',
        description: 'Current project status',
        is_required: true,
        is_unique: false,
        options: [
          { value: 'planning', label: 'Planning', color: '#1e40af' },
          { value: 'active', label: 'Active', color: '#10B981' },
          { value: 'on_hold', label: 'On Hold', color: '#F59E0B' },
          { value: 'completed', label: 'Completed', color: '#6B7280' }
        ],
        order: 4
      },
      {
        name: 'start_date',
        display_name: 'Start Date',
        type: 'date',
        description: 'Project start date',
        is_required: true,
        is_unique: false,
        order: 5
      },
      {
        name: 'end_date',
        display_name: 'End Date',
        type: 'date',
        description: 'Project end date',
        is_required: false,
        is_unique: false,
        order: 6
      },
      {
        name: 'project_manager',
        display_name: 'Project Manager',
        type: 'user',
        description: 'Assigned project manager',
        is_required: true,
        is_unique: false,
        order: 7
      }
    ]
  },
  {
    id: 'employee_directory',
    name: 'Employee Directory',
    description: 'Employee information with departments, roles, and contact details',
    category: 'HR',
    icon: 'User',
    color: 'bg-orange-500',
    isSystem: true,
    tags: ['hr', 'employee', 'directory', 'organization'],
    attributes: [
      {
        name: 'employee_id',
        display_name: 'Employee ID',
        type: 'text',
        description: 'Unique employee identifier',
        is_required: true,
        is_unique: true,
        order: 1
      },
      {
        name: 'first_name',
        display_name: 'First Name',
        type: 'text',
        description: 'Employee first name',
        is_required: true,
        is_unique: false,
        order: 2
      },
      {
        name: 'last_name',
        display_name: 'Last Name',
        type: 'text',
        description: 'Employee last name',
        is_required: true,
        is_unique: false,
        order: 3
      },
      {
        name: 'email',
        display_name: 'Email',
        type: 'email',
        description: 'Employee email address',
        is_required: true,
        is_unique: true,
        order: 4
      },
      {
        name: 'department',
        display_name: 'Department',
        type: 'select',
        description: 'Employee department',
        is_required: true,
        is_unique: false,
        options: [
          { value: 'engineering', label: 'Engineering', color: '#1e40af' },
          { value: 'marketing', label: 'Marketing', color: '#10B981' },
          { value: 'sales', label: 'Sales', color: '#F59E0B' },
          { value: 'hr', label: 'Human Resources', color: '#8B5CF6' }
        ],
        order: 5
      },
      {
        name: 'position',
        display_name: 'Position',
        type: 'text',
        description: 'Employee job title',
        is_required: true,
        is_unique: false,
        order: 6
      },
      {
        name: 'hire_date',
        display_name: 'Hire Date',
        type: 'date',
        description: 'Date when employee was hired',
        is_required: true,
        is_unique: false,
        order: 7
      }
    ]
  }
]

export const ATTRIBUTE_PRESETS: Record<string, AttributeTemplate[]> = {
  'contact_info': [
    {
      name: 'email',
      display_name: 'Email Address',
      type: 'email',
      description: 'Email address with validation',
      is_required: true,
      is_unique: true,
      order: 1
    },
    {
      name: 'phone',
      display_name: 'Phone Number',
      type: 'text',
      description: 'Phone number',
      is_required: false,
      is_unique: false,
      order: 2
    },
    {
      name: 'address',
      display_name: 'Address',
      type: 'textarea',
      description: 'Full address',
      is_required: false,
      is_unique: false,
      order: 3
    }
  ],
  'status_tracking': [
    {
      name: 'status',
      display_name: 'Status',
      type: 'select',
      description: 'Current status',
      is_required: true,
      is_unique: false,
      options: [
        { value: 'active', label: 'Active', color: '#10B981' },
        { value: 'inactive', label: 'Inactive', color: '#6B7280' },
        { value: 'pending', label: 'Pending', color: '#F59E0B' }
      ],
      order: 1
    },
    {
      name: 'last_updated',
      display_name: 'Last Updated',
      type: 'datetime',
      description: 'Last update timestamp',
      is_required: true,
      is_unique: false,
      default_value: 'now()',
      order: 2
    }
  ],
  'audit_fields': [
    {
      name: 'created_at',
      display_name: 'Created At',
      type: 'datetime',
      description: 'Record creation timestamp',
      is_required: true,
      is_unique: false,
      default_value: 'now()',
      order: 1
    },
    {
      name: 'updated_at',
      display_name: 'Updated At',
      type: 'datetime',
      description: 'Last update timestamp',
      is_required: true,
      is_unique: false,
      default_value: 'now()',
      order: 2
    },
    {
      name: 'created_by',
      display_name: 'Created By',
      type: 'user',
      description: 'User who created the record',
      is_required: true,
      is_unique: false,
      order: 3
    }
  ]
}

export class TemplateManager {
  private templates: DataModelTemplate[]
  private presets: Record<string, AttributeTemplate[]>

  constructor() {
    this.templates = DATA_MODEL_TEMPLATES
    this.presets = ATTRIBUTE_PRESETS
  }

  getTemplatesByCategory(category: string): DataModelTemplate[] {
    return this.templates.filter(t => t.category === category)
  }

  getTemplateById(id: string): DataModelTemplate | undefined {
    return this.templates.find(t => t.id === id)
  }

  getTemplatesByTag(tag: string): DataModelTemplate[] {
    return this.templates.filter(t => t.tags.includes(tag))
  }

  getPresetAttributes(presetName: string): AttributeTemplate[] {
    return this.presets[presetName] || []
  }

  getAvailablePresets(): string[] {
    return Object.keys(this.presets)
  }

  createCustomTemplate(template: Omit<DataModelTemplate, 'id' | 'isSystem'>): DataModelTemplate {
    const newTemplate: DataModelTemplate = {
      ...template,
      id: `custom_${Date.now()}`,
      isSystem: false
    }
    this.templates.push(newTemplate)
    return newTemplate
  }

  getCategories(): string[] {
    return Array.from(new Set(this.templates.map(t => t.category)))
  }

  searchTemplates(query: string): DataModelTemplate[] {
    const lowercaseQuery = query.toLowerCase()
    return this.templates.filter(t => 
      t.name.toLowerCase().includes(lowercaseQuery) ||
      t.description.toLowerCase().includes(lowercaseQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
    )
  }
}

export const templateManager = new TemplateManager()
