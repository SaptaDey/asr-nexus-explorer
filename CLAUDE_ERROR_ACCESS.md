# Claude Code Error Logging Access Guide

This document provides Claude Code with comprehensive access to the ASR-GoT application's error logging system for debugging and troubleshooting.

## Quick Access Methods

### 1. Browser Console Commands (Production)
When debugging issues on https://scientific-research.online/, use these browser console commands:

```javascript
// Quick health check
await healthCheck()

// Get recent errors (last 24 hours)
await getErrors(24)

// Get critical errors only
await getCritical()

// Get error patterns
await getPatterns(24)

// Debug specific component
await debugComponent('ErrorBoundary')

// Full debug helper access
claudeDebug.getFullErrorReport(48)
claudeDebug.quickHealthCheck()
claudeDebug.debugErrorSpike(6)
claudeDebug.getProductionStatus()
```

### 2. Direct API Access
For programmatic access to error data:

```typescript
import { ClaudeDebugHelper } from '@/utils/debugHelper';

// Get comprehensive error export
const errorReport = await ClaudeDebugHelper.getFullErrorReport(24);

// Get error patterns for analysis
const patterns = await ClaudeDebugHelper.getErrorPatterns(24);

// Get critical errors
const critical = await ClaudeDebugHelper.getCriticalErrors();

// Component-specific debugging
const componentErrors = await ClaudeDebugHelper.debugComponent('ResearchInterface', 24);

// Error spike analysis
const spikeAnalysis = await ClaudeDebugHelper.debugErrorSpike(6);
```

### 3. Database Schema Access
Direct Supabase access for complex queries:

```sql
-- Get recent errors by type
SELECT error_type, severity, message, created_at, component_name
FROM error_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Get error patterns
SELECT category, COUNT(*) as occurrences, MAX(created_at) as latest
FROM error_logs
WHERE created_at >= NOW() - INTERVAL '24 hours'
GROUP BY category
HAVING COUNT(*) >= 3
ORDER BY occurrences DESC;

-- Get critical errors
SELECT * FROM recent_critical_errors;

-- Use built-in pattern analysis function
SELECT * FROM get_error_patterns(24, 3);
```

## Error Data Structure

### ErrorLogEntry Interface
```typescript
{
  // Error Classification
  error_type: 'javascript' | 'network' | 'database' | 'auth' | 'validation' | 'component' | 'api';
  severity: 'info' | 'warning' | 'error' | 'critical';
  category?: string;
  
  // Error Details
  message: string;
  stack?: string;
  error_code?: string;
  
  // Context Information
  url?: string;
  user_agent?: string;
  user_id?: string;
  session_id?: string;
  
  // Technical Context
  component_name?: string;
  function_name?: string;
  line_number?: number;
  column_number?: number;
  
  // ASR-GoT Specific Context
  stage_id?: string;
  research_session_id?: string;
  parameter_set?: Record<string, any>;
  
  // Additional Metadata
  metadata?: Record<string, any>;
  tags?: string[];
}
```

## Common Debugging Scenarios

### 1. Application Won't Load
```javascript
// Check for critical initialization errors
const critical = await getCritical();
console.log('Critical errors:', critical);

// Check for React/JavaScript errors
const reactErrors = await claudeDebug.debugErrorType('javascript', 6);
console.log('JavaScript errors:', reactErrors);

// Check error spike
const spike = await claudeDebug.debugErrorSpike(2);
console.log('Error spike analysis:', spike);
```

### 2. Specific Component Issues
```javascript
// Debug specific component
const componentErrors = await debugComponent('ResearchInterface');
console.log('Component errors:', componentErrors);

// Get component error patterns
const patterns = await getPatterns(24);
const componentPatterns = patterns.data?.patterns?.filter(p => 
  p.affected_components?.includes('ResearchInterface')
);
```

### 3. API/Network Issues
```javascript
// Check API errors
const apiErrors = await claudeDebug.debugErrorType('api', 12);
console.log('API errors:', apiErrors);

// Check network errors
const networkErrors = await claudeDebug.debugErrorType('network', 12);
console.log('Network errors:', networkErrors);
```

### 4. Database Connection Issues
```javascript
// Check database errors
const dbErrors = await claudeDebug.debugErrorType('database', 24);
console.log('Database errors:', dbErrors);

// Check authentication errors
const authErrors = await claudeDebug.debugErrorType('auth', 24);
console.log('Auth errors:', authErrors);
```

## Error Response Format

All debug methods return data in this format:

```typescript
{
  success: boolean;
  data?: {
    recent_errors: ErrorLogEntry[];
    patterns: ErrorPattern[];
    critical_errors: ErrorLogEntry[];
    local_errors: any[]; // Offline fallback
    summary: {
      total_recent_errors: number;
      total_patterns: number;
      total_critical: number;
      export_timestamp: string;
      timeframe_hours: number;
    };
    debugging_context: {
      browser_info: any;
      environment: any;
      performance_metrics: any;
      storage_info: any;
    };
  };
  error?: string;
  timestamp: string;
  request_id: string;
}
```

## Offline Access

When the database is unavailable, the system falls back to localStorage:

```javascript
// Get local storage errors directly
const localErrors = errorLogger.getLocalStorageErrors();
console.log('Local errors:', localErrors);

// All debug methods automatically fall back to localStorage
const errors = await getErrors(24); // Will use localStorage if DB unavailable
```

## Error Logging Integration Points

The error logging system is integrated at these key points:

1. **Global Error Handlers** - `ErrorLoggingService.ts` captures all unhandled errors
2. **Error Boundaries** - `ErrorBoundary.tsx` logs component crashes
3. **API Services** - `apiService.ts` logs API failures
4. **Custom Components** - Any component can log errors using `errorLogger.logComponentError()`

## Production Monitoring

For continuous monitoring:

```javascript
// Set up periodic health checks
setInterval(async () => {
  const status = await claudeDebug.getProductionStatus();
  if (status.production_status === 'CRITICAL') {
    console.error('🚨 CRITICAL ISSUES DETECTED:', status);
  }
}, 60000); // Check every minute
```

## Security Considerations

- All API keys are automatically redacted from error logs
- Error messages are sanitized to prevent sensitive data exposure
- User data is not included in error logs unless explicitly authorized
- Stack traces are cleaned to remove sensitive paths

## Support for Claude Code

This system provides Claude Code with:

1. **Real-time error visibility** for immediate debugging
2. **Historical error analysis** for pattern recognition
3. **Component-specific debugging** for targeted fixes
4. **Offline fallback capabilities** for robust access
5. **Production monitoring** for proactive issue detection
6. **Structured error data** for systematic analysis

Use these tools to quickly identify, analyze, and resolve issues in the ASR-GoT application.