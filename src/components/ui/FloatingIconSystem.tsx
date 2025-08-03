/**
 * Floating Icon System - Organized notification and tracking system
 * Three categorized floating icons: Notifications, Cost/Tokens, and Debug
 */

import React, { useState, useEffect, useRef } from 'react';
import { Bell, DollarSign, Bug, X, Info, AlertTriangle, CheckCircle, AlertCircle, TrendingUp, Activity, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

// Notification Types
interface SystemNotification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  timestamp: Date;
  read: boolean;
  category: 'system' | 'stage' | 'auth' | 'general';
}

// Cost/Token Tracking Types
interface TokenUsage {
  stage: number;
  stageName: string;
  tokensUsed: number;
  estimatedCost: number;
  timestamp: Date;
  provider: 'gemini' | 'perplexity' | 'openai';
}

interface CostSummary {
  totalTokens: number;
  totalCost: number;
  averageTokensPerStage: number;
  averageCostPerStage: number;
  sessionStartTime: Date;
  stageBreakdown: TokenUsage[];
}

// Global Managers
class SystemNotificationManager {
  private static instance: SystemNotificationManager;
  private notifications: SystemNotification[] = [];
  private listeners: Set<(notifications: SystemNotification[]) => void> = new Set();
  private maxNotifications = 100;

  static getInstance(): SystemNotificationManager {
    if (!SystemNotificationManager.instance) {
      SystemNotificationManager.instance = new SystemNotificationManager();
    }
    return SystemNotificationManager.instance;
  }

  addNotification(
    message: string, 
    type: 'info' | 'warning' | 'success' | 'error' = 'info',
    category: 'system' | 'stage' | 'auth' | 'general' = 'general'
  ) {
    // Check for recent duplicates
    const now = new Date();
    const recentDuplicate = this.notifications.find(
      n => n.message === message && 
      (now.getTime() - n.timestamp.getTime()) < 30000
    );

    if (recentDuplicate) {
      console.log(`🔇 Skipping duplicate system notification: "${message}"`);
      return;
    }

    const notification: SystemNotification = {
      id: `sys-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      type,
      timestamp: now,
      read: false,
      category
    };

    this.notifications.unshift(notification);

    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }

    this.notifyListeners();
  }

  getNotifications(): SystemNotification[] {
    return this.notifications;
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.notifyListeners();
  }

  clearAll() {
    this.notifications = [];
    this.notifyListeners();
  }

  subscribe(listener: (notifications: SystemNotification[]) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.notifications));
  }
}

class CostTrackingManager {
  private static instance: CostTrackingManager;
  private costSummary: CostSummary;
  private listeners: Set<(summary: CostSummary) => void> = new Set();

  static getInstance(): CostTrackingManager {
    if (!CostTrackingManager.instance) {
      CostTrackingManager.instance = new CostTrackingManager();
    }
    return CostTrackingManager.instance;
  }

  constructor() {
    this.costSummary = {
      totalTokens: 0,
      totalCost: 0,
      averageTokensPerStage: 0,
      averageCostPerStage: 0,
      sessionStartTime: new Date(),
      stageBreakdown: []
    };
  }

  addStageUsage(
    stage: number,
    stageName: string,
    tokensUsed: number,
    provider: 'gemini' | 'perplexity' | 'openai' = 'gemini'
  ) {
    // Calculate cost based on provider
    const costPerToken = {
      gemini: 0.000001, // $1 per 1M tokens (example rates)
      perplexity: 0.000002,
      openai: 0.000003
    };

    const estimatedCost = tokensUsed * costPerToken[provider];

    const usage: TokenUsage = {
      stage,
      stageName,
      tokensUsed,
      estimatedCost,
      timestamp: new Date(),
      provider
    };

    // Remove existing entry for this stage if it exists
    this.costSummary.stageBreakdown = this.costSummary.stageBreakdown.filter(u => u.stage !== stage);
    this.costSummary.stageBreakdown.push(usage);
    this.costSummary.stageBreakdown.sort((a, b) => a.stage - b.stage);

    // Recalculate totals
    this.recalculateTotals();
    this.notifyListeners();
  }

  private recalculateTotals() {
    this.costSummary.totalTokens = this.costSummary.stageBreakdown.reduce((sum, usage) => sum + usage.tokensUsed, 0);
    this.costSummary.totalCost = this.costSummary.stageBreakdown.reduce((sum, usage) => sum + usage.estimatedCost, 0);
    
    if (this.costSummary.stageBreakdown.length > 0) {
      this.costSummary.averageTokensPerStage = this.costSummary.totalTokens / this.costSummary.stageBreakdown.length;
      this.costSummary.averageCostPerStage = this.costSummary.totalCost / this.costSummary.stageBreakdown.length;
    }
  }

  getCostSummary(): CostSummary {
    return this.costSummary;
  }

  resetSession() {
    this.costSummary = {
      totalTokens: 0,
      totalCost: 0,
      averageTokensPerStage: 0,
      averageCostPerStage: 0,
      sessionStartTime: new Date(),
      stageBreakdown: []
    };
    this.notifyListeners();
  }

  subscribe(listener: (summary: CostSummary) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.costSummary));
  }
}

// Export global instances
export const systemNotificationManager = SystemNotificationManager.getInstance();
export const costTrackingManager = CostTrackingManager.getInstance();

// Individual Floating Icons
const NotificationIcon: React.FC<{ position: 'bottom' | 'middle' | 'top' }> = ({ position }) => {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const unsubscribe = systemNotificationManager.subscribe((newNotifications) => {
      setNotifications(newNotifications);
      setUnreadCount(systemNotificationManager.getUnreadCount());
    });
    return unsubscribe;
  }, []);

  const getIcon = (type: SystemNotification['type']) => {
    switch (type) {
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  const positionOffset = position === 'bottom' ? 0 : position === 'middle' ? 70 : 140;

  return (
    <div className={`absolute bottom-${positionOffset} right-0`}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) systemNotificationManager.markAllAsRead();
          }}
          className="relative h-14 w-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          size="icon"
        >
          <Bell className="h-6 w-6" />
          
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-16 right-0 mb-2"
          >
            <Card className="w-96 max-h-96 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-semibold">System Notifications</CardTitle>
                  <Badge variant="secondary">{notifications.length}</Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-0">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">No notifications</p>
                  </div>
                ) : (
                  <ScrollArea className="h-80">
                    <div className="p-3 space-y-2">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 rounded-lg border transition-all duration-200 hover:bg-gray-50 ${
                            notification.read ? 'opacity-60' : 'bg-blue-50/50 border-blue-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            {getIcon(notification.type)}
                            <div className="flex-1">
                              <p className="text-sm text-gray-800">{notification.message}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {notification.category}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {formatTime(notification.timestamp)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const CostTrackingIcon: React.FC<{ position: 'bottom' | 'middle' | 'top' }> = ({ position }) => {
  const [costSummary, setCostSummary] = useState<CostSummary>(costTrackingManager.getCostSummary());
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const unsubscribe = costTrackingManager.subscribe(setCostSummary);
    return unsubscribe;
  }, []);

  const positionOffset = position === 'bottom' ? 0 : position === 'middle' ? 70 : 140;

  const stageNames = [
    'Initialization',
    'Decomposition', 
    'Hypothesis Planning',
    'Evidence Integration',
    'Pruning & Merging',
    'Subgraph Extraction',
    'Composition',
    'Reflection',
    'Final Analysis'
  ];

  return (
    <div className={`absolute bottom-${positionOffset} right-0`}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="relative h-14 w-14 rounded-full bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
          size="icon"
        >
          <Coins className="h-6 w-6" />
          
          {costSummary.totalCost > 0 && (
            <motion.div
              className="absolute -top-1 -right-1 h-4 w-8 bg-yellow-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              ${costSummary.totalCost.toFixed(3)}
            </motion.div>
          )}
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-16 right-0 mb-2"
          >
            <Card className="w-96 max-h-96 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Cost & Token Tracking
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Summary Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {costSummary.totalTokens.toLocaleString()}
                    </div>
                    <div className="text-xs text-blue-500">Total Tokens</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ${costSummary.totalCost.toFixed(4)}
                    </div>
                    <div className="text-xs text-green-500">Total Cost</div>
                  </div>
                </div>

                {/* Averages */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-semibold text-gray-700">
                      {Math.round(costSummary.averageTokensPerStage)}
                    </div>
                    <div className="text-xs text-gray-500">Avg Tokens/Stage</div>
                  </div>
                  <div className="text-center p-2 bg-gray-50 rounded">
                    <div className="font-semibold text-gray-700">
                      ${costSummary.averageCostPerStage.toFixed(4)}
                    </div>
                    <div className="text-xs text-gray-500">Avg Cost/Stage</div>
                  </div>
                </div>

                <Separator />

                {/* Stage Breakdown */}
                <div>
                  <h4 className="font-semibold text-sm mb-3">Stage Breakdown</h4>
                  {costSummary.stageBreakdown.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm py-4">
                      No usage data yet
                    </p>
                  ) : (
                    <ScrollArea className="h-40">
                      <div className="space-y-2">
                        {costSummary.stageBreakdown.map((usage) => (
                          <div key={usage.stage} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                            <div>
                              <div className="font-medium">
                                Stage {usage.stage + 1}: {stageNames[usage.stage] || usage.stageName}
                              </div>
                              <div className="text-xs text-gray-500 capitalize">
                                via {usage.provider}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-medium">
                                {usage.tokensUsed.toLocaleString()} tokens
                              </div>
                              <div className="text-xs text-green-600">
                                ${usage.estimatedCost.toFixed(4)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>

                {/* Reset Button */}
                {costSummary.totalCost > 0 && (
                  <Button
                    onClick={() => costTrackingManager.resetSession()}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Reset Session
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Debug Icon with on-demand recording
const DebugIcon: React.FC<{ position: 'bottom' | 'middle' | 'top' }> = ({ position }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const recordingStartTime = useRef<Date | null>(null);

  const startRecording = () => {
    if (isRecording) return;
    
    setIsRecording(true);
    recordingStartTime.current = new Date();
    setDebugLogs([]);
    
    // Capture console logs during recording
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;
    
    const recordLog = (level: string, ...args: any[]) => {
      const timestamp = new Date().toLocaleTimeString();
      const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
      setDebugLogs(prev => [...prev, `[${timestamp}] ${level.toUpperCase()}: ${message}`]);
    };
    
    console.log = (...args) => {
      originalLog(...args);
      if (isRecording) recordLog('log', ...args);
    };
    
    console.error = (...args) => {
      originalError(...args);
      if (isRecording) recordLog('error', ...args);
    };
    
    console.warn = (...args) => {
      originalWarn(...args);
      if (isRecording) recordLog('warn', ...args);
    };
    
    systemNotificationManager.addNotification('Debug recording started', 'info', 'system');
  };

  const stopRecording = () => {
    if (!isRecording) return;
    
    setIsRecording(false);
    recordingStartTime.current = null;
    
    systemNotificationManager.addNotification(`Debug recording stopped. Captured ${debugLogs.length} events`, 'success', 'system');
  };

  const clearLogs = () => {
    setDebugLogs([]);
    systemNotificationManager.addNotification('Debug logs cleared', 'info', 'system');
  };

  const exportLogs = () => {
    const logContent = debugLogs.join('\n');
    const blob = new Blob([logContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-logs-${new Date().toISOString().slice(0, 19)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    systemNotificationManager.addNotification('Debug logs exported', 'success', 'system');
  };

  const positionOffset = position === 'bottom' ? 0 : position === 'middle' ? 70 : 140;

  return (
    <div className={`absolute bottom-${positionOffset} right-0`}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className={`relative h-14 w-14 rounded-full text-white shadow-lg hover:shadow-xl transition-all duration-200 ${
            isRecording 
              ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
          size="icon"
        >
          <Bug className="h-6 w-6" />
          
          {isRecording && (
            <motion.div
              className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          )}
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="absolute bottom-16 right-0 mb-2"
          >
            <Card className="w-96 max-h-96 shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Bug className="h-5 w-5 text-purple-600" />
                  Debug Console
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Recording Controls */}
                <div className="flex gap-2">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    variant={isRecording ? "destructive" : "default"}
                    size="sm"
                    className="flex-1"
                  >
                    {isRecording ? (
                      <>
                        <Activity className="h-4 w-4 mr-2" />
                        Stop Recording
                      </>
                    ) : (
                      <>
                        <Activity className="h-4 w-4 mr-2" />
                        Start Recording
                      </>
                    )}
                  </Button>
                  
                  <Button
                    onClick={clearLogs}
                    variant="outline"
                    size="sm"
                    disabled={debugLogs.length === 0}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    onClick={exportLogs}
                    variant="outline"
                    size="sm"
                    disabled={debugLogs.length === 0}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>

                {/* Status */}
                <div className="text-sm">
                  <Badge variant={isRecording ? "destructive" : "secondary"}>
                    {isRecording ? `Recording (${debugLogs.length} events)` : `Idle (${debugLogs.length} events)`}
                  </Badge>
                </div>

                {/* Debug Logs */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">Console Output</h4>
                  {debugLogs.length === 0 ? (
                    <p className="text-center text-gray-500 text-sm py-4">
                      {isRecording ? 'Recording... waiting for console events' : 'Click "Start Recording" to capture console output'}
                    </p>
                  ) : (
                    <ScrollArea className="h-32 bg-gray-50 rounded p-2">
                      <div className="space-y-1">
                        {debugLogs.map((log, index) => (
                          <div key={index} className="text-xs font-mono text-gray-700">
                            {log}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Main Floating Icon System
export const FloatingIconSystem: React.FC = () => {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <div className="relative">
        {/* Notification Bell - Bottom */}
        <NotificationIcon position="bottom" />
        
        {/* Cost Tracking - Middle */}
        <div className="absolute bottom-16 right-0 mb-2">
          <CostTrackingIcon position="middle" />
        </div>
        
        {/* Debug Button - Top */}
        <div className="absolute bottom-32 right-0 mb-4">
          <DebugIcon position="top" />
        </div>
      </div>
    </div>
  );
};

// Hooks for easy integration
export const useSystemNotifications = () => {
  return {
    addNotification: (message: string, type: 'info' | 'warning' | 'success' | 'error' = 'info', category: 'system' | 'stage' | 'auth' | 'general' = 'general') => {
      systemNotificationManager.addNotification(message, type, category);
    },
    manager: systemNotificationManager
  };
};

export const useCostTracking = () => {
  return {
    addStageUsage: (stage: number, stageName: string, tokensUsed: number, provider: 'gemini' | 'perplexity' | 'openai' = 'gemini') => {
      costTrackingManager.addStageUsage(stage, stageName, tokensUsed, provider);
    },
    manager: costTrackingManager
  };
};