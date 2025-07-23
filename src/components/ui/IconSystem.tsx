/**
 * Comprehensive Icon System for ASR-GoT
 * Provides consistent iconography for different content types, states, and actions
 */

import React from 'react';
import {
  // Content Type Icons
  FileText, Book, BookOpen, ScrollText, Newspaper, File, FileSpreadsheet,
  // Research Stage Icons
  Target, Settings, Microscope, Database, Scissors, Search, PenTool, Brain, BarChart3,
  // Status Icons
  CheckCircle, AlertCircle, Clock, Play, Pause, Loader2, XCircle, AlertTriangle,
  // Action Icons
  Download, Upload, Save, Share, Copy, Edit, Trash2, Plus, Minus, Eye, EyeOff,
  // Navigation Icons
  ChevronRight, ChevronLeft, ChevronUp, ChevronDown, ArrowRight, ArrowLeft,
  // Data Type Icons
  TrendingUp, PieChart, Activity, Zap, Network, GitBranch, Layers,
  // User & Auth Icons
  User, Users, Key, Shield, Lock, Unlock, Mail, Phone,
  // System Icons
  Cpu, Server, Globe, Wifi, WifiOff, Refresh, Power, Settings2
} from 'lucide-react';

// Icon size variants
export type IconSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type IconVariant = 'default' | 'muted' | 'success' | 'warning' | 'error' | 'info';

const iconSizes: Record<IconSize, string> = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4', 
  md: 'h-5 w-5',
  lg: 'h-6 w-6',
  xl: 'h-8 w-8'
};

const iconVariants: Record<IconVariant, string> = {
  default: 'text-gray-600',
  muted: 'text-gray-400',
  success: 'text-green-600',
  warning: 'text-yellow-600',
  error: 'text-red-600',
  info: 'text-blue-600'
};

interface IconProps {
  size?: IconSize;
  variant?: IconVariant;
  className?: string;
}

// Content Type Icons
export const ContentTypeIcons = {
  // Research content types
  paper: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <FileText className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  article: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <Newspaper className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  book: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <Book className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  study: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <BookOpen className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  report: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <ScrollText className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  dataset: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <FileSpreadsheet className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  document: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <File className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  )
};

// Research Stage Icons (ASR-GoT 9 stages)
export const StageIcons = {
  initialization: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <Target className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  decomposition: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <Settings className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  hypothesis: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <Microscope className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  evidence: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <Database className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  pruning: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <Scissors className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  extraction: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <Search className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  composition: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <PenTool className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  reflection: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <Brain className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  analysis: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <BarChart3 className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  )
};

// Status & State Icons
export const StatusIcons = {
  completed: ({ size = 'md', variant = 'success', className = '' }: IconProps) => (
    <CheckCircle className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  pending: ({ size = 'md', variant = 'muted', className = '' }: IconProps) => (
    <Clock className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  running: ({ size = 'md', variant = 'info', className = '' }: IconProps) => (
    <Play className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  paused: ({ size = 'md', variant = 'warning', className = '' }: IconProps) => (
    <Pause className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  loading: ({ size = 'md', variant = 'info', className = '' }: IconProps) => (
    <Loader2 className={`${iconSizes[size]} ${iconVariants[variant]} ${className} animate-spin`} />
  ),
  failed: ({ size = 'md', variant = 'error', className = '' }: IconProps) => (
    <XCircle className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  warning: ({ size = 'md', variant = 'warning', className = '' }: IconProps) => (
    <AlertTriangle className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  info: ({ size = 'md', variant = 'info', className = '' }: IconProps) => (
    <AlertCircle className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  )
};

// Action Icons
export const ActionIcons = {
  download: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <Download className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  upload: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <Upload className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  save: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <Save className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  share: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <Share className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  copy: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <Copy className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  edit: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <Edit className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  delete: ({ size = 'md', variant = 'error', className = '' }: IconProps) => (
    <Trash2 className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  add: ({ size = 'md', variant = 'success', className = '' }: IconProps) => (
    <Plus className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  remove: ({ size = 'md', variant = 'error', className = '' }: IconProps) => (
    <Minus className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  view: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <Eye className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  hide: ({ size = 'md', variant = 'muted', className = '' }: IconProps) => (
    <EyeOff className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  )
};

// Data Visualization Icons
export const DataIcons = {
  chart: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <BarChart3 className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  trend: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <TrendingUp className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  pie: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <PieChart className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  activity: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <Activity className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  network: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <Network className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  branch: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <GitBranch className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  layers: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <Layers className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  performance: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <Zap className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  )
};

// Navigation Icons
export const NavigationIcons = {
  next: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <ChevronRight className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  previous: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <ChevronLeft className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  up: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <ChevronUp className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  down: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <ChevronDown className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  forward: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <ArrowRight className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  back: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <ArrowLeft className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  )
};

// User & Authentication Icons
export const UserIcons = {
  user: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <User className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  users: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <Users className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  key: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <Key className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  shield: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <Shield className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  lock: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <Lock className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  unlock: ({ size = 'md', variant = 'success', className = '' }: IconProps) => (
    <Unlock className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  email: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <Mail className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  phone: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <Phone className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  )
};

// System & Technical Icons
export const SystemIcons = {
  cpu: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <Cpu className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  server: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <Server className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  globe: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <Globe className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  connected: ({ size = 'md', variant = 'success', className = '' }: IconProps) => (
    <Wifi className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  disconnected: ({ size = 'md', variant = 'error', className = '' }: IconProps) => (
    <WifiOff className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  refresh: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <Refresh className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  power: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <Power className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  ),
  settings: ({ size = 'md', variant = 'default', className = '' }: IconProps) => (
    <Settings2 className={`${iconSizes[size]} ${iconVariants[variant]} ${className}`} />
  )
};

// Utility function to get icon by type and name
export const getIcon = (
  category: 'content' | 'stage' | 'status' | 'action' | 'data' | 'nav' | 'user' | 'system',
  name: string,
  props?: IconProps
) => {
  const iconSets = {
    content: ContentTypeIcons,
    stage: StageIcons,
    status: StatusIcons,
    action: ActionIcons,
    data: DataIcons,
    nav: NavigationIcons,
    user: UserIcons,
    system: SystemIcons
  };

  const iconSet = iconSets[category];
  const IconComponent = iconSet?.[name as keyof typeof iconSet];
  
  return IconComponent ? IconComponent(props || {}) : null;
};

// Compound component for easy icon usage with labels
interface IconWithLabelProps extends IconProps {
  category: 'content' | 'stage' | 'status' | 'action' | 'data' | 'nav' | 'user' | 'system';
  name: string;
  label?: string;
  position?: 'left' | 'right' | 'top' | 'bottom';
}

export const IconWithLabel: React.FC<IconWithLabelProps> = ({
  category,
  name,
  label,
  position = 'left',
  ...iconProps
}) => {
  const icon = getIcon(category, name, iconProps);
  
  if (!label) return icon;
  
  const flexDirection = {
    left: 'flex-row',
    right: 'flex-row-reverse',
    top: 'flex-col',
    bottom: 'flex-col-reverse'
  };
  
  const spacing = {
    left: 'space-x-2',
    right: 'space-x-2',
    top: 'space-y-1',
    bottom: 'space-y-1'
  };
  
  return (
    <div className={`flex items-center ${flexDirection[position]} ${spacing[position]}`}>
      {icon}
      <span>{label}</span>
    </div>
  );
};

export default {
  ContentTypeIcons,
  StageIcons,
  StatusIcons,
  ActionIcons,
  DataIcons,
  NavigationIcons,
  UserIcons,
  SystemIcons,
  getIcon,
  IconWithLabel
};