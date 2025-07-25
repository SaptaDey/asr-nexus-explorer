// API Credentials Management - SECURE VERSION
import { useState, useCallback, useEffect } from 'react';
import { APICredentials } from '@/types/asrGotTypes';
import { SecureCredentialManager } from '@/utils/securityUtils';
import { toast } from "sonner";

export const useAPICredentials = () => {
  const [apiKeys, setApiKeys] = useState<APICredentials>({ gemini: '', perplexity: '' });

  // Load cached credentials on mount - SECURE
  useEffect(() => {
    const loadCredentials = async () => {
      try {
        const credentials = await SecureCredentialManager.getAPICredentials();
        if (credentials) {
          setApiKeys(credentials);
        }
      } catch (error) {
        console.error('Failed to load API credentials:', error);
        // Don't show error to user, just fail silently
      }
    };
    loadCredentials();
  }, []);

  const updateApiKeys = useCallback(async (newKeys: APICredentials) => {
    try {
      setApiKeys(newKeys);
      await SecureCredentialManager.storeAPICredentials(newKeys);
      toast.success('API credentials stored securely');
    } catch (error) {
      console.error('Failed to store API credentials:', error);
      toast.error('Failed to store credentials securely');
    }
  }, []);

  return {
    apiKeys,
    updateApiKeys,
    hasValidKeys: Boolean(apiKeys.gemini),
    hasPerplexityKey: Boolean(apiKeys.perplexity)
  };
};