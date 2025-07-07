
import ASRGoTInterface from "@/pages/ASRGoTInterface";
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
  return <ASRGoTInterface />;
};

export default Index;
