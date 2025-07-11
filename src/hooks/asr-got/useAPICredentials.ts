// API Credentials Management
import { useState, useCallback, useEffect } from 'react';
import { APICredentials } from '@/types/asrGotTypes';
import { loadApiKeysFromStorage, saveApiKeysToStorage } from '@/utils/asrGotUtils';
import { toast } from "sonner";

export const useAPICredentials = () => {
  const [apiKeys, setApiKeys] = useState<APICredentials>({ gemini: '', perplexity: '' });

  // Load cached credentials on mount
  useEffect(() => {
    // First try to load from environment variables
    const envGemini = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.Gemini_API_Key;
    const envPerplexity = import.meta.env.VITE_PERPLEXITY_API_KEY || import.meta.env.Perplexity_API_Key;
    
    if (envGemini || envPerplexity) {
      const envCredentials: APICredentials = {
        gemini: envGemini || '',
        perplexity: envPerplexity || ''
      };
      setApiKeys(envCredentials);
      // Save to storage for consistency
      if (envGemini && envPerplexity) {
        saveApiKeysToStorage(envCredentials);
        toast.success('API credentials loaded from environment variables');
      }
    } else {
      // Fallback to cached credentials
      const credentials = loadApiKeysFromStorage();
      setApiKeys(credentials);
    }
  }, []);

  const updateApiKeys = useCallback((newKeys: APICredentials) => {
    setApiKeys(newKeys);
    saveApiKeysToStorage(newKeys);
    toast.success('API credentials cached securely');
  }, []);

  return {
    apiKeys,
    updateApiKeys,
    hasValidKeys: Boolean(apiKeys.gemini),
    hasPerplexityKey: Boolean(apiKeys.perplexity)
  };
};