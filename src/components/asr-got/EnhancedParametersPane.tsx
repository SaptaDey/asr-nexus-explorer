import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Settings, Save, RotateCcw, Upload, Download, HelpCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ASRGoTParameters, ASRGoTParameter } from '@/types/asrGotTypes';

interface EnhancedParametersPaneProps {
  parameters: ASRGoTParameters;
  onParameterChange: (parameterId: string, value: any) => void;
  onSavePreset: (presetName: string, parameters: ASRGoTParameters) => void;
  onLoadPreset: (presetName: string) => void;
  presets?: string[];
  className?: string;
  isProcessing?: boolean;
}

// Category descriptions with proper index signature
const CATEGORY_DESCRIPTIONS: { [key: string]: string } = {
  framework: 'Core framework parameters that control the overall ASR-GoT execution strategy and methodology.',
  initialization: 'Initial setup parameters including API configurations, research context, and starting conditions.',
  decomposition: 'Parameters controlling how complex research questions are broken down into manageable components.',
  hypothesis: 'Settings for hypothesis generation, validation criteria, and confidence thresholds.',
  evidence: 'Evidence collection parameters including source preferences, quality filters, and validation rules.',
  refinement: 'Iterative refinement controls for improving research quality through multiple passes.',
  output: 'Output formatting, presentation preferences, and export configurations.',
  verification: 'Quality assurance parameters including bias detection, fact-checking, and validation rules.',
  advanced: 'Advanced technical parameters for fine-tuning algorithm behavior and performance optimization.'
};

// Category icons with proper index signature  
const CATEGORY_ICONS: { [key: string]: string } = {
  framework: '🏗️',
  initialization: '🚀',
  decomposition: '🔍',
  hypothesis: '💡',
  evidence: '📊',
  refinement: '🔄',
  output: '📝',
  verification: '✅',
  advanced: '⚙️'
};

export const EnhancedParametersPane: React.FC<EnhancedParametersPaneProps> = ({
  parameters,
  onParameterChange,
  onSavePreset,
  onLoadPreset,
  presets = [],
  className = '',
  isProcessing = false
}) => {
  

  const [selectedCategory, setSelectedCategory] = useState<string>('framework');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{ [key: string]: string }>({});
  const [presetName, setPresetName] = useState('');
  const [expandedSections, setExpandedSections] = useState<{ [key: string]: boolean }>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Group parameters by category
  const parametersByCategory = useMemo(() => {
    const grouped: { [key: string]: ASRGoTParameter[] } = {};
    
    Object.values(parameters).forEach(param => {
      if (!grouped[param.category]) {
        grouped[param.category] = [];
      }
      grouped[param.category].push(param);
    });

    return grouped;
  }, [parameters]);

  // Filter parameters based on search term
  const filteredParameters = useMemo(() => {
    if (!searchTerm) return parametersByCategory;

    const filtered: { [key: string]: ASRGoTParameter[] } = {};
    
    Object.entries(parametersByCategory).forEach(([category, params]) => {
      const matchingParams = params.filter(param =>
        param.parameter_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        param.source_description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        param.notes.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (matchingParams.length > 0) {
        filtered[category] = matchingParams;
      }
    });

    return filtered;
  }, [parametersByCategory, searchTerm]);

  

  const validateParameter = useCallback((param: ASRGoTParameter, value: any): string | null => {
    if (!param.validation_rules) return null;

    for (const rule of param.validation_rules) {
      if (rule.startsWith('required') && (!value || value === '')) {
        return 'This field is required';
      }
      
      if (rule.startsWith('min:') && typeof value === 'number') {
        const min = parseFloat(rule.split(':')[1]);
        if (value < min) {
          return `Value must be at least ${min}`;
        }
      }
      
      if (rule.startsWith('max:') && typeof value === 'number') {
        const max = parseFloat(rule.split(':')[1]);
        if (value > max) {
          return `Value must be at most ${max}`;
        }
      }
      
      if (rule === 'email' && typeof value === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          return 'Please enter a valid email address';
        }
      }
    }

    return null;
  }, []);

  const handleParameterChange = useCallback((param: ASRGoTParameter, newValue: any) => {
    const error = validateParameter(param, newValue);
    
    setValidationErrors(prev => ({
      ...prev,
      [param.parameter_id]: error || ''
    }));

    if (!error) {
      onParameterChange(param.parameter_id, newValue);
      setHasUnsavedChanges(true);
    }
  }, [onParameterChange, validateParameter]);

  const handleResetCategory = useCallback(() => {
    // Reset all parameters in the selected category to their default values
    const categoryParams = parametersByCategory[selectedCategory] || [];
    categoryParams.forEach(param => {
      // Assuming there's a default value mechanism
      onParameterChange(param.parameter_id, getDefaultValue(param));
    });
    setHasUnsavedChanges(true);
  }, [selectedCategory, parametersByCategory, onParameterChange]);

  const getDefaultValue = (param: ASRGoTParameter): any => {
    switch (param.type) {
      case 'boolean':
        return false;
      case 'number':
        return 0;
      case 'string':
        return '';
      case 'array':
        return [];
      default:
        return null;
    }
  };

  const renderParameterInput = (param: ASRGoTParameter) => {
    const error = validationErrors[param.parameter_id];
    const value = param.value;

    const baseInputProps = {
      id: param.parameter_id,
      disabled: isProcessing || !param.enabled,
      className: error ? 'border-red-500' : ''
    };

    switch (param.type) {
      case 'boolean':
        return (
          <div className="flex items-center space-x-2">
            <Switch
              {...baseInputProps}
              checked={Boolean(value)}
              onCheckedChange={(checked) => handleParameterChange(param, checked)}
            />
            <Label htmlFor={param.parameter_id} className="text-sm">
              {param.source_description}
            </Label>
          </div>
        );

      case 'number':
        return (
          <div className="space-y-2">
            <Input
              {...baseInputProps}
              type="number"
              value={value || 0}
              onChange={(e) => handleParameterChange(param, parseFloat(e.target.value) || 0)}
              placeholder={`Enter ${param.source_description.toLowerCase()}`}
            />
            {param.validation_rules?.some(rule => rule.includes('range:')) && (
              <div className="px-2">
                <Slider
                  value={[Number(value) || 0]}
                  onValueChange={(values) => handleParameterChange(param, values[0])}
                  max={100}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>
            )}
          </div>
        );

      case 'string':
        if (param.validation_rules?.includes('multiline')) {
          return (
            <Textarea
              {...baseInputProps}
              value={String(value || '')}
              onChange={(e) => handleParameterChange(param, e.target.value)}
              placeholder={`Enter ${param.source_description.toLowerCase()}`}
              rows={3}
            />
          );
        } else if (param.validation_rules?.some(rule => rule.startsWith('options:'))) {
          const options = param.validation_rules
            .find(rule => rule.startsWith('options:'))
            ?.split(':')[1]
            .split(',') || [];
          
          return (
            <Select
              value={String(value || '')}
              onValueChange={(newValue) => handleParameterChange(param, newValue)}
            >
              <SelectTrigger {...baseInputProps}>
                <SelectValue placeholder={`Select ${param.source_description.toLowerCase()}`} />
              </SelectTrigger>
              <SelectContent>
                {options.map(option => (
                  <SelectItem key={option.trim()} value={option.trim()}>
                    {option.trim()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        } else {
          return (
            <Input
              {...baseInputProps}
              type="text"
              value={String(value || '')}
              onChange={(e) => handleParameterChange(param, e.target.value)}
              placeholder={`Enter ${param.source_description.toLowerCase()}`}
            />
          );
        }

      case 'array':
        return (
          <div className="space-y-2">
            <Textarea
              {...baseInputProps}
              value={Array.isArray(value) ? value.join('\n') : ''}
              onChange={(e) => handleParameterChange(param, e.target.value.split('\n').filter(v => v.trim()))}
              placeholder="Enter each item on a new line"
              rows={3}
            />
            <p className="text-xs text-gray-500">Enter one item per line</p>
          </div>
        );

      default:
        return (
          <Input
            {...baseInputProps}
            type="text"
            value={String(value || '')}
            onChange={(e) => handleParameterChange(param, e.target.value)}
            placeholder="Enter value"
          />
        );
    }
  };

  const renderCategoryContent = (category: string) => {
    const categoryParams = filteredParameters[category] || [];
    
    if (categoryParams.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          <Settings className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>No parameters found for this category</p>
          {searchTerm && (
            <p className="text-sm mt-1">Try adjusting your search terms</p>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {categoryParams.map(param => (
          <div key={param.parameter_id} className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <Label htmlFor={param.parameter_id} className="text-sm font-medium">
                  {param.source_description}
                  {param.validation_rules?.includes('required') && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </Label>
                {param.notes && (
                  <p className="text-xs text-gray-500 mt-1">{param.notes}</p>
                )}
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                {!param.enabled && (
                  <Badge variant="secondary" className="text-xs">Disabled</Badge>
                )}
                {param.dependencies && param.dependencies.length > 0 && (
                  <HelpCircle className="h-4 w-4 text-gray-400" title={`Depends on: ${param.dependencies.join(', ')}`} />
                )}
              </div>
            </div>

            {renderParameterInput(param)}

            {validationErrors[param.parameter_id] && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {validationErrors[param.parameter_id]}
                </AlertDescription>
              </Alert>
            )}

            {param.dependencies && param.dependencies.length > 0 && (
              <div className="text-xs text-gray-500">
                <strong>Dependencies:</strong> {param.dependencies.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <Card className={`w-full ${className}`}>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Research Parameters
            {hasUnsavedChanges && (
              <Badge variant="outline" className="ml-2">Unsaved Changes</Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetCategory}
              disabled={isProcessing}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset Category
            </Button>
            
            <Select value={presetName} onValueChange={setPresetName}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Load Preset" />
              </SelectTrigger>
              <SelectContent>
                {presets.map(preset => (
                  <SelectItem key={preset} value={preset}>
                    {preset}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {presetName && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onLoadPreset(presetName)}
                disabled={isProcessing}
              >
                <Upload className="h-4 w-4 mr-1" />
                Load
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-4 mt-4">
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Search parameters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            
            <div className="flex items-center space-x-2">
              <Label htmlFor="show-advanced" className="text-sm">Advanced</Label>
              <Switch
                id="show-advanced"
                checked={showAdvanced}
                onCheckedChange={setShowAdvanced}
              />
            </div>
          </div>

          {Object.keys(validationErrors).filter(key => validationErrors[key]).length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please fix {Object.keys(validationErrors).filter(key => validationErrors[key]).length} validation error(s) before proceeding.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardHeader>

      <CardContent>
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-9 mb-6">
            {Object.keys(CATEGORY_DESCRIPTIONS).map(category => {
              const count = (filteredParameters[category] || []).length;
              const hasErrors = (filteredParameters[category] || []).some(param => 
                validationErrors[param.parameter_id]
              );
              
              if (category === 'advanced' && !showAdvanced) return null;
              
              return (
                <TabsTrigger key={category} value={category} className="relative">
                  <span className="mr-1">{CATEGORY_ICONS[category]}</span>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                  {count > 0 && (
                    <Badge variant="secondary" className="ml-1 text-xs">
                      {count}
                    </Badge>
                  )}
                  {hasErrors && (
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></div>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {Object.entries(CATEGORY_DESCRIPTIONS).map(([category, description]) => (
            <TabsContent key={category} value={category}>
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">
                    {CATEGORY_ICONS[category]} {category.charAt(0).toUpperCase() + category.slice(1)} Parameters
                  </h3>
                  <p className="text-sm text-blue-700">{description}</p>
                </div>

                <ScrollArea className="h-96">
                  <div className="pr-4">
                    {renderCategoryContent(category)}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>
          ))}
        </Tabs>

        <Separator className="my-6" />

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {Object.keys(parameters).length} total parameters • 
            {Object.keys(validationErrors).filter(key => validationErrors[key]).length} errors
          </div>
          
          <div className="flex items-center space-x-2">
            <Input
              placeholder="Preset name..."
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="w-40"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (presetName.trim()) {
                  onSavePreset(presetName.trim(), parameters);
                  setHasUnsavedChanges(false);
                }
              }}
              disabled={!presetName.trim() || isProcessing}
            >
              <Save className="h-4 w-4 mr-1" />
              Save Preset
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
