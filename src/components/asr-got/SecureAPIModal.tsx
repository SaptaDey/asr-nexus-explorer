import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Key, CheckCircle, AlertTriangle, Zap, Database } from 'lucide-react';
import { toast } from 'sonner';
import { APICredentials } from '@/types/asrGotTypes';
import { validateAPIKey, encryptCredentials, decryptCredentials } from '@/utils/securityUtils';

interface SecureAPIModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCredentialsSave: (credentials: APICredentials) => void;
  existingCredentials?: APICredentials;
}

export const SecureAPIModal: React.FC<SecureAPIModalProps> = ({
  open,
  onOpenChange,
  onCredentialsSave,
  existingCredentials
}) => {
  const [credentials, setCredentials] = useState<APICredentials>({
    perplexity: existingCredentials?.perplexity || '',
    gemini: existingCredentials?.gemini || '',
    mcp_servers: existingCredentials?.mcp_servers || []
  });
  
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    perplexity: 'pending' | 'success' | 'error';
    gemini: 'pending' | 'success' | 'error';
  }>({
    perplexity: 'pending',
    gemini: 'pending'
  });

  useEffect(() => {
    // Load from encrypted session storage on mount
    const encryptedCredentials = sessionStorage.getItem('asr-got-credentials-encrypted');
    if (encryptedCredentials) {
      try {
        const decrypted = decryptCredentials(encryptedCredentials);
        const parsed = JSON.parse(decrypted);
        setCredentials(parsed);
      } catch (error) {
        console.warn('Failed to decrypt stored credentials');
        // Clear invalid credentials
        sessionStorage.removeItem('asr-got-credentials-encrypted');
      }
    }
  }, []);

  const validatePerplexityAPI = async (apiKey: string): Promise<boolean> => {
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar-reasoning-pro',
          messages: [{ role: 'user', content: 'Test connection' }],
          max_tokens: 10
        }),
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const validateGeminiAPI = async (apiKey: string): Promise<boolean> => {
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent', {
        method: 'POST',
        headers: {
          'x-goog-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: 'Test connection' }] }],
          generationConfig: { maxOutputTokens: 10 }
        }),
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const handleValidateConnections = async () => {
    if (!credentials.perplexity || !credentials.gemini) {
      toast.error('Please enter both API keys');
      return;
    }

    setIsValidating(true);
    setValidationResults({ perplexity: 'pending', gemini: 'pending' });

    try {
      const [perplexityValid, geminiValid] = await Promise.all([
        validatePerplexityAPI(credentials.perplexity),
        validateGeminiAPI(credentials.gemini)
      ]);

      setValidationResults({
        perplexity: perplexityValid ? 'success' : 'error',
        gemini: geminiValid ? 'success' : 'error'
      });

      if (perplexityValid && geminiValid) {
        toast.success('All API connections validated successfully!');
      } else {
        toast.error('One or more API connections failed validation');
      }
    } catch (error) {
      toast.error('Connection validation failed');
      setValidationResults({ perplexity: 'error', gemini: 'error' });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveCredentials = () => {
    if (!credentials.perplexity || !credentials.gemini) {
      toast.error('Please enter both API keys');
      return;
    }

    // Validate API key formats
    if (!validateAPIKey(credentials.perplexity, 'perplexity')) {
      toast.error('Invalid Perplexity API key format');
      return;
    }

    if (!validateAPIKey(credentials.gemini, 'gemini')) {
      toast.error('Invalid Gemini API key format');
      return;
    }

    try {
      // Encrypt and store credentials
      const encrypted = encryptCredentials(JSON.stringify(credentials));
      sessionStorage.setItem('asr-got-credentials-encrypted', encrypted);
      
      // Cache timestamp securely (ASR-GoT requirement)
      const timestamp = new Date().toISOString();
      localStorage.setItem('asr-got-auth-timestamp', timestamp);
      
      // Clear any old unencrypted credentials
      sessionStorage.removeItem('asr-got-credentials');
      
      onCredentialsSave(credentials);
      onOpenChange(false);
      toast.success('ASR-GoT credentials cached securely with encryption');
    } catch (error) {
      toast.error('Failed to encrypt and save credentials');
    }
  };

  const getValidationIcon = (status: 'pending' | 'success' | 'error') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="card-gradient max-w-2xl">
        <DialogHeader>
          <DialogTitle className="gradient-text flex items-center gap-2 text-2xl">
            <Shield className="h-6 w-6" />
            ASR-GoT Secure Initialization
          </DialogTitle>
          <DialogDescription className="text-base">
            Configure your AI API credentials for the Advanced Scientific Reasoning framework.
            All credentials are stored securely in session storage as per ASR-GoT protocol.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* API Requirements Alert */}
          <Alert className="border-purple-200 bg-purple-50">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>ASR-GoT requires both APIs:</strong> Perplexity Sonar for evidence integration 
              and Gemini 2.5 Pro for advanced reasoning and code execution.
            </AlertDescription>
          </Alert>

          {/* API Configuration Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="card-gradient">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Zap className="h-5 w-5 text-orange-500" />
                  Perplexity Sonar
                  {getValidationIcon(validationResults.perplexity)}
                </CardTitle>
                <CardDescription>
                  Real-time search and evidence integration engine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="perplexity-key">API Token (PERPLEXITY_SONAR_TOKEN)</Label>
                  <Input
                    id="perplexity-key"
                    type="password"
                    placeholder="pplx-..."
                    value={credentials.perplexity}
                    onChange={(e) => setCredentials(prev => ({ ...prev, perplexity: e.target.value }))}
                    className="font-mono"
                  />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className="text-xs">sonar-reasoning-pro</Badge>
                    <span>model required</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-gradient">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Database className="h-5 w-5 text-blue-500" />
                  Gemini 2.5 Pro
                  {getValidationIcon(validationResults.gemini)}
                </CardTitle>
                <CardDescription>
                  Multimodal reasoning and code execution engine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Label htmlFor="gemini-key">API Key (GEMINI_25_PRO_TOKEN)</Label>
                  <Input
                    id="gemini-key"
                    type="password"
                    placeholder="AIza..."
                    value={credentials.gemini}
                    onChange={(e) => setCredentials(prev => ({ ...prev, gemini: e.target.value }))}
                    className="font-mono"
                  />
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline" className="text-xs">gemini-2.5-pro</Badge>
                    <span>with code execution</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Security Information */}
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-semibold text-green-800">Secure Storage Protocol</h4>
                  <p className="text-sm text-green-700">
                    Credentials are cached in session storage with timestamp validation. 
                    They are never transmitted except directly to the respective AI APIs.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={handleValidateConnections} 
              disabled={!credentials.perplexity || !credentials.gemini || isValidating}
              variant="outline" 
              className="flex-1"
            >
              {isValidating ? (
                <>
                  <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                  Validating...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  Test Connections
                </>
              )}
            </Button>
            <Button 
              onClick={handleSaveCredentials}
              disabled={!credentials.perplexity || !credentials.gemini}
              className="gradient-bg flex-1"
            >
              <Shield className="h-4 w-4 mr-2" />
              Initialize ASR-GoT
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};