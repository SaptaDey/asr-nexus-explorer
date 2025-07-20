/**
 * Stored Analyses Manager Component
 * Interface for retrieving and managing stored ASR-GoT analyses from Supabase
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, Eye, Trash2, Calendar, FileText, Image } from 'lucide-react';
import { supabaseStorage, StoredAnalysis } from '@/services/SupabaseStorageService';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StoredAnalysisItem {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  figure_count: number;
  content_length: number;
}

export const StoredAnalysesManager: React.FC = () => {
  const [analyses, setAnalyses] = useState<StoredAnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<StoredAnalysis | null>(null);
  const [viewingAnalysis, setViewingAnalysis] = useState(false);

  // Load stored analyses on component mount
  useEffect(() => {
    loadStoredAnalyses();
  }, []);

  const loadStoredAnalyses = async () => {
    try {
      setLoading(true);
      setError(null);
      const storedAnalyses = await supabaseStorage.listStoredAnalyses(50);
      setAnalyses(storedAnalyses);
    } catch (err) {
      setError('Failed to load stored analyses');
      console.error('Error loading analyses:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAnalysis = async (analysisId: string) => {
    try {
      setViewingAnalysis(true);
      const analysis = await supabaseStorage.retrieveAnalysis(analysisId);
      if (analysis) {
        setSelectedAnalysis(analysis);
      } else {
        setError('Analysis not found or could not be loaded');
      }
    } catch (err) {
      setError('Failed to load analysis details');
      console.error('Error loading analysis:', err);
    } finally {
      setViewingAnalysis(false);
    }
  };

  const handleDownloadAnalysis = async (analysisId: string, title: string) => {
    try {
      const analysis = await supabaseStorage.retrieveAnalysis(analysisId);
      if (analysis) {
        // Create downloadable HTML file
        const blob = new Blob([analysis.final_report_html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}_analysis.html`;
        link.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      setError('Failed to download analysis');
      console.error('Error downloading analysis:', err);
    }
  };

  const handleDeleteAnalysis = async (analysisId: string) => {
    if (!confirm('Are you sure you want to delete this analysis? This action cannot be undone.')) {
      return;
    }

    try {
      const success = await supabaseStorage.deleteAnalysis(analysisId);
      if (success) {
        setAnalyses(prev => prev.filter(analysis => analysis.id !== analysisId));
        if (selectedAnalysis?.id === analysisId) {
          setSelectedAnalysis(null);
        }
      } else {
        setError('Failed to delete analysis');
      }
    } catch (err) {
      setError('Failed to delete analysis');
      console.error('Error deleting analysis:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatContentLength = (length: number) => {
    if (length > 1000000) {
      return `${(length / 1000000).toFixed(1)}M chars`;
    } else if (length > 1000) {
      return `${(length / 1000).toFixed(1)}K chars`;
    }
    return `${length} chars`;
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Loading stored analyses...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Stored ASR-GoT Analyses
          </CardTitle>
          <CardDescription>
            Your comprehensive research analyses stored in Supabase for future retrieval and re-analysis.
            All textual content, visualizations, tables, and metadata are preserved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert className="mb-4" variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {analyses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No stored analyses found.</p>
              <p className="text-sm">Complete an ASR-GoT analysis to see stored results here.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {analyses.map((analysis) => (
                <Card key={analysis.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg line-clamp-2">{analysis.title}</CardTitle>
                    <CardDescription className="text-xs flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(analysis.created_at)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {analysis.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{analysis.description}</p>
                    )}
                    
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="secondary" className="text-xs">
                        <Image className="h-3 w-3 mr-1" />
                        {analysis.figure_count} figures
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {formatContentLength(analysis.content_length)}
                      </Badge>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleViewAnalysis(analysis.id)}
                            disabled={viewingAnalysis}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>{selectedAnalysis?.title}</DialogTitle>
                            <DialogDescription>
                              Analysis details and content preview
                            </DialogDescription>
                          </DialogHeader>
                          {selectedAnalysis && (
                            <ScrollArea className="h-96 w-full">
                              <div className="space-y-4 p-4">
                                <div>
                                  <h4 className="font-semibold mb-2">Research Context</h4>
                                  <p className="text-sm text-gray-600">
                                    <strong>Topic:</strong> {selectedAnalysis.research_context.topic}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    <strong>Field:</strong> {selectedAnalysis.research_context.field}
                                  </p>
                                </div>
                                
                                <div>
                                  <h4 className="font-semibold mb-2">Content Sections</h4>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <Badge variant="outline">Abstract</Badge>
                                    <Badge variant="outline">Introduction</Badge>
                                    <Badge variant="outline">Methodology</Badge>
                                    <Badge variant="outline">Results</Badge>
                                    <Badge variant="outline">Discussion</Badge>
                                    <Badge variant="outline">Conclusions</Badge>
                                  </div>
                                </div>

                                <div>
                                  <h4 className="font-semibold mb-2">Metadata</h4>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span>Tokens Used: {selectedAnalysis.total_tokens_used.toLocaleString()}</span>
                                    <span>Generation Time: {selectedAnalysis.generation_time_seconds}s</span>
                                    <span>Figures: {selectedAnalysis.figure_count}</span>
                                    <span>References: {selectedAnalysis.reference_count}</span>
                                  </div>
                                </div>

                                {selectedAnalysis.visualization_files.length > 0 && (
                                  <div>
                                    <h4 className="font-semibold mb-2">Stored Visualizations</h4>
                                    <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                                      {selectedAnalysis.visualization_files.map((url, index) => (
                                        <img 
                                          key={index}
                                          src={url} 
                                          alt={`Figure ${index + 1}`}
                                          className="w-full h-32 object-contain border rounded"
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </ScrollArea>
                          )}
                        </DialogContent>
                      </Dialog>

                      <Button 
                        size="sm" 
                        variant="default"
                        onClick={() => handleDownloadAnalysis(analysis.id, analysis.title)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>

                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleDeleteAnalysis(analysis.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="flex justify-center pt-4">
            <Button variant="outline" onClick={loadStoredAnalyses}>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};