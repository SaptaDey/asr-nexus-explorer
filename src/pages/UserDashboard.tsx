// User Dashboard Page
// Main dashboard page with navigation and user management

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '@/contexts/AuthContext'
import { UserDashboard as DashboardComponent } from '@/components/dashboard/UserDashboard'
import { ApiKeyManager } from '@/components/auth/ApiKeyManager'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Brain, 
  Home, 
  Settings, 
  Key, 
  BarChart3, 
  LogOut, 
  User,
  Play,
  History,
  Database,
  FileText
} from 'lucide-react'
import { Link } from 'react-router-dom'

export default function UserDashboard() {
  const [activeTab, setActiveTab] = useState('overview')
  const { user, profile, signOut, loading } = useAuthContext()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    navigate('/auth')
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center space-x-8">
              <Link to="/" className="flex items-center space-x-2">
                <Brain className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold">ASR-GoT</span>
              </Link>
              
              <nav className="hidden md:flex space-x-6">
                <Link 
                  to="/"
                  className="flex items-center space-x-1 text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Home className="h-4 w-4" />
                  <span>Research</span>
                </Link>
              </nav>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              {profile && (
                <div className="flex items-center space-x-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {profile.full_name || user.email}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {profile.subscription_tier}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {profile.current_api_usage || 0}/{profile.api_usage_limit || 1000} calls
                      </span>
                    </div>
                  </div>
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                </div>
              )}
              
              <Button variant="ghost" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
          <p className="text-gray-600">
            Manage your research sessions, API keys, and view analytics
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Link to="/" className="block">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Play className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Start Research</p>
                    <p className="text-sm text-gray-600">Begin new ASR-GoT session</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                onClick={() => setActiveTab('history')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <History className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Session History</p>
                  <p className="text-sm text-gray-600">View past research</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setActiveTab('api-keys')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Key className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="font-medium">API Keys</p>
                  <p className="text-sm text-gray-600">Manage credentials</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setActiveTab('analytics')}>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium">Analytics</p>
                  <p className="text-sm text-gray-600">Usage insights</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <History className="h-4 w-4" />
              <span className="hidden sm:inline">History</span>
            </TabsTrigger>
            <TabsTrigger value="collections" className="flex items-center space-x-2">
              <Database className="h-4 w-4" />
              <span className="hidden sm:inline">Collections</span>
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="flex items-center space-x-2">
              <Key className="h-4 w-4" />
              <span className="hidden sm:inline">API Keys</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="overview">
              <DashboardComponent />
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Research History</h3>
                    <p className="text-gray-600 mb-4">
                      Your research sessions will appear here once you start using ASR-GoT
                    </p>
                    <Link to="/">
                      <Button>
                        <Play className="h-4 w-4 mr-2" />
                        Start Your First Research Session
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="collections">
              <Card>
                <CardContent className="p-6">
                  <div className="text-center py-12">
                    <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Research Collections</h3>
                    <p className="text-gray-600 mb-4">
                      Organize your research sessions into collections for better management
                    </p>
                    <Button variant="outline">
                      <Database className="h-4 w-4 mr-2" />
                      Create Your First Collection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="api-keys">
              <ApiKeyManager />
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Profile Settings</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Full Name
                          </label>
                          <input
                            type="text"
                            value={profile?.full_name || ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            readOnly
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            type="email"
                            value={user?.email || ''}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                            readOnly
                          />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-4">Subscription</h3>
                      <div className="flex items-center space-x-4">
                        <Badge variant="outline" className="text-sm">
                          {profile?.subscription_tier || 'free'} Plan
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {profile?.current_api_usage || 0} / {profile?.api_usage_limit || 1000} API calls used
                        </span>
                      </div>
                      {profile?.subscription_tier === 'free' && (
                        <Alert className="mt-4">
                          <AlertDescription>
                            Upgrade to Pro or Enterprise for higher API limits and additional features.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}