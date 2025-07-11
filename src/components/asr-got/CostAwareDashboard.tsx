/**
 * Cost-Aware Dashboard Component
 * Displays tri-model cost tracking with real-time stage-by-stage analysis
 * Based on Cost-Aware-Orchestration.md specifications
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  DollarSign, 
  AlertTriangle, 
  Shield, 
  RotateCcw,
  TrendingUp,
  Zap,
  Clock,
  Info,
  Database,
  Brain,
  Search,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { motion } from 'framer-motion';
import { costAwareOrchestration } from '@/services/CostAwareOrchestrationService';
import { CostDashboardEntry, AIModel } from '@/types/asrGotTypes';
import { toast } from 'sonner';

interface CostAwareDashboardProps {
  className?: string;
}

export const CostAwareDashboard: React.FC<CostAwareDashboardProps> = ({ className = '' }) => {
  const [costData, setCostData] = useState(costAwareOrchestration.getCostDashboard());
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const [selectedModel, setSelectedModel] = useState<AIModel | 'all'>('all');

  useEffect(() => {
    // Set up real-time cost tracking
    const interval = setInterval(() => {
      const newCostData = costAwareOrchestration.getCostDashboard();
      setCostData(newCostData);
    }, 2000);

    setRefreshInterval(interval);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const handleResetCosts = () => {
    costAwareOrchestration.resetCostTracking();
    setCostData(costAwareOrchestration.getCostDashboard());
    toast.success('Cost tracking reset successfully');
  };

  const getModelIcon = (model: AIModel) => {
    switch (model) {
      case 'sonar-deep-research':
        return <Search className="h-4 w-4" />;
      case 'gemini-2.5-flash':
        return <Zap className="h-4 w-4" />;
      case 'gemini-2.5-pro':
        return <Brain className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const getModelColor = (model: AIModel) => {
    switch (model) {
      case 'sonar-deep-research':
        return 'bg-purple-100 text-purple-800';
      case 'gemini-2.5-flash':
        return 'bg-blue-100 text-blue-800';
      case 'gemini-2.5-pro':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredEntries = selectedModel === 'all' 
    ? costData.entries 
    : costData.entries.filter(entry => entry.model === selectedModel);

  const modelCostSummary = costData.entries.reduce((acc, entry) => {
    if (!acc[entry.model]) {
      acc[entry.model] = { cost: 0, count: 0, tokens: 0 };
    }
    acc[entry.model].cost += entry.priceUSD;
    acc[entry.model].count += 1;
    acc[entry.model].tokens += entry.promptTokens + entry.outputTokens;
    return acc;
  }, {} as Record<AIModel, { cost: number; count: number; tokens: number }>);

  const estimatedTotalCost = costAwareOrchestration.getEstimatedTotalCost();
  const progressPercentage = (costData.totalCost / estimatedTotalCost) * 100;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Cost Overview Header */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-blue-600" />
            Cost-Aware Orchestration Dashboard
            <Badge variant="outline" className="ml-2">
              Tri-Model Pipeline
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                ${costData.totalCost.toFixed(4)}
              </div>
              <div className="text-sm text-gray-600">Current Session</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                ${estimatedTotalCost.toFixed(2)}
              </div>
              <div className="text-sm text-gray-600">Estimated Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                ${costData.averageCostPerStage.toFixed(4)}
              </div>
              <div className="text-sm text-gray-600">Avg per Stage</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pipeline Progress</span>
              <span className="text-sm font-medium">{progressPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Model Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5" />
            Model Cost Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {Object.entries(modelCostSummary).map(([model, data]) => (
              <motion.div
                key={model}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border rounded-lg p-4 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-2">
                  {getModelIcon(model as AIModel)}
                  <div className="font-medium text-sm">
                    {model.replace('-', ' ').toUpperCase()}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-lg font-bold text-gray-900">
                    ${data.cost.toFixed(4)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {data.count} calls • {data.tokens.toLocaleString()} tokens
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Cost Tracking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Stage-by-Stage Cost Tracking
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="timeline" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="timeline">Timeline View</TabsTrigger>
              <TabsTrigger value="breakdown">Model Breakdown</TabsTrigger>
            </TabsList>
            
            <TabsContent value="timeline" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-sm text-gray-600">Filter by model:</span>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as AIModel | 'all')}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="all">All Models</option>
                  <option value="sonar-deep-research">Sonar Deep Research</option>
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                </select>
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredEntries.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No cost data yet. Start running analysis stages to see real-time tracking.</p>
                  </div>
                ) : (
                  filteredEntries.map((entry, index) => (
                    <motion.div
                      key={`${entry.stage}-${entry.timestamp}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge className={getModelColor(entry.model)}>
                          {getModelIcon(entry.model)}
                          <span className="ml-1 text-xs">
                            {entry.model.split('-')[0].toUpperCase()}
                          </span>
                        </Badge>
                        <div>
                          <div className="font-medium text-sm">{entry.stage}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm">${entry.priceUSD.toFixed(4)}</div>
                        <div className="text-xs text-gray-500">
                          {(entry.promptTokens + entry.outputTokens).toLocaleString()} tokens
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="breakdown" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(modelCostSummary).map(([model, data]) => (
                  <Card key={model} className="bg-white">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base">
                        {getModelIcon(model as AIModel)}
                        {model.replace('-', ' ').toUpperCase()}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total Cost</span>
                          <span className="font-bold">${data.cost.toFixed(4)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">API Calls</span>
                          <span className="font-medium">{data.count}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total Tokens</span>
                          <span className="font-medium">{data.tokens.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Avg Cost/Call</span>
                          <span className="font-medium">
                            ${data.count > 0 ? (data.cost / data.count).toFixed(4) : '0.0000'}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Cost Optimization Tips */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <Info className="h-5 w-5" />
            Cost Optimization Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm text-yellow-800">
            <div className="flex items-start gap-2">
              <span className="font-medium">•</span>
              <span>Sonar Deep Research is most cost-effective for bulk literature searches</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">•</span>
              <span>Gemini Flash is optimal for routine graph operations and structured outputs</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">•</span>
              <span>Gemini Pro is reserved for complex reasoning and code execution</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium">•</span>
              <span>Batch API calls when possible to reduce per-request overhead</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={handleResetCosts}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Tracking
        </Button>
        <Button onClick={() => toast.info('Cost data refreshed!')}>
          <TrendingUp className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>
    </div>
  );
};