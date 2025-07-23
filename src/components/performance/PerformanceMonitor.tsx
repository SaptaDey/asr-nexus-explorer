/**
 * Performance Monitor Component
 * Real-time performance monitoring dashboard for ASR-GoT system
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Activity, Database, Zap, AlertTriangle, CheckCircle, RefreshCw, TrendingUp } from 'lucide-react';
// import { usePerformance } from '@/contexts/DatabaseContext'; // Temporarily disabled

interface PerformanceMonitorProps {
  className?: string;
  showDetailedMetrics?: boolean;
}

export function PerformanceMonitor({ className, showDetailedMetrics = true }: PerformanceMonitorProps) {
  // Temporary mock to replace disabled usePerformance hook
  const performance = null;
  const performanceMetrics = null;
  const cacheHealth = null;
  const refreshPerformanceMetrics = async () => {};
  const getHealthStatus = async () => null;
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [healthStatus, setHealthStatus] = useState<any>(null);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  /**
   * Refresh performance data
   */
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshPerformanceMetrics();
      const health = await getHealthStatus();
      setHealthStatus(health);
      
      if (performanceMetrics?.recommendations) {
        setRecommendations(performanceMetrics.recommendations);
      }
    } catch (error) {
      console.error('Failed to refresh performance metrics:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  /**
   * Auto-refresh every 30 seconds
   */
  useEffect(() => {
    const interval = setInterval(handleRefresh, 30000);
    return () => clearInterval(interval);
  }, []);

  /**
   * Initial load
   */
  useEffect(() => {
    handleRefresh();
  }, []);

  /**
   * Get status color based on health
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-500';
      case 'good': return 'bg-blue-500';
      case 'fair': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  /**
   * Get severity color for recommendations
   */
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  /**
   * Format performance trends for chart
   */
  const formatTrendsData = (trends: any) => {
    if (!trends) return [];
    
    const maxLength = Math.max(
      trends.cacheHitRate?.length || 0,
      trends.queryPerformance?.length || 0,
      trends.memoryUsage?.length || 0
    );
    
    return Array.from({ length: maxLength }, (_, i) => ({
      index: i,
      cacheHitRate: trends.cacheHitRate?.[i] || 0,
      queryPerformance: trends.queryPerformance?.[i] || 0,
      memoryUsage: trends.memoryUsage?.[i] || 0,
      networkLatency: trends.networkLatency?.[i] || 0
    }));
  };

  const trendsData = formatTrendsData(performanceMetrics?.trends);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Performance Monitor</h2>
        </div>
        <Button 
          onClick={handleRefresh} 
          disabled={isRefreshing}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Health Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {healthStatus?.performance?.health?.score?.toFixed(1) || 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Overall Score</div>
              <Badge variant="secondary" className={getStatusColor(healthStatus?.performance?.health?.status || 'unknown')}>
                {healthStatus?.performance?.health?.status || 'Unknown'}
              </Badge>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {performanceMetrics?.currentMetrics?.cacheMetrics?.hitRate 
                  ? (performanceMetrics.currentMetrics.cacheMetrics.hitRate * 100).toFixed(1) 
                  : 'N/A'}%
              </div>
              <div className="text-sm text-gray-600">Cache Hit Rate</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {performanceMetrics?.currentMetrics?.queryMetrics?.averageQueryTime || 'N/A'}ms
              </div>
              <div className="text-sm text-gray-600">Avg Query Time</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {performanceMetrics?.currentMetrics?.memoryMetrics?.heapUsage 
                  ? (performanceMetrics.currentMetrics.memoryMetrics.heapUsage * 100).toFixed(1)
                  : 'N/A'}%
              </div>
              <div className="text-sm text-gray-600">Memory Usage</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Alerts */}
      {performanceMetrics?.alerts && performanceMetrics.alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {performanceMetrics.alerts.map((alert: any, index: number) => (
                <Alert key={index} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-center justify-between">
                      <span>{alert.message}</span>
                      <Badge variant={getSeverityColor(alert.severity)}>
                        {alert.severity}
                      </Badge>
                    </div>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detailed Metrics */}
      {showDetailedMetrics && (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="cache">Cache</TabsTrigger>
            <TabsTrigger value="database">Database</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendsData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="index" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="cacheHitRate" stroke="#8884d8" name="Cache Hit Rate" />
                      <Line type="monotone" dataKey="queryPerformance" stroke="#82ca9d" name="Query Performance" />
                      <Line type="monotone" dataKey="memoryUsage" stroke="#ffc658" name="Memory Usage" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Session Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Active Users</span>
                      <span className="font-semibold">
                        {performanceMetrics?.currentMetrics?.sessionMetrics?.activeUsers || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Concurrent Sessions</span>
                      <span className="font-semibold">
                        {performanceMetrics?.currentMetrics?.sessionMetrics?.concurrentSessions || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Session Duration</span>
                      <span className="font-semibold">
                        {performanceMetrics?.currentMetrics?.sessionMetrics?.averageSessionDuration 
                          ? Math.round(performanceMetrics.currentMetrics.sessionMetrics.averageSessionDuration / 60000) + 'm'
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Network Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Requests/sec</span>
                      <span className="font-semibold">
                        {performanceMetrics?.currentMetrics?.networkMetrics?.requestsPerSecond || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Response Time</span>
                      <span className="font-semibold">
                        {performanceMetrics?.currentMetrics?.networkMetrics?.averageResponseTime || 0}ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Error Rate</span>
                      <span className="font-semibold">
                        {performanceMetrics?.currentMetrics?.networkMetrics?.errorRate 
                          ? (performanceMetrics.currentMetrics.networkMetrics.errorRate * 100).toFixed(2) + '%'
                          : '0%'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="cache" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Cache Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Hit Rate</span>
                        <span>
                          {performanceMetrics?.currentMetrics?.cacheMetrics?.hitRate 
                            ? (performanceMetrics.currentMetrics.cacheMetrics.hitRate * 100).toFixed(1) + '%'
                            : '0%'}
                        </span>
                      </div>
                      <Progress value={
                        (performanceMetrics?.currentMetrics?.cacheMetrics?.hitRate || 0) * 100
                      } />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>Memory Usage</span>
                        <span>
                          {cacheHealth?.metrics?.memoryUsagePercent?.toFixed(1) || '0'}%
                        </span>
                      </div>
                      <Progress value={cacheHealth?.metrics?.memoryUsagePercent || 0} />
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Eviction Count</span>
                      <span className="font-semibold">
                        {performanceMetrics?.currentMetrics?.cacheMetrics?.evictionCount || 0}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span>Avg Access Time</span>
                      <span className="font-semibold">
                        {performanceMetrics?.currentMetrics?.cacheMetrics?.averageAccessTime?.toFixed(2) || '0'}ms
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Cache Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Status</span>
                      <Badge variant={cacheHealth?.status === 'healthy' ? 'default' : 'destructive'}>
                        {cacheHealth?.status || 'Unknown'}
                      </Badge>
                    </div>
                    
                    {cacheHealth?.recommendations && cacheHealth.recommendations.length > 0 && (
                      <div>
                        <div className="text-sm font-medium mb-2">Recommendations:</div>
                        <ul className="text-sm space-y-1">
                          {cacheHealth.recommendations.map((rec: string, index: number) => (
                            <li key={index} className="text-gray-600">• {rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="database" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Database Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-3">Query Metrics</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span>Average Query Time</span>
                        <span className="font-semibold">
                          {performanceMetrics?.currentMetrics?.queryMetrics?.averageQueryTime || 0}ms
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Slow Queries</span>
                        <span className="font-semibold">
                          {performanceMetrics?.currentMetrics?.queryMetrics?.slowQueries || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Failed Queries</span>
                        <span className="font-semibold">
                          {performanceMetrics?.currentMetrics?.queryMetrics?.failedQueries || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Queries</span>
                        <span className="font-semibold">
                          {performanceMetrics?.currentMetrics?.queryMetrics?.totalQueries || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-3">Memory Metrics</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between mb-2">
                          <span>Heap Usage</span>
                          <span>
                            {performanceMetrics?.currentMetrics?.memoryMetrics?.heapUsage 
                              ? (performanceMetrics.currentMetrics.memoryMetrics.heapUsage * 100).toFixed(1) + '%'
                              : '0%'}
                          </span>
                        </div>
                        <Progress value={
                          (performanceMetrics?.currentMetrics?.memoryMetrics?.heapUsage || 0) * 100
                        } />
                      </div>
                      <div className="flex justify-between">
                        <span>GC Count</span>
                        <span className="font-semibold">
                          {performanceMetrics?.currentMetrics?.memoryMetrics?.gcCount || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>GC Time</span>
                        <span className="font-semibold">
                          {performanceMetrics?.currentMetrics?.memoryMetrics?.gcTime || 0}ms
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Optimization Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recommendations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                    No optimization recommendations at this time.
                    <br />
                    Your system is performing well!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recommendations.map((rec: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{rec.title}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant={getSeverityColor(rec.severity)}>
                              {rec.severity}
                            </Badge>
                            <Badge variant="outline">
                              +{rec.estimatedImprovement}%
                            </Badge>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                        <div className="text-sm">
                          <div className="text-gray-700 mb-1">
                            <strong>Impact:</strong> {rec.impact}
                          </div>
                          <div className="text-gray-700 mb-1">
                            <strong>Difficulty:</strong> {rec.implementation?.difficulty} ({rec.implementation?.estimatedTime})
                          </div>
                          {rec.implementation?.steps && (
                            <div className="mt-2">
                              <strong>Steps:</strong>
                              <ul className="mt-1 ml-4 list-disc text-sm">
                                {rec.implementation.steps.map((step: string, stepIndex: number) => (
                                  <li key={stepIndex}>{step}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}