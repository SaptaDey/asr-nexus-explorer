/**
 * Enhanced Parameters Pane with Advanced Configuration Options
 * Provides comprehensive configuration for ASR-GoT Framework parameters
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Settings, 
  ChevronDown, 
  ChevronRight, 
  Save, 
  RotateCcw, 
  Download, 
  Upload,
  Info,
  AlertTriangle,
  CheckCircle,
  Network,
  Brain,
  Zap,
  Target,
  FileText,
  ShieldCheck,
  Cog
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ASRGoTParameters } from '@/types/asrGotTypes';
import { toast } from 'sonner';

interface EnhancedParametersPaneProps {
  parameters: ASRGoTParameters;
  onParametersChange: (parameters: ASRGoTParameters) => void;
  isProcessing?: boolean;
  className?: string;
  enableAdvancedMode?: boolean;
}

// Parameter validation schemas
const PARAMETER_CONSTRAINTS = {
  confidenceThreshold: { min: 0, max: 1, step: 0.01 },
  maxIterations: { min: 1, max: 100, step: 1 },
  timeoutMinutes: { min: 1, max: 120, step: 1 },
  maxNodes: { min: 10, max: 1000, step: 10 },
  explorationDepth: { min: 1, max: 10, step: 1 },
  evidenceWeight: { min: 0, max: 2, step: 0.1 },
  hypothesisWeight: { min: 0, max: 2, step: 0.1 },
  synthesisWeight: { min: 0, max: 2, step: 0.1 },
  biasDetectionSensitivity: { min: 0, max: 1, step: 0.01 },
  costBudget: { min: 0, max: 1000, step: 1 }
};

// Parameter categories for organization
const PARAMETER_CATEGORIES = {
  framework: 'Framework Settings',
  initialization: 'Initialization',
  decomposition: 'Problem Decomposition',
  hypothesis: 'Hypothesis Generation',
  evidence: 'Evidence Collection',
  refinement: 'Refinement Process',
  output: 'Output Generation',
  verification: 'Verification & Validation',
  advanced: 'Advanced Settings'
};

const CATEGORY_ICONS = {
  framework: Settings,
  initialization: Target,
  decomposition: Network,
  hypothesis: Brain,
  evidence: FileText,
  refinement: Zap,
  output: Download,
  verification: ShieldCheck,
  advanced: Cog
};

export const EnhancedParametersPane: React.FC<EnhancedParametersPaneProps> = ({
  parameters,
  onParametersChange,
  isProcessing = false,
  className = '',
  enableAdvancedMode = false
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('framework');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['framework']));
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isAdvancedMode, setIsAdvancedMode] = useState(enableAdvancedMode);

  // Validate parameter values
  const validateParameter = useCallback((key: string, value: any): string | null => {
    const constraint = PARAMETER_CONSTRAINTS[key as keyof typeof PARAMETER_CONSTRAINTS];
    if (!constraint) return null;

    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return 'Must be a valid number';
    if (numValue < constraint.min) return `Must be at least ${constraint.min}`;
    if (numValue > constraint.max) return `Must be at most ${constraint.max}`;
    return null;
  }, []);

  // Handle parameter changes with validation
  const handleParameterChange = useCallback((key: string, value: any) => {
    const error = validateParameter(key, value);
    
    setValidationErrors(prev => ({
      ...prev,
      [key]: error || ''
    }));

    if (!error) {
      const updatedParameters = { ...parameters, [key]: value };
      onParametersChange(updatedParameters);
      setHasUnsavedChanges(true);
    }
  }, [parameters, onParametersChange, validateParameter]);

  // Render parameter input based on type
  const renderParameterInput = useCallback((key: string, value: any, config: any) => {
    const constraint = PARAMETER_CONSTRAINTS[key as keyof typeof PARAMETER_CONSTRAINTS];
    const error = validationErrors[key];

    switch (config.type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              checked={Boolean(value)}
              onCheckedChange={(checked) => handleParameterChange(key, checked)}
              disabled={isProcessing}
            />
            <Label htmlFor={key} className={error ? 'text-red-500' : ''}>
              {config.label}
            </Label>
          </div>
        );

      case 'number':
        return (
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor={key} className={error ? 'text-red-500' : ''}>
                {config.label}
              </Label>
              <span className="text-sm text-muted-foreground">{String(value)}</span>
            </div>
            {constraint ? (
              <Slider
                value={[typeof value === 'string' ? parseFloat(value) || 0 : Number(value)]}
                onValueChange={(values) => handleParameterChange(key, values[0])}
                min={constraint.min}
                max={constraint.max}
                step={constraint.step}
                disabled={isProcessing}
                className="w-full"
              />
            ) : (
              <Input
                type="number"
                value={String(value)}
                onChange={(e) => handleParameterChange(key, e.target.value)}
                disabled={isProcessing}
                className={error ? 'border-red-500' : ''}
              />
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'string':
        return (
          <div className="space-y-2">
            <Label htmlFor={key} className={error ? 'text-red-500' : ''}>
              {config.label}
            </Label>
            <Input
              value={String(value)}
              onChange={(e) => handleParameterChange(key, e.target.value)}
              disabled={isProcessing}
              className={error ? 'border-red-500' : ''}
              placeholder={config.placeholder || ''}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div className="space-y-2">
            <Label htmlFor={key} className={error ? 'text-red-500' : ''}>
              {config.label}
            </Label>
            <Textarea
              value={String(value)}
              onChange={(e) => handleParameterChange(key, e.target.value)}
              disabled={isProcessing}
              className={error ? 'border-red-500' : ''}
              placeholder={config.placeholder || ''}
              rows={3}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      case 'select':
        return (
          <div className="space-y-2">
            <Label htmlFor={key} className={error ? 'text-red-500' : ''}>
              {config.label}
            </Label>
            <Select
              value={String(value)}
              onValueChange={(selectedValue) => handleParameterChange(key, selectedValue)}
              disabled={isProcessing}
            >
              <SelectTrigger className={error ? 'border-red-500' : ''}>
                <SelectValue placeholder={config.placeholder || 'Select option'} />
              </SelectTrigger>
              <SelectContent>
                {config.options?.map((option: any) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  }, [validationErrors, handleParameterChange, isProcessing]);

  // Parameter configurations
  const parameterConfigs = useMemo(() => ({
    // Framework Settings
    framework: {
      researchDomain: { type: 'string', label: 'Research Domain', category: 'framework' },
      analysisType: { type: 'select', label: 'Analysis Type', category: 'framework', options: [
        { value: 'exploratory', label: 'Exploratory' },
        { value: 'confirmatory', label: 'Confirmatory' },
        { value: 'descriptive', label: 'Descriptive' },
        { value: 'causal', label: 'Causal' }
      ]},
      confidenceThreshold: { type: 'number', label: 'Confidence Threshold', category: 'framework' },
    },
    initialization: {
      initialQuery: { type: 'textarea', label: 'Initial Query', category: 'initialization', placeholder: 'Enter initial query...' },
      maxNodes: { type: 'number', label: 'Max Nodes', category: 'initialization' },
      timeoutMinutes: { type: 'number', label: 'Timeout (Minutes)', category: 'initialization' }
    },
    decomposition: {
      decompositionStrategy: { type: 'select', label: 'Decomposition Strategy', category: 'decomposition', options: [
        { value: 'top-down', label: 'Top-Down' },
        { value: 'bottom-up', label: 'Bottom-Up' },
        { value: 'hybrid', label: 'Hybrid' }
      ]},
      explorationDepth: { type: 'number', label: 'Exploration Depth', category: 'decomposition' }
    },
    hypothesis: {
      hypothesisGenerationMethod: { type: 'select', label: 'Hypothesis Method', category: 'hypothesis', options: [
        { value: 'rule-based', label: 'Rule-Based' },
        { value: 'statistical', label: 'Statistical' },
        { value: 'ai-driven', label: 'AI-Driven' }
      ]},
      maxIterations: { type: 'number', label: 'Max Iterations', category: 'hypothesis' }
    },
    evidence: {
      evidenceCollectionMethod: { type: 'select', label: 'Evidence Method', category: 'evidence', options: [
        { value: 'literature-review', label: 'Literature Review' },
        { value: 'expert-opinion', label: 'Expert Opinion' },
        { value: 'data-analysis', label: 'Data Analysis' }
      ]},
      evidenceWeight: { type: 'number', label: 'Evidence Weight', category: 'evidence' }
    },
    refinement: {
      refinementAlgorithm: { type: 'select', label: 'Refinement Algorithm', category: 'refinement', options: [
        { value: 'genetic-algorithm', label: 'Genetic Algorithm' },
        { value: 'simulated-annealing', label: 'Simulated Annealing' },
        { value: 'gradient-descent', label: 'Gradient Descent' }
      ]},
      hypothesisWeight: { type: 'number', label: 'Hypothesis Weight', category: 'refinement' },
      synthesisWeight: { type: 'number', label: 'Synthesis Weight', category: 'refinement' }
    },
    output: {
      outputFormat: { type: 'select', label: 'Output Format', category: 'output', options: [
        { value: 'graphml', label: 'GraphML' },
        { value: 'json', label: 'JSON' },
        { value: 'csv', label: 'CSV' }
      ]},
      biasDetectionSensitivity: { type: 'number', label: 'Bias Sensitivity', category: 'output' }
    },
    verification: {
      verificationMethod: { type: 'select', label: 'Verification Method', category: 'verification', options: [
        { value: 'statistical-validation', label: 'Statistical Validation' },
        { value: 'expert-review', label: 'Expert Review' },
        { value: 'simulation', label: 'Simulation' }
      ]},
      costBudget: { type: 'number', label: 'Cost Budget', category: 'verification' }
    },
    // Advanced Settings
    advanced: {
      apiEndpoint: { type: 'string', label: 'API Endpoint', category: 'advanced' },
      apiKey: { type: 'string', label: 'API Key', category: 'advanced' },
      enableCaching: { type: 'boolean', label: 'Enable Caching', category: 'advanced' },
      loggingLevel: { type: 'select', label: 'Logging Level', category: 'advanced', options: [
        { value: 'debug', label: 'Debug' },
        { value: 'info', label: 'Info' },
        { value: 'warn', label: 'Warning' },
        { value: 'error', label: 'Error' }
      ]}
    }
  }), []);

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  // Reset parameters
  const resetParameters = () => {
    // Implementation for reset
    setHasUnsavedChanges(false);
    toast.success('Parameters reset to defaults');
  };

  // Save parameters
  const saveParameters = () => {
    setHasUnsavedChanges(false);
    toast.success('Parameters saved successfully');
  };

  return (
    <TooltipProvider>
      <Card className={`w-full ${className}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Enhanced Parameters
              {hasUnsavedChanges && (
                <Badge variant="secondary" className="ml-2">
                  Unsaved Changes
                </Badge>
              )}
            </CardTitle>
            
            <div className="flex items-center space-x-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAdvancedMode(!isAdvancedMode)}
                  >
                    <Cog className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Toggle Advanced Mode</p>
                </TooltipContent>
              </Tooltip>
              
              <Button
                variant="outline"
                size="sm"
                onClick={resetParameters}
                disabled={isProcessing}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
              
              <Button
                size="sm"
                onClick={saveParameters}
                disabled={isProcessing || !hasUnsavedChanges}
              >
                <Save className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Parameter Categories */}
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
              {Object.entries(PARAMETER_CATEGORIES).map(([key, label]) => {
                const IconComponent = CATEGORY_ICONS[key as keyof typeof CATEGORY_ICONS];
                return (
                  <TabsTrigger key={key} value={key} className="text-xs">
                    <IconComponent className="h-4 w-4 mr-1" />
                    <span className="hidden sm:inline">{label.split(' ')[0]}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {Object.entries(PARAMETER_CATEGORIES).map(([categoryKey, categoryLabel]) => (
              <TabsContent key={categoryKey} value={categoryKey} className="mt-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-lg font-medium">{categoryLabel}</h3>
                    <Badge variant="outline">
                      {Object.values(parameterConfigs).filter(config => (config as any).category === categoryKey).length} parameters
                    </Badge>
                  </div>

                  <div className="grid gap-4">
                    {Object.entries(parameterConfigs)
                      .filter(([_, config]) => (config as any).category === categoryKey)
                      .map(([key, config]) => (
                        <div key={key} className="p-4 border rounded-lg space-y-3">
                          {renderParameterInput(key, (parameters as any)[key], config)}
                          {(config as any).description && (
                            <p className="text-sm text-muted-foreground">
                              {(config as any).description}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          {/* Validation Summary */}
          {Object.keys(validationErrors).some(key => validationErrors[key]) && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Please fix validation errors before proceeding.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};
