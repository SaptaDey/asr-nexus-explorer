
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraphVisualization } from "@/components/asr-got/GraphVisualization";
import { StageManager } from "@/components/asr-got/StageManager";
import { ParameterConfig } from "@/components/asr-got/ParameterConfig";
import { APIIntegration } from "@/components/asr-got/APIIntegration";
import { ResearchInterface } from "@/components/asr-got/ResearchInterface";
import { TreeOfReasoningVisualization } from "@/components/asr-got/TreeOfReasoningVisualization";
import { Brain, Network, Settings, Database, Zap, Download, Sparkles, Rocket } from "lucide-react";
import { useASRGoT } from "@/hooks/useASRGoT";
import { toast } from "sonner";

const Index = () => {
  const [activeTab, setActiveTab] = useState("research");
  const [showApiDialog, setShowApiDialog] = useState(false);
  const [tempApiKeys, setTempApiKeys] = useState({ perplexity: '', gemini: '' });
  
  const { 
    currentStage, 
    graphData, 
    parameters, 
    stageProgress,
    isProcessing,
    apiKeys,
    stageResults,
    researchContext,
    executeStage,
    resetFramework,
    setParameters,
    updateApiKeys,
    exportResults
  } = useASRGoT();

  const stages = [
    "Initialization", "Decomposition", "Hypothesis/Planning", 
    "Evidence Integration", "Pruning/Merging", "Subgraph Extraction",
    "Composition", "Reflection", "Final Analysis"
  ];

  // Check for API keys on mount
  useEffect(() => {
    if (!apiKeys.perplexity || !apiKeys.gemini) {
      setShowApiDialog(true);
    }
  }, []);

  const handleApiKeySave = () => {
    if (!tempApiKeys.perplexity || !tempApiKeys.gemini) {
      toast.error('Please enter both API keys');
      return;
    }
    updateApiKeys(tempApiKeys);
    setShowApiDialog(false);
    toast.success('API keys saved successfully');
  };

  const handleTestConnection = async () => {
    try {
      // Test Perplexity
      const perplexityResponse = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tempApiKeys.perplexity}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar-reasoning-pro',
          messages: [{ role: 'user', content: 'Test connection' }],
          max_tokens: 10
        }),
      });

      // Test Gemini
      const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
        method: 'POST',
        headers: {
          'x-goog-api-key': tempApiKeys.gemini,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Test connection' }] }]
        }),
      });

      if (perplexityResponse.ok && geminiResponse.ok) {
        toast.success('Both API connections successful!');
      } else {
        toast.error('API connection failed. Check your keys.');
      }
    } catch (error) {
      toast.error('Connection test failed');
    }
  };

  return (
    <div className="min-h-screen neural-bg">
      {/* API Key Dialog */}
      <Dialog open={showApiDialog} onOpenChange={setShowApiDialog}>
        <DialogContent className="card-gradient">
          <DialogHeader>
            <DialogTitle className="gradient-text flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Configure AI APIs
            </DialogTitle>
            <DialogDescription>
              Enter your Perplexity Sonar and Gemini 2.5 Pro API keys to enable advanced reasoning capabilities.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="perplexity-key">Perplexity Sonar API Key</Label>
              <Input
                id="perplexity-key"
                type="password"
                placeholder="pplx-..."
                value={tempApiKeys.perplexity}
                onChange={(e) => setTempApiKeys(prev => ({ ...prev, perplexity: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="gemini-key">Gemini 2.5 Pro API Key</Label>
              <Input
                id="gemini-key"
                type="password"
                placeholder="AIza..."
                value={tempApiKeys.gemini}
                onChange={(e) => setTempApiKeys(prev => ({ ...prev, gemini: e.target.value }))}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleTestConnection} variant="outline" className="flex-1">
                Test Connection
              </Button>
              <Button onClick={handleApiKeySave} className="gradient-bg flex-1">
                <Rocket className="h-4 w-4 mr-2" />
                Start Research
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Header */}
      <div className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="floating-element">
                <Brain className="h-12 w-12 text-purple-600" />
              </div>
              <div>
                <h1 className="text-4xl font-bold gradient-text">Advanced Scientific Reasoning</h1>
                <p className="text-lg text-muted-foreground">Graph-of-Thoughts Framework</p>
                {researchContext.field && (
                  <Badge className="mt-2 bg-purple-100 text-purple-800">
                    Field: {researchContext.field}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="pulse-glow">
                Stage {currentStage + 1}: {stages[currentStage]}
              </Badge>
              <Button onClick={exportResults} variant="outline" size="sm" disabled={stageResults.length === 0}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={resetFramework} variant="outline" size="sm">
                Reset
              </Button>
            </div>
          </div>
          
          {/* Enhanced Progress Bar */}
          <div className="mt-6">
            <div className="flex justify-between text-sm font-medium mb-2">
              <span className="gradient-text">Framework Progress</span>
              <span className="text-purple-600">{Math.round(stageProgress)}%</span>
            </div>
            <Progress value={stageProgress} className="h-3 bg-purple-100">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${stageProgress}%` }}
              />
            </Progress>
            <div className="grid grid-cols-9 gap-1 mt-2">
              {stages.map((stage, index) => (
                <div
                  key={index}
                  className={`text-xs text-center p-1 rounded ${
                    index < currentStage ? 'bg-green-100 text-green-800' :
                    index === currentStage ? 'bg-purple-100 text-purple-800 pulse-glow' :
                    'bg-gray-100 text-gray-500'
                  }`}
                >
                  {index + 1}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Interface */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white/80 backdrop-blur-sm">
            <TabsTrigger value="research" className="flex items-center gap-2 data-[state=active]:gradient-bg data-[state=active]:text-white">
              <Zap className="h-4 w-4" />
              Research
            </TabsTrigger>
            <TabsTrigger value="tree" className="flex items-center gap-2 data-[state=active]:gradient-bg data-[state=active]:text-white">
              🌳
              Tree
            </TabsTrigger>
            <TabsTrigger value="graph" className="flex items-center gap-2 data-[state=active]:gradient-bg data-[state=active]:text-white">
              <Network className="h-4 w-4" />
              Graph
            </TabsTrigger>
            <TabsTrigger value="stages" className="flex items-center gap-2 data-[state=active]:gradient-bg data-[state=active]:text-white">
              <Brain className="h-4 w-4" />
              Stages
            </TabsTrigger>
            <TabsTrigger value="parameters" className="flex items-center gap-2 data-[state=active]:gradient-bg data-[state=active]:text-white">
              <Settings className="h-4 w-4" />
              Parameters
            </TabsTrigger>
            <TabsTrigger value="apis" className="flex items-center gap-2 data-[state=active]:gradient-bg data-[state=active]:text-white">
              <Database className="h-4 w-4" />
              APIs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="research" className="space-y-6">
            <Card className="card-gradient">
              <CardHeader>
                <CardTitle className="gradient-text flex items-center gap-2">
                  <Sparkles className="h-5 w-5" />
                  Scientific Research Interface
                </CardTitle>
                <CardDescription>
                  Conduct advanced scientific reasoning using the ASR-GoT framework with AI-powered analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResearchInterface 
                  currentStage={currentStage}
                  graphData={graphData}
                  onExecuteStage={executeStage}
                  isProcessing={isProcessing}
                  stageResults={stageResults}
                  researchContext={researchContext}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tree" className="space-y-6">
            <Card className="card-gradient bg-gradient-to-b from-emerald-50 to-indigo-50 dark:from-emerald-950/20 dark:to-indigo-950/20">
              <CardHeader>
                <CardTitle className="gradient-text flex items-center gap-2">
                  🌳
                  Tree of Reasoning - Animated Growth
                </CardTitle>
                <CardDescription>
                  Watch your research grow like a living tree - from trunk (question) to branches (dimensions) to flowers (insights)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-2">
                <TreeOfReasoningVisualization 
                  graphData={graphData}
                  currentStage={currentStage}
                  isProcessing={isProcessing}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="graph" className="space-y-6">
            <Card className="card-gradient">
              <CardHeader>
                <CardTitle className="gradient-text flex items-center gap-2">
                  <Network className="h-5 w-5" />
                  Knowledge Graph Visualization
                </CardTitle>
                <CardDescription>
                  Interactive visualization of reasoning chains and knowledge structures
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <GraphVisualization 
                  data={graphData}
                  currentStage={currentStage}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stages" className="space-y-6">
            <Card className="card-gradient">
              <CardHeader>
                <CardTitle className="gradient-text flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Stage Management
                </CardTitle>
                <CardDescription>
                  Monitor and control the 8-stage ASR-GoT process with AI integration
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StageManager 
                  currentStage={currentStage}
                  stages={stages}
                  onExecuteStage={executeStage}
                  isProcessing={isProcessing}
                  stageResults={stageResults}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="parameters" className="space-y-6">
            <Card className="card-gradient">
              <CardHeader>
                <CardTitle className="gradient-text flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Parameter Configuration
                </CardTitle>
                <CardDescription>
                  Configure all ASR-GoT framework parameters (P1.0 - P1.29)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ParameterConfig 
                  parameters={parameters}
                  onUpdateParameters={setParameters}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="apis" className="space-y-6">
            <Card className="card-gradient">
              <CardHeader>
                <CardTitle className="gradient-text flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  API Integration
                </CardTitle>
                <CardDescription>
                  Configure Perplexity Sonar and Gemini 2.5 Pro API connections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <APIIntegration />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
