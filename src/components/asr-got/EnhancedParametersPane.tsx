/**
 * Enhanced Parameters Pane with P1.0-P1.29 Accordion Implementation
 * Grouped by theme with full editability and metadata binding
 */

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { motion } from 'framer-motion';
import { ASRGoTParameters, ASRGoTParameter } from '@/types/asrGotTypes';
import { Info, Save, RotateCcw, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface EnhancedParametersPaneProps {
  parameters: ASRGoTParameters;
  onParameterUpdate: (parameterId: string, updates: Partial<ASRGoTParameter>) => void;
  onParametersReset: () => void;
  onParametersSave: () => void;
}

export const EnhancedParametersPane: React.FC<EnhancedParametersPaneProps> = ({
  parameters,
  onParameterUpdate,
  onParametersReset,
  onParametersSave
}) => {
  const [editingParameter, setEditingParameter] = useState<string | null>(null);
  const [localValues, setLocalValues] = useState<Record<string, any>>({});

  // Group parameters by category for accordion sections
  const groupedParameters = React.useMemo(() => {
    const groups: Record<string, ASRGoTParameter[]> = {
      framework: [],
      initialization: [],
      decomposition: [],
      hypothesis: [],
      evidence: [],
      refinement: [],
      output: [],
      verification: [],
      advanced: []
    };

    Object.values(parameters).forEach(param => {
      if (groups[param.category]) {
        groups[param.category].push(param);
      }
    });

    return groups;
  }, [parameters]);

  const handleParameterEdit = useCallback((parameterId: string, field: string, value: any) => {
    setLocalValues(prev => ({
      ...prev,
      [parameterId]: {
        ...prev[parameterId],
        [field]: value
      }
    }));
  }, []);

  const saveParameterChanges = useCallback((parameterId: string) => {
    const changes = localValues[parameterId];
    if (changes) {
      onParameterUpdate(parameterId, {
        ...changes,
        notes: `Last modified: ${new Date().toLocaleString()}`
      });
      setLocalValues(prev => {
        const updated = { ...prev };
        delete updated[parameterId];
        return updated;
      });
      setEditingParameter(null);
      toast.success(`Parameter ${parameterId} updated`);
    }
  }, [localValues, onParameterUpdate]);

  const cancelParameterEdit = useCallback((parameterId: string) => {
    setLocalValues(prev => {
      const updated = { ...prev };
      delete updated[parameterId];
      return updated;
    });
    setEditingParameter(null);
  }, []);

  const formatParameterValue = (param: ASRGoTParameter) => {
    if (typeof param.value === 'boolean') {
      return param.value ? 'Enabled' : 'Disabled';
    }
    if (Array.isArray(param.value)) {
      return param.value.join(', ');
    }
    return String(param.value);
  };

  const renderParameterInput = (param: ASRGoTParameter) => {
    const localValue = localValues[param.parameter_id];
    const currentValue = localValue?.value ?? param.value;

    if (typeof param.value === 'boolean') {
      return (
        <Switch
          checked={currentValue}
          onCheckedChange={(checked) => 
            handleParameterEdit(param.parameter_id, 'value', checked)
          }
        />
      );
    }

    if (Array.isArray(param.value)) {
      return (
        <Textarea
          value={Array.isArray(currentValue) ? currentValue.join('\n') : currentValue}
          onChange={(e) => 
            handleParameterEdit(param.parameter_id, 'value', e.target.value.split('\n'))
          }
          placeholder="Enter values (one per line)"
          className="min-h-[80px]"
        />
      );
    }

    if (typeof param.value === 'number') {
      return (
        <Input
          type="number"
          value={currentValue}
          onChange={(e) => 
            handleParameterEdit(param.parameter_id, 'value', parseFloat(e.target.value))
          }
          step="0.01"
        />
      );
    }

    return (
      <Input
        value={currentValue}
        onChange={(e) => 
          handleParameterEdit(param.parameter_id, 'value', e.target.value)
        }
      />
    );
  };

  const getCategoryIcon = (category: string) => {
    const icons = {
      framework: '🏗️',
      initialization: '🚀',
      decomposition: '🔍',
      hypothesis: '💡',
      evidence: '📊',
      refinement: '⚙️',
      output: '📄',
      verification: '✅',
      advanced: '🔬'
    };
    return icons[category] || '📋';
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      framework: 'bg-blue-500',
      initialization: 'bg-green-500',
      decomposition: 'bg-yellow-500',
      hypothesis: 'bg-purple-500',
      evidence: 'bg-orange-500',
      refinement: 'bg-red-500',
      output: 'bg-indigo-500',
      verification: 'bg-pink-500',
      advanced: 'bg-gray-500'
    };
    return colors[category] || 'bg-gray-500';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              ⚙️ Live P1.0–P1.29 Parameters
              <Badge variant="outline">
                {Object.keys(parameters).length} Parameters
              </Badge>
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={onParametersReset}>
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              <Button size="sm" onClick={onParametersSave}>
                <Save className="h-4 w-4 mr-1" />
                Save All
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="space-y-2">
            {Object.entries(groupedParameters).map(([category, params]) => (
              params.length > 0 && (
                <AccordionItem key={category} value={category} className="border rounded-lg">
                  <AccordionTrigger className="px-4 hover:no-underline">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full ${getCategoryColor(category)} flex items-center justify-center text-white text-sm`}>
                        {getCategoryIcon(category)}
                      </div>
                      <div className="text-left">
                        <div className="font-semibold capitalize">{category} Parameters</div>
                        <div className="text-sm text-muted-foreground">
                          {params.length} parameter{params.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <div className="space-y-4">
                      {params.map((param) => (
                        <motion.div
                          key={param.parameter_id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="border rounded-lg p-4 space-y-3"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <Label className="font-semibold text-sm">
                                  {param.parameter_id}
                                </Label>
                                <Badge 
                                  variant={param.enabled ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {param.enabled ? 'Active' : 'Inactive'}
                                </Badge>
                                <HoverCard>
                                  <HoverCardTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0">
                                      <Info className="h-3 w-3" />
                                    </Button>
                                  </HoverCardTrigger>
                                  <HoverCardContent className="w-80">
                                    <div className="space-y-2">
                                      <h4 className="font-semibold">{param.parameter_id}</h4>
                                      <p className="text-sm">{param.source_description}</p>
                                      <div className="text-xs text-muted-foreground">
                                        Type: {param.type}
                                      </div>
                                      {param.validation_rules && (
                                        <div className="text-xs">
                                          <strong>Validation:</strong> {param.validation_rules.join(', ')}
                                        </div>
                                      )}
                                    </div>
                                  </HoverCardContent>
                                </HoverCard>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {param.source_description}
                              </p>
                            </div>
                          </div>

                          {editingParameter === param.parameter_id ? (
                            <div className="space-y-3">
                              <div>
                                <Label className="text-xs">Value</Label>
                                {renderParameterInput(param)}
                              </div>
                              <div>
                                <Label className="text-xs">Notes</Label>
                                <Textarea
                                  value={localValues[param.parameter_id]?.notes || param.notes}
                                  onChange={(e) => 
                                    handleParameterEdit(param.parameter_id, 'notes', e.target.value)
                                  }
                                  placeholder="Add notes about this parameter..."
                                  className="min-h-[80px]"
                                />
                              </div>
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  onClick={() => saveParameterChanges(param.parameter_id)}
                                >
                                  <Save className="h-3 w-3 mr-1" />
                                  Save
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => cancelParameterEdit(param.parameter_id)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <Label className="text-xs text-muted-foreground">Current Value</Label>
                                  <div className="font-mono bg-muted rounded px-2 py-1">
                                    {formatParameterValue(param)}
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-xs text-muted-foreground">Type</Label>
                                  <div className="text-sm">{param.type}</div>
                                </div>
                              </div>
                              
                              {param.notes && (
                                <div>
                                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    Notes
                                  </Label>
                                  <div className="text-sm bg-muted rounded px-2 py-1">
                                    {param.notes}
                                  </div>
                                </div>
                              )}

                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setEditingParameter(param.parameter_id)}
                              >
                                Edit Parameter
                              </Button>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </motion.div>
  );
};