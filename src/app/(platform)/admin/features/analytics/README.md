# Analytics Feature

This feature contains all analytics, monitoring, and logging functionality.

## Structure

```
analytics/
├── components/
│   ├── AnalyticsDashboard.tsx      # Main analytics dashboard
│   ├── SystemHealthDashboard.tsx  # System health monitoring
│   ├── PerformanceMonitoring.tsx  # Performance metrics and alerts
│   └── LogManagement.tsx          # Log viewing and management
├── types.ts                        # Shared type definitions
├── utils.ts                        # Utility functions
├── index.ts                        # Public exports
└── README.md                       # This file
```

## Components

### AnalyticsDashboard
- System-wide analytics
- User activity metrics
- Storage usage
- Query statistics
- Error tracking
- Performance trends

### SystemHealthDashboard
- Service health monitoring
- System resource metrics
- Service dependencies
- Health alerts
- Uptime tracking

### PerformanceMonitoring
- Real-time performance metrics
- Database performance
- Alert configuration
- Performance thresholds
- Metric history

### LogManagement
- Log viewing and filtering
- Log statistics
- Log retention policies
- Log export
- Service-level logging

## Usage

```typescript
// Import components
import {
  AnalyticsDashboard,
  SystemHealthDashboard,
  PerformanceMonitoring,
  LogManagement,
} from '@/app/admin/features/analytics'

// Import types
import { SystemMetrics, HealthStatus, LogEntry, Alert } from '@/app/admin/features/analytics'

// Import utilities
import { formatUptime, getHealthStatusColor, filterLogs } from '@/app/admin/features/analytics'
```

## Types

- `SystemMetrics` - System-wide metrics
- `ActivityData` - Activity time series data
- `StorageData` - Storage usage data
- `HealthStatus` - Service health status
- `PerformanceMetric` - Performance metrics
- `DatabaseMetric` - Database performance metrics
- `Alert` - Performance alert configuration
- `PerformanceSettings` - Performance monitoring settings
- `LogEntry` - Log entry
- `LogStats` - Log statistics
- `LogFilter` - Log filter configuration
- `LogRetention` - Log retention policy

## Utilities

- `getHealthStatusColor(status)` - Get badge color for health status
- `getLogLevelColor(level)` - Get badge color for log level
- `getAlertSeverityColor(severity)` - Get badge color for alert severity
- `formatUptime(seconds)` - Format uptime in human-readable format
- `formatResponseTime(ms)` - Format response time
- `calculateStoragePercentage(used, limit)` - Calculate storage percentage
- `formatStorageSize(bytes)` - Format storage size
- `filterLogs(logs, query)` - Filter logs by search query
- `filterLogsByLevel(logs, level)` - Filter logs by level
- `filterLogsByService(logs, service)` - Filter logs by service
- `sortLogsByTimestamp(logs, order)` - Sort logs by timestamp
- `isAlertActive(alert)` - Check if alert is active
- `getMetricTrend(current, previous)` - Get metric trend direction
- `calculateErrorRate(errors, total)` - Calculate error rate percentage

## Migration Notes

This feature was migrated from `src/app/admin/components/` to demonstrate the new feature-based structure. All imports have been updated to use the new location.

