import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { GraphVisualization } from "@/components/asr-got/GraphVisualization";
import { StageManager } from "@/components/asr-got/StageManager";
import { ParameterConfig } from "@/components/asr-got/ParameterConfig";
import { APIIntegration } from "@/components/asr-got/APIIntegration";
import { ResearchInterface } from "@/components/asr-got/ResearchInterface";
import { Brain, Network, Settings, Database, Zap } from "lucide-react";
import { useASRGoT } from "@/hooks/useASRGoT";

const Index = () => {
  const [activeTab, setActiveTab] = useState("research");
  const { 
    currentStage, 
    graphData, 
    parameters, 
    stageProgress,
    isProcessing,
    executeStage,
    resetFramework 
  } = useASRGoT();

  const stages = [
    "Initialization", "Decomposition", "Hypothesis/Planning", 
    "Evidence Integration", "Pruning/Merging", "Subgraph Extraction",
    "Composition", "Reflection"
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Advanced Scientific Reasoning</h1>
                <p className="text-sm text-muted-foreground">Graph-of-Thoughts Framework</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                Stage {currentStage + 1}: {stages[currentStage]}
              </Badge>
              <Button 
                onClick={resetFramework}
                variant="outline"
                size="sm"
              >
                Reset
              </Button>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Framework Progress</span>
              <span>{Math.round(stageProgress)}%</span>
            </div>
            <Progress value={stageProgress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Main Interface */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="research" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Research
            </TabsTrigger>
            <TabsTrigger value="graph" className="flex items-center gap-2">
              <Network className="h-4 w-4" />
              Graph
            </TabsTrigger>
            <TabsTrigger value="stages" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Stages
            </TabsTrigger>
            <TabsTrigger value="parameters" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Parameters
            </TabsTrigger>
            <TabsTrigger value="apis" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              APIs
            </TabsTrigger>
          </TabsList>

          <TabsContent value="research" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Scientific Research Interface</CardTitle>
                <CardDescription>
                  Conduct advanced scientific reasoning using the ASR-GoT framework
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResearchInterface 
                  currentStage={currentStage}
                  graphData={graphData}
                  onExecuteStage={executeStage}
                  isProcessing={isProcessing}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="graph" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Knowledge Graph Visualization</CardTitle>
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
            <Card>
              <CardHeader>
                <CardTitle>Stage Management</CardTitle>
                <CardDescription>
                  Monitor and control the 8-stage ASR-GoT process
                </CardDescription>
              </CardHeader>
              <CardContent>
                <StageManager 
                  currentStage={currentStage}
                  stages={stages}
                  onExecuteStage={executeStage}
                  isProcessing={isProcessing}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="parameters" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Parameter Configuration</CardTitle>
                <CardDescription>
                  Configure ASR-GoT framework parameters (P1.0 - P1.29)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ParameterConfig 
                  parameters={parameters}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="apis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Integration</CardTitle>
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