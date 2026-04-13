# Data Governance Feature

This feature provides data governance capabilities using OpenMetadata SDK integration.

## Structure

```
data-governance/
├── components/
│   └── DataGovernance.tsx  # Main data governance interface
├── types.ts                 # Type definitions
├── utils.ts                # Utility functions
├── index.ts                 # Public exports
└── README.md                # This file
```

## Components

### DataGovernance
- OpenMetadata connection configuration
- Data asset discovery and management
- Policy management and compliance
- Data quality monitoring
- Lineage visualization
- Classification and tagging

## Features

- **OpenMetadata Integration**: Connect to OpenMetadata instance for metadata management
- **Data Asset Discovery**: Browse and search data assets (tables, databases, dashboards, pipelines, topics, ML models)
- **Policy Management**: Create and manage data governance policies
- **Quality Monitoring**: Track data quality scores and checks
- **Test Suites**: Create and manage data quality test suites with test cases
- **Data Profiling**: View detailed data profiles including column statistics, distributions, and completeness
- **Lineage Visualization**: View data lineage and dependencies
- **Collaboration**: Activity feeds, conversation threads, and collaboration on data assets
- **Ingestion Management**: Create and manage metadata ingestion pipelines from various data sources
- **Webhooks & Alerts**: Configure webhooks to receive real-time notifications from OpenMetadata events
- **Classification**: Tag and classify data assets
- **Platform Configuration**: Configure data domains, classification schemes, quality rules, retention policies, access control, and business glossary
- **Advanced Search**: Search by tags, owners, domains, and custom fields
- **Bulk Operations**: Bulk update tags and owners across multiple assets
- **Data Insights**: Analytics and insights on data usage and quality
- **Custom Properties**: Define and manage custom metadata properties
- **Workflows**: Create and manage automated workflows
- **Additional Entities**: Support for Containers, Stored Procedures, Database Schemas, Metrics, Reports, and Data Products

## Usage

```typescript
// Import component
import { DataGovernance } from '@/app/admin/features/data-governance'

// Import types
import { DataAsset, DataPolicy, OpenMetadataConfig } from '@/app/admin/features/data-governance'

// Import utilities
import { calculateGovernanceMetrics, isAssetCompliant } from '@/app/admin/features/data-governance'
```

## Configuration

The Data Governance module requires OpenMetadata configuration:
- OpenMetadata host URL
- API version
- Authentication (Basic, JWT, OAuth, or SAML)
- Enable/disable integration

## API Endpoints

- `GET /api/admin/data-governance/config` - Get OpenMetadata configuration
- `POST /api/admin/data-governance/config` - Save OpenMetadata configuration
- `GET /api/admin/data-governance/assets` - Get data assets
- `GET /api/admin/data-governance/policies` - Get policies
- `POST /api/admin/data-governance/sync` - Sync assets from OpenMetadata
- `GET /api/admin/data-governance/profiling/[fqn]` - Get data profile for asset
- `GET /api/admin/data-governance/test-suites` - Get test suites
- `POST /api/admin/data-governance/test-suites` - Create test suite
- `POST /api/admin/data-governance/test-suites/[id]/run` - Run test suite
- `GET /api/admin/data-governance/feed/[fqn]` - Get activity feed for asset
- `POST /api/admin/data-governance/feed/[fqn]` - Create thread in activity feed
- `POST /api/admin/data-governance/feed/[fqn]/[threadId]/posts` - Post reply to thread
- `GET /api/admin/data-governance/platform-config` - Get platform governance configuration
- `POST /api/admin/data-governance/platform-config` - Save platform governance configuration
- `GET /api/admin/data-governance/ingestion` - Get ingestion pipelines
- `POST /api/admin/data-governance/ingestion` - Create ingestion pipeline
- `PATCH /api/admin/data-governance/ingestion/[id]` - Update ingestion pipeline
- `DELETE /api/admin/data-governance/ingestion/[id]` - Delete ingestion pipeline
- `POST /api/admin/data-governance/ingestion/[id]/trigger` - Trigger ingestion pipeline
- `GET /api/admin/data-governance/webhooks` - Get webhooks
- `POST /api/admin/data-governance/webhooks` - Create webhook
- `POST /api/admin/data-governance/webhooks/[id]/test` - Test webhook

## OpenMetadata SDK Client

The module includes a comprehensive OpenMetadata client (`src/lib/openmetadata-client.ts`) that provides methods for:

**Core Entities:**
- Tables (full CRUD, soft/hard delete, restore)
- Databases (full CRUD, soft/hard delete), Database Schemas (full CRUD)
- Dashboards (full CRUD, soft/hard delete)
- Pipelines (full CRUD, soft/hard delete)
- Topics (full CRUD, soft/hard delete, topic schemas - full CRUD)
- ML Models (full CRUD, soft/hard delete)
- Containers (full CRUD)
- Stored Procedures (full CRUD)
- Metrics (full CRUD)
- Reports (full CRUD)
- Data Products (full CRUD)

**Data Management:**
- Lineage tracking (upstream/downstream, column-level, manual editing)
- Data Quality (Test Suites, Test Cases, Test Results - all with full CRUD)
- Data Profiling (table and column profiles)
- Data Insights & Analytics (reports, KPIs, Goals, Data Insight Reports - all with full CRUD)
- Data Observability (freshness, volume, latency)
- Usage Statistics (per entity, aggregated)
- Queries (create, manage, usage tracking)
- Sample Data (get, create, update, delete)
- Table Constraints (get, add, update, delete)
- Column Operations (add, update, delete)

**Governance:**
- Tags & Classifications (full CRUD, add/remove from entities)
- Glossary & Terms (full CRUD)
- Policies (full CRUD)
- Custom Properties (full CRUD)
- Platform Configuration

**Access & Collaboration:**
- Roles & Teams
- Users
- Activity Feed & Collaboration (threads, posts - full CRUD)
- Version History (get, patch, compare)
- Followers & Owners (get, add, remove)
- Votes & Reviews (get, add, update, delete)

**Integration & Automation:**
- Services & Connectors (Database, Dashboard, Pipeline, Messaging, Metadata - all with full CRUD)
- Service Management (create, update, delete, test connection for all service types)
- Ingestion Pipelines (create, update, delete, trigger, status, enable, disable, pause, resume)
- Webhooks & Alerts (create, update, delete, test)
- Workflows (create, update, delete, run, pause, resume, status)

**Search & Discovery:**
- General search
- Advanced search (by tag, owner, domain, custom fields)
- Search suggestions
- Search facets
- Search aggregations
- Bulk operations (bulk update tags, owners)
- Recommendations (entity-level and global)

**Copy & Clone:**
- Copy entities
- Clone entities
- Copy/clone with options

**Audit & Logging:**
- Audit logs (with filters)
- Entity audit logs
- Export audit logs
- Time-based and user-based filtering

**Authentication & SSO:**
- Auth provider management (CRUD)
- SSO configuration
- Login/logout
- Token management (list, get, generate, revoke, revoke all)
- Password management (change, reset)
- Current user info

**Settings & Configuration:**
- Settings management (get, update, delete)
- Category-based settings
- Bulk settings update

**Events & Streaming:**
- Event retrieval (with filters)
- Entity events
- Event subscription
- Event type filtering

**Utility Operations:**
- Entity summary
- Entity statistics
- Entity comparison
- Entity dependencies
- Entity references
- Entity health/status

