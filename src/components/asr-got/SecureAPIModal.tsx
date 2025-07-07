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
    gemini: existingCredentials?.gemini || ''
  });
  
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<{
    gemini: 'pending' | 'success' | 'error';
  }>({
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

  const validateGeminiAPI = async (apiKey: string): Promise<boolean> => {
    try {
      const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent', {
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
    if (!credentials.gemini) {
      toast.error('Please enter Gemini API key');
      return;
    }

    setIsValidating(true);
    setValidationResults({ gemini: 'pending' });

    try {
      const geminiValid = await validateGeminiAPI(credentials.gemini);

      setValidationResults({
        gemini: geminiValid ? 'success' : 'error'
      });

      if (geminiValid) {
        toast.success('Gemini API connection validated successfully!');
      } else {
        toast.error('Gemini API connection failed validation');
      }
    } catch (error) {
      toast.error('Connection validation failed');
      setValidationResults({ gemini: 'error' });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveCredentials = () => {
    if (!credentials.gemini) {
      toast.error('Please enter Gemini API key');
      return;
    }

    // Validate API key format
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
              <strong>ASR-GoT now uses only Gemini:</strong> Enhanced with web search capabilities 
              for comprehensive research analysis and reasoning.
            </AlertDescription>
          </Alert>

          {/* API Configuration Card */}
          <Card className="card-gradient">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Database className="h-5 w-5 text-blue-500" />
                Gemini 2.0 Flash
                {getValidationIcon(validationResults.gemini)}
              </CardTitle>
              <CardDescription>
                Advanced reasoning with web search and code execution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor="gemini-key">API Key (GEMINI_API_TOKEN)</Label>
                <Input
                  id="gemini-key"
                  type="password"
                  placeholder="AIza..."
                  value={credentials.gemini}
                  onChange={(e) => setCredentials(prev => ({ ...prev, gemini: e.target.value }))}
                  className="font-mono"
                />
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge variant="outline" className="text-xs">gemini-2.0-flash-exp</Badge>
                  <span>with web search & code execution</span>
                </div>
              </div>
            </CardContent>
          </Card>

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
              disabled={!credentials.gemini || isValidating}
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
                  Test Connection
                </>
              )}
            </Button>
            <Button 
              onClick={handleSaveCredentials}
              disabled={!credentials.gemini}
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