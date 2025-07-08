import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Settings, Brain, Database, Zap, AlertTriangle, Info } from 'lucide-react';
import { ASRGoTParameters } from '@/types/asrGotTypes';
import { getParametersByCategory, getParameterCategories } from '@/config/asrGotParameters';
import { toast } from 'sonner';

interface DeveloperModeProps {
  parameters: ASRGoTParameters;
  onParametersChange: (parameters: ASRGoTParameters) => void;
}

export const DeveloperMode: React.FC<DeveloperModeProps> = ({
  parameters,
  onParametersChange
}) => {
  const [activeCategory, setActiveCategory] = useState('framework');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editingParam, setEditingParam] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');

  const categories = getParameterCategories();
  const categoryIcons = {
    framework: Brain,
    initialization: Zap,
    decomposition: Database,
    hypothesis: Brain,
    evidence: Database,
    refinement: Settings,
    output: Info,
    verification: AlertTriangle,
    advanced: Settings
  };

  const handleParameterToggle = (paramId: string) => {
    const updated = { ...parameters };
    updated[paramId] = {
      ...updated[paramId],
      enabled: !updated[paramId].enabled
    };
    onParametersChange(updated);
    toast.success(`Parameter ${paramId} ${updated[paramId].enabled ? 'enabled' : 'disabled'}`);
  };

  const handleParameterEdit = (paramId: string) => {
    setEditingParam(paramId);
    setTempValue(String(parameters[paramId].value));
  };

  const saveParameterEdit = () => {
    if (editingParam && tempValue.trim()) {
      const updated = { ...parameters };
      updated[editingParam] = {
        ...updated[editingParam],
        value: tempValue.trim()
      };
      onParametersChange(updated);
      setEditingParam(null);
      setTempValue('');
      toast.success(`Parameter ${editingParam} updated`);
    }
  };

  const resetToDefaults = () => {
    // This would reset to default parameters
    toast.info('Reset to defaults - implement with default parameter set');
  };

  const exportConfig = () => {
    const config = JSON.stringify(parameters, null, 2);
    const blob = new Blob([config], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asr-got-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Configuration exported successfully');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="card-gradient border-orange-200">
        <CardHeader>
          <CardTitle className="gradient-text flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Developer Mode - Graph of Thoughts Parameters
          </CardTitle>
          <CardDescription>
            Customize the underlying ASR-GoT framework parameters to optimize for your specific research domain.
            <strong className="text-orange-600 ml-2">⚠️ Advanced users only - changes affect reasoning quality</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <Switch
                checked={showAdvanced}
                onCheckedChange={setShowAdvanced}
                id="advanced-mode"
              />
              <Label htmlFor="advanced-mode">Show Advanced Parameters</Label>
            </div>
            <Button onClick={exportConfig} variant="outline" size="sm">
              Export Config
            </Button>
            <Button onClick={resetToDefaults} variant="outline" size="sm">
              Reset to Defaults
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Parameter Categories */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-5 bg-white/70">
          {categories.slice(0, 5).map((category) => {
            const Icon = categoryIcons[category as keyof typeof categoryIcons] || Settings;
            return (
              <TabsTrigger 
                key={category} 
                value={category}
                className="data-[state=active]:gradient-bg data-[state=active]:text-white"
              >
                <Icon className="h-4 w-4 mr-1" />
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Additional categories for advanced mode */}
        {showAdvanced && categories.length > 5 && (
          <TabsList className="grid w-full grid-cols-4 bg-white/70 mt-2">
            {categories.slice(5).map((category) => {
              const Icon = categoryIcons[category as keyof typeof categoryIcons] || Settings;
              return (
                <TabsTrigger 
                  key={category} 
                  value={category}
                  className="data-[state=active]:gradient-bg data-[state=active]:text-white"
                >
                  <Icon className="h-4 w-4 mr-1" />
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </TabsTrigger>
              );
            })}
          </TabsList>
        )}

        {/* Parameter Content */}
        {categories.map((category) => (
          <TabsContent key={category} value={category}>
            <Card className="card-gradient">
              <CardHeader>
                <CardTitle className="gradient-text">
                  {category.charAt(0).toUpperCase() + category.slice(1)} Parameters
                </CardTitle>
                <CardDescription>
                  Configure {category} stage parameters for the Graph of Thoughts framework
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="space-y-2">
                  {getParametersByCategory(category).map((param) => (
                    <AccordionItem key={param.parameter_id} value={param.parameter_id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 w-full">
                          <Switch
                            checked={param.enabled}
                            onCheckedChange={() => handleParameterToggle(param.parameter_id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                          <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {param.parameter_id}
                              </Badge>
                              <span className="font-medium">{param.type}</span>
                            </div>
                          </div>
                          <Badge 
                            variant={param.enabled ? "default" : "secondary"}
                            className={param.enabled ? "gradient-bg text-white" : ""}
                          >
                            {param.enabled ? 'Active' : 'Disabled'}
                          </Badge>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="space-y-4">
                        <div className="grid gap-4">
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">
                              Source Description
                            </Label>
                            <p className="text-sm">{param.source_description}</p>
                          </div>
                          
                          <div>
                            <Label className="text-sm font-medium text-muted-foreground">
                              Current Value
                            </Label>
                            {editingParam === param.parameter_id ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={tempValue}
                                  onChange={(e) => setTempValue(e.target.value)}
                                  className="min-h-20"
                                />
                                <div className="flex gap-2">
                                  <Button onClick={saveParameterEdit} size="sm">
                                    Save
                                  </Button>
                                  <Button 
                                    onClick={() => setEditingParam(null)} 
                                    variant="outline" 
                                    size="sm"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start gap-2">
                                <p className="text-sm bg-muted p-2 rounded flex-1">
                                  {param.value}
                                </p>
                                <Button 
                                  onClick={() => handleParameterEdit(param.parameter_id)}
                                  variant="outline" 
                                  size="sm"
                                >
                                  Edit
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          {param.notes && (
                            <div>
                              <Label className="text-sm font-medium text-muted-foreground">
                                Notes
                              </Label>
                              <p className="text-sm text-muted-foreground">{param.notes}</p>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};