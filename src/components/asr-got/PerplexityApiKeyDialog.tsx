/**
 * Perplexity API Key Dialog Component
 * Provides secure input for Perplexity API key required for Sonar Deep Research
 */

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, Key, Search, Database, Shield, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PerplexityApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApiKeySubmit: (apiKey: string) => void;
  currentApiKey?: string;
}

export const PerplexityApiKeyDialog: React.FC<PerplexityApiKeyDialogProps> = ({
  open,
  onOpenChange,
  onApiKeySubmit,
  currentApiKey
}) => {
  const [tempApiKey, setTempApiKey] = useState(currentApiKey || '');
  const [isValidating, setIsValidating] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!tempApiKey.trim()) {
      toast.error('Please enter a valid Perplexity API key');
      return;
    }

    if (!tempApiKey.startsWith('pplx-')) {
      toast.error('Perplexity API keys should start with "pplx-"');
      return;
    }

    setIsValidating(true);
    
    try {
      // Validate API key with a simple test call
      const response = await fetch('https://api.perplexity.ai/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tempApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'sonar-online',
          messages: [
            {
              role: 'user',
              content: 'Test connection'
            }
          ],
          max_tokens: 10,
          temperature: 0.1
        })
      });

      if (response.ok) {
        onApiKeySubmit(tempApiKey);
        onOpenChange(false);
        toast.success('✅ Perplexity API key validated and saved');
      } else {
        const errorData = await response.json();
        toast.error(`API key validation failed: ${errorData.error?.message || 'Invalid key'}`);
      }
    } catch (error) {
      console.error('API key validation error:', error);
      toast.error('Failed to validate API key. Please check your connection and try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleClose = () => {
    if (!isValidating) {
      onOpenChange(false);
      setTempApiKey(currentApiKey || '');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Search className="h-6 w-6 text-purple-600" />
            Perplexity API Key Required
            <Badge variant="outline" className="ml-2">
              Sonar Deep Research
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-600">
            To enable Sonar Deep Research for comprehensive literature review and evidence collection, 
            please provide your Perplexity API key.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Security Notice */}
          <Alert className="border-green-200 bg-green-50">
            <Shield className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <strong>Security:</strong> Your API key is stored locally in your browser and never transmitted to our servers.
            </AlertDescription>
          </Alert>

          {/* Features Enabled */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <Database className="h-4 w-4" />
              Features Enabled by Sonar Deep Research
            </h3>
            <ul className="space-y-1 text-sm text-blue-800">
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                Real-time web search and literature review
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                PubMed and arXiv academic database access
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                Comprehensive evidence collection (up to 1M tokens)
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                Structured citation generation with DOIs
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="h-3 w-3 text-green-600" />
                Cost-optimized research at $5 per 1000 queries
              </li>
            </ul>
          </div>

          {/* API Key Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="perplexity-api-key" className="text-sm font-medium">
                Perplexity API Key
              </Label>
              <div className="relative">
                <Key className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="perplexity-api-key"
                  type={showKey ? 'text' : 'password'}
                  placeholder="pplx-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  className="pl-10 pr-20 font-mono text-sm"
                  disabled={isValidating}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1 h-8 w-12 text-xs"
                  onClick={() => setShowKey(!showKey)}
                  disabled={isValidating}
                >
                  {showKey ? 'Hide' : 'Show'}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Your API key should start with "pplx-" and be 32+ characters long
              </p>
            </div>

            <div className="flex justify-between items-center pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isValidating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700"
                disabled={isValidating || !tempApiKey.trim()}
              >
                {isValidating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Validating...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Validate & Save
                  </>
                )}
              </Button>
            </div>
          </form>

          {/* Get API Key Link */}
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-2">
              Don't have a Perplexity API key yet?
            </p>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => window.open('https://docs.perplexity.ai/docs/getting-started', '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Get Perplexity API Key
            </Button>
          </div>

          {/* Cost Information */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Cost Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Input Cost</p>
                <p className="font-semibold">$1.00 per 1M tokens</p>
              </div>
              <div>
                <p className="text-gray-600">Output Cost</p>
                <p className="font-semibold">$1.00 per 1M tokens</p>
              </div>
              <div>
                <p className="text-gray-600">Search Cost</p>
                <p className="font-semibold">$5.00 per 1000 queries</p>
              </div>
              <div>
                <p className="text-gray-600">Estimated per Run</p>
                <p className="font-semibold text-purple-600">~$1.80</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};