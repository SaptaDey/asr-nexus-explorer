import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertCircle, CheckCircle, Key, Zap, Database, Wifi } from 'lucide-react';
import { toast } from 'sonner';

interface APIConfig {
  name: string;
  enabled: boolean;
  apiKey: string;
  endpoint: string;
  model: string;
  status: 'connected' | 'disconnected' | 'error';
  lastTested?: string;
}

export const APIIntegration: React.FC = () => {
  const [perplexityConfig, setPerplexityConfig] = useState<APIConfig>({
    name: 'Perplexity Sonar',
    enabled: true,
    apiKey: '',
    endpoint: 'https://api.perplexity.ai/chat/completions',
    model: 'sonar-reasoning-pro',
    status: 'disconnected'
  });

  const [geminiConfig, setGeminiConfig] = useState<APIConfig>({
    name: 'Gemini 2.5 Pro',
    enabled: true,
    apiKey: '',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    model: 'gemini-2.5-pro',
    status: 'disconnected'
  });

  const [mcpServers, setMcpServers] = useState([
    {
      name: 'Local MCP Server',
      url: 'http://localhost:3001',
      enabled: false,
      status: 'disconnected' as const
    },
    {
      name: 'Claude Desktop MCP',
      url: 'mcp://claude-desktop',
      enabled: false,
      status: 'disconnected' as const
    }
  ]);

  const testConnection = async (config: APIConfig, type: 'perplexity' | 'gemini') => {
    if (!config.apiKey) {
      toast.error('API key is required');
      return;
    }

    try {
      // Simulate API test
      const response = await fetch('/api/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, config })
      });

      if (response.ok) {
        const updatedConfig = {
          ...config,
          status: 'connected' as const,
          lastTested: new Date().toISOString()
        };
        
        if (type === 'perplexity') {
          setPerplexityConfig(updatedConfig);
        } else {
          setGeminiConfig(updatedConfig);
        }
        
        toast.success(`${config.name} connected successfully`);
      } else {
        throw new Error('Connection failed');
      }
    } catch (error) {
      const updatedConfig = {
        ...config,
        status: 'error' as const
      };
      
      if (type === 'perplexity') {
        setPerplexityConfig(updatedConfig);
      } else {
        setGeminiConfig(updatedConfig);
      }
      
      toast.error(`Failed to connect to ${config.name}`);
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const variants: { [key: string]: { variant: 'default' | 'secondary' | 'destructive', icon: any, color: string } } = {
      connected: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-500' },
      disconnected: { variant: 'secondary' as const, icon: Wifi, color: 'text-muted-foreground' },
      error: { variant: 'destructive' as const, icon: AlertCircle, color: 'text-red-500' }
    };
    
    const config = variants[status] || variants.disconnected;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="perplexity" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="perplexity">Perplexity Sonar</TabsTrigger>
          <TabsTrigger value="gemini">Gemini 2.5 Pro</TabsTrigger>
          <TabsTrigger value="mcp">MCP Servers</TabsTrigger>
        </TabsList>

        <TabsContent value="perplexity">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Perplexity Sonar API
                  </CardTitle>
                  <CardDescription>
                    Real-time web research and Q&A capabilities for Stage 3 & 4
                  </CardDescription>
                </div>
                <StatusBadge status={perplexityConfig.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={perplexityConfig.enabled}
                  onCheckedChange={(enabled) => 
                    setPerplexityConfig(prev => ({ ...prev, enabled }))
                  }
                />
                <Label>Enable Perplexity Integration</Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="perplexity-key">API Key</Label>
                  <Input
                    id="perplexity-key"
                    type="password"
                    placeholder="pplx-..."
                    value={perplexityConfig.apiKey}
                    onChange={(e) => 
                      setPerplexityConfig(prev => ({ ...prev, apiKey: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="perplexity-model">Model</Label>
                  <Input
                    id="perplexity-model"
                    value={perplexityConfig.model}
                    onChange={(e) => 
                      setPerplexityConfig(prev => ({ ...prev, model: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="perplexity-endpoint">API Endpoint</Label>
                <Input
                  id="perplexity-endpoint"
                  value={perplexityConfig.endpoint}
                  onChange={(e) => 
                    setPerplexityConfig(prev => ({ ...prev, endpoint: e.target.value }))
                  }
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => testConnection(perplexityConfig, 'perplexity')}
                  size="sm"
                >
                  Test Connection
                </Button>
                <Button variant="outline" size="sm">
                  <Key className="h-4 w-4 mr-2" />
                  Get API Key
                </Button>
              </div>

              {perplexityConfig.lastTested && (
                <div className="text-sm text-muted-foreground">
                  Last tested: {new Date(perplexityConfig.lastTested).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gemini">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Gemini 2.5 Pro API
                  </CardTitle>
                  <CardDescription>
                    Multimodal AI capabilities for advanced reasoning and analysis
                  </CardDescription>
                </div>
                <StatusBadge status={geminiConfig.status} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={geminiConfig.enabled}
                  onCheckedChange={(enabled) => 
                    setGeminiConfig(prev => ({ ...prev, enabled }))
                  }
                />
                <Label>Enable Gemini Integration</Label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gemini-key">API Key</Label>
                  <Input
                    id="gemini-key"
                    type="password"
                    placeholder="AIza..."
                    value={geminiConfig.apiKey}
                    onChange={(e) => 
                      setGeminiConfig(prev => ({ ...prev, apiKey: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="gemini-model">Model</Label>
                  <Input
                    id="gemini-model"
                    value={geminiConfig.model}
                    onChange={(e) => 
                      setGeminiConfig(prev => ({ ...prev, model: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="gemini-endpoint">API Endpoint</Label>
                <Input
                  id="gemini-endpoint"
                  value={geminiConfig.endpoint}
                  onChange={(e) => 
                    setGeminiConfig(prev => ({ ...prev, endpoint: e.target.value }))
                  }
                />
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => testConnection(geminiConfig, 'gemini')}
                  size="sm"
                >
                  Test Connection
                </Button>
                <Button variant="outline" size="sm">
                  <Key className="h-4 w-4 mr-2" />
                  Get API Key
                </Button>
              </div>

              {geminiConfig.lastTested && (
                <div className="text-sm text-muted-foreground">
                  Last tested: {new Date(geminiConfig.lastTested).toLocaleString()}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mcp">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Model Context Protocol Servers
              </CardTitle>
              <CardDescription>
                Connect to external MCP servers for extended capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mcpServers.map((server, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="font-medium">{server.name}</div>
                      <div className="text-sm text-muted-foreground">{server.url}</div>
                    </div>
                    <StatusBadge status={server.status} />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={server.enabled}
                        onCheckedChange={(enabled) => {
                          const updated = [...mcpServers];
                          updated[index] = { ...server, enabled };
                          setMcpServers(updated);
                        }}
                      />
                      <Label>Enable Connection</Label>
                    </div>
                    
                    <Button variant="outline" size="sm">
                      Test Connection
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button variant="outline" className="w-full">
                Add New MCP Server
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Usage Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>API Usage Statistics</CardTitle>
          <CardDescription>
            Monitor API usage and costs across all integrations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold">247</div>
              <div className="text-sm text-muted-foreground">Perplexity Queries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">89</div>
              <div className="text-sm text-muted-foreground">Gemini Requests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">12</div>
              <div className="text-sm text-muted-foreground">MCP Calls</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
