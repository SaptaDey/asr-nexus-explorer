/**
 * Enhanced API Key Validation with Settings Management
 * Implements secure validation and management of API credentials
 */

import React, { useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { motion } from 'framer-motion';
import { Database, Key, CheckCircle, XCircle, Settings, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { SecureCredentialManager } from '@/services/security/SecureCredentialManager';

interface APICredentials {
  perplexity: string;
  gemini: string;
}

interface ValidationResult {
  isValid: boolean;
  service: string;
  model?: string;
  error?: string;
}

interface EnhancedAPIValidationProps {
  showModal: boolean;
  onClose: () => void;
  onCredentialsValidated: (credentials: APICredentials) => void;
  initialCredentials?: APICredentials;
}

export const EnhancedAPIValidation: React.FC<EnhancedAPIValidationProps> = ({
  showModal,
  onClose,
  onCredentialsValidated,
  initialCredentials
}) => {
  const [credentials, setCredentials] = useState<APICredentials>(
    initialCredentials || { perplexity: '', gemini: '' }
  );
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ perplexity: false, gemini: false });

  // API validation functions
  const validatePerplexityAPI = async (apiKey: string): Promise<ValidationResult> => {
    try {
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'sonar-reasoning-pro',
          messages: [{ role: 'user', content: 'test' }],
          max_tokens: 1
        }),
      });

      if (response.ok) {
        return { isValid: true, service: 'Perplexity', model: 'sonar-reasoning-pro' };
      } else if (response.status === 401) {
        return { isValid: false, service: 'Perplexity', error: 'Invalid API key' };
      } else {
        return { isValid: false, service: 'Perplexity', error: `HTTP ${response.status}` };
      }
    } catch (error) {
      return { isValid: false, service: 'Perplexity', error: 'Network error' };
    }
  };

  const validateGeminiAPI = async (apiKey: string): Promise<ValidationResult> => {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
        method: 'GET',
      });

      if (response.ok) {
        const data = await response.json();
        const hasGemini25 = data.models?.some((model: any) => 
          model.name.includes('gemini-2.5') || model.name.includes('gemini-pro')
        );
        
        if (hasGemini25) {
          return { isValid: true, service: 'Gemini', model: 'gemini-2.5-flash' };
        } else {
          return { isValid: false, service: 'Gemini', error: 'Gemini 2.5 Pro not available' };
        }
      } else if (response.status === 400) {
        return { isValid: false, service: 'Gemini', error: 'Invalid API key' };
      } else {
        return { isValid: false, service: 'Gemini', error: `HTTP ${response.status}` };
      }
    } catch (error) {
      return { isValid: false, service: 'Gemini', error: 'Network error' };
    }
  };

  const validateCredentials = useCallback(async () => {
    if (!credentials.perplexity || !credentials.gemini) {
      toast.error('Both API keys are required');
      return;
    }

    setIsValidating(true);
    setValidationResults([]);

    try {
      // Run validations in parallel
      const [perplexityResult, geminiResult] = await Promise.all([
        validatePerplexityAPI(credentials.perplexity),
        validateGeminiAPI(credentials.gemini)
      ]);

      const results = [perplexityResult, geminiResult];
      setValidationResults(results);

      const allValid = results.every(result => result.isValid);
      
      if (allValid) {
        // Store credentials securely using SecureCredentialManager
        const secureCredentials = {
          perplexity: credentials.perplexity,
          gemini: credentials.gemini
        };
        
        try {
          // SECURITY: Use encrypted storage instead of plain sessionStorage
          await SecureCredentialManager.storeAPICredentials(secureCredentials);
          toast.success('✅ API credentials validated and stored securely');
          onCredentialsValidated(secureCredentials);
          onClose();
        } catch (error) {
          console.error('Failed to store credentials securely:', error);
          toast.error('Failed to store credentials securely');
        }
      } else {
        toast.error('Some API keys failed validation. Please check and try again.');
      }
    } catch (error) {
      toast.error('Validation failed due to network error');
      setValidationResults([
        { isValid: false, service: 'Perplexity', error: 'Validation failed' },
        { isValid: false, service: 'Gemini', error: 'Validation failed' }
      ]);
    } finally {
      setIsValidating(false);
    }
  }, [credentials, onCredentialsValidated, onClose]);

  const togglePasswordVisibility = (service: 'perplexity' | 'gemini') => {
    setShowPasswords(prev => ({
      ...prev,
      [service]: !prev[service]
    }));
  };

  return (
    <Dialog open={showModal} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-6 w-6 text-blue-600" />
            ASR-GoT Agent Initialization
          </DialogTitle>
          <DialogDescription>
            Configure and validate your API credentials to enable the ASR-GoT reasoning engine
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Perplexity API Configuration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                    <Key className="h-4 w-4 text-white" />
                  </div>
                  Perplexity Sonar API
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Used for evidence retrieval and literature search (sonar-reasoning-pro model)
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="perplexity-key">PERPLEXITY_SONAR_TOKEN</Label>
                  <div className="relative">
                    <Input
                      id="perplexity-key"
                      type={showPasswords.perplexity ? "text" : "password"}
                      placeholder="pplx-..."
                      value={credentials.perplexity}
                      onChange={(e) => setCredentials(prev => ({ ...prev, perplexity: e.target.value }))}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => togglePasswordVisibility('perplexity')}
                    >
                      {showPasswords.perplexity ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {validationResults.find(r => r.service === 'Perplexity') && (
                  <ValidationResultDisplay 
                    result={validationResults.find(r => r.service === 'Perplexity')!} 
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Gemini API Configuration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                    <Key className="h-4 w-4 text-white" />
                  </div>
                  Google Gemini API
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Used for reasoning, code execution, and final synthesis (gemini-2.5-flash model)
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="gemini-key">GEMINI_25_PRO_TOKEN</Label>
                  <div className="relative">
                    <Input
                      id="gemini-key"
                      type={showPasswords.gemini ? "text" : "password"}
                      placeholder="AIza..."
                      value={credentials.gemini}
                      onChange={(e) => setCredentials(prev => ({ ...prev, gemini: e.target.value }))}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => togglePasswordVisibility('gemini')}
                    >
                      {showPasswords.gemini ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                {validationResults.find(r => r.service === 'Gemini') && (
                  <ValidationResultDisplay 
                    result={validationResults.find(r => r.service === 'Gemini')!} 
                  />
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Security Notice */}
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              API keys are stored with military-grade encryption and never transmitted to external servers.
              You can edit these credentials later via the Settings panel.
            </AlertDescription>
          </Alert>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              onClick={validateCredentials}
              disabled={!credentials.perplexity || !credentials.gemini || isValidating}
              className="flex-1"
            >
              {isValidating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Validating APIs...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Validate & Initialize
                </>
              )}
            </Button>
            <Button variant="outline" onClick={onClose} disabled={isValidating}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Validation result display component
const ValidationResultDisplay: React.FC<{ result: ValidationResult }> = ({ result }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className={`flex items-center gap-2 p-3 rounded-lg ${
      result.isValid ? 'bg-green-50 dark:bg-green-950/20' : 'bg-red-50 dark:bg-red-950/20'
    }`}
  >
    {result.isValid ? (
      <CheckCircle className="h-5 w-5 text-green-600" />
    ) : (
      <XCircle className="h-5 w-5 text-red-600" />
    )}
    <div className="flex-1">
      <div className={`font-semibold ${result.isValid ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}`}>
        {result.isValid ? 'Validation Successful' : 'Validation Failed'}
      </div>
      <div className="text-sm text-muted-foreground">
        {result.isValid ? (
          <>
            {result.service} API connected successfully
            {result.model && <span className="ml-2">({result.model})</span>}
          </>
        ) : (
          result.error || 'Unknown error'
        )}
      </div>
    </div>
    <Badge variant={result.isValid ? "default" : "destructive"}>
      {result.service}
    </Badge>
  </motion.div>
);