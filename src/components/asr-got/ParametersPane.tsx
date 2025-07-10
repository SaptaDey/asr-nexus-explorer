/**
 * Comprehensive Parameters Pane for ASR-GoT Framework
 * Displays all P1.0-P1.29 parameters with inline documentation tooltips
 * Supports real-time parameter editing and validation
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ASRGoTParameters, ASRGoTParameter } from '@/types/asrGotTypes';
import { completeASRGoTParameters, getParametersByCategory, getParameterCategories } from '@/config/asrGotParameters';
import { 
  Settings, 
  Info, 
  ChevronDown, 
  ChevronRight, 
  CheckCircle, 
  XCircle, 
  Search,
  Filter,
  RotateCcw,
  Save,
  AlertTriangle,
  Zap,
  Network,
  Target,
  Clock,
  Database,
  FileText,
  Shield,
  TrendingUp,
  Brain
} from 'lucide-react';

interface ParametersPaneProps {
  parameters: ASRGoTParameters;
  onParameterChange: (parameterId: string, updates: Partial<ASRGoTParameter>) => void;
  onParametersReset: () => void;
  onParametersSave: () => void;
  className?: string;
}

// Category icons mapping
const CATEGORY_ICONS = {
  framework: Network,
  initialization: Target,
  decomposition: Brain,
  hypothesis: Zap,
  evidence: Database,
  refinement: TrendingUp,
  output: FileText,
  verification: Shield,
  advanced: Settings
};

// Category colors
const CATEGORY_COLORS = {
  framework: 'bg-blue-100 text-blue-800',
  initialization: 'bg-green-100 text-green-800',
  decomposition: 'bg-purple-100 text-purple-800',
  hypothesis: 'bg-yellow-100 text-yellow-800',
  evidence: 'bg-cyan-100 text-cyan-800',
  refinement: 'bg-orange-100 text-orange-800',
  output: 'bg-pink-100 text-pink-800',
  verification: 'bg-red-100 text-red-800',
  advanced: 'bg-gray-100 text-gray-800'
};

export const ParametersPane: React.FC<ParametersPaneProps> = ({
  parameters,
  onParameterChange,
  onParametersReset,
  onParametersSave,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [expandedParameters, setExpandedParameters] = useState<Record<string, boolean>>({});
  const [editingParameter, setEditingParameter] = useState<string | null>(null);

  // Get all categories
  const categories = useMemo(() => getParameterCategories(), []);

  // Filter parameters based on search and category
  const filteredParameters = useMemo(() => {
    let filtered = Object.entries(parameters);

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(([id, param]) =>
        id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        param.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        param.value.toLowerCase().includes(searchTerm.toLowerCase()) ||
        param.notes.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(([, param]) => param.category === selectedCategory);
    }

    return filtered;
  }, [parameters, searchTerm, selectedCategory]);

  // Group parameters by category
  const groupedParameters = useMemo(() => {
    const grouped: Record<string, [string, ASRGoTParameter][]> = {};
    
    filteredParameters.forEach(([id, param]) => {
      if (!grouped[param.category]) {
        grouped[param.category] = [];
      }
      grouped[param.category].push([id, param]);
    });

    return grouped;
  }, [filteredParameters]);

  // Toggle category expansion
  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Toggle parameter expansion
  const toggleParameter = (parameterId: string) => {
    setExpandedParameters(prev => ({
      ...prev,
      [parameterId]: !prev[parameterId]
    }));
  };

  // Handle parameter editing
  const handleParameterEdit = (parameterId: string, field: string, value: any) => {
    onParameterChange(parameterId, { [field]: value });
  };

  // Start editing parameter
  const startEditing = (parameterId: string) => {
    setEditingParameter(parameterId);
  };

  // Stop editing parameter
  const stopEditing = () => {
    setEditingParameter(null);
  };

  // Parameter status indicator
  const getParameterStatus = (param: ASRGoTParameter) => {
    if (!param.enabled) return 'disabled';
    if (param.value.length < 10) return 'incomplete';
    return 'active';
  };

  // Render individual parameter
  const renderParameter = (parameterId: string, param: ASRGoTParameter) => {
    const isExpanded = expandedParameters[parameterId];
    const isEditing = editingParameter === parameterId;
    const status = getParameterStatus(param);
    const StatusIcon = status === 'active' ? CheckCircle : status === 'incomplete' ? AlertTriangle : XCircle;

    return (
      <Card key={parameterId} className="mb-2">
        <Collapsible open={isExpanded} onOpenChange={() => toggleParameter(parameterId)}>
          <CollapsibleTrigger asChild>
            <CardHeader className="py-3 cursor-pointer hover:bg-muted/50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Badge variant="outline" className="font-mono text-xs">
                    {parameterId}
                  </Badge>
                  <span className="font-medium">{param.type.replace('Parameter - ', '')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <StatusIcon className={`h-4 w-4 ${
                          status === 'active' ? 'text-green-500' :
                          status === 'incomplete' ? 'text-yellow-500' : 'text-red-500'
                        }`} />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{status === 'active' ? 'Parameter is active and configured' :
                             status === 'incomplete' ? 'Parameter needs configuration' :
                             'Parameter is disabled'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <Switch
                    checked={param.enabled}
                    onCheckedChange={(enabled) => handleParameterEdit(parameterId, 'enabled', enabled)}
                  />
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* Parameter Description */}
                <div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center space-x-1 mb-2">
                          <Info className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Description</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Source: {param.source_description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <p className="text-sm text-muted-foreground">{param.notes}</p>
                </div>

                {/* Parameter Value */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Value</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => isEditing ? stopEditing() : startEditing(parameterId)}
                    >
                      {isEditing ? 'Save' : 'Edit'}
                    </Button>
                  </div>
                  
                  {isEditing ? (
                    <Textarea
                      value={param.value}
                      onChange={(e) => handleParameterEdit(parameterId, 'value', e.target.value)}
                      className="min-h-20"
                      placeholder="Enter parameter value..."
                    />
                  ) : (
                    <div className="bg-muted/50 p-3 rounded-md">
                      <code className="text-sm">{param.value}</code>
                    </div>
                  )}
                </div>

                {/* Parameter Notes */}
                <div>
                  <span className="text-sm font-medium">Implementation Notes</span>
                  <div className="mt-1 bg-blue-50 p-3 rounded-md">
                    <p className="text-sm text-blue-800">{param.notes}</p>
                  </div>
                </div>

                {/* Parameter Source */}
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Source:</span> {param.source_description}
                </div>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  // Render category section
  const renderCategory = (category: string, categoryParameters: [string, ASRGoTParameter][]) => {
    const isExpanded = expandedCategories[category];
    const CategoryIcon = CATEGORY_ICONS[category] || Settings;
    const enabledCount = categoryParameters.filter(([, param]) => param.enabled).length;

    return (
      <div key={category} className="mb-4">
        <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(category)}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50">
              <div className="flex items-center space-x-3">
                {isExpanded ? (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
                <CategoryIcon className="h-5 w-5 text-muted-foreground" />
                <span className="font-semibold capitalize">{category.replace('_', ' ')}</span>
                <Badge className={CATEGORY_COLORS[category] || 'bg-gray-100 text-gray-800'}>
                  {enabledCount}/{categoryParameters.length}
                </Badge>
              </div>
            </div>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="mt-3 space-y-2">
              {categoryParameters.map(([id, param]) => renderParameter(id, param))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>
    );
  };

  // Calculate statistics
  const totalParameters = Object.keys(parameters).length;
  const enabledParameters = Object.values(parameters).filter(p => p.enabled).length;
  const completeParameters = Object.values(parameters).filter(p => p.enabled && p.value.length >= 10).length;

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <h2 className="text-lg font-semibold">ASR-GoT Parameters</h2>
            <Badge variant="outline">P1.0 - P1.29</Badge>
          </div>
          <div className="flex space-x-2">
            <Button size="sm" variant="outline" onClick={onParametersReset}>
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </Button>
            <Button size="sm" onClick={onParametersSave}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Card className="p-2">
            <div className="text-center">
              <div className="text-lg font-bold">{totalParameters}</div>
              <div className="text-xs text-muted-foreground">Total</div>
            </div>
          </Card>
          <Card className="p-2">
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">{enabledParameters}</div>
              <div className="text-xs text-muted-foreground">Enabled</div>
            </div>
          </Card>
          <Card className="p-2">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{completeParameters}</div>
              <div className="text-xs text-muted-foreground">Complete</div>
            </div>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search parameters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-5 text-xs">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="framework">Core</TabsTrigger>
              <TabsTrigger value="evidence">Evidence</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
              <TabsTrigger value="output">Output</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* Parameters List */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {Object.entries(groupedParameters).map(([category, categoryParameters]) =>
            renderCategory(category, categoryParameters)
          )}
          
          {filteredParameters.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Filter className="h-8 w-8 mx-auto mb-2" />
              <p>No parameters match your search criteria</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};