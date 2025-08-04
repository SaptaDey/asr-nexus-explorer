// Enhanced ASR-GoT Interface with Full Backend Integration
// Complete integration of frontend and backend services

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Brain, 
  Play, 
  Pause, 
  Save, 
  User, 
  Settings, 
  History, 
  Download,
  AlertTriangle,
  CheckCircle,
  Key,
  LogIn,
  UserPlus
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthContext } from '@/contexts/AuthContext'
import { useEnhancedASRGoT } from '@/hooks/useEnhancedASRGoT'
import { SessionControls } from '@/components/asr-got/SessionControls'
import { ApiKeyManager } from '@/components/auth/ApiKeyManager'
import { ResearchInterface } from '@/components/asr-got/ResearchInterface'
import { EnhancedGraphVisualization } from '@/components/asr-got/EnhancedGraphVisualization'
// Tree visualization temporarily disabled for performance optimization
// import { TreeOfReasoningVisualization } from '@/components/asr-got/TreeOfReasoningVisualization'
import { UnifiedAPICredentialsModal } from '@/components/asr-got/UnifiedAPICredentialsModal'
import { toast } from 'sonner'

export default function EnhancedASRGoTInterface() {
  const navigate = useNavigate()
  const { user, profile, loading: authLoading } = useAuthContext()
  
  const {
    userQuery,
    isProcessing,
    isCompleted,
    currentStage,
    graphData,
    stageResults,
    currentSessionId,
    isPaused,
    lastSaveTime,
    autoSaveEnabled,
    apiCredentials,
    startNewSession,
    pauseSession,
    resumeSession,
    saveSession,
    loadSession,
    resetSession,
    updateApiCredentials,
    hasBackendApiKeys,
    getUsageStats,
    executeStage,
    executeAllStages,
    exportResults
  } = useEnhancedASRGoT()

  // UI State
  const [query, setQuery] = useState('')
  const [activeTab, setActiveTab] = useState('research')
  const [showApiCredentials, setShowApiCredentials] = useState(false)
  const [showApiKeyManager, setShowApiKeyManager] = useState(false)
  const [usageStats, setUsageStats] = useState<any>(null)
  const [backendApiKeys, setBackendApiKeys] = useState<any>({})

  // Define loadInitialData before the useEffect that uses it
  const loadInitialData = useCallback(async () => {
    try {
      if (user) {
        const [usage, apiKeys] = await Promise.all([
          getUsageStats(),
          hasBackendApiKeys()
        ])
        setUsageStats(usage)
        setBackendApiKeys(apiKeys)
      }
    } catch (error) {
      console.error('Failed to load initial data:', error)
    }
  }, [user, getUsageStats, hasBackendApiKeys])

  // Load initial data
  useEffect(() => {
    loadInitialData()
  }, [user, loadInitialData])

  const handleStartResearch = async () => {
    if (!query.trim()) {
      toast.error('Please enter a research query')
      return
    }

    try {
      await startNewSession(query.trim())
      setQuery('')
      setActiveTab('execution')
    } catch (error: any) {
      toast.error(error.message || 'Failed to start research session')
    }
  }

  const handleExecuteStage = async (stage: number) => {
    try {
      await executeStage(stage)
    } catch (error: any) {
      toast.error(error.message || `Failed to execute stage ${stage + 1}`)
    }
  }

  const handleExecuteAll = async () => {
    try {
      await executeAllStages()
    } catch (error: any) {
      toast.error(error.message || 'Failed to execute all stages')
    }
  }

  const hasApiAccess = () => {
    return (user && (backendApiKeys.gemini || backendApiKeys.perplexity)) || 
           (!user && apiCredentials && (apiCredentials.geminiKey || apiCredentials.perplexityKey))
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <Brain className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold">ASR-GoT</span>
              </div>
              
              <nav className="hidden md:flex space-x-6">
                <Link to="/guide" className="text-gray-600 hover:text-blue-600">Guide</Link>
                <Link to="/research-framework" className="text-gray-600 hover:text-blue-600">Framework</Link>
              </nav>
            </div>

            <div className="flex items-center space-x-4">
              {/* API Status */}
              <div className="flex items-center space-x-2">
                {hasApiAccess() ? (
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    API Ready
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    API Setup Required
                  </Badge>
                )}
              </div>

              {/* User Menu */}
              {user ? (
                <div className="flex items-center space-x-2">
                  {profile && (
                    <div className="text-right text-sm">
                      <p className="font-medium">{profile.full_name}</p>
                      <p className="text-gray-500">
                        {profile.current_api_usage || 0}/{profile.api_usage_limit || 1000} calls
                      </p>
                    </div>
                  )}
                  <Link to="/dashboard">
                    <Button variant="outline" size="sm">
                      <User className="h-4 w-4 mr-2" />
                      Dashboard
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link to="/auth?mode=login">
                    <Button variant="outline" size="sm">
                      <LogIn className="h-4 w-4 mr-2" />
                      Sign In
                    </Button>
                  </Link>
                  <Link to="/auth?mode=register">
                    <Button size="sm">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ASR-GoT Research Framework
          </h1>
          <p className="text-gray-600">
            AI-powered scientific research with 9-stage pipeline and graph-based reasoning
          </p>
        </div>

        {/* API Setup Alert */}
        {!hasApiAccess() && (
          <Alert className="mb-6">
            <Key className="h-4 w-4" />
            <AlertDescription>
              To start research, you need to configure API keys. 
              {user ? (
                <Button 
                  variant="link" 
                  className="p-0 h-auto ml-1"
                  onClick={() => setShowApiKeyManager(true)}
                >
                  Manage API keys in your dashboard
                </Button>
              ) : (
                <>
                  <Button 
                    variant="link" 
                    className="p-0 h-auto ml-1"
                    onClick={() => setShowApiCredentials(true)}
                  >
                    Set up API credentials
                  </Button>
                  {' or '}
                  <Link to="/auth?mode=register" className="text-blue-600 hover:underline">
                    create an account
                  </Link>
                  {' for secure backend storage.'}
                </>
              )}
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Interface */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="research">Research</TabsTrigger>
                <TabsTrigger value="execution">Execution</TabsTrigger>
                <TabsTrigger value="visualization">Visualization</TabsTrigger>
                <TabsTrigger value="results">Results</TabsTrigger>
              </TabsList>

              {/* Research Tab */}
              <TabsContent value="research" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Start New Research</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Research Query</label>
                      <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Enter your research question or topic..."
                        disabled={isProcessing}
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button 
                        onClick={handleStartResearch}
                        disabled={!hasApiAccess() || isProcessing || !query.trim()}
                        className="flex-1"
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Start Research
                      </Button>
                      
                      {currentSessionId && (
                        <Button 
                          variant="outline"
                          onClick={resetSession}
                          disabled={isProcessing}
                        >
                          Reset
                        </Button>
                      )}
                    </div>

                    {/* Current Session Info */}
                    {currentSessionId && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">Current Session</p>
                            <p className="text-xs text-gray-600">{userQuery}</p>
                          </div>
                          <Badge variant="outline">
                            Stage {currentStage}/9
                          </Badge>
                        </div>
                        <Progress value={(currentStage / 9) * 100} className="mt-2" />
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Research Interface */}
                {currentSessionId && (
                  <ResearchInterface 
                    onStageExecute={handleExecuteStage}
                    currentStage={currentStage}
                    isProcessing={isProcessing}
                    stageResults={stageResults}
                  />
                )}
              </TabsContent>

              {/* Execution Tab */}
              <TabsContent value="execution" className="space-y-6">
                {currentSessionId ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Array.from({ length: 9 }, (_, i) => (
                      <Card key={i} className={`${currentStage === i ? 'border-blue-500' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-medium">Stage {i + 1}</h3>
                              <p className="text-sm text-gray-600">
                                {getStageDescription(i)}
                              </p>
                            </div>
                            <div className="flex items-center space-x-2">
                              {currentStage > i && (
                                <CheckCircle className="h-5 w-5 text-green-600" />
                              )}
                              {currentStage === i && (
                                <Button 
                                  size="sm"
                                  onClick={() => handleExecuteStage(i)}
                                  disabled={isProcessing || isPaused}
                                >
                                  {isProcessing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Start a research session to see execution stages</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Visualization Tab */}
              <TabsContent value="visualization" className="space-y-6">
                {graphData && graphData.nodes.length > 0 ? (
                  <>
                    <EnhancedGraphVisualization 
                      graphData={graphData}
                      onNodeClick={(node) => console.log('Node clicked:', node)}
                    />
                    {/* Tree visualization temporarily disabled for performance optimization
                    <TreeOfReasoningVisualization 
                      graphData={graphData}
                      parameters={{}}
                    />
                    */}
                  </>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Start research to generate visualizations</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Results Tab */}
              <TabsContent value="results" className="space-y-6">
                {isCompleted ? (
                  <Card>
                    <CardHeader>
                      <CardTitle>Research Complete</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-green-600">
                        ✅ All 9 stages completed successfully
                      </p>
                      
                      <div className="flex space-x-2">
                        <Button onClick={exportResults}>
                          <Download className="h-4 w-4 mr-2" />
                          Export Report
                        </Button>
                        
                        {user && (
                          <Button variant="outline" onClick={() => saveSession()}>
                            <Save className="h-4 w-4 mr-2" />
                            Save Session
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="text-center py-12">
                      <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Complete all stages to view results</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Session Controls */}
            {currentSessionId && (
              <SessionControls
                currentStage={currentStage}
                isProcessing={isProcessing}
                isPaused={isPaused}
                sessionData={{}}
                currentSessionId={currentSessionId}
                onPause={pauseSession}
                onResume={resumeSession}
                onSave={saveSession}
                onLoad={loadSession}
                onReset={resetSession}
              />
            )}

            {/* Usage Stats */}
            {usageStats && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">API Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Used</span>
                      <span>{usageStats.currentUsage}/{usageStats.limit}</span>
                    </div>
                    <Progress value={usageStats.usagePercentage} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {!hasApiAccess() && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => user ? setShowApiKeyManager(true) : setShowApiCredentials(true)}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    Setup API Keys
                  </Button>
                )}
                
                <Link to="/guide">
                  <Button variant="outline" size="sm" className="w-full">
                    <Settings className="h-4 w-4 mr-2" />
                    View Guide
                  </Button>
                </Link>
                
                {user && (
                  <Link to="/dashboard">
                    <Button variant="outline" size="sm" className="w-full">
                      <History className="h-4 w-4 mr-2" />
                      View History
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* API Credentials Modal */}
      <UnifiedAPICredentialsModal
        isOpen={showApiCredentials}
        onClose={() => setShowApiCredentials(false)}
        onCredentialsUpdate={updateApiCredentials}
        currentCredentials={apiCredentials}
      />

      {/* API Key Manager Dialog */}
      <Dialog open={showApiKeyManager} onOpenChange={setShowApiKeyManager}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Manage API Keys</DialogTitle>
          </DialogHeader>
          <ApiKeyManager />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function getStageDescription(stage: number): string {
  const descriptions = [
    'Initialize research context',
    'Decompose research question', 
    'Generate hypotheses',
    'Collect evidence',
    'Prune and merge findings',
    'Extract key subgraphs',
    'Compose initial report',
    'Reflect and audit',
    'Generate final analysis'
  ]
  return descriptions[stage] || 'Research stage'
}