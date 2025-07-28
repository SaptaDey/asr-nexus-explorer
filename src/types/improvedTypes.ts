/**
 * Improved TypeScript Types
 * Replaces any types with proper type definitions
 */

// Base types for better type safety
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface User extends BaseEntity {
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'user' | 'admin' | 'researcher';
}

// Collaboration service types
export interface CollaborationData {
  sessionId: string;
  userId: string;
  action: 'join' | 'leave' | 'update' | 'message';
  payload: CollaborationPayload;
  timestamp: number;
}

export interface CollaborationPayload {
  type: 'presence' | 'database' | 'realtime';
  data: Record<string, unknown>;
}

export interface PresenceState {
  user_id: string;
  online_at: string;
  collaborators: CollaborationUser[];
}

export interface CollaborationUser {
  id: string;
  name: string;
  avatar?: string;
  cursor_position?: { x: number; y: number };
  active_stage?: number;
}

// Computational budget types
export interface ComputationalOperation {
  id: string;
  type: 'api_call' | 'graph_processing' | 'visualization' | 'export';
  cost: number;
  duration: number;
  metadata: OperationMetadata;
}

export interface OperationMetadata {
  stage?: number;
  tokens_used?: number;
  model?: string;
  complexity?: 'low' | 'medium' | 'high';
  [key: string]: unknown;
}

export interface ResourceAllocation {
  operation_id: string;
  resource_type: 'cpu' | 'memory' | 'api_quota' | 'storage';
  allocated_amount: number;
  used_amount: number;
  timestamp: number;
}

export interface ComputationalSchedule {
  operations: ComputationalOperation[];
  timeline: Map<string, ResourceAllocation[]>;
  efficiency_score: number;
  estimated_completion: number;
}

// Tree visualization types (replacing any)
export interface TreePerformanceData {
  render_time: number;
  node_count: number;
  edge_count: number;
  memory_usage: number;
  fps: number;
}

export interface BotanicalElements {
  trunk: TreeElement;
  branches: TreeElement[];
  leaves: TreeElement[];
  roots: TreeElement[];
}

export interface TreeElement {
  id: string;
  type: 'trunk' | 'branch' | 'leaf' | 'root';
  position: { x: number; y: number; z: number };
  size: number;
  color: string;
  animation_state?: AnimationState;
}

export interface AnimationState {
  current_frame: number;
  total_frames: number;
  easing: 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out';
  loop: boolean;
}

export interface TreeAnimationConfig {
  growth_speed: number;
  branch_angle: number;
  leaf_density: number;
  root_depth: number;
  animation_duration: number;
}

// Dataset collection types
export interface DatasetItem {
  id: string;
  title: string;
  description: string;
  source: string;
  url?: string;
  relevance_score: number;
  confidence: number;
  extracted_data: ExtractedData[];
  metadata: DatasetMetadata;
}

export interface ExtractedData {
  type: 'text' | 'number' | 'date' | 'url' | 'citation';
  value: string | number | Date;
  context: string;
  confidence: number;
}

export interface DatasetMetadata {
  format: string;
  size_bytes: number;
  created_at: string;
  last_updated: string;
  tags: string[];
  quality_score: number;
}

// Secure data service types
export interface SecureInsertData {
  table: string;
  data: Record<string, unknown>;
  user_id: string;
  permissions?: AccessPermission[];
}

export interface SecureUpdateData {
  table: string;
  id: string;
  data: Record<string, unknown>;
  user_id: string;
  version?: number;
}

export interface SecureQueryFilters {
  [column: string]: string | number | boolean | null | QueryOperator;
}

export interface QueryOperator {
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in';
  value: unknown;
}

export interface AccessPermission {
  action: 'read' | 'write' | 'delete';
  resource: string;
  condition?: string;
}

// Database update handlers
export interface DatabaseUpdateEvent {
  session_id: string;
  event_type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  payload: DatabasePayload;
}

export interface DatabasePayload {
  old?: Record<string, unknown>;
  new?: Record<string, unknown>;
  commit_timestamp: string;
}

export interface PresenceEvent {
  session_id: string;
  event_type: 'JOIN' | 'LEAVE' | 'UPDATE';
  payload: PresencePayload;
}

export interface PresencePayload {
  user_id: string;
  metadata: UserPresenceMetadata;
}

export interface UserPresenceMetadata {
  name: string;
  avatar?: string;
  current_stage?: number;
  last_activity: string;
  device_info?: DeviceInfo;
}

export interface DeviceInfo {
  type: 'desktop' | 'tablet' | 'mobile';
  browser: string;
  os: string;
  screen_resolution?: string;
}

// Activity tracking
export interface ActivityData {
  user_id: string;
  action: ActivityAction;
  timestamp: number;
  context: ActivityContext;
}

export interface ActivityAction {
  type: 'stage_complete' | 'export' | 'visualization' | 'collaboration';
  details: string;
  success: boolean;
}

export interface ActivityContext {
  session_id: string;
  stage_index?: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}

// Generic API response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
  metadata?: ResponseMetadata;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ResponseMetadata {
  timestamp: string;
  request_id: string;
  version: string;
  rate_limit?: RateLimitInfo;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset_time: number;
}

// Type guards for runtime validation
export const isUser = (obj: unknown): obj is User => {
  return typeof obj === 'object' && obj !== null && 
         'id' in obj && 'email' in obj && 'role' in obj;
};

export const isCollaborationData = (obj: unknown): obj is CollaborationData => {
  return typeof obj === 'object' && obj !== null &&
         'sessionId' in obj && 'userId' in obj && 'action' in obj && 'payload' in obj;
};

export const isApiResponse = <T>(obj: unknown): obj is ApiResponse<T> => {
  return typeof obj === 'object' && obj !== null && 'success' in obj;
};

// Utility types for better inference
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// Event handler types
export type EventHandler<T = unknown> = (event: T) => void | Promise<void>;
export type AsyncEventHandler<T = unknown> = (event: T) => Promise<void>;

// Generic callback types
export type Callback<T = void> = () => T;
export type CallbackWithParam<P, T = void> = (param: P) => T;
export type AsyncCallback<T = void> = () => Promise<T>;

export default {
  // Export all types as a namespace
  BaseEntity,
  User,
  CollaborationData,
  CollaborationPayload,
  PresenceState,
  CollaborationUser,
  ComputationalOperation,
  OperationMetadata,
  ResourceAllocation,
  ComputationalSchedule,
  TreePerformanceData,
  BotanicalElements,
  TreeElement,
  AnimationState,
  TreeAnimationConfig,
  DatasetItem,
  ExtractedData,
  DatasetMetadata,
  SecureInsertData,
  SecureUpdateData,
  SecureQueryFilters,
  QueryOperator,
  AccessPermission,
  DatabaseUpdateEvent,
  DatabasePayload,
  PresenceEvent,
  PresencePayload,
  UserPresenceMetadata,
  DeviceInfo,
  ActivityData,
  ActivityAction,
  ActivityContext,
  ApiResponse,
  ApiError,
  ResponseMetadata,
  RateLimitInfo,
  isUser,
  isCollaborationData,
  isApiResponse,
};