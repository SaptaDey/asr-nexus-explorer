
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Settings, Save, RotateCcw } from 'lucide-react';
import { ASRGoTParameters } from '@/hooks/useASRGoT';
import { completeASRGoTParameters, getParametersByCategory, getParameterCategories } from '@/config/asrGotParameters';

interface ParameterConfigProps {
  parameters: ASRGoTParameters;
  onUpdateParameters?: (parameters: ASRGoTParameters) => void;
}

export const ParameterConfig: React.FC<ParameterConfigProps> = ({
  parameters,
  onUpdateParameters
}) => {
  const [localParams, setLocalParams] = React.useState(parameters);
  const categories = getParameterCategories();

  const handleParameterUpdate = (paramId: string, field: string, value: any) => {
    const updated = {
      ...localParams,
      [paramId]: {
        ...localParams[paramId],
        [field]: value
      }
    };
    setLocalParams(updated);
    onUpdateParameters?.(updated);
  };

  const resetParameters = () => {
    setLocalParams(completeASRGoTParameters);
    onUpdateParameters?.(completeASRGoTParameters);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="gradient-text text-2xl font-bold">ASR-GoT Parameters (P1.0 - P1.29)</h2>
          <p className="text-muted-foreground mt-1">
            Complete configuration of all Advanced Scientific Reasoning parameters
          </p>
        </div>
        <Button onClick={resetParameters} variant="outline" size="sm">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset All
        </Button>
      </div>

      <Tabs defaultValue={categories[0]} className="space-y-4">
        <TabsList className="flex-wrap h-auto p-1">
          {categories.map(category => (
            <TabsTrigger key={category} value={category} className="capitalize data-[state=active]:gradient-bg data-[state=active]:text-white">
              {category}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map(category => (
          <TabsContent key={category} value={category} className="space-y-4">
            <div className="grid gap-4">
              {getParametersByCategory(category).map(param => (
                <Card key={param.parameter_id} className="card-gradient">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono">
                          {param.parameter_id}
                        </Badge>
                        <CardTitle className="text-lg">{param.type}</CardTitle>
                        <Switch
                          checked={localParams[param.parameter_id]?.enabled ?? param.enabled}
                          onCheckedChange={(enabled) => 
                            handleParameterUpdate(param.parameter_id, 'enabled', enabled)
                          }
                        />
                      </div>
                    </div>
                    <CardDescription className="text-sm">
                      {param.source_description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold">Parameter Value</Label>
                      <Textarea
                        value={String(localParams[param.parameter_id]?.value ?? param.value)}
                        disabled={!localParams[param.parameter_id]?.enabled}
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

