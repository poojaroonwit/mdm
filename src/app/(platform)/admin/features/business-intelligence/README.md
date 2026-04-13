# Business Intelligence Feature

This feature contains all business intelligence, AI analytics, chatbot management, and kernel management functionality.

## Structure

```
business-intelligence/
├── components/
│   ├── BusinessIntelligence.tsx  # BI dashboards and reports
│   ├── AIAnalyst.tsx            # AI-powered analytics
│   ├── AIChatUI.tsx             # Chatbot management
│   └── KernelManagement.tsx     # Kernel server management
├── types.ts                     # Shared type definitions
├── utils.ts                     # Utility functions
├── index.ts                     # Public exports
└── README.md                    # This file
```

## Components

### BusinessIntelligence
- Dashboard management
- Report generation and scheduling
- Data source configuration
- Chart templates
- Widget configuration

### AIAnalyst
- AI-powered data analysis
- Natural language queries
- Automated insights
- Data visualization suggestions

### AIChatUI
- Chatbot creation and management
- Chatbot configuration
- Chatbot deployment
- Chatbot versioning

### KernelManagement
- Kernel server management
- Kernel templates
- Kernel health monitoring
- Kernel authentication
- Kernel environment configuration

## Usage

```typescript
// Import components
import {
  BusinessIntelligence,
  AIAnalyst,
  AIChatUI,
  KernelManagement,
} from '@/app/admin/features/business-intelligence'

// Import types
import { Dashboard, Report, KernelServer } from '@/app/admin/features/business-intelligence'

// Import utilities
import { isDashboardPublic, getKernelStatusColor, filterKernelsByStatus } from '@/app/admin/features/business-intelligence'
```

## Types

- `Dashboard` - Dashboard configuration
- `DashboardWidget` - Dashboard widget configuration
- `FilterConfig` - Filter configuration
- `Report` - Report configuration
- `DataSource` - Data source configuration
- `ChartTemplate` - Chart template configuration
- `KernelServer` - Kernel server configuration
- `KernelTemplate` - Kernel template configuration

## Utilities

- `isDashboardPublic(dashboard)` - Check if dashboard is public
- `filterDashboardsBySpace(dashboards, spaceId)` - Filter dashboards by space
- `sortDashboardsByName(dashboards, order)` - Sort dashboards by name
- `isReportActive(report)` - Check if report is active
- `isReportScheduled(report)` - Check if report is scheduled
- `filterReportsBySpace(reports, spaceId)` - Filter reports by space
- `formatReportFormat(format)` - Format report format display name
- `isDataSourceActive(dataSource)` - Check if data source is active
- `filterDataSourcesByType(dataSources, type)` - Filter data sources by type
- `getKernelStatusColor(status)` - Get kernel status badge color
- `isKernelOnline(kernel)` - Check if kernel is online
- `filterKernelsByStatus(kernels, status)` - Filter kernels by status
- `filterKernelsByLanguage(kernels, language)` - Filter kernels by language

## Migration Notes

This feature was migrated from `src/app/admin/components/` to demonstrate the new feature-based structure. All imports have been updated to use the new location.

Note: `AIChatUI` references chatbot components from `src/app/admin/components/chatbot/` which remain in the shared components directory.

