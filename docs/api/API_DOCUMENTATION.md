# ASR-GoT Framework API Documentation

## Overview

Complete API reference for the ASR-GoT (Automatic Scientific Research - Graph of Thoughts) framework. This documentation covers all services, endpoints, hooks, and utilities available in the system deployed at https://scientific-research.online/.

## Table of Contents

1. [Core API Services](#core-api-services)
2. [React Hooks API](#react-hooks-api)
3. [Utility APIs](#utility-apis)
4. [Component APIs](#component-apis)
5. [Background Processing APIs](#background-processing-apis)
6. [Database APIs](#database-apis)
7. [Integration Examples](#integration-examples)
8. [Error Handling](#error-handling)
9. [Rate Limiting & Security](#rate-limiting--security)
10. [Testing APIs](#testing-apis)

---

## Core API Services

### AsrGotStageEngine

The central orchestration engine for the 9-stage ASR-GoT pipeline.

**File**: `/src/services/AsrGotStageEngine.ts`

#### Constructor

```typescript
constructor(credentials?: APICredentials, initialGraph?: GraphData)
```

**Parameters**:
- `credentials` (optional): API credentials for external services
- `initialGraph` (optional): Initial graph data structure

**Example**:
```typescript
import { AsrGotStageEngine } from '@/services/AsrGotStageEngine';

const engine = new AsrGotStageEngine({
  gemini: 'AIza...', 
  perplexity: 'pplx-...',
  openai: 'sk-...'
});
```

#### Methods

---

#### `executeStage1(taskDescription: string)`

Initialize the research process with task understanding.

**Parameters**:
- `taskDescription`: Research question or task description

**Returns**: `Promise<{ graph: GraphData; context: ResearchContext; result: string }>`

**Example**:
```typescript
const stage1Result = await engine.executeStage1(
  "Analyze the effectiveness of immunotherapy in treating cutaneous T-cell lymphoma"
);

console.log('Root node created:', stage1Result.graph.nodes[0]);
console.log('Research context:', stage1Result.context);
```

**Response Structure**:
```typescript
{
  graph: {
    nodes: GraphNode[],
    edges: GraphEdge[],
    metadata: {
      version: string,
      created: string,
      stage: number,
      total_nodes: number
    }
  },
  context: {
    field: string,
    topic: string,
    objectives: string[],
    hypotheses: string[],
    auto_generated: boolean
  },
  result: string // Markdown report
}
```

---

#### `executeStage2()`

Decompose the research into dimensional analysis.

**Returns**: `Promise<{ graph: GraphData; result: string }>`

**Example**:
```typescript
const stage2Result = await engine.executeStage2();

// Extract dimension nodes
const dimensions = stage2Result.graph.nodes.filter(n => n.type === 'dimension');
console.log('Created dimensions:', dimensions.map(d => d.label));
```

**Generated Dimensions**:
- Scope
- Objectives  
- Constraints
- Data Needs
- Use Cases
- Potential Biases
- Knowledge Gaps

---

#### `executeStage3()`

Generate hypotheses for each dimension.

**Returns**: `Promise<{ graph: GraphData; context: ResearchContext; result: string }>`

**Example**:
```typescript
const stage3Result = await engine.executeStage3();

// Extract hypotheses
const hypotheses = stage3Result.graph.nodes.filter(n => n.type === 'hypothesis');
console.log('Generated hypotheses:', hypotheses.length);

// Access falsification criteria
hypotheses.forEach(h => {
  console.log('Hypothesis:', h.metadata.value);
  console.log('Falsification:', h.metadata.falsification_criteria);
});
```

---

#### `executeStage4()`

Integrate evidence through Perplexity Sonar + Gemini analysis.

**Returns**: `Promise<{ graph: GraphData; result: string }>`

**Example**:
```typescript
const stage4Result = await engine.executeStage4();

// Analyze evidence quality
const evidenceNodes = stage4Result.graph.nodes.filter(n => n.type === 'evidence');
evidenceNodes.forEach(e => {
  console.log('Evidence quality:', e.metadata.evidence_quality);
  console.log('Statistical power:', e.metadata.statistical_power);
  console.log('Info metrics:', e.metadata.info_metrics);
});
```

---

#### `executeStage5()` through `executeStage9()`

Continue through the remaining pipeline stages: Pruning/Merging, Subgraph Extraction, Composition, Reflection, and Final Analysis.

**Stage 9 Special Return**:
```typescript
executeStage9(): Promise<{ 
  graph: GraphData; 
  result: string; 
  finalReport: string // Complete HTML report
}>
```

**Example**:
```typescript
const finalResult = await engine.executeStage9();

// Get the complete HTML report
const htmlReport = finalResult.finalReport;

// Save to file or display
document.body.innerHTML = htmlReport;
```

---

### API Service (`apiService.ts`)

Handles external API integrations with security and cost management.

**File**: `/src/services/apiService.ts`

#### `callGeminiAPI()`

Call Google Gemini 2.5 Pro with advanced capabilities.

```typescript
callGeminiAPI(
  prompt: string,
  apiKey: string,
  capability?: GeminiCapability,
  schema?: any,
  options?: {
    thinkingBudget?: number;
    stageId?: string;
    graphHash?: string;
    temperature?: number;
    maxTokens?: number;
    retryCount?: number;
  }
): Promise<string>
```

**Capabilities**:
- `'thinking-only'` - Pure reasoning mode
- `'thinking-structured'` - Structured JSON output
- `'thinking-search'` - Web search grounding
- `'thinking-code'` - Code execution
- `'thinking-function'` - Function calling
- `'thinking-cache'` - Caching enabled

**Example**:
```typescript
import { callGeminiAPI } from '@/services/apiService';

// Basic reasoning
const response = await callGeminiAPI(
  "Analyze the implications of CRISPR in immunotherapy",
  apiKey,
  'thinking-only',
  null,
  { temperature: 0.4, maxTokens: 4000 }
);

// Structured output
const structuredResponse = await callGeminiAPI(
  "Extract key findings from this research paper...",
  apiKey,
  'thinking-structured',
  {
    type: 'object',
    properties: {
      findings: { type: 'array', items: { type: 'string' } },
      methodology: { type: 'string' },
      limitations: { type: 'array', items: { type: 'string' } }
    }
  }
);

const parsed = JSON.parse(structuredResponse);
console.log('Findings:', parsed.findings);
```

**Error Handling**:
```typescript
try {
  const result = await callGeminiAPI(prompt, apiKey);
} catch (error) {
  if (error.message.includes('Rate limit exceeded')) {
    // Handle rate limiting
    await new Promise(resolve => setTimeout(resolve, 60000));
    // Retry logic
  } else if (error.message.includes('MAX_TOKENS')) {
    // Handle token limit - response will include partial content
    console.log('Response truncated due to token limit');
  }
}
```

---

#### `callPerplexitySonarAPI()`

Search for real-time information using Perplexity Sonar.

```typescript
callPerplexitySonarAPI(
  query: string,
  apiKey?: string,
  options?: { recency?: boolean; focus?: string }
): Promise<string>
```

**Example**:
```typescript
import { callPerplexitySonarAPI } from '@/services/apiService';

const evidence = await callPerplexitySonarAPI(
  "CAR-T cell therapy CTCL clinical trials 2024",
  perplexityApiKey,
  { recency: true, focus: 'immunology' }
);

console.log('Recent research findings:', evidence);
```

---

## React Hooks API

### useASRGoT Hook

The master orchestration hook for ASR-GoT functionality.

**File**: `/src/hooks/useASRGoT.ts`

```typescript
const useASRGoT = () => {
  // State management
  const [state, setState] = useState<ASRGoTState>();
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentStage, setCurrentStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Methods
  const initializeEngine: (credentials: APICredentials) => void;
  const executeStage: (stageNumber: number, input?: any) => Promise<any>;
  const resetPipeline: () => void;
  const exportResults: () => void;
  
  return {
    // State
    state,
    isExecuting,
    currentStage,
    error,
    graphData: state?.graphData,
    researchContext: state?.researchContext,
    
    // Methods
    initializeEngine,
    executeStage,
    resetPipeline,
    exportResults
  };
};
```

**Example Usage**:
```typescript
import { useASRGoT } from '@/hooks/useASRGoT';

function ResearchComponent() {
  const {
    state,
    isExecuting,
    currentStage,
    error,
    initializeEngine,
    executeStage
  } = useASRGoT();
  
  const handleStartResearch = async () => {
    initializeEngine({ gemini: 'AIza...', perplexity: 'pplx-...' });
    
    try {
      await executeStage(1, { 
        taskDescription: "Research immunotherapy effectiveness" 
      });
    } catch (error) {
      console.error('Stage execution failed:', error);
    }
  };
  
  return (
    <div>
      <button onClick={handleStartResearch} disabled={isExecuting}>
        {isExecuting ? `Executing Stage ${currentStage}...` : 'Start Research'}
      </button>
      
      {error && <div className="error">{error}</div>}
      
      {state?.graphData && (
        <div>Nodes: {state.graphData.nodes.length}</div>
      )}
    </div>
  );
}
```

---

### useASRGoTState Hook

Granular state management hook.

**File**: `/src/hooks/asr-got/useASRGoTState.ts`

```typescript
const useASRGoTState = () => {
  const [graphData, setGraphData] = useState<GraphData>();
  const [researchContext, setResearchContext] = useState<ResearchContext>();
  const [processingMode, setProcessingMode] = useState<'manual' | 'automatic'>('manual');
  const [stageResults, setStageResults] = useState<string[]>([]);
  
  // Computed state
  const currentStage = graphData?.metadata?.stage || 0;
  const totalNodes = graphData?.nodes?.length || 0;
  const totalEdges = graphData?.edges?.length || 0;
  const isCompleted = currentStage === 9;
  
  // State mutators
  const updateGraph = (updates: Partial<GraphData>) => void;
  const addNode = (node: GraphNode) => void;
  const addEdge = (edge: GraphEdge) => void;
  const updateResearchContext = (updates: Partial<ResearchContext>) => void;
  
  return {
    // State
    graphData,
    researchContext,
    processingMode,
    stageResults,
    
    // Computed
    currentStage,
    totalNodes,
    totalEdges,
    isCompleted,
    
    // Mutators
    updateGraph,
    addNode,
    addEdge,
    updateResearchContext,
    setProcessingMode
  };
};
```

---

### useStageExecution Hook

Manages individual stage execution with error handling.

**File**: `/src/hooks/asr-got/useStageExecution.ts`

```typescript
const useStageExecution = () => {
  const [executionState, setExecutionState] = useState<{
    stage: number;
    status: 'idle' | 'executing' | 'completed' | 'error';
    progress: number;
    error?: string;
    result?: any;
  }>();
  
  const executeStage = async (
    stageNumber: number,
    engine: AsrGotStageEngine,
    input?: any
  ) => Promise<any>;
  
  const cancelExecution = () => void;
  const retryExecution = () => Promise<any>;
  
  return {
    executionState,
    executeStage,
    cancelExecution,
    retryExecution
  };
};
```

**Example**:
```typescript
function StageExecutor({ stageNumber }: { stageNumber: number }) {
  const { executionState, executeStage, cancelExecution } = useStageExecution();
  const engine = useRef(new AsrGotStageEngine());
  
  const handleExecute = () => {
    executeStage(stageNumber, engine.current, { 
      /* stage-specific input */ 
    });
  };
  
  return (
    <div>
      <button onClick={handleExecute}>Execute Stage {stageNumber}</button>
      
      {executionState?.status === 'executing' && (
        <div>
          <progress value={executionState.progress} max={100} />
          <button onClick={cancelExecution}>Cancel</button>
        </div>
      )}
      
      {executionState?.status === 'error' && (
        <div className="error">
          {executionState.error}
          <button onClick={retryExecution}>Retry</button>
        </div>
      )}
    </div>
  );
}
```

---

### useAPICredentials Hook

Secure API credential management.

**File**: `/src/hooks/asr-got/useAPICredentials.ts`

```typescript
const useAPICredentials = () => {
  const [credentials, setCredentials] = useState<APICredentials>();
  const [isValid, setIsValid] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  
  const updateCredentials = (updates: Partial<APICredentials>) => void;
  const validateCredentials = () => Promise<Record<string, boolean>>;
  const testConnection = (service: string) => Promise<boolean>;
  const clearCredentials = () => void;
  
  return {
    credentials,
    isValid,
    testResults,
    updateCredentials,
    validateCredentials,
    testConnection,
    clearCredentials
  };
};
```

**Example**:
```typescript
function APISetup() {
  const {
    credentials,
    isValid,
    updateCredentials,
    validateCredentials,
    testConnection
  } = useAPICredentials();
  
  const handleGeminiKeyChange = (key: string) => {
    updateCredentials({ gemini: key });
  };
  
  const handleTestConnection = async () => {
    const geminiOk = await testConnection('gemini');
    console.log('Gemini connection:', geminiOk ? 'OK' : 'Failed');
  };
  
  return (
    <div>
      <input 
        type="password"
        placeholder="Gemini API Key"
        onChange={(e) => handleGeminiKeyChange(e.target.value)}
      />
      
      <div className={isValid.gemini ? 'valid' : 'invalid'}>
        {isValid.gemini ? '✅ Valid' : '❌ Invalid'}
      </div>
      
      <button onClick={handleTestConnection}>Test Connection</button>
    </div>
  );
}
```

---

## Utility APIs

### Information Theory Utils

**File**: `/src/utils/informationTheory.ts`

Mathematical utilities for graph analysis and information metrics.

```typescript
// Calculate node information metrics
calculateNodeInformationMetrics(
  node: GraphNode,
  graphData: GraphData
): InformationMetrics

// Calculate evidence information metrics
calculateEvidenceInformationMetrics(
  evidenceQuality: 'high' | 'medium' | 'low',
  statisticalPower: number,
  sourceType: string
): InformationMetrics

// Calculate graph complexity
calculateGraphComplexity(graphData: GraphData): number

// Calculate mutual information between nodes
calculateMutualInformation(
  nodeA: GraphNode, 
  nodeB: GraphNode
): number
```

**Example**:
```typescript
import { 
  calculateNodeInformationMetrics,
  calculateGraphComplexity 
} from '@/utils/informationTheory';

const nodeMetrics = calculateNodeInformationMetrics(hypothesisNode, graphData);
console.log('Entropy:', nodeMetrics.entropy);
console.log('Information gain:', nodeMetrics.informationGain);

const complexity = calculateGraphComplexity(graphData);
console.log('Graph complexity score:', complexity);
```

---

### Security Utils

**File**: `/src/utils/securityUtils.ts`

Security validation and sanitization utilities.

```typescript
// Input validation
validateInput(input: any, type: string): any

// API key validation  
validateAPIKey(key: string, service: string): boolean

// Rate limiting
apiRateLimiter: {
  isAllowed(service: string): boolean;
  reset(service: string): void;
}

// Error sanitization
sanitizeError(error: any): string
```

**Example**:
```typescript
import { validateInput, validateAPIKey, apiRateLimiter } from '@/utils/securityUtils';

// Validate user input
const sanitizedPrompt = validateInput(userInput, 'prompt');

// Check API key format
const isValidKey = validateAPIKey(apiKey, 'gemini');

// Rate limiting check
if (!apiRateLimiter.isAllowed('gemini-api')) {
  throw new Error('Rate limit exceeded');
}
```

---

### Background Processing Utils

**File**: `/src/utils/background/index.ts`

Asynchronous task processing utilities.

```typescript
// Queue Gemini API call
queueGeminiCall(
  prompt: string,
  credentials: APICredentials,
  priority: 'low' | 'medium' | 'high'
): string // Returns task ID

// Get task result
getTaskResult(taskId: string, timeout?: number): Promise<any>

// Queue background processing
queueBackgroundTask(
  type: string,
  data: any,
  priority?: 'low' | 'medium' | 'high'
): string

// Task queue status
getQueueStatus(): {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}
```

**Example**:
```typescript
import { queueGeminiCall, getTaskResult, getQueueStatus } from '@/utils/background';

// Queue high-priority analysis
const taskId = queueGeminiCall(
  "Analyze this complex dataset...",
  credentials,
  'high'
);

// Monitor queue
const status = getQueueStatus();
console.log('Queue status:', status);

// Get result when ready
try {
  const result = await getTaskResult(taskId, 30000); // 30 second timeout
  console.log('Analysis complete:', result);
} catch (error) {
  console.error('Task failed:', error);
}
```

---

## Component APIs

### ResearchInterface Component

**File**: `/src/components/asr-got/ResearchInterface.tsx`

Main interface component for ASR-GoT research workflows.

```typescript
interface ResearchInterfaceProps {
  initialQuery?: string;
  autoStart?: boolean;
  onStageComplete?: (stage: number, result: any) => void;
  onError?: (error: string) => void;
  onComplete?: (finalResult: any) => void;
  className?: string;
}

const ResearchInterface: React.FC<ResearchInterfaceProps>
```

**Example**:
```typescript
import { ResearchInterface } from '@/components/asr-got/ResearchInterface';

function App() {
  const handleStageComplete = (stage: number, result: any) => {
    console.log(`Stage ${stage} completed:`, result);
  };
  
  const handleComplete = (finalResult: any) => {
    console.log('Research complete:', finalResult);
    // Display final HTML report
    document.body.innerHTML = finalResult.finalReport;
  };
  
  return (
    <ResearchInterface
      initialQuery="Analyze CRISPR applications in immunotherapy"
      autoStart={false}
      onStageComplete={handleStageComplete}
      onComplete={handleComplete}
      className="research-container"
    />
  );
}
```

---

### GraphVisualization Component

**File**: `/src/components/asr-got/EnhancedGraphVisualization.tsx`

Interactive graph visualization using Cytoscape.js.

```typescript
interface GraphVisualizationProps {
  graphData: GraphData;
  layout?: 'cose' | 'breadthfirst' | 'circle' | 'concentric';
  interactive?: boolean;
  showLabels?: boolean;
  showConfidence?: boolean;
  onNodeSelect?: (node: GraphNode) => void;
  onEdgeSelect?: (edge: GraphEdge) => void;
  style?: React.CSSProperties;
}

const GraphVisualization: React.FC<GraphVisualizationProps>
```

**Example**:
```typescript
import { GraphVisualization } from '@/components/asr-got/EnhancedGraphVisualization';

function GraphDisplay({ graphData }: { graphData: GraphData }) {
  const handleNodeSelect = (node: GraphNode) => {
    console.log('Selected node:', node);
    // Show node details in sidebar
  };
  
  return (
    <GraphVisualization
      graphData={graphData}
      layout="cose"
      interactive={true}
      showLabels={true}
      showConfidence={true}
      onNodeSelect={handleNodeSelect}
      style={{ height: '600px', width: '100%' }}
    />
  );
}
```

---

### DebugPanel Component

**File**: `/src/components/asr-got/DebugPanel.tsx`

Development debugging interface.

```typescript
interface DebugPanelProps {
  visible?: boolean;
  onToggle?: (visible: boolean) => void;
  showPerformanceMetrics?: boolean;
  showMemoryUsage?: boolean;
  showAPILogs?: boolean;
}

const DebugPanel: React.FC<DebugPanelProps>
```

**Example**:
```typescript
import { DebugPanel } from '@/components/asr-got/DebugPanel';

function DeveloperInterface() {
  const [debugVisible, setDebugVisible] = useState(false);
  
  return (
    <div>
      <button onClick={() => setDebugVisible(!debugVisible)}>
        {debugVisible ? 'Hide' : 'Show'} Debug Panel
      </button>
      
      <DebugPanel
        visible={debugVisible}
        onToggle={setDebugVisible}
        showPerformanceMetrics={true}
        showMemoryUsage={true}
        showAPILogs={true}
      />
    </div>
  );
}
```

---

## Background Processing APIs

### TaskQueue System

**File**: `/src/utils/background/TaskQueue.ts`

Priority-based task management system.

```typescript
class TaskQueue {
  // Add task to queue
  enqueue(task: Task, priority?: Priority): string;
  
  // Process next task
  dequeue(): Task | null;
  
  // Get queue statistics
  getStats(): QueueStats;
  
  // Clear queue
  clear(): void;
  
  // Start/stop processing
  start(): void;
  stop(): void;
}

interface Task {
  id: string;
  type: 'gemini_call' | 'stage_execution' | 'graph_processing';
  data: any;
  priority: 'low' | 'medium' | 'high';
  created: number;
  timeout?: number;
}
```

**Example**:
```typescript
import { TaskQueue } from '@/utils/background/TaskQueue';

const taskQueue = new TaskQueue();

// Start processing
taskQueue.start();

// Add high-priority task
const taskId = taskQueue.enqueue({
  id: crypto.randomUUID(),
  type: 'gemini_call',
  data: { prompt: '...', credentials: '...' },
  priority: 'high',
  created: Date.now(),
  timeout: 30000
}, 'high');

// Monitor queue
const stats = taskQueue.getStats();
console.log('Queue stats:', stats);
```

---

### BackgroundProcessor

**File**: `/src/utils/background/BackgroundProcessor.ts`

Main coordination system for background tasks.

```typescript
class BackgroundProcessor {
  // Initialize processor
  static initialize(): void;
  
  // Submit task
  static submitTask(
    type: string,
    data: any,
    options?: TaskOptions
  ): Promise<any>;
  
  // Get processor status
  static getStatus(): ProcessorStatus;
  
  // Shutdown processor
  static shutdown(): void;
}

interface TaskOptions {
  priority?: 'low' | 'medium' | 'high';
  timeout?: number;
  retryCount?: number;
  onProgress?: (progress: number) => void;
}
```

**Example**:
```typescript
import { BackgroundProcessor } from '@/utils/background/BackgroundProcessor';

// Initialize on app start
BackgroundProcessor.initialize();

// Submit complex analysis task
const result = await BackgroundProcessor.submitTask(
  'complex_analysis',
  { 
    analysisType: 'meta_analysis',
    dataset: largeDataset,
    parameters: analysisParams
  },
  {
    priority: 'high',
    timeout: 120000, // 2 minutes
    onProgress: (progress) => {
      console.log(`Analysis progress: ${progress}%`);
    }
  }
);

console.log('Analysis result:', result);
```

---

## Database APIs

### SupabaseStorageService

**File**: `/src/services/SupabaseStorageService.ts`

Database operations for persistent storage.

```typescript
class SupabaseStorageService {
  // Save research session
  saveSession(
    userId: string,
    sessionData: ASRGoTSession
  ): Promise<string>;
  
  // Load research session
  loadSession(
    userId: string,
    sessionId: string
  ): Promise<ASRGoTSession>;
  
  // List user sessions
  listSessions(userId: string): Promise<SessionSummary[]>;
  
  // Delete session
  deleteSession(
    userId: string,
    sessionId: string
  ): Promise<boolean>;
  
  // Save graph snapshot
  saveGraphSnapshot(
    sessionId: string,
    stage: number,
    graphData: GraphData
  ): Promise<string>;
  
  // Query history management
  saveQuery(
    userId: string,
    query: string,
    results: any
  ): Promise<string>;
  
  getQueryHistory(
    userId: string,
    limit?: number
  ): Promise<QueryHistoryItem[]>;
}
```

**Example**:
```typescript
import { SupabaseStorageService } from '@/services/SupabaseStorageService';

const storageService = new SupabaseStorageService();

// Save current session
const sessionId = await storageService.saveSession(userId, {
  id: 'session_123',
  created: new Date().toISOString(),
  updated: new Date().toISOString(),
  name: 'CTCL Immunotherapy Research',
  graphData: currentGraphData,
  stageResults: stageResults,
  completed: false
});

// Load previous session
const session = await storageService.loadSession(userId, sessionId);
console.log('Loaded session:', session);

// Save query for history
await storageService.saveQuery(
  userId,
  "Analyze CRISPR effectiveness in treating lymphoma",
  analysisResults
);

// Get query history
const history = await storageService.getQueryHistory(userId, 10);
console.log('Recent queries:', history);
```

---

### DatabaseService

**File**: `/src/services/database/DatabaseService.ts`

Low-level database operations with transaction support.

```typescript
class DatabaseService {
  // Execute query with parameters
  query<T>(
    sql: string,
    params?: any[]
  ): Promise<T[]>;
  
  // Execute single query
  queryOne<T>(
    sql: string,
    params?: any[]
  ): Promise<T | null>;
  
  // Transaction support
  transaction<T>(
    callback: (tx: Transaction) => Promise<T>
  ): Promise<T>;
  
  // Batch operations
  batch(operations: BatchOperation[]): Promise<any[]>;
}

interface BatchOperation {
  sql: string;
  params?: any[];
}
```

**Example**:
```typescript
import { DatabaseService } from '@/services/database/DatabaseService';

const db = new DatabaseService();

// Query with parameters
const sessions = await db.query<ASRGoTSession>(
  'SELECT * FROM asr_got_sessions WHERE user_id = ? AND created > ?',
  [userId, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)] // Last 7 days
);

// Transaction example
await db.transaction(async (tx) => {
  // Save session
  const sessionId = await tx.queryOne<string>(
    'INSERT INTO asr_got_sessions (user_id, data) VALUES (?, ?) RETURNING id',
    [userId, sessionData]
  );
  
  // Save graph snapshots
  for (let stage = 1; stage <= 9; stage++) {
    await tx.query(
      'INSERT INTO graph_snapshots (session_id, stage, data) VALUES (?, ?, ?)',
      [sessionId, stage, stageGraphs[stage]]
    );
  }
  
  return sessionId;
});
```

---

## Integration Examples

### Complete Research Workflow

```typescript
import { useASRGoT } from '@/hooks/useASRGoT';
import { ResearchInterface } from '@/components/asr-got/ResearchInterface';
import { GraphVisualization } from '@/components/asr-got/EnhancedGraphVisualization';
import { ExportFunctionality } from '@/components/asr-got/ExportFunctionality';

function CompleteResearchApp() {
  const {
    state,
    isExecuting,
    currentStage,
    error,
    initializeEngine,
    executeStage,
    exportResults
  } = useASRGoT();
  
  const [credentials, setCredentials] = useState<APICredentials>();
  const [selectedNode, setSelectedNode] = useState<GraphNode>();
  
  // Initialize with credentials
  useEffect(() => {
    if (credentials) {
      initializeEngine(credentials);
    }
  }, [credentials]);
  
  const handleStageComplete = async (stage: number, result: any) => {
    console.log(`Stage ${stage} completed`);
    
    // Auto-advance to next stage if in automatic mode
    if (state?.processingMode === 'automatic' && stage < 9) {
      await executeStage(stage + 1);
    }
  };
  
  const handleResearchComplete = (finalResult: any) => {
    // Display final report
    console.log('Research completed:', finalResult);
    
    // Automatically export results
    exportResults();
  };
  
  const handleNodeSelect = (node: GraphNode) => {
    setSelectedNode(node);
  };
  
  return (
    <div className="research-app">
      <header>
        <h1>ASR-GoT Research Interface</h1>
        <div className="status">
          {isExecuting ? `Executing Stage ${currentStage}...` : 'Ready'}
        </div>
      </header>
      
      <main className="research-layout">
        <aside className="controls-panel">
          <APICredentialsForm 
            onCredentialsUpdate={setCredentials}
          />
          
          {selectedNode && (
            <NodeDetailsPanel node={selectedNode} />
          )}
        </aside>
        
        <section className="research-interface">
          <ResearchInterface
            onStageComplete={handleStageComplete}
            onComplete={handleResearchComplete}
            onError={(error) => console.error('Research error:', error)}
          />
        </section>
        
        <section className="visualization">
          {state?.graphData && (
            <GraphVisualization
              graphData={state.graphData}
              layout="cose"
              interactive={true}
              showConfidence={true}
              onNodeSelect={handleNodeSelect}
            />
          )}
        </section>
        
        <section className="export-tools">
          <ExportFunctionality
            graphData={state?.graphData}
            stageResults={state?.stageResults}
          />
        </section>
      </main>
      
      {error && (
        <div className="error-banner">
          <strong>Error:</strong> {error}
        </div>
      )}
    </div>
  );
}
```

---

### Custom Stage Execution

```typescript
import { AsrGotStageEngine } from '@/services/AsrGotStageEngine';
import { BackgroundProcessor } from '@/utils/background/BackgroundProcessor';

class CustomResearchPipeline {
  private engine: AsrGotStageEngine;
  private progressCallback?: (stage: number, progress: number) => void;
  
  constructor(
    credentials: APICredentials,
    onProgress?: (stage: number, progress: number) => void
  ) {
    this.engine = new AsrGotStageEngine(credentials);
    this.progressCallback = onProgress;
  }
  
  async executeCustomPipeline(
    taskDescription: string,
    customParameters?: CustomParameters
  ): Promise<ResearchResults> {
    const results: any[] = [];
    
    try {
      // Stage 1: Initialization
      this.updateProgress(1, 0);
      const stage1 = await this.engine.executeStage1(taskDescription);
      results.push(stage1);
      this.updateProgress(1, 100);
      
      // Stage 2: Decomposition
      this.updateProgress(2, 0);
      const stage2 = await this.engine.executeStage2();
      results.push(stage2);
      this.updateProgress(2, 100);
      
      // Custom parallel processing for stages 3-4
      this.updateProgress(3, 0);
      const [stage3, stage4] = await Promise.all([
        this.engine.executeStage3(),
        this.executeCustomEvidenceCollection(stage2.graph)
      ]);
      results.push(stage3, stage4);
      this.updateProgress(4, 100);
      
      // Continue with remaining stages...
      for (let stage = 5; stage <= 9; stage++) {
        this.updateProgress(stage, 0);
        const result = await this.executeStageWithRetry(stage);
        results.push(result);
        this.updateProgress(stage, 100);
      }
      
      return {
        success: true,
        stages: results,
        finalReport: results[8].finalReport,
        metadata: {
          totalTime: Date.now() - startTime,
          apiCallsUsed: this.engine.getApiCallCount(),
          tokensConsumed: this.engine.getTokenUsage()
        }
      };
      
    } catch (error) {
      console.error('Pipeline execution failed:', error);
      throw error;
    }
  }
  
  private async executeCustomEvidenceCollection(graph: GraphData): Promise<any> {
    // Custom evidence collection logic
    const hypotheses = graph.nodes.filter(n => n.type === 'hypothesis');
    
    const evidencePromises = hypotheses.map(async (hypothesis) => {
      // Use background processor for parallel evidence collection
      return BackgroundProcessor.submitTask(
        'evidence_collection',
        {
          hypothesis: hypothesis.metadata.value,
          field: graph.metadata.field
        },
        { priority: 'high' }
      );
    });
    
    const evidence = await Promise.all(evidencePromises);
    
    return {
      type: 'custom_evidence_collection',
      evidence,
      hypothesesProcessed: hypotheses.length
    };
  }
  
  private async executeStageWithRetry(
    stageNumber: number,
    maxRetries: number = 3
  ): Promise<any> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        switch (stageNumber) {
          case 5:
            return await this.engine.executeStage5();
          case 6:
            return await this.engine.executeStage6();
          case 7:
            return await this.engine.executeStage7();
          case 8:
            return await this.engine.executeStage8();
          case 9:
            return await this.engine.executeStage9();
          default:
            throw new Error(`Unknown stage: ${stageNumber}`);
        }
      } catch (error) {
        console.warn(`Stage ${stageNumber} attempt ${attempt} failed:`, error);
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    }
  }
  
  private updateProgress(stage: number, progress: number): void {
    this.progressCallback?.(stage, progress);
  }
}

// Usage
const customPipeline = new CustomResearchPipeline(
  credentials,
  (stage, progress) => {
    console.log(`Stage ${stage}: ${progress}%`);
  }
);

const results = await customPipeline.executeCustomPipeline(
  "Analyze the role of epigenetic modifications in CTCL progression"
);

console.log('Research completed:', results);
```

---

## Error Handling

### Comprehensive Error Management

```typescript
import { ApiError, ValidationError, NetworkError } from '@/types/errors';

class ErrorHandler {
  static handleApiError(error: ApiError): void {
    switch (error.code) {
      case 'RATE_LIMIT_EXCEEDED':
        // Show rate limit message and retry timer
        this.showRateLimitMessage(error.retryAfter);
        break;
        
      case 'INVALID_API_KEY':
        // Prompt for new API key
        this.promptForApiKey(error.service);
        break;
        
      case 'QUOTA_EXCEEDED':
        // Show quota exceeded message
        this.showQuotaMessage(error.service, error.quotaReset);
        break;
        
      case 'MAX_TOKENS':
        // Handle token limit with chunking
        this.handleTokenLimit(error);
        break;
        
      default:
        console.error('Unhandled API error:', error);
    }
  }
  
  static handleValidationError(error: ValidationError): void {
    // Show field-specific validation messages
    error.fields.forEach(field => {
      this.showFieldError(field.name, field.message);
    });
  }
  
  static handleNetworkError(error: NetworkError): void {
    if (error.offline) {
      this.showOfflineMessage();
    } else {
      this.showConnectionError(error.message);
    }
  }
  
  private static showRateLimitMessage(retryAfter?: number): void {
    const message = retryAfter 
      ? `Rate limit exceeded. Retry in ${retryAfter} seconds.`
      : 'Rate limit exceeded. Please wait before making another request.';
    
    console.warn(message);
    // Show user notification
  }
  
  private static promptForApiKey(service: string): void {
    console.error(`Invalid ${service} API key. Please update your credentials.`);
    // Show API key input modal
  }
  
  private static handleTokenLimit(error: ApiError): void {
    console.warn('Token limit exceeded. Implementing chunking strategy...');
    // Implement automatic chunking and retry
  }
}

// Error boundary for React components
class ResearchErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Research component error:', error, errorInfo);
    
    // Report error to monitoring service
    this.reportError(error, errorInfo);
  }
  
  private reportError(error: Error, errorInfo: React.ErrorInfo): void {
    // Send error report to monitoring service
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name
        },
        errorInfo,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent
      })
    }).catch(console.error);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <details>
            <summary>Error details</summary>
            <pre>{this.state.error?.stack}</pre>
          </details>
          <button onClick={() => window.location.reload()}>
            Reload Application
          </button>
        </div>
      );
    }
    
    return this.props.children;
  }
}

// Usage
function App() {
  return (
    <ResearchErrorBoundary>
      <ResearchInterface />
    </ResearchErrorBoundary>
  );
}
```

---

## Rate Limiting & Security

### API Rate Limiting

```typescript
class RateLimiter {
  private limits: Map<string, {
    count: number;
    resetTime: number;
    limit: number;
    window: number;
  }> = new Map();
  
  constructor(private defaultLimits: Record<string, { limit: number; window: number }>) {
    // Initialize default limits
    Object.entries(defaultLimits).forEach(([key, config]) => {
      this.limits.set(key, {
        count: 0,
        resetTime: Date.now() + config.window,
        limit: config.limit,
        window: config.window
      });
    });
  }
  
  isAllowed(key: string): boolean {
    const limit = this.limits.get(key);
    if (!limit) return true;
    
    const now = Date.now();
    
    // Reset if window has passed
    if (now >= limit.resetTime) {
      limit.count = 0;
      limit.resetTime = now + limit.window;
    }
    
    // Check if under limit
    if (limit.count >= limit.limit) {
      return false;
    }
    
    // Increment counter
    limit.count++;
    return true;
  }
  
  getRemainingRequests(key: string): number {
    const limit = this.limits.get(key);
    return limit ? Math.max(0, limit.limit - limit.count) : Infinity;
  }
  
  getResetTime(key: string): number {
    const limit = this.limits.get(key);
    return limit ? limit.resetTime : 0;
  }
}

// Usage
const rateLimiter = new RateLimiter({
  'gemini-api': { limit: 100, window: 60000 }, // 100 requests per minute
  'perplexity-api': { limit: 50, window: 60000 }, // 50 requests per minute
  'user-actions': { limit: 1000, window: 3600000 } // 1000 actions per hour
});

// Check before API call
if (!rateLimiter.isAllowed('gemini-api')) {
  const resetTime = rateLimiter.getResetTime('gemini-api');
  const waitTime = Math.ceil((resetTime - Date.now()) / 1000);
  throw new Error(`Rate limit exceeded. Try again in ${waitTime} seconds.`);
}
```

---

### Security Validation

```typescript
class SecurityValidator {
  static validateApiKey(key: string, service: 'gemini' | 'perplexity' | 'openai'): boolean {
    const patterns = {
      gemini: /^AIza[A-Za-z0-9_-]{35}$/,
      perplexity: /^pplx-[a-f0-9]{40}$/,
      openai: /^sk-[A-Za-z0-9]{48}$/
    };
    
    const pattern = patterns[service];
    return pattern ? pattern.test(key) : false;
  }
  
  static sanitizeInput(input: string): string {
    // Remove potentially dangerous content
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim();
  }
  
  static validatePrompt(prompt: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];
    
    if (!prompt || prompt.trim().length === 0) {
      issues.push('Prompt cannot be empty');
    }
    
    if (prompt.length > 100000) {
      issues.push('Prompt too long (>100k characters)');
    }
    
    // Check for prompt injection attempts
    const injectionPatterns = [
      /ignore\s+previous\s+instructions/i,
      /forget\s+everything/i,
      /system\s*:\s*you\s+are/i,
      /roleplay\s+as/i
    ];
    
    injectionPatterns.forEach(pattern => {
      if (pattern.test(prompt)) {
        issues.push('Potential prompt injection detected');
      }
    });
    
    return { valid: issues.length === 0, issues };
  }
  
  static encryptSensitiveData(data: any): string {
    // In production, use proper encryption
    return btoa(JSON.stringify(data));
  }
  
  static decryptSensitiveData(encrypted: string): any {
    // In production, use proper decryption
    try {
      return JSON.parse(atob(encrypted));
    } catch {
      return null;
    }
  }
}

// Usage
const isValidKey = SecurityValidator.validateApiKey(apiKey, 'gemini');
if (!isValidKey) {
  throw new Error('Invalid API key format');
}

const sanitizedPrompt = SecurityValidator.sanitizeInput(userPrompt);
const validation = SecurityValidator.validatePrompt(sanitizedPrompt);

if (!validation.valid) {
  console.error('Prompt validation failed:', validation.issues);
  throw new ValidationError('Invalid prompt', validation.issues);
}
```

---

## Testing APIs

### Unit Testing Utilities

```typescript
// Test utilities for ASR-GoT components
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';

export class ASRGoTTestUtils {
  static createMockCredentials(): APICredentials {
    return {
      gemini: 'AIza' + 'x'.repeat(35),
      perplexity: 'pplx-' + 'a'.repeat(40),
      openai: 'sk-' + 'x'.repeat(48)
    };
  }
  
  static createMockGraphData(): GraphData {
    return {
      nodes: [
        {
          id: 'n0_root',
          label: 'Task Understanding',
          type: 'root',
          confidence: [0.8, 0.7, 0.6, 0.8],
          metadata: {
            parameter_id: 'P1.1',
            type: 'root_initialization',
            source_description: 'Test root node',
            value: 'Test research question',
            timestamp: new Date().toISOString(),
            impact_score: 1.0
          }
        }
      ],
      edges: [],
      metadata: {
        version: '1.0.0',
        created: new Date().toISOString(),
        last_updated: new Date().toISOString(),
        stage: 1,
        total_nodes: 1,
        total_edges: 0,
        graph_metrics: {}
      }
    };
  }
  
  static mockApiService() {
    const mockCallGeminiAPI = jest.fn().mockResolvedValue('Mock Gemini response');
    const mockCallPerplexityAPI = jest.fn().mockResolvedValue('Mock Perplexity response');
    
    jest.mock('@/services/apiService', () => ({
      callGeminiAPI: mockCallGeminiAPI,
      callPerplexitySonarAPI: mockCallPerplexityAPI
    }));
    
    return { mockCallGeminiAPI, mockCallPerplexityAPI };
  }
  
  static renderWithProviders(component: React.ReactElement) {
    const mockContextValue = {
      state: {
        graphData: this.createMockGraphData(),
        credentials: this.createMockCredentials()
      },
      isExecuting: false,
      currentStage: 1,
      error: null
    };
    
    return render(
      <ASRGoTContext.Provider value={mockContextValue}>
        {component}
      </ASRGoTContext.Provider>
    );
  }
  
  static async waitForStageCompletion(stageName: string, timeout: number = 5000) {
    await waitFor(
      () => {
        expect(screen.getByText(new RegExp(stageName, 'i'))).toBeInTheDocument();
      },
      { timeout }
    );
  }
}

// Example test
describe('ResearchInterface', () => {
  it('should execute stage 1 successfully', async () => {
    const { mockCallGeminiAPI } = ASRGoTTestUtils.mockApiService();
    
    ASRGoTTestUtils.renderWithProviders(<ResearchInterface />);
    
    // Enter research question
    const input = screen.getByPlaceholderText(/enter research question/i);
    fireEvent.change(input, { 
      target: { value: 'Test research question' } 
    });
    
    // Click execute button
    const executeButton = screen.getByText(/execute stage 1/i);
    fireEvent.click(executeButton);
    
    // Wait for completion
    await ASRGoTTestUtils.waitForStageCompletion('Stage 1: Initialization Complete');
    
    // Verify API was called
    expect(mockCallGeminiAPI).toHaveBeenCalledWith(
      expect.stringContaining('Test research question'),
      expect.any(String),
      'thinking-only'
    );
  });
});
```

---

### Integration Testing

```typescript
// Integration test example
import { AsrGotStageEngine } from '@/services/AsrGotStageEngine';
import { ASRGoTTestUtils } from './testUtils';

describe('ASR-GoT Pipeline Integration', () => {
  let engine: AsrGotStageEngine;
  
  beforeEach(() => {
    engine = new AsrGotStageEngine(ASRGoTTestUtils.createMockCredentials());
  });
  
  it('should complete full 9-stage pipeline', async () => {
    const taskDescription = 'Analyze CRISPR applications in immunotherapy';
    
    // Stage 1: Initialization
    const stage1 = await engine.executeStage1(taskDescription);
    expect(stage1.graph.nodes).toHaveLength(1);
    expect(stage1.graph.nodes[0].type).toBe('root');
    
    // Stage 2: Decomposition  
    const stage2 = await engine.executeStage2();
    expect(stage2.graph.nodes.length).toBeGreaterThan(1);
    
    // Stage 3: Hypothesis Generation
    const stage3 = await engine.executeStage3();
    const hypotheses = stage3.graph.nodes.filter(n => n.type === 'hypothesis');
    expect(hypotheses.length).toBeGreaterThan(0);
    
    // Continue through remaining stages...
    const stage4 = await engine.executeStage4();
    const stage5 = await engine.executeStage5();
    const stage6 = await engine.executeStage6();
    const stage7 = await engine.executeStage7();
    const stage8 = await engine.executeStage8();
    const stage9 = await engine.executeStage9();
    
    // Verify final output
    expect(stage9.finalReport).toBeDefined();
    expect(stage9.finalReport).toContain('<!DOCTYPE html>');
    expect(stage9.graph.metadata.stage).toBe(9);
    expect(stage9.graph.metadata.completed).toBe(true);
  }, 30000); // 30 second timeout for full pipeline
});
```

---

This comprehensive API documentation provides developers with complete reference material for integrating with and extending the ASR-GoT framework. Each API includes detailed examples, type definitions, and usage patterns to ensure successful implementation.