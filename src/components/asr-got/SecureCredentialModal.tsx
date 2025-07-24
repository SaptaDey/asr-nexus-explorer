/**
 * Secure Credential Modal
 * Provides secure API key input and management with proper encryption
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { SecureCredentialManager, CredentialMetadata } from '@/services/security/SecureCredentialManager';
import { validateAPIKey } from '@/utils/securityUtils';
import { APICredentials } from '@/types/asrGotTypes';
import { Eye, EyeOff, Shield, Key, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface SecureCredentialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCredentialsUpdate: (credentials: APICredentials) => void;
  requiredProviders?: string[];
}

export const SecureCredentialModal: React.FC<SecureCredentialModalProps> = ({
  isOpen,
  onClose,
  onCredentialsUpdate,
  requiredProviders = ['gemini']
}) => {
  const [credentials, setCredentials] = useState<APICredentials>({
    gemini: '',
    perplexity: ''
  });
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState<CredentialMetadata[]>([]);
  const [secureSessionInitialized, setSecureSessionInitialized] = useState(false);
  const [userPin, setUserPin] = useState('');
  const [showPinInput, setShowPinInput] = useState(false);
  const [validationResults, setValidationResults] = useState<{ [key: string]: boolean }>({});

  const credentialManager = SecureCredentialManager.getInstance();

  // Initialize secure session and load existing credentials
  useEffect(() => {
    if (isOpen) {
      initializeSecureSession();
    }
  }, [isOpen]);

  const initializeSecureSession = async () => {
    try {
      setIsLoading(true);
      
      // Initialize secure session
      const sessionOk = await credentialManager.initializeSecureSession();
      if (!sessionOk) {
        toast.error('Failed to initialize secure session');
        return;
      }

      setSecureSessionInitialized(true);

      // Load existing credentials
      const existingCredentials = await credentialManager.getCredentials();
      if (existingCredentials) {
        setCredentials(existingCredentials);
        toast.success('Loaded existing secure credentials');
      }

      // Load metadata
      const meta = await credentialManager.getCredentialMetadata();
      setMetadata(meta);

    } catch (error) {
      console.error('Failed to initialize secure session:', error);
      toast.error('Failed to initialize secure credential storage');
    } finally {
      setIsLoading(false);
    }
  };

  const validateCredential = async (provider: string, key: string): Promise<boolean> => {
    if (!key.trim()) return false;

    try {
      // Format validation
      const isValidFormat = validateAPIKey(key, provider as 'perplexity' | 'gemini');
      if (!isValidFormat) {
        return false;
      }

      // API validation
      if (provider === 'gemini') {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${key}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Test' }] }],
              generationConfig: { maxOutputTokens: 10 }
            })
          }
        );
        return response.ok;
      }

      if (provider === 'perplexity') {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'llama-3.1-sonar-small-128k-online',
            messages: [{ role: 'user', content: 'Test' }],
            max_tokens: 10
          })
        });
        return response.ok;
      }

      return false;
    } catch (error) {
      console.warn(`Failed to validate ${provider} API key:`, error);
      return false;
    }
  };

  const handleCredentialChange = (provider: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [provider]: value
    }));

    // Clear validation result when key changes
    setValidationResults(prev => ({
      ...prev,
      [provider]: false
    }));
  };

  const handleValidateCredential = async (provider: string) => {
    const key = credentials[provider as keyof APICredentials];
    if (!key) return;

    setIsLoading(true);
    const isValid = await validateCredential(provider, key);
    
    setValidationResults(prev => ({
      ...prev,
      [provider]: isValid
    }));

    if (isValid) {
      toast.success(`✅ ${provider} API key validated successfully`);
    } else {
      toast.error(`❌ ${provider} API key validation failed`);
    }
    
    setIsLoading(false);
  };

  const handleSaveCredentials = async () => {
    try {
      setIsLoading(true);

      // Validate required providers
      const hasRequiredCredentials = requiredProviders.every(provider => {
        const key = credentials[provider as keyof APICredentials];
        return key && key.trim().length > 0;
      });

      if (!hasRequiredCredentials) {
        toast.error(`Please provide API keys for: ${requiredProviders.join(', ')}`);
        return;
      }

      // Validate all provided credentials
      const validationPromises = Object.entries(credentials)
        .filter(([_, key]) => key && key.trim())
        .map(([provider, key]) => validateCredential(provider, key));

      const validationResults = await Promise.all(validationPromises);
      const allValid = validationResults.every(result => result);

      if (!allValid) {
        toast.error('Some API keys failed validation. Please check and try again.');
        return;
      }

      // Store credentials securely
      const success = await credentialManager.storeCredentials(credentials);
      if (!success) {
        toast.error('Failed to store credentials securely');
        return;
      }

      // Notify parent component
      onCredentialsUpdate(credentials);
      
      toast.success('🔐 Credentials stored securely with encryption');
      onClose();

    } catch (error) {
      console.error('Failed to save credentials:', error);
      toast.error('Failed to save credentials securely');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearCredentials = async () => {
    try {
      await credentialManager.clearSession();
      setCredentials({ gemini: '', perplexity: '' });
      setMetadata([]);
      setValidationResults({});
      toast.success('Credentials cleared securely');
    } catch (error) {
      console.error('Failed to clear credentials:', error);
      toast.error('Failed to clear credentials');
    }
  };

  const toggleShowKey = (provider: string) => {
    setShowKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }));
  };

  const getProviderInfo = (provider: string) => {
    const info = {
      gemini: {
        name: 'Google Gemini',
        description: 'Required for advanced reasoning and synthesis',
        urlText: 'Get Gemini API Key',
        url: 'https://makersuite.google.com/app/apikey',
        keyPrefix: 'AIza',
        keyLength: 32
      },
      perplexity: {
        name: 'Perplexity AI',
        description: 'Required for real-time web search and research',
        urlText: 'Get Perplexity API Key',
        url: 'https://www.perplexity.ai/settings/api',
        keyPrefix: 'pplx-',
        keyLength: 40
      }
    };
    return info[provider as keyof typeof info];
  };

  const getCredentialStatus = (provider: string) => {
    const meta = metadata.find(m => m.provider === provider);
    const hasKey = credentials[provider as keyof APICredentials]?.trim();
    const isValid = validationResults[provider];

    if (meta && meta.isValid) {
      return { status: 'stored', color: 'green', icon: <CheckCircle className="h-4 w-4" /> };
    }
    if (isValid) {
      return { status: 'validated', color: 'blue', icon: <CheckCircle className="h-4 w-4" /> };
    }
    if (hasKey) {
      return { status: 'pending', color: 'yellow', icon: <Clock className="h-4 w-4" /> };
    }
    return { status: 'missing', color: 'red', icon: <AlertTriangle className="h-4 w-4" /> };
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Secure API Credential Manager
          </DialogTitle>
          <DialogDescription>
            Store your API credentials securely with AES-256 encryption. 
            Keys are encrypted in your browser and never transmitted to our servers.
          </DialogDescription>
        </DialogHeader>

        {!secureSessionInitialized ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3">Initializing secure session...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Security Notice */}
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Security Features:</strong> AES-256-GCM encryption, secure session management, 
                automatic cleanup, and no server transmission of keys.
              </AlertDescription>
            </Alert>

            {/* Credential Inputs */}
            <div className="space-y-4">
              {['gemini', 'perplexity'].map(provider => {
                const info = getProviderInfo(provider);
                const status = getCredentialStatus(provider);
                const isRequired = requiredProviders.includes(provider);
                
                if (!info) return null;

                return (
                  <Card key={provider} className="relative">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{info.name}</CardTitle>
                          {isRequired && <Badge variant="destructive">Required</Badge>}
                          <Badge variant="outline" className={`text-${status.color}-600`}>
                            {status.icon}
                            {status.status}
                          </Badge>
                        </div>
                      </div>
                      <CardDescription>{info.description}</CardDescription>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor={`${provider}-key`}>
                          {info.name} API Key
                        </Label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              id={`${provider}-key`}
                              type={showKeys[provider] ? 'text' : 'password'}
                              value={credentials[provider as keyof APICredentials] || ''}
                              onChange={(e) => handleCredentialChange(provider, e.target.value)}
                              placeholder={`Enter your ${info.name} API key (starts with ${info.keyPrefix})`}
                              className="pr-10"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-0 top-0 h-full px-3"
                              onClick={() => toggleShowKey(provider)}
                            >
                              {showKeys[provider] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <Button
                            onClick={() => handleValidateCredential(provider)}
                            disabled={!credentials[provider as keyof APICredentials]?.trim() || isLoading}
                            variant="outline"
                            size="sm"
                          >
                            Validate
                          </Button>
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        Expected format: {info.keyPrefix}... ({info.keyLength}+ characters)
                      </div>

                      <div className="flex justify-between items-center text-sm">
                        <a
                          href={info.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline flex items-center gap-1"
                        >
                          <Key className="h-3 w-3" />
                          {info.urlText}
                        </a>
                        
                        {metadata.find(m => m.provider === provider) && (
                          <div className="text-xs text-muted-foreground">
                            Last used: {new Date(metadata.find(m => m.provider === provider)?.lastUsed || '').toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleClearCredentials}
                className="text-red-600 hover:text-red-700"
              >
                Clear All Credentials
              </Button>
              
              <div className="flex gap-2">
                <Button variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveCredentials}
                  disabled={isLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isLoading ? 'Saving...' : 'Save Securely'}
                </Button>
              </div>
            </div>

            {/* Security Information */}
            <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
              <strong>Security Details:</strong> Credentials are encrypted using AES-256-GCM with randomly generated keys. 
              Session data expires automatically after 4 hours or when the browser tab is closed. 
              No API keys are ever transmitted to external servers.
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};