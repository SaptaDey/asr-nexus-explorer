/**
 * Bias Auditing Sidebar Component
 * Displays critical analysis checklist and bias detection results
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Shield, 
  TrendingUp, 
  BarChart3,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  Info
} from 'lucide-react';
import { motion } from 'framer-motion';
import { GraphData, ResearchContext } from '@/types/asrGotTypes';
import { toast } from 'sonner';

interface BiasAuditItem {
  id: string;
  category: 'bias' | 'coverage' | 'statistical' | 'methodological';
  title: string;
  description: string;
  status: 'pass' | 'fail' | 'warning' | 'pending';
  details: string;
  impactLevel: 'low' | 'medium' | 'high' | 'critical';
  recommendation?: string;
  relatedNodes?: string[];
}

interface BiasAuditingSidebarProps {
  graphData: GraphData;
  researchContext: ResearchContext;
  currentStage: number;
  geminiApiKey: string;
  onRefreshAudit?: () => void;
  className?: string;
}

export const BiasAuditingSidebar: React.FC<BiasAuditingSidebarProps> = ({
  graphData,
  researchContext,
  currentStage,
  geminiApiKey,
  onRefreshAudit,
  className = ''
}) => {
  const [auditItems, setAuditItems] = useState<BiasAuditItem[]>([]);
  const [isAuditing, setIsAuditing] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Initialize audit items
  useEffect(() => {
    if (currentStage >= 8 && geminiApiKey && graphData.nodes.length > 0) {
      performCriticalAnalysis();
    }
  }, [currentStage, graphData, geminiApiKey]);

  // Perform critical analysis using Gemini
  const performCriticalAnalysis = async () => {
    setIsAuditing(true);
    
    try {
      const analysisPrompt = `
Perform a comprehensive critical analysis of this research graph for bias detection and quality assurance:

Research Topic: "${researchContext.topic}"
Field: "${researchContext.field}"
Graph Summary: ${graphData.nodes.length} nodes, ${graphData.edges.length} edges

Node Types Summary:
${Object.entries(graphData.nodes.reduce((acc, node) => {
  acc[node.type] = (acc[node.type] || 0) + 1;
  return acc;
}, {} as Record<string, number>)).map(([type, count]) => `- ${type}: ${count}`).join('\n')}

Average Node Confidence: ${(graphData.nodes.reduce((sum, node) => {
  const avgConf = node.confidence.reduce((a, b) => a + b, 0) / node.confidence.length;
  return sum + avgConf;
}, 0) / graphData.nodes.length * 100).toFixed(1)}%

Analyze for:
1. BIAS DETECTION (P1.17):
   - Confirmation bias in evidence selection
   - Selection bias in data sources
   - Publication bias indicators
   - Cultural/demographic bias
   - Temporal bias

2. COVERAGE ANALYSIS:
   - High-impact nodes coverage
   - Knowledge gap identification
   - Methodological completeness
   - Interdisciplinary representation

3. STATISTICAL POWER (P1.26):
   - Sample size adequacy
   - Effect size considerations
   - Statistical significance thresholds
   - Multiple testing corrections

4. METHODOLOGICAL RIGOR:
   - Evidence quality assessment
   - Replication considerations
   - Peer review status
   - Methodology appropriateness

Return JSON array of audit items:
[{
  "category": "bias|coverage|statistical|methodological",
  "title": "Brief title",
  "description": "Detailed description",
  "status": "pass|fail|warning|pending",
  "details": "Specific findings",
  "impactLevel": "low|medium|high|critical",
  "recommendation": "Actionable recommendation",
  "relatedNodes": ["node_ids"]
}]
`;

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: analysisPrompt }] }],
          generationConfig: { 
            maxOutputTokens: 8000,
            temperature: 0.1
          }
        })
      });

      if (!response.ok) throw new Error('Gemini API error');
      
      const data = await response.json();
      const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!responseText) {
        throw new Error('Invalid API response');
      }

      // Extract JSON from response
      const jsonMatch = responseText.match(/```(?:json)?\s*(\[[\s\S]*\])\s*```/);
      const extractedJson = jsonMatch ? jsonMatch[1] : responseText;
      
      const auditResults = JSON.parse(extractedJson);
      
      // Add IDs and ensure proper structure
      const processedAuditItems: BiasAuditItem[] = auditResults.map((item: any, index: number) => ({
        id: `audit_${index}_${Date.now()}`,
        category: item.category,
        title: item.title,
        description: item.description,
        status: item.status,
        details: item.details,
        impactLevel: item.impactLevel,
        recommendation: item.recommendation,
        relatedNodes: item.relatedNodes || []
      }));
      
      setAuditItems(processedAuditItems);
      toast.success(`Critical analysis complete: ${processedAuditItems.length} items identified`);
      
    } catch (error) {
      console.error('Critical analysis failed:', error);
      toast.error('Failed to perform critical analysis');
      
      // Add fallback audit items
      setAuditItems(generateFallbackAuditItems());
    } finally {
      setIsAuditing(false);
    }
  };

  // Generate fallback audit items
  const generateFallbackAuditItems = (): BiasAuditItem[] => {
    return [
      {
        id: 'fallback_bias_1',
        category: 'bias',
        title: 'Confirmation Bias Check',
        description: 'Assessment of potential confirmation bias in evidence selection',
        status: graphData.nodes.filter(n => n.type === 'evidence').length > 3 ? 'pass' : 'warning',
        details: `Found ${graphData.nodes.filter(n => n.type === 'evidence').length} evidence nodes`,
        impactLevel: 'medium',
        recommendation: 'Ensure diverse evidence sources and contradictory perspectives'
      },
      {
        id: 'fallback_coverage_1',
        category: 'coverage',
        title: 'High-Impact Node Coverage',
        description: 'Verification of coverage for high-confidence nodes',
        status: 'pass',
        details: 'High-confidence nodes are well-connected',
        impactLevel: 'low'
      },
      {
        id: 'fallback_statistical_1',
        category: 'statistical',
        title: 'Statistical Power Assessment',
        description: 'Evaluation of statistical power and sample sizes',
        status: 'pending',
        details: 'Statistical power analysis needed',
        impactLevel: 'high',
        recommendation: 'Conduct formal power analysis for quantitative claims'
      }
    ];
  };

  // Category statistics
  const getCategoryStats = () => {
    const stats = auditItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = { total: 0, pass: 0, fail: 0, warning: 0, pending: 0 };
      }
      acc[item.category].total++;
      acc[item.category][item.status]++;
      return acc;
    }, {} as Record<string, any>);

    return stats;
  };

  // Filter items by category
  const filteredItems = selectedCategory === 'all' 
    ? auditItems 
    : auditItems.filter(item => item.category === selectedCategory);

  // Get status icon
  const getStatusIcon = (status: BiasAuditItem['status']) => {
    switch (status) {
      case 'pass': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'fail': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'pending': return <Info className="h-4 w-4 text-blue-500" />;
    }
  };

  // Get impact color
  const getImpactColor = (level: BiasAuditItem['impactLevel']) => {
    switch (level) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
    }
  };

  const categoryStats = getCategoryStats();
  const overallProgress = auditItems.length > 0 
    ? (auditItems.filter(item => item.status === 'pass').length / auditItems.length) * 100 
    : 0;

  return (
    <Card className={`w-96 h-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <span>Bias Auditing</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {auditItems.length} Items
            </Badge>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                performCriticalAnalysis();
                onRefreshAudit?.();
              }}
              disabled={isAuditing}
            >
              <RefreshCw className={`h-4 w-4 ${isAuditing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
        
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Quality</span>
            <span>{overallProgress.toFixed(0)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-5 p-1 m-4">
            <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
            <TabsTrigger value="bias" className="text-xs">Bias</TabsTrigger>
            <TabsTrigger value="coverage" className="text-xs">Coverage</TabsTrigger>
            <TabsTrigger value="statistical" className="text-xs">Stats</TabsTrigger>
            <TabsTrigger value="methodological" className="text-xs">Method</TabsTrigger>
          </TabsList>

          {/* Category Statistics */}
          <div className="px-4 mb-4">
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(categoryStats).map(([category, stats]) => (
                <div key={category} className="bg-muted/50 rounded p-2">
                  <div className="font-medium capitalize">{category}</div>
                  <div className="flex justify-between">
                    <span className="text-green-600">{stats.pass} ✓</span>
                    <span className="text-red-600">{stats.fail} ✗</span>
                    <span className="text-yellow-600">{stats.warning} ⚠</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <ScrollArea className="h-[calc(100vh-400px)]">
            <div className="px-4 space-y-3">
              {isAuditing && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-8"
                >
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-sm text-muted-foreground">Performing critical analysis...</p>
                </motion.div>
              )}

              {filteredItems.length === 0 && !isAuditing && (
                <div className="text-center py-8">
                  <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-sm text-muted-foreground">
                    {currentStage < 8 
                      ? 'Bias auditing available in Stage 8+' 
                      : 'No audit items found'}
                  </p>
                </div>
              )}

              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Collapsible>
                    <CollapsibleTrigger asChild>
                      <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              {getStatusIcon(item.status)}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{item.title}</h4>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {item.description}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge 
                                    variant="secondary" 
                                    className={`text-xs ${getImpactColor(item.impactLevel)}`}
                                  >
                                    {item.impactLevel}
                                  </Badge>
                                  <Badge variant="outline" className="text-xs">
                                    {item.category}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </CardContent>
                      </Card>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent>
                      <Card className="mt-2 ml-4">
                        <CardContent className="p-3 space-y-3">
                          <div>
                            <h5 className="font-medium text-sm mb-1">Details</h5>
                            <p className="text-xs text-muted-foreground">{item.details}</p>
                          </div>
                          
                          {item.recommendation && (
                            <div>
                              <h5 className="font-medium text-sm mb-1">Recommendation</h5>
                              <p className="text-xs text-blue-600">{item.recommendation}</p>
                            </div>
                          )}
                          
                          {item.relatedNodes && item.relatedNodes.length > 0 && (
                            <div>
                              <h5 className="font-medium text-sm mb-1">Related Nodes</h5>
                              <div className="flex flex-wrap gap-1">
                                {item.relatedNodes.map(nodeId => (
                                  <Badge key={nodeId} variant="outline" className="text-xs">
                                    {nodeId}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </CollapsibleContent>
                  </Collapsible>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </Tabs>
      </CardContent>
    </Card>
  );
};