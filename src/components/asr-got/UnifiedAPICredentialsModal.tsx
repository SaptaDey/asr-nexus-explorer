import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Key, CheckCircle, AlertTriangle, Zap, Database, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { APICredentials } from '@/types/asrGotTypes';

interface UnifiedAPICredentialsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCredentialsSave: (credentials: APICredentials) => void;
  existingCredentials?: APICredentials;
}

export const UnifiedAPICredentialsModal: React.FC<UnifiedAPICredentialsModalProps> = ({
  open,
  onOpenChange,
  onCredentialsSave,
  existingCredentials
}) => {
  const [credentials, setCredentials] = useState<APICredentials>({
    gemini: existingCredentials?.gemini || '',
    perplexity: existingCredentials?.perplexity || ''
  });
  
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    gemini: 'pending' | 'success' | 'error';
    perplexity: 'pending' | 'success' | 'error';
  }>({
    gemini: 'pending',
    perplexity: 'pending'
  });

  useEffect(() => {
    if (existingCredentials) {
      setCredentials(existingCredentials);
      // Set validation status based on existing keys
      setValidationResults({
        gemini: existingCredentials.gemini ? 'success' : 'pending',
        perplexity: existingCredentials.perplexity ? 'success' : 'pending'
      });
    }
  }, [existingCredentials]);

  const validateGeminiKey = async (apiKey: string): Promise<boolean> => {
    if (!apiKey || !apiKey.startsWith('AIza')) {
      return false;
    }
    
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const validatePerplexityKey = async (apiKey: string): Promise<boolean> => {
    if (!apiKey || !apiKey.startsWith('pplx-')) {
      return false;
    }
    
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar-deep-research',
          messages: [{ role: 'user', content: 'Test' }],
          max_tokens: 1
        })
      });
      return response.status !== 401; // Any status except unauthorized means key is valid
    } catch (error) {
      return false;
    }
  };

  const handleValidate = async () => {
    setIsValidating(true);
    
    const geminiValid = credentials.gemini ? await validateGeminiKey(credentials.gemini) : false;
    const perplexityValid = credentials.perplexity ? await validatePerplexityKey(credentials.perplexity) : false;
    
    setValidationResults({
      gemini: geminiValid ? 'success' : 'error',
      perplexity: perplexityValid ? 'success' : 'error'
    });
    
    setIsValidating(false);
    
    if (geminiValid && perplexityValid) {
      toast.success('Both API keys validated successfully!');
    } else if (geminiValid || perplexityValid) {
      toast.success('Some API keys validated successfully!');
    } else {
      toast.error('API key validation failed. Please check your keys.');
    }
  };

  const handleSave = () => {
    if (!credentials.gemini && !credentials.perplexity) {
      toast.error('Please provide at least one API key');
      return;
    }
    
    onCredentialsSave(credentials);
    toast.success('API credentials saved successfully!');
    onOpenChange(false);
  };

  const getStatusIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Key className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Invalid</Badge>;
      default:
        return <Badge variant="secondary">Not Set</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            <DialogTitle>API Credentials Configuration</DialogTitle>
          </div>
          <DialogDescription>
            Configure your API keys for Gemini and Perplexity Sonar services. Both are required for full ASR-GoT functionality.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="gemini" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gemini" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Gemini API
              {getStatusIcon(validationResults.gemini)}
            </TabsTrigger>
            <TabsTrigger value="perplexity" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Perplexity Sonar
              {getStatusIcon(validationResults.perplexity)}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="gemini" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Google Gemini API
                    </CardTitle>
                    <CardDescription>
                      Required for advanced reasoning, code execution, and structured outputs
                    </CardDescription>
                  </div>
                  {getStatusBadge(validationResults.gemini)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="gemini-key">API Key</Label>
                  <Input
                    id="gemini-key"
                    type="password"
                    placeholder="AIza..."
                    value={credentials.gemini}
                    onChange={(e) => setCredentials(prev => ({ ...prev, gemini: e.target.value }))}
                  />
                </div>
                
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Get your API key from{' '}
                    <a 
                      href="https://aistudio.google.com/app/apikey" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      Google AI Studio <ExternalLink className="h-3 w-3" />
                    </a>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="perplexity" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="h-5 w-5" />
                      Perplexity Sonar Deep Research
                    </CardTitle>
                    <CardDescription>
                      Required for real-time web search and evidence harvesting
                    </CardDescription>
                  </div>
                  {getStatusBadge(validationResults.perplexity)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="perplexity-key">API Key</Label>
                  <Input
                    id="perplexity-key"
                    type="password"
                    placeholder="pplx-..."
                    value={credentials.perplexity}
                    onChange={(e) => setCredentials(prev => ({ ...prev, perplexity: e.target.value }))}
                  />
                </div>
                
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Get your API key from{' '}
                    <a 
                      href="https://www.perplexity.ai/settings/api" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      Perplexity Settings <ExternalLink className="h-3 w-3" />
                    </a>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="flex gap-3 pt-4">
          <Button
            onClick={handleValidate}
            disabled={isValidating || (!credentials.gemini && !credentials.perplexity)}
            variant="outline"
            className="flex-1"
          >
            {isValidating ? 'Validating...' : 'Validate Keys'}
          </Button>
          <Button
            onClick={handleSave}
            disabled={!credentials.gemini && !credentials.perplexity}
            className="flex-1"
          >
            Save Configuration
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};