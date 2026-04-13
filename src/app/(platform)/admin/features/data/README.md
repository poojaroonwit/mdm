# Data Management Feature

This feature contains all database, data export/import, data masking, schema migration, and SQL linting functionality.

## Structure

```
data/
├── components/
│   ├── DatabaseManagement.tsx    # Database connection management
│   ├── DataExportImport.tsx     # Data export and import jobs
│   ├── DataMasking.tsx          # Data masking rules
│   ├── DataModelManagement.tsx  # Data model management
│   ├── SchemaMigrations.tsx     # Database schema migrations
│   └── SQLLinting.tsx           # SQL query linting
├── types.ts                     # Shared type definitions
├── utils.ts                     # Utility functions
├── index.ts                     # Public exports
└── README.md                    # This file
```

## Components

### DatabaseManagement
- Database connection management
- Connection pool monitoring
- Query performance tracking
- Database statistics
- Table and index information

### DataExportImport
- Export jobs (full, incremental, custom)
- Import jobs with progress tracking
- Multiple format support (JSON, CSV, XML, SQL)
- Data schema management

### DataMasking
- Data masking rules
- Column-level masking strategies
- Rule management

### DataModelManagement
- Data model organization
- Folder structure
- Model sharing across spaces

### SchemaMigrations
- Migration creation and management
- Up/down SQL scripts
- Migration status tracking
- Rollback support

### SQLLinting
- SQL query validation
- Lint rules configuration
- Query quality scoring
- Issue reporting

## Usage

```typescript
// Import components
import {
  DatabaseManagement,
  DataExportImport,
  DataMasking,
  DataModelManagement,
  SchemaMigrations,
  SQLLinting,
} from '@/app/admin/features/data'

// Import types
import { DatabaseConnection, ExportJob, Migration, LintResult } from '@/app/admin/features/data'

// Import utilities
import { formatFileSize, getConnectionStatusColor, filterConnections } from '@/app/admin/features/data'
```

## Types

- `DatabaseConnection` - Database connection configuration
- `QueryPerformance` - Query performance metrics
- `DatabaseStats` - Database statistics
- `TableInfo` - Table information
- `IndexInfo` - Index information
- `ExportJob` - Export job configuration
- `ImportJob` - Import job configuration
- `DataSchema` - Data schema definition
- `MaskingRule` - Data masking rule
- `Migration` - Schema migration
- `LintIssue` - SQL lint issue
- `LintResult` - SQL lint result
- `LintRule` - SQL lint rule
- `DataModel` - Data model definition
- `Folder` - Folder structure

## Utilities

- `getConnectionStatusColor(status)` - Get badge color for connection status
- `getJobStatusColor(status)` - Get badge color for job status
- `formatFileSize(bytes)` - Format file size in human-readable format
- `formatDatabaseType(type)` - Format database type display name
- `isConnectionActive(connection)` - Check if connection is active
- `filterConnections(connections, query)` - Filter connections by search query
- `filterJobsByStatus(jobs, status)` - Filter jobs by status
- `sortMigrationsByVersion(migrations, order)` - Sort migrations by version
- `getLintSummary(result)` - Get lint result summary
- `formatTableSize(size)` - Format table size
- `isMigrationApplied(migration)` - Check if migration is applied
- `canRollbackMigration(migration)` - Check if migration can be rolled back

## Migration Notes

This feature was migrated from `src/app/admin/components/` to demonstrate the new feature-based structure. All imports have been updated to use the new location.

