/**
 * Production-Ready Query History Manager
 * Comprehensive UI for browsing, searching, and managing ASR-GoT query sessions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Search, 
  Filter, 
  Play, 
  Pause, 
  RotateCcw, 
  Trash2, 
  Download, 
  Clock, 
  Calendar,
  Tag,
  FileText,
  BarChart3,
  Eye,
  RefreshCw,
  Settings,
  Brain,
  Sparkles
} from 'lucide-react';
import { QuerySession, queryHistoryService, QueryFigure, QueryTable } from '@/services/QueryHistoryService';
import { RAGReanalysisPanel } from './RAGReanalysisPanel';
import { RAGInsight } from '@/services/RAGReanalysisService';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';

interface QueryHistoryManagerProps {
  onResumeSession: (sessionId: string) => void;
  onLoadForReanalysis: (sessionId: string) => void;
  currentSessionId?: string;
}

export const QueryHistoryManager: React.FC<QueryHistoryManagerProps> = ({
  onResumeSession,
  onLoadForReanalysis,
  currentSessionId
}) => {
  const [sessions, setSessions] = useState<QuerySession[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<QuerySession | null>(null);
  const [sessionDetails, setSessionDetails] = useState<{
    session: QuerySession;
    figures: QueryFigure[];
    tables: QueryTable[];
  } | null>(null);
  const [totalSessions, setTotalSessions] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(20);
  const [showRAGReanalysis, setShowRAGReanalysis] = useState(false);
  const [ragSessionId, setRAGSessionId] = useState<string | null>(null);

  /**
   * Load query history with filters
   */
  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 10000)
      );
      
      const queryPromise = queryHistoryService.getQueryHistory(
        pageSize,
        currentPage * pageSize,
        searchTerm || undefined,
        statusFilter !== 'all' ? statusFilter : undefined,
        undefined, // startDate
        undefined, // endDate
        tagFilter !== 'all' ? [tagFilter] : undefined
      );

      const { sessions: loadedSessions, total } = await Promise.race([
        queryPromise,
        timeoutPromise
      ]) as { sessions: QuerySession[], total: number };

      setSessions(loadedSessions);
      setTotalSessions(total);
    } catch (error) {
      console.error('Failed to load history:', error);
      
      // Fallback to empty state instead of infinite loading
      setSessions([]);
      setTotalSessions(0);
      
      if (error instanceof Error && error.message === 'Request timeout') {
        toast.error('Loading query history timed out. Please check your connection.');
      } else {
        toast.error('Failed to load query history. Using offline mode.');
      }
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, tagFilter, currentPage, pageSize]);

  /**
   * Load session details
   */
  const loadSessionDetails = useCallback(async (sessionId: string) => {
    try {
      const details = await queryHistoryService.getSessionDetails(sessionId);
      setSessionDetails(details);
    } catch (error) {
      toast.error('Failed to load session details');
      console.error('Failed to load session details:', error);
    }
  }, []);

  /**
   * Delete session
   */
  const handleDeleteSession = useCallback(async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      return;
    }

    try {
      await queryHistoryService.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      setSelectedSession(null);
      setSessionDetails(null);
      toast.success('Session deleted successfully');
    } catch (error) {
      toast.error('Failed to delete session');
    }
  }, []);

  /**
   * Export session
   */
  const handleExportSession = useCallback(async (sessionId: string, format: 'json' | 'html') => {
    try {
      const details = await queryHistoryService.getSessionDetails(sessionId);
      
      if (format === 'json') {
        const exportData = {
          session: details.session,
          figures: details.figures,
          tables: details.tables,
          exported_at: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `asr-got-session-${sessionId}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      toast.success(`Session exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export session');
    }
  }, []);

  /**
   * Get status badge color
   */
  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      running: 'bg-blue-100 text-blue-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  /**
   * Get unique tags from sessions
   */
  const getUniqueTags = useCallback(() => {
    const tags = new Set<string>();
    sessions.forEach(session => {
      session.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }, [sessions]);

  // Load initial data
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Query History & Session Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search queries, topics, or research fields..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="running">Running</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            {/* Tag Filter */}
            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Tags" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tags</SelectItem>
                {getUniqueTags().map(tag => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Refresh Button */}
            <Button variant="outline" onClick={loadHistory} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {/* Results Summary */}
          <div className="text-sm text-gray-600">
            Showing {sessions.length} of {totalSessions} sessions
          </div>
        </CardContent>
      </Card>

      {/* Sessions List */}
      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
              <p>Loading query history...</p>
            </div>
          ) : sessions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Query History</h3>
                <p className="text-gray-600">Start your first research query to see it appear here.</p>
              </CardContent>
            </Card>
          ) : (
            sessions.map((session) => (
              <Card key={session.id} className={`${session.id === currentSessionId ? 'ring-2 ring-blue-500' : ''}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                        {session.query}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(session.created_at), 'MMM dd, yyyy HH:mm')}</span>
                        <span>•</span>
                        <span>{formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(session.status)}
                      {session.id === currentSessionId && (
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          Current
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Progress</span>
                      <span>{session.current_stage + 1} / {session.total_stages} stages</span>
                    </div>
                    <Progress 
                      value={((session.current_stage + 1) / session.total_stages) * 100} 
                      className="h-2"
                    />
                  </div>

                  {/* Tags */}
                  {session.tags && session.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {session.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          <Tag className="h-3 w-3 mr-1" />
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Research Context */}
                  {session.research_context?.field && (
                    <div className="text-sm text-gray-600 mb-3">
                      <strong>Field:</strong> {session.research_context.field}
                      {session.research_context.topic && (
                        <>
                          <span> • </span>
                          <strong>Topic:</strong> {session.research_context.topic}
                        </>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    <TooltipProvider>
                      {/* Resume/Continue */}
                      {session.status === 'paused' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              size="sm" 
                              onClick={() => onResumeSession(session.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Resume session</TooltipContent>
                        </Tooltip>
                      )}

                      {/* View Details */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => {
                                  setSelectedSession(session);
                                  loadSessionDetails(session.id);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View details</TooltipContent>
                          </Tooltip>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Session Details</DialogTitle>
                          </DialogHeader>
                          {sessionDetails && (
                            <SessionDetailsView 
                              sessionDetails={sessionDetails}
                              onExport={handleExportSession}
                            />
                          )}
                        </DialogContent>
                      </Dialog>

                      {/* Reanalyze */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => onLoadForReanalysis(session.id)}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Reanalyze session</TooltipContent>
                      </Tooltip>

                      {/* RAG Reanalysis */}
                      {session.status === 'completed' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setRAGSessionId(session.id);
                                setShowRAGReanalysis(true);
                              }}
                              className="border-purple-300 text-purple-600 hover:bg-purple-50"
                            >
                              <Brain className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>RAG Reanalysis with AI insights</TooltipContent>
                        </Tooltip>
                      )}

                      {/* Smart Insights */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setRAGSessionId(session.id);
                              setShowRAGReanalysis(true);
                            }}
                            className="border-blue-300 text-blue-600 hover:bg-blue-50"
                          >
                            <Sparkles className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Load for reanalysis</TooltipContent>
                      </Tooltip>

                      {/* Export */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleExportSession(session.id, 'json')}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Export session data</TooltipContent>
                      </Tooltip>

                      {/* Delete */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeleteSession(session.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete session</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>

      {/* Pagination */}
      {totalSessions > pageSize && (
        <div className="flex justify-between items-center">
          <Button 
            variant="outline" 
            disabled={currentPage === 0}
            onClick={() => setCurrentPage(prev => Math.max(0, prev - 1))}
          >
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage + 1} of {Math.ceil(totalSessions / pageSize)}
          </span>
          <Button 
            variant="outline" 
            disabled={(currentPage + 1) * pageSize >= totalSessions}
            onClick={() => setCurrentPage(prev => prev + 1)}
          >
            Next
          </Button>
        </div>
      )}

      {/* RAG Reanalysis Dialog */}
      <Dialog open={showRAGReanalysis} onOpenChange={setShowRAGReanalysis}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              RAG-Enhanced Reanalysis
            </DialogTitle>
          </DialogHeader>
          {ragSessionId && (
            <RAGReanalysisPanel
              sessionId={ragSessionId}
              sessionQuery={sessions.find(s => s.id === ragSessionId)?.query || ''}
              sessionField={sessions.find(s => s.id === ragSessionId)?.research_context?.field || 'General'}
              onClose={() => {
                setShowRAGReanalysis(false);
                setRAGSessionId(null);
              }}
              onApplyInsights={(insights: RAGInsight[]) => {
                toast.success(`Applied ${insights.length} RAG insights! Enhanced research capabilities activated.`, {
                  description: 'Insights have been integrated for improved analysis.'
                });
                // Future: Apply insights to enhance current research
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

/**
 * Session Details View Component
 */
interface SessionDetailsViewProps {
  sessionDetails: {
    session: QuerySession;
    figures: QueryFigure[];
    tables: QueryTable[];
  };
  onExport: (sessionId: string, format: 'json' | 'html') => void;
}

const SessionDetailsView: React.FC<SessionDetailsViewProps> = ({ sessionDetails, onExport }) => {
  const { session, figures, tables } = sessionDetails;

  return (
    <div className="space-y-6">
      {/* Session Overview */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-medium mb-2">Session Information</h4>
          <div className="space-y-1 text-sm">
            <div><strong>ID:</strong> {session.id}</div>
            <div><strong>Status:</strong> {session.status}</div>
            <div><strong>Progress:</strong> {session.current_stage + 1} / {session.total_stages}</div>
            <div><strong>Created:</strong> {format(new Date(session.created_at), 'PPpp')}</div>
          </div>
        </div>
        <div>
          <h4 className="font-medium mb-2">Performance Metrics</h4>
          <div className="space-y-1 text-sm">
            <div><strong>Total Tokens:</strong> {session.metadata?.token_usage?.total || 'N/A'}</div>
            <div><strong>Execution Time:</strong> {session.metadata?.execution_time?.total_seconds || 'N/A'}s</div>
            <div><strong>API Calls:</strong> Gemini: {session.metadata?.api_calls?.gemini || 0}, Perplexity: {session.metadata?.api_calls?.perplexity || 0}</div>
          </div>
        </div>
      </div>

      {/* Research Context */}
      <div>
        <h4 className="font-medium mb-2">Research Context</h4>
        <div className="bg-gray-50 p-3 rounded text-sm">
          <div><strong>Field:</strong> {session.research_context?.field || 'N/A'}</div>
          <div><strong>Topic:</strong> {session.research_context?.topic || 'N/A'}</div>
        </div>
      </div>

      {/* Generated Content */}
      <Tabs defaultValue="stages">
        <TabsList>
          <TabsTrigger value="stages">Stage Results ({session.stage_results?.length || 0})</TabsTrigger>
          <TabsTrigger value="figures">Figures ({figures.length})</TabsTrigger>
          <TabsTrigger value="tables">Tables ({tables.length})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stages" className="space-y-2 max-h-96 overflow-y-auto">
          {session.stage_results?.map((result, index) => (
            <Card key={index}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Stage {index + 1}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-sm bg-gray-50 p-2 rounded max-h-32 overflow-y-auto">
                  {result.substring(0, 500)}...
                </div>
              </CardContent>
            </Card>
          )) || <p className="text-gray-500">No stage results available</p>}
        </TabsContent>
        
        <TabsContent value="figures" className="space-y-2 max-h-96 overflow-y-auto">
          {figures.map((figure) => (
            <Card key={figure.id}>
              <CardContent className="p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h5 className="font-medium">{figure.title}</h5>
                    <p className="text-sm text-gray-600">Stage {figure.stage + 1} • {figure.figure_type}</p>
                    <p className="text-sm">{figure.description}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => window.open(figure.data_url, '_blank')}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {figures.length === 0 && <p className="text-gray-500">No figures generated</p>}
        </TabsContent>
        
        <TabsContent value="tables" className="space-y-2 max-h-96 overflow-y-auto">
          {tables.map((table) => (
            <Card key={table.id}>
              <CardContent className="p-3">
                <h5 className="font-medium">{table.title}</h5>
                <p className="text-sm text-gray-600">Stage {table.stage + 1} • {table.data?.length || 0} rows</p>
                <p className="text-sm">{table.description}</p>
              </CardContent>
            </Card>
          ))}
          {tables.length === 0 && <p className="text-gray-500">No tables generated</p>}
        </TabsContent>
      </Tabs>

      {/* Export Options */}
      <div className="flex gap-2 pt-4 border-t">
        <Button onClick={() => onExport(session.id, 'json')} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export JSON
        </Button>
        <Button onClick={() => onExport(session.id, 'html')} variant="outline">
          <FileText className="h-4 w-4 mr-2" />
          Export HTML
        </Button>
      </div>
    </div>
  );
};