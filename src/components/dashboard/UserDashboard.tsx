// User Dashboard Component
// Comprehensive dashboard for user data management, API usage, and research history

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { userService, type DashboardData } from '@/services/userService'
import { apiProxyService } from '@/services/apiProxyService'
import { dataStorageService } from '@/services/dataStorageService'
import { 
  Activity, 
  Database, 
  FileText, 
  Key, 
  Settings, 
  TrendingUp,
  Calendar,
  Download,
  Eye,
  Trash2,
  Plus,
  BarChart3
} from 'lucide-react'

interface UserDashboardProps {
  className?: string
}

export function UserDashboard({ className = '' }: UserDashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [apiUsage, setApiUsage] = useState<any>(null)
  const [researchSessions, setResearchSessions] = useState<any[]>([])
  const [collections, setCollections] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [dashboard, usage, sessions, userCollections] = await Promise.all([
        userService.getDashboardData(),
        apiProxyService.getUsageStats(),
        dataStorageService.getResearchSessions(20),
        dataStorageService.getUserCollections()
      ])

      setDashboardData(dashboard)
      setApiUsage(usage)
      setResearchSessions(sessions)
      setCollections(userCollections)
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500'
      case 'running': return 'bg-blue-500'
      case 'paused': return 'bg-yellow-500'
      case 'failed': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive" className={className}>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{researchSessions.length}</p>
                <p className="text-sm text-gray-600">Research Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Database className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{collections.length}</p>
                <p className="text-sm text-gray-600">Collections</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{apiUsage?.currentUsage || 0}</p>
                <p className="text-sm text-gray-600">API Calls Used</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{dashboardData?.recentFiles?.length || 0}</p>
                <p className="text-sm text-gray-600">Generated Files</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* API Usage Progress */}
      {apiUsage && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>API Usage</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">
                  {apiUsage.currentUsage} / {apiUsage.limit} calls
                </span>
                <Badge variant={apiUsage.usagePercentage > 80 ? 'destructive' : 'secondary'}>
                  {apiUsage.usagePercentage}% used
                </Badge>
              </div>
              <Progress value={apiUsage.usagePercentage} className="w-full" />
              
              {apiUsage.usagePercentage > 80 && (
                <Alert>
                  <AlertDescription>
                    You're approaching your monthly API limit. Consider upgrading your plan.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sessions">Research Sessions</TabsTrigger>
          <TabsTrigger value="collections">Collections</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Research Sessions Tab */}
        <TabsContent value="sessions">
          <Card>
            <CardHeader>
              <CardTitle>Recent Research Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {researchSessions.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No research sessions found</p>
                ) : (
                  researchSessions.map((session) => (
                    <div key={session.id} className="border rounded-lg p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-medium truncate">{session.query}</h3>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-sm text-gray-500">
                              {formatDate(session.created_at)}
                            </span>
                            <Badge variant="outline" className="flex items-center space-x-1">
                              <div className={`w-2 h-2 rounded-full ${getStatusColor(session.status)}`}></div>
                              <span>{session.status}</span>
                            </Badge>
                            <span className="text-sm text-gray-500">
                              Stage {session.current_stage}/9
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {session.tags && session.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {session.tags.map((tag: string, index: number) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Collections Tab */}
        <TabsContent value="collections">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Research Collections</CardTitle>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Collection
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {collections.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No collections found</p>
                ) : (
                  collections.map((collection) => (
                    <div key={collection.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: collection.color }}
                            ></div>
                            <h3 className="font-medium">{collection.name}</h3>
                            <Badge variant="outline">
                              {collection.session_ids?.length || 0} sessions
                            </Badge>
                          </div>
                          {collection.description && (
                            <p className="text-sm text-gray-600 mt-1">{collection.description}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Created {formatDate(collection.created_at)}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files">
          <Card>
            <CardHeader>
              <CardTitle>Generated Files</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.recentFiles?.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No files found</p>
                ) : (
                  dashboardData?.recentFiles?.map((file) => (
                    <div key={file.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <FileText className="h-8 w-8 text-blue-600" />
                          <div>
                            <h3 className="font-medium">{file.file_name}</h3>
                            <div className="flex items-center space-x-2 text-sm text-gray-500">
                              <span>{file.file_type}</span>
                              <span>•</span>
                              <span>{file.file_size ? `${Math.round(file.file_size / 1024)} KB` : 'Unknown size'}</span>
                              <span>•</span>
                              <span>{formatDate(file.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Usage Analytics</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* API Usage Over Time */}
                <div>
                  <h3 className="font-medium mb-4">Recent API Activity</h3>
                  <div className="space-y-2">
                    {apiUsage?.recentActivity?.slice(0, 10).map((activity: any, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{activity.provider}</Badge>
                          <span className="text-gray-600">{activity.endpoint}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-gray-500">
                          <span>{activity.tokens_used} tokens</span>
                          <span>•</span>
                          <span>{formatDate(activity.created_at)}</span>
                        </div>
                      </div>
                    )) || (
                      <p className="text-gray-500">No recent API activity</p>
                    )}
                  </div>
                </div>

                {/* Session Statistics */}
                <div>
                  <h3 className="font-medium mb-4">Session Statistics</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">
                        {researchSessions.filter(s => s.status === 'completed').length}
                      </p>
                      <p className="text-sm text-gray-600">Completed</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {researchSessions.filter(s => s.status === 'running').length}
                      </p>
                      <p className="text-sm text-gray-600">Running</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-600">
                        {researchSessions.filter(s => s.status === 'paused').length}
                      </p>
                      <p className="text-sm text-gray-600">Paused</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-600">
                        {researchSessions.filter(s => s.status === 'failed').length}
                      </p>
                      <p className="text-sm text-gray-600">Failed</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}