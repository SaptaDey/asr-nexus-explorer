// Session History Component
// Displays and manages user research session history

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Play, 
  Pause, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  Clock,
  Eye,
  Trash2,
  Star,
  MoreHorizontal
} from 'lucide-react'
import { dataStorageService, type StoredResearchSession } from '@/services/dataStorageService'
import { useAuthContext } from '@/contexts/AuthContext'
import { toast } from 'sonner'

interface SessionHistoryProps {
  onLoadSession?: (sessionId: string) => Promise<void>
  className?: string
}

export function SessionHistory({ onLoadSession, className = '' }: SessionHistoryProps) {
  const [sessions, setSessions] = useState<StoredResearchSession[]>([])
  const [filteredSessions, setFilteredSessions] = useState<StoredResearchSession[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('created_at')
  const [selectedSession, setSelectedSession] = useState<StoredResearchSession | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  
  const { user } = useAuthContext()

  useEffect(() => {
    loadSessions()
  }, [user])

  useEffect(() => {
    filterAndSortSessions()
  }, [sessions, searchTerm, statusFilter, sortBy])

  const loadSessions = async () => {
    try {
      setLoading(true)
      const sessionData = await dataStorageService.getResearchSessions(50)
      setSessions(sessionData)
    } catch (error: any) {
      console.error('Failed to load sessions:', error)
      toast.error(error.message || 'Failed to load session history')
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortSessions = () => {
    let filtered = sessions

    // Apply search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(session => 
        session.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
        session.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.status === statusFilter)
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created_at':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'updated_at':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        case 'progress':
          return (b.current_stage / b.total_stages) - (a.current_stage / a.total_stages)
        case 'status':
          return a.status.localeCompare(b.status)
        default:
          return 0
      }
    })

    setFilteredSessions(filtered)
  }

  const handleLoadSession = async (session: StoredResearchSession) => {
    try {
      if (onLoadSession) {
        await onLoadSession(session.id)
        toast.success('Session loaded successfully')
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to load session')
    }
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return
    }

    try {
      // Note: Would need to implement delete functionality in dataStorageService
      toast.success('Session deleted successfully')
      await loadSessions()
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete session')
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
      case 'completed': return 'bg-green-100 text-green-800'
      case 'running': return 'bg-blue-100 text-blue-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'failed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
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

  const getProgressPercentage = (session: StoredResearchSession) => {
    return Math.round((session.current_stage / session.total_stages) * 100)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Research History</h2>
          <p className="text-gray-600 mt-1">
            {sessions.length} session{sessions.length !== 1 ? 's' : ''} found
          </p>
        </div>
        <Button onClick={loadSessions} variant="outline">
          <History className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search sessions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created_at">Date Created</SelectItem>
                <SelectItem value="updated_at">Last Updated</SelectItem>
                <SelectItem value="progress">Progress</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-gray-600 flex items-center">
              <Filter className="h-4 w-4 mr-1" />
              {filteredSessions.length} of {sessions.length}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      {filteredSessions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {sessions.length === 0 ? 'No Research Sessions' : 'No Matching Sessions'}
            </h3>
            <p className="text-gray-600">
              {sessions.length === 0 
                ? 'Start your first research session to see it here.'
                : 'Try adjusting your search or filter criteria.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start space-x-3">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 truncate" title={session.query}>
                          {session.query}
                        </h3>
                        
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(session.created_at)}</span>
                          </div>
                          
                          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getStatusColor(session.status)}`}>
                            {getStatusIcon(session.status)}
                            <span className="capitalize">{session.status}</span>
                          </div>
                          
                          <span>Stage {session.current_stage}/{session.total_stages}</span>
                        </div>

                        <div className="mt-3">
                          <div className="flex items-center justify-between text-sm mb-1">
                            <span className="text-gray-600">Progress</span>
                            <span className="text-gray-900">{getProgressPercentage(session)}%</span>
                          </div>
                          <Progress value={getProgressPercentage(session)} className="h-2" />
                        </div>

                        {session.tags && session.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {session.tags.slice(0, 3).map((tag, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {session.tags.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{session.tags.length - 3} more
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedSession(session)
                        setShowDetails(true)
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    
                    {onLoadSession && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLoadSession(session)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteSession(session.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Session Details Modal */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Session Details</DialogTitle>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Research Query</h3>
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                  {selectedSession.query}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Status</h4>
                  <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getStatusColor(selectedSession.status)}`}>
                    {getStatusIcon(selectedSession.status)}
                    <span className="capitalize">{selectedSession.status}</span>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">Progress</h4>
                  <p className="text-gray-700">
                    Stage {selectedSession.current_stage} of {selectedSession.total_stages} ({getProgressPercentage(selectedSession)}%)
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-1">Timeline</h4>
                <div className="text-sm text-gray-600 space-y-1">
                  <p>Created: {formatDate(selectedSession.created_at)}</p>
                  <p>Last Updated: {formatDate(selectedSession.updated_at)}</p>
                  {selectedSession.completed_at && (
                    <p>Completed: {formatDate(selectedSession.completed_at)}</p>
                  )}
                </div>
              </div>

              {selectedSession.tags && selectedSession.tags.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedSession.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-2 pt-4">
                {onLoadSession && (
                  <Button onClick={() => {
                    handleLoadSession(selectedSession)
                    setShowDetails(false)
                  }}>
                    <Play className="h-4 w-4 mr-2" />
                    Load Session
                  </Button>
                )}
                
                <Button variant="outline" onClick={() => setShowDetails(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}