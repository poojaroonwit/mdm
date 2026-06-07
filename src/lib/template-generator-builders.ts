import { v4 as uuidv4 } from 'uuid'

import type { DataModel, Template } from './template-generator-types'

export function buildEntityTableTemplate(dataModel: DataModel): Template {
  const templateId = uuidv4()
  const pageId = uuidv4()
  const tableComponentId = uuidv4()
  const headerComponentId = uuidv4()
  const filtersComponentId = uuidv4()
  const paginationComponentId = uuidv4()

  const sidebarItems = [
    {
      id: uuidv4(),
      type: 'page' as const,
      name: dataModel.display_name,
      icon: 'Table',
      color: '#1e40af',
      pageId
    },
    {
      id: uuidv4(),
      type: 'divider' as const,
      name: '',
      icon: '',
      color: ''
    },
    {
      id: uuidv4(),
      type: 'page' as const,
      name: 'Dashboard',
      icon: 'BarChart3',
      color: '#10b981',
      pageId: uuidv4()
    },
    {
      id: uuidv4(),
      type: 'page' as const,
      name: 'Analytics',
      icon: 'TrendingUp',
      color: '#f59e0b',
      pageId: uuidv4()
    }
  ]

  const pageComponents = [
    {
      id: headerComponentId,
      type: 'header',
      x: 20,
      y: 20,
      width: 1160,
      height: 80,
      config: {
        title: dataModel.display_name,
        subtitle: dataModel.description || `Manage ${dataModel.display_name.toLowerCase()} records`,
        showBreadcrumb: true,
        showActions: true,
        actions: [
          { type: 'create', label: 'Add New', icon: 'Plus' },
          { type: 'import', label: 'Import', icon: 'Upload' },
          { type: 'export', label: 'Export', icon: 'Download' }
        ],
        styling: {
          backgroundColor: '#ffffff',
          borderColor: '#e5e7eb',
          textColor: '#111827',
          fontSize: '16px',
          fontWeight: '600'
        }
      }
    },
    {
      id: filtersComponentId,
      type: 'filters',
      x: 20,
      y: 120,
      width: 1160,
      height: 60,
      config: {
        showSearch: true,
        showFilters: true,
        showViewToggle: true,
        showDensityToggle: true,
        searchPlaceholder: `Search ${dataModel.display_name.toLowerCase()}...`,
        filters: dataModel.attributes.slice(0, 5).map(attr => ({
          id: attr.id,
          name: attr.name,
          displayName: attr.display_name,
          type: attr.type,
          enabled: true
        })),
        styling: {
          backgroundColor: '#f9fafb',
          borderColor: '#e5e7eb',
          textColor: '#374151'
        }
      }
    },
    {
      id: tableComponentId,
      type: 'data-table',
      x: 20,
      y: 200,
      width: 1160,
      height: 600,
      config: {
        dataSource: dataModel.id,
        displayMode: 'table',
        layoutColumns: '1',
        density: 'normal',
        showHeaders: true,
        showBorders: true,
        alternatingRows: true,
        pagination: {
          enabled: true,
          pageSize: 20,
          showPageSizeSelector: true,
          showPageInfo: true
        },
        sorting: {
          enabled: true,
          multiColumn: false
        },
        filtering: {
          enabled: true,
          showColumnFilters: true
        },
        actions: {
          allowCreate: true,
          allowEdit: true,
          allowDelete: true,
          allowExport: true,
          allowImport: true,
          allowBulkActions: true
        },
        columns: dataModel.attributes.map(attr => ({
          id: attr.id,
          name: attr.name,
          displayName: attr.display_name,
          type: attr.type,
          visible: true,
          sortable: true,
          filterable: true,
          width: getDefaultColumnWidth(attr.type)
        })),
        recordConfig: {
          dataSource: dataModel.id,
          fields: dataModel.attributes.map(attr => ({
            id: attr.id,
            name: attr.name,
            displayName: attr.display_name,
            type: attr.type,
            visible: true,
            editable: !attr.required,
            required: attr.required
          })),
          layout: {
            displayMode: 'page',
            layoutColumns: '2',
            density: 'normal',
            showHeaders: true,
            showBorders: true,
            alternatingRows: true
          },
          display: {
            pagination: {
              enabled: true,
              pageSize: 20,
              showPageSizeSelector: true,
              showPageInfo: true
            },
            sorting: {
              enabled: true,
              multiColumn: false
            },
            filtering: {
              enabled: true,
              showColumnFilters: true
            },
            actions: {
              allowCreate: true,
              allowEdit: true,
              allowDelete: true,
              allowExport: true,
              allowImport: true,
              allowBulkActions: true
            }
          },
          styling: {
            theme: 'default',
            fontSize: '14px',
            fontFamily: 'Inter',
            borderRadius: '6px',
            colors: {
              primary: '#1e40af',
              secondary: '#6b7280',
              background: '#ffffff',
              border: '#e5e7eb'
            }
          }
        },
        styling: {
          backgroundColor: '#ffffff',
          borderColor: '#e5e7eb',
          textColor: '#111827',
          headerBackgroundColor: '#f9fafb',
          headerTextColor: '#374151',
          rowHoverColor: '#f3f4f6'
        }
      }
    },
    {
      id: paginationComponentId,
      type: 'pagination',
      x: 20,
      y: 820,
      width: 1160,
      height: 60,
      config: {
        showPageSizeSelector: true,
        showPageInfo: true,
        showJumpToPage: true,
        pageSizes: [10, 20, 50, 100],
        defaultPageSize: 20,
        styling: {
          backgroundColor: '#ffffff',
          borderColor: '#e5e7eb',
          textColor: '#374151'
        }
      }
    }
  ]

  return {
    id: templateId,
    name: `${dataModel.name}_entity_table`,
    displayName: `${dataModel.display_name} Entity Table`,
    description: `Default entity table template for ${dataModel.display_name} with full CRUD operations, filtering, sorting, and pagination`,
    category: 'Entity Management',
    dataModelId: dataModel.id,
    version: '1.0.0',
    pages: [
      {
        id: pageId,
        name: 'main',
        displayName: dataModel.display_name,
        description: `Main page for ${dataModel.display_name} management`,
        components: pageComponents,
        background: {
          type: 'color',
          color: '#ffffff'
        }
      }
    ],
    sidebarConfig: {
      items: sidebarItems,
      background: '#ffffff',
      textColor: '#374151',
      fontSize: '14px'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

export function buildDashboardTemplate(dataModel: DataModel): Template {
  const templateId = uuidv4()
  const pageId = uuidv4()

  return {
    id: templateId,
    name: `${dataModel.name}_dashboard`,
    displayName: `${dataModel.display_name} Dashboard`,
    description: `Analytics dashboard for ${dataModel.display_name} with charts and metrics`,
    category: 'Analytics',
    dataModelId: dataModel.id,
    version: '1.0.0',
    pages: [
      {
        id: pageId,
        name: 'dashboard',
        displayName: 'Dashboard',
        description: `Analytics dashboard for ${dataModel.display_name}`,
        components: [
          {
            id: uuidv4(),
            type: 'chart',
            x: 20,
            y: 20,
            width: 560,
            height: 300,
            config: {
              type: 'bar',
              title: `${dataModel.display_name} Overview`,
              dataSource: dataModel.id,
              xAxis: 'created_at',
              yAxis: 'count',
              styling: {
                backgroundColor: '#ffffff',
                borderColor: '#e5e7eb'
              }
            }
          },
          {
            id: uuidv4(),
            type: 'metric',
            x: 600,
            y: 20,
            width: 280,
            height: 150,
            config: {
              title: 'Total Records',
              dataSource: dataModel.id,
              metric: 'count',
              styling: {
                backgroundColor: '#ffffff',
                borderColor: '#e5e7eb'
              }
            }
          },
          {
            id: uuidv4(),
            type: 'metric',
            x: 900,
            y: 20,
            width: 280,
            height: 150,
            config: {
              title: 'Recent Activity',
              dataSource: dataModel.id,
              metric: 'recent_count',
              styling: {
                backgroundColor: '#ffffff',
                borderColor: '#e5e7eb'
              }
            }
          }
        ],
        background: {
          type: 'color',
          color: '#f8fafc'
        }
      }
    ],
    sidebarConfig: {
      items: [
        {
          id: uuidv4(),
          type: 'page',
          name: 'Dashboard',
          icon: 'BarChart3',
          color: '#1e40af',
          pageId
        }
      ],
      background: '#ffffff',
      textColor: '#374151',
      fontSize: '14px'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

export function buildFormTemplate(dataModel: DataModel): Template {
  const templateId = uuidv4()
  const pageId = uuidv4()

  return {
    id: templateId,
    name: `${dataModel.name}_form`,
    displayName: `${dataModel.display_name} Form`,
    description: `Form template for creating and editing ${dataModel.display_name} records`,
    category: 'Forms',
    dataModelId: dataModel.id,
    version: '1.0.0',
    pages: [
      {
        id: pageId,
        name: 'form',
        displayName: 'Form',
        description: `Form for ${dataModel.display_name}`,
        components: [
          {
            id: uuidv4(),
            type: 'form',
            x: 20,
            y: 20,
            width: 800,
            height: 600,
            config: {
              dataSource: dataModel.id,
              fields: dataModel.attributes.map(attr => ({
                id: attr.id,
                name: attr.name,
                displayName: attr.display_name,
                type: attr.type,
                required: attr.required,
                visible: true
              })),
              layout: 'vertical',
              showValidation: true,
              styling: {
                backgroundColor: '#ffffff',
                borderColor: '#e5e7eb'
              }
            }
          }
        ],
        background: {
          type: 'color',
          color: '#ffffff'
        }
      }
    ],
    sidebarConfig: {
      items: [
        {
          id: uuidv4(),
          type: 'page',
          name: 'Form',
          icon: 'FileText',
          color: '#10b981',
          pageId
        }
      ],
      background: '#ffffff',
      textColor: '#374151',
      fontSize: '14px'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
}

export function buildDefaultTemplates(dataModel: DataModel): Template[] {
  return [buildEntityTableTemplate(dataModel)]
}

function getDefaultColumnWidth(type: string): number {
  const widthMap: Record<string, number> = {
    'TEXT': 200,
    'LONG_TEXT': 300,
    'EMAIL': 250,
    'PHONE': 150,
    'URL': 250,
    'NUMBER': 120,
    'DECIMAL': 120,
    'BOOLEAN': 100,
    'DATE': 120,
    'DATETIME': 150,
    'TIME': 100,
    'SELECT': 150,
    'MULTI_SELECT': 200,
    'FILE': 150,
    'IMAGE': 150,
    'JSON': 200,
    'RELATION': 150
  }
  return widthMap[type] || 150
}
