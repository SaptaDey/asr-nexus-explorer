# ASR-GoT Database Integration Documentation

## Overview

This document outlines the comprehensive database integration implemented for the Advanced Scientific Reasoning Graph-of-Thoughts (ASR-GoT) framework. The integration provides full-stack persistence, real-time collaboration, performance optimization, and deployment capabilities using Supabase as the backend database.

## Architecture

### Database Schema

The database schema consists of 14 main tables designed to support the ASR-GoT framework:

1. **profiles** - User profile information
2. **research_sessions** - Research session management
3. **graph_nodes** - Graph node data storage
4. **graph_edges** - Graph edge relationships
5. **stage_executions** - Stage execution history
6. **hypotheses** - Hypothesis management
7. **knowledge_gaps** - Knowledge gap tracking
8. **research_collaborations** - Collaboration management
9. **api_credentials** - Secure API key storage
10. **performance_metrics** - Performance monitoring
11. **error_logs** - Error tracking and debugging
12. **export_history** - Data export/import history
13. **research_templates** - Reusable research templates
14. **activity_logs** - User activity tracking
15. **cache_entries** - Performance optimization cache

### Services Architecture

#### Core Services

1. **DatabaseService** (`src/services/database/DatabaseService.ts`)
   - Core database operations
   - Session management
   - Graph data persistence
   - Real-time subscriptions

2. **AuthService** (`src/services/auth/AuthService.ts`)
   - User authentication
   - Profile management
   - Session monitoring

3. **CollaborationService** (`src/services/collaboration/CollaborationService.ts`)
   - Real-time collaboration
   - User presence tracking
   - Role-based permissions

#### Integration Adapters

1. **HypothesisAdapter** (`src/services/database/adapters/HypothesisAdapter.ts`)
   - Integrates HypothesisCompetitionFramework with database
   - Manages hypothesis persistence and competition tracking

2. **KnowledgeGapAdapter** (`src/services/database/adapters/KnowledgeGapAdapter.ts`)
   - Integrates KnowledgeGapDetector with database
   - Manages gap detection and resolution tracking

3. **ValidationAdapter** (`src/services/database/adapters/ValidationAdapter.ts`)
   - Integrates FalsifiabilityValidator with database
   - Manages validation results and experimental design

4. **AbstractionAdapter** (`src/services/database/adapters/AbstractionAdapter.ts`)
   - Integrates HierarchicalAbstractionEngine with database
   - Manages abstraction hierarchies and conceptual bridges

#### Performance Optimization

1. **CacheService** (`src/services/optimization/CacheService.ts`)
   - Multi-level caching (memory + disk)
   - LRU/LFU eviction policies
   - Database-backed cache persistence

2. **PerformanceOptimizationService** (`src/services/optimization/PerformanceOptimizationService.ts`)
   - Comprehensive performance monitoring
   - Automatic optimization recommendations
   - Real-time performance alerts

#### Data Portability

1. **DataExportImportService** (`src/services/data/DataExportImportService.ts`)
   - Multi-format data export (JSON, CSV, XML, GraphML, GEXF)
   - Data validation and integrity checking
   - Batch operations and templates

## Frontend Integration

### Context Providers

#### DatabaseContext (`src/contexts/DatabaseContext.tsx`)
- Centralized database state management
- Service initialization and health monitoring
- Authentication state management
- Performance metrics tracking

#### SessionContext (`src/contexts/SessionContext.tsx`)
- Research session management
- Graph operations and persistence
- Hypothesis and knowledge gap management
- Real-time collaboration integration

### React Hooks

#### Data Export/Import Hooks (`src/hooks/useDataExportImport.ts`)
- `useDataExport` - Export functionality with progress tracking
- `useDataImport` - Import functionality with validation
- `useDataPortability` - Combined export/import operations
- `useDataTemplates` - Template management

#### Context Hooks
- `useDatabase` - Access to database services and state
- `useAuth` - Authentication operations
- `usePerformance` - Performance monitoring
- `useCollaboration` - Collaboration features
- `useSession` - Session management
- `useGraph` - Graph operations
- `useHypotheses` - Hypothesis management

### UI Components

#### Performance Monitoring (`src/components/performance/PerformanceMonitor.tsx`)
- Real-time performance dashboard
- Cache performance metrics
- Database query monitoring
- Optimization recommendations

#### Error Handling (`src/components/errors/DatabaseErrorBoundary.tsx`)
- Comprehensive error boundary for database operations
- Error categorization and recovery suggestions
- Connection status monitoring
- Automatic retry mechanisms

## Database Migrations

### Migration System (`src/services/database/MigrationRunner.ts`)
- Automated migration execution
- Dependency management
- Rollback capabilities
- Checksum validation

### Migration Files (`supabase/migrations/`)
1. **001_initial_schema.sql** - Core database schema
2. **002_add_graph_indexes.sql** - Performance indexes
3. **003_add_collaboration_features.sql** - Collaboration tables
4. **004_add_cache_table.sql** - Cache persistence

## Deployment

### Deployment Script (`scripts/deploy.js`)
- Environment validation
- Dependency installation
- Quality checks (linting, type checking, tests)
- Database migration execution
- Build process
- Deployment verification

### NPM Scripts
```bash
npm run deploy              # Full deployment
npm run deploy:validate     # Validate environment
npm run deploy:migrate      # Run migrations
npm run deploy:build        # Build application
npm run deploy:verify       # Verify deployment
```

## Security Features

### Row Level Security (RLS)
- All tables have RLS enabled
- User-specific data access policies
- Collaboration-aware permissions
- Secure API credential storage

### Authentication
- Supabase Auth integration
- OAuth provider support
- Session management
- Profile synchronization

## Performance Optimization

### Caching Strategy
- Multi-level caching (memory + database)
- Intelligent cache invalidation
- LRU/LFU eviction policies
- Performance monitoring and auto-tuning

### Database Optimization
- Strategic indexes for graph operations
- Query optimization
- Connection pooling
- Batch operations

### Real-time Features
- WebSocket connections for collaboration
- Live presence tracking
- Real-time graph updates
- Activity streaming

## Monitoring and Observability

### Performance Metrics
- Cache hit rates
- Query execution times
- Memory usage
- Network latency
- User session metrics

### Error Tracking
- Comprehensive error logging
- Error categorization
- Recovery suggestions
- Alert system

### Health Checks
- Database connection status
- Service health monitoring
- Performance thresholds
- Automatic alerting

## Data Export/Import

### Supported Formats
- JSON (complete data structure)
- CSV (tabular data)
- XML (structured data)
- GraphML (graph visualization)
- GEXF (network analysis)

### Features
- Template-based exports
- Data validation
- Batch operations
- Progress tracking
- Rollback capabilities

## Usage Examples

### Basic Session Management
```typescript
import { useSession } from '@/contexts/SessionContext';

function MyComponent() {
  const { 
    createSession, 
    loadSession, 
    updateGraph, 
    addHypothesis 
  } = useSession();
  
  // Create a new research session
  const sessionId = await createSession(
    'My Research Project',
    'Investigation of quantum entanglement'
  );
  
  // Load existing session
  await loadSession(sessionId);
  
  // Update graph data
  await updateGraph(graphData);
  
  // Add hypothesis
  await addHypothesis({
    description: 'Quantum states are correlated',
    evidence: [...],
    predictions: [...]
  });
}
```

### Performance Monitoring
```typescript
import { usePerformance } from '@/contexts/DatabaseContext';

function PerformanceDashboard() {
  const { 
    performanceMetrics, 
    cacheHealth, 
    refreshPerformanceMetrics 
  } = usePerformance();
  
  return (
    <div>
      <h2>System Performance</h2>
      <div>Cache Hit Rate: {performanceMetrics?.cacheHitRate}%</div>
      <div>Query Time: {performanceMetrics?.averageQueryTime}ms</div>
      <button onClick={refreshPerformanceMetrics}>
        Refresh Metrics
      </button>
    </div>
  );
}
```

### Data Export
```typescript
import { useDataExport } from '@/hooks/useDataExportImport';

function ExportComponent() {
  const { exportData, downloadExport } = useDataExport({ sessionId });
  
  const handleExport = async () => {
    const result = await exportData({
      format: 'json',
      includeGraphData: true,
      includeHypotheses: true,
      includeStageResults: true
    });
    
    if (result.success) {
      downloadExport(result);
    }
  };
  
  return (
    <button onClick={handleExport}>
      Export Session Data
    </button>
  );
}
```

## Environment Variables

Required environment variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

## File Structure

```
src/
├── contexts/
│   ├── DatabaseContext.tsx
│   └── SessionContext.tsx
├── services/
│   ├── database/
│   │   ├── DatabaseService.ts
│   │   ├── GraphDataService.ts
│   │   ├── MigrationRunner.ts
│   │   └── adapters/
│   │       ├── HypothesisAdapter.ts
│   │       ├── KnowledgeGapAdapter.ts
│   │       ├── ValidationAdapter.ts
│   │       └── AbstractionAdapter.ts
│   ├── auth/
│   │   └── AuthService.ts
│   ├── collaboration/
│   │   └── CollaborationService.ts
│   ├── optimization/
│   │   ├── CacheService.ts
│   │   └── PerformanceOptimizationService.ts
│   └── data/
│       └── DataExportImportService.ts
├── hooks/
│   └── useDataExportImport.ts
├── components/
│   ├── performance/
│   │   └── PerformanceMonitor.tsx
│   └── errors/
│       └── DatabaseErrorBoundary.tsx
supabase/
└── migrations/
    ├── 001_initial_schema.sql
    ├── 002_add_graph_indexes.sql
    ├── 003_add_collaboration_features.sql
    └── 004_add_cache_table.sql
scripts/
└── deploy.js
```

## Testing

### Unit Tests
- Service layer testing
- Database operation mocking
- Error handling validation

### Integration Tests
- Database migration testing
- API endpoint validation
- Performance benchmarking

### End-to-End Tests
- Complete workflow testing
- Collaboration scenarios
- Data export/import validation

## Deployment Considerations

### Production Checklist
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] RLS policies tested
- [ ] Performance monitoring enabled
- [ ] Error tracking configured
- [ ] Backup strategy implemented
- [ ] Security audit completed

### Scaling Considerations
- Database connection pooling
- Read replicas for performance
- CDN for static assets
- Horizontal scaling for compute
- Cache warming strategies

## Troubleshooting

### Common Issues
1. **Connection Errors**: Check environment variables and network connectivity
2. **Migration Failures**: Verify migration dependencies and permissions
3. **Performance Issues**: Monitor cache hit rates and query performance
4. **Authentication Problems**: Verify Supabase Auth configuration

### Debug Tools
- Performance monitor dashboard
- Database connection status
- Error boundary with technical details
- Migration status checker

## Contributing

### Development Setup
1. Clone repository
2. Install dependencies: `npm install`
3. Configure environment variables
4. Run migrations: `npm run deploy:migrate`
5. Start development server: `npm run dev`

### Code Standards
- TypeScript strict mode
- ESLint configuration
- Comprehensive error handling
- Performance optimization
- Security best practices

This comprehensive database integration provides a robust foundation for the ASR-GoT framework with full-stack persistence, real-time collaboration, performance optimization, and deployment capabilities.