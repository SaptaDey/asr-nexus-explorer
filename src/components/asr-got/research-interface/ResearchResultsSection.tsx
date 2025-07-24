/**
 * Research Results Section Component
 * Displays comprehensive research results and analytics
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { GraphData } from '@/types/asrGotTypes';

interface ResearchResultsSectionProps {
  stageResults: string[];
  graphData: GraphData;
  researchContext?: {
    field: string;
    topic: string;
    objectives: string[];
    hypotheses: string[];
  };
}

export const ResearchResultsSection: React.FC<ResearchResultsSectionProps> = ({
  stageResults,
  graphData,
  researchContext,
}) => {
  const handleExportAnalysis = () => {
    const reportContent = stageResults.length > 0 ? stageResults.join('\n\n---\n\n') : 'No analysis completed yet';
    const jsonData = {
      metadata: {
        exported: new Date().toISOString(),
        version: '1.0.0',
        framework: 'ASR-GoT'
      },
      researchContext: researchContext || {},
      stages: stageResults.map((result, index) => ({
        stage: index + 1,
        result: result || ''
      })),
      graph: {
        nodes: graphData.nodes.length,
        edges: graphData.edges.length,
        nodeTypes: Array.from(new Set(graphData.nodes.map(n => n.type))),
        edgeTypes: Array.from(new Set(graphData.edges.map(e => e.type)))
      },
      completeAnalysis: reportContent
    };

    const blob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asr-got-complete-analysis-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Complete analysis exported successfully');
  };

  if (stageResults.length === 0) {
    return (
      <div className="text-center py-12">
        <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-medium text-muted-foreground mb-2">No Results Yet</h3>
        <p className="text-muted-foreground">
          Start the research process to generate comprehensive AI-powered insights.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Research Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
        <h3 className="font-bold gradient-text text-lg mb-4">Research Summary</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Research Field</div>
            <div className="font-medium">{researchContext?.field || 'General Science'}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Stages Completed</div>
            <div className="font-medium">{stageResults.length} / 9</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Knowledge Nodes</div>
            <div className="font-medium">{graphData.nodes.length}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Reasoning Connections</div>
            <div className="font-medium">{graphData.edges.length}</div>
          </div>
        </div>
      </div>

      {/* Node and Edge Analysis */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold gradient-text mb-2">Knowledge Types</h4>
          <div className="space-y-1">
            {Array.from(new Set(graphData.nodes.map(n => n.type))).map(type => (
              <Badge key={type} variant="secondary" className="mr-1">
                {type} ({graphData.nodes.filter(n => n.type === type).length})
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <h4 className="font-semibold gradient-text mb-2">Relationship Types</h4>
          <div className="space-y-1">
            {Array.from(new Set(graphData.edges.map(e => e.type))).map(type => (
              <Badge key={type} variant="outline" className="mr-1">
                {type} ({graphData.edges.filter(e => e.type === type).length})
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Export Button */}
      <Button 
        onClick={handleExportAnalysis} 
        className="w-full gradient-bg"
      >
        <FileText className="h-4 w-4 mr-2" />
        Export Complete Analysis
      </Button>
    </div>
  );
};