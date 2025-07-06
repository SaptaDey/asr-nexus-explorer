import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Save, RotateCcw } from 'lucide-react';
import { ASRGoTParameters } from '@/hooks/useASRGoT';
import { toast } from 'sonner';

interface ParameterConfigProps {
  parameters: ASRGoTParameters;
}

const parameterGroups = {
  'Core Framework': ['P1.0', 'P1.1', 'P1.2', 'P1.3', 'P1.4', 'P1.5', 'P1.6', 'P1.7'],
  'Network Structure': ['P1.8', 'P1.9', 'P1.10', 'P1.22', 'P1.23', 'P1.24', 'P1.25'],
  'Mathematical': ['P1.11', 'P1.12', 'P1.13', 'P1.14', 'P1.26', 'P1.27'],
  'Quality Assurance': ['P1.15', 'P1.16', 'P1.17', 'P1.18'],
  'Advanced Features': ['P1.19', 'P1.20', 'P1.21', 'P1.28', 'P1.29']
};

export const ParameterConfig: React.FC<ParameterConfigProps> = ({
  parameters
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParameter, setSelectedParameter] = useState<string | null>(null);
  const [editedParameters, setEditedParameters] = useState(parameters);

  const filteredParameters = Object.entries(editedParameters).filter(([key, param]) =>
    key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    param.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    param.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const updateParameter = (paramId: string, field: string, value: any) => {
    setEditedParameters(prev => ({
      ...prev,
      [paramId]: {
        ...prev[paramId],
        [field]: value
      }
    }));
  };

  const saveChanges = () => {
    // In a real app, this would save to backend or context
    toast.success('Parameter configuration saved');
  };

  const resetToDefaults = () => {
    setEditedParameters(parameters);
    toast.info('Parameters reset to defaults');
  };

  return (
    <div className="space-y-6">
      {/* Search and Actions */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search parameters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={saveChanges} size="sm">
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
        <Button onClick={resetToDefaults} variant="outline" size="sm">
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset
        </Button>
      </div>

      <Tabs defaultValue="grouped" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grouped">Grouped View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="editor">Parameter Editor</TabsTrigger>
        </TabsList>

        <TabsContent value="grouped" className="space-y-6">
          {Object.entries(parameterGroups).map(([groupName, paramIds]) => (
            <Card key={groupName}>
              <CardHeader>
                <CardTitle className="text-lg">{groupName}</CardTitle>
                <CardDescription>
                  {paramIds.length} parameters in this group
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {paramIds.map(paramId => {
                    const param = editedParameters[paramId];
                    if (!param) return null;
                    
                    return (
                      <div 
                        key={paramId}
                        className="border rounded-lg p-4 hover:bg-muted/50 cursor-pointer"
                        onClick={() => setSelectedParameter(paramId)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{param.parameter_id}</Badge>
                              <Badge variant="secondary">{param.type}</Badge>
                              <Switch 
                                checked={param.enabled}
                                onCheckedChange={(enabled) => 
                                  updateParameter(paramId, 'enabled', enabled)
                                }
                              />
                            </div>
                            <div className="text-sm text-muted-foreground mb-2">
                              {param.source_description}
                            </div>
                            <div className="text-sm font-mono bg-muted p-2 rounded">
                              {param.value.length > 100 
                                ? `${param.value.substring(0, 100)}...`
                                : param.value
                              }
                            </div>
                            {param.notes && (
                              <div className="text-xs text-muted-foreground mt-2">
                                {param.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <div className="grid gap-4">
            {filteredParameters.map(([paramId, param]) => (
              <Card key={paramId}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{param.parameter_id}</CardTitle>
                      <CardDescription>{param.type}</CardDescription>
                    </div>
                    <Switch 
                      checked={param.enabled}
                      onCheckedChange={(enabled) => 
                        updateParameter(paramId, 'enabled', enabled)
                      }
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium mb-1">Description</div>
                      <div className="text-sm text-muted-foreground">
                        {param.source_description}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Value</div>
                      <div className="text-sm font-mono bg-muted p-2 rounded">
                        {param.value}
                      </div>
                    </div>
                    {param.notes && (
                      <div>
                        <div className="text-sm font-medium mb-1">Notes</div>
                        <div className="text-sm text-muted-foreground">
                          {param.notes}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="editor" className="space-y-4">
          {selectedParameter && editedParameters[selectedParameter] ? (
            <Card>
              <CardHeader>
                <CardTitle>Edit Parameter: {selectedParameter}</CardTitle>
                <CardDescription>
                  Modify parameter configuration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="param-id">Parameter ID</Label>
                    <Input
                      id="param-id"
                      value={editedParameters[selectedParameter].parameter_id}
                      onChange={(e) => updateParameter(selectedParameter, 'parameter_id', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="param-type">Type</Label>
                    <Input
                      id="param-type"
                      value={editedParameters[selectedParameter].type}
                      onChange={(e) => updateParameter(selectedParameter, 'type', e.target.value)}
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="param-description">Source Description</Label>
                  <Input
                    id="param-description"
                    value={editedParameters[selectedParameter].source_description}
                    onChange={(e) => updateParameter(selectedParameter, 'source_description', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="param-value">Value</Label>
                  <Textarea
                    id="param-value"
                    rows={4}
                    value={editedParameters[selectedParameter].value}
                    onChange={(e) => updateParameter(selectedParameter, 'value', e.target.value)}
                  />
                </div>
                
                <div>
                  <Label htmlFor="param-notes">Notes</Label>
                  <Textarea
                    id="param-notes"
                    rows={2}
                    value={editedParameters[selectedParameter].notes}
                    onChange={(e) => updateParameter(selectedParameter, 'notes', e.target.value)}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editedParameters[selectedParameter].enabled}
                    onCheckedChange={(enabled) => 
                      updateParameter(selectedParameter, 'enabled', enabled)
                    }
                  />
                  <Label>Parameter Enabled</Label>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center text-muted-foreground">
                  Select a parameter from the list to edit
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};