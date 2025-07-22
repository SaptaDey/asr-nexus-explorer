// Session Controls Component
// Provides pause, resume, save, and session management functionality

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { 
  Play, 
  Pause, 
  Save, 
  RotateCcw, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  History,
  Download,
  Upload
} from 'lucide-react'
import { dataStorageService } from '@/services/dataStorageService'
import { useAuthContext } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import type { AsrGotState } from '@/types/asrGotTypes'

interface SessionControlsProps {
  currentStage: number
  isProcessing: boolean
  isPaused: boolean
  sessionData: Partial<AsrGotState>
  currentSessionId?: string
  onPause: () => void
  onResume: () => void
  onSave: () => Promise<string>
  onLoad: (sessionId: string) => Promise<void>
  onReset: () => void
  className?: string
}

export function SessionControls({
  currentStage,
  isProcessing,
  isPaused,
  sessionData,
  currentSessionId,
  onPause,
  onResume,
  onSave,
  onLoad,
  onReset,
  className = ''
}: SessionControlsProps) {
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [recentSessions, setRecentSessions] = useState<any[]>([])
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const { user } = useAuthContext()

  // Auto-save functionality
  useEffect(() => {
    if (!autoSaveEnabled || !user || isPaused || !isProcessing) return

    const autoSaveInterval = setInterval(async () => {
      try {
        await handleSave(true) // Silent auto-save
      } catch (error) {
        console.error('Auto-save failed:', error)
      }
    }, 30000) // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval)
  }, [autoSaveEnabled, user, isPaused, isProcessing])

  // Load recent sessions
  useEffect(() => {
    loadRecentSessions()
  }, [user])

  const loadRecentSessions = async () => {
    try {
      const sessions = await dataStorageService.getResearchSessions(10)
      setRecentSessions(sessions)
    } catch (error) {
      console.error('Failed to load recent sessions:', error)
    }
  }

  const handleSave = async (silent = false) => {
    if (saving) return

    try {
      setSaving(true)
      const sessionId = await onSave()
      setLastSaveTime(new Date())
      
      if (!silent) {
        toast.success('Session saved successfully')
      }
      
      // Refresh recent sessions list
      await loadRecentSessions()
      
      return sessionId
    } catch (error: any) {
      if (!silent) {
        toast.error(error.message || 'Failed to save session')
      }
      throw error
    } finally {
      setSaving(false)
    }
  }

  const handleLoad = async (sessionId: string) => {
    try {
      setLoading(true)
      await onLoad(sessionId)
      setShowLoadDialog(false)
      toast.success('Session loaded successfully')
    } catch (error: any) {
      toast.error(error.message || 'Failed to load session')
    } finally {
      setLoading(false)
    }
  }

  const handlePauseResume = () => {
    if (isPaused) {
      onResume()
      toast.info('Session resumed')
    } else {
      onPause()
      toast.info('Session paused')
    }
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset the current session? All unsaved progress will be lost.')) {
      onReset()
      toast.info('Session reset')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSessionProgress = (session: any) => {
    const progress = ((session.current_stage || 0) / 9) * 100
    return Math.min(100, Math.max(0, progress))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600'
      case 'running': return 'text-blue-600'
      case 'paused': return 'text-yellow-600'
      case 'failed': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'running': return <Play className="h-4 w-4" />
      case 'paused': return <Pause className="h-4 w-4" />
      case 'failed': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <Clock className="h-5 w-5" />
            <span>Session Controls</span>
          </span>
          {currentSessionId && (
            <Badge variant="outline" className="text-xs">
              Session: {currentSessionId.slice(0, 8)}...
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Session Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Stage {currentStage}/9</span>
            {isPaused && <Badge variant="secondary">Paused</Badge>}
            {isProcessing && <Badge variant="outline">Processing</Badge>}
          </div>
          <div className="text-xs text-gray-500">
            {lastSaveTime && `Last saved: ${lastSaveTime.toLocaleTimeString()}`}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>Progress</span>
            <span>{Math.round((currentStage / 9) * 100)}%</span>
          </div>
          <Progress value={(currentStage / 9) * 100} className="w-full" />
        </div>

        {/* Control Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={handlePauseResume}
            disabled={!isProcessing && !isPaused}
            variant={isPaused ? "default" : "outline"}
            className="flex items-center space-x-2"
          >
            {isPaused ? (
              <>
                <Play className="h-4 w-4" />
                <span>Resume</span>
              </>
            ) : (
              <>
                <Pause className="h-4 w-4" />
                <span>Pause</span>
              </>
            )}
          </Button>

          <Button
            onClick={() => handleSave(false)}
            disabled={saving || (!isProcessing && currentStage === 0)}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Save className="h-4 w-4" />
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </Button>

          <Dialog open={showLoadDialog} onOpenChange={setShowLoadDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Load</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Load Research Session</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {recentSessions.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No saved sessions found</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {recentSessions.map((session) => (
                      <div
                        key={session.id}
                        className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleLoad(session.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium truncate" title={session.query}>
                              {session.query || 'Untitled Session'}
                            </h3>
                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                              <span>{formatDate(session.created_at)}</span>
                              <div className={`flex items-center space-x-1 ${getStatusColor(session.status)}`}>
                                {getStatusIcon(session.status)}
                                <span>{session.status}</span>
                              </div>
                              <span>Stage {session.current_stage}/9</span>
                            </div>
                            <div className="mt-2">
                              <Progress value={getSessionProgress(session)} className="w-full h-2" />
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleLoad(session.id)
                            }}
                            disabled={loading}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Button
            onClick={handleReset}
            variant="outline"
            className="flex items-center space-x-2 text-red-600 hover:text-red-700"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </Button>
        </div>

        {/* Auto-save Toggle */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Auto-save</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
            className={autoSaveEnabled ? 'text-green-600' : 'text-gray-400'}
          >
            {autoSaveEnabled ? 'Enabled' : 'Disabled'}
          </Button>
        </div>

        {/* Authentication Alert */}
        {!user && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Sign in to save sessions and access advanced features.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}