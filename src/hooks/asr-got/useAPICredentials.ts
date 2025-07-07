// API Credentials Management
import { useState, useCallback, useEffect } from 'react';
import { APICredentials } from '@/types/asrGotTypes';
import { loadApiKeysFromStorage, saveApiKeysToStorage } from '@/utils/asrGotUtils';
import { toast } from "sonner";

export const useAPICredentials = () => {
  const [apiKeys, setApiKeys] = useState<APICredentials>({ gemini: '' });

  // Load cached credentials on mount
  useEffect(() => {
    const credentials = loadApiKeysFromStorage();
    setApiKeys(credentials);
  }, []);

  const updateApiKeys = useCallback((newKeys: APICredentials) => {
    setApiKeys(newKeys);
    saveApiKeysToStorage(newKeys);
    toast.success('API credentials cached securely');
  }, []);

  return {
    apiKeys,
    updateApiKeys,
    hasValidKeys: Boolean(apiKeys.gemini)
  };
};