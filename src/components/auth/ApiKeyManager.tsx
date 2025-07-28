// API Key Manager Component
// Manages user API keys with secure backend storage

import React, { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { userService, type ApiKeyInfo } from '@/services/userService'
import { 
  Key, 
  Plus, 
  Trash2, 
  Eye, 
  EyeOff, 
  Shield, 
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink
} from 'lucide-react'

interface ApiKeyManagerProps {
  className?: string
}

export function ApiKeyManager({ className = '' }: ApiKeyManagerProps) {
  const [apiKeys, setApiKeys] = useState<ApiKeyInfo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [addKeyDialogOpen, setAddKeyDialogOpen] = useState(false)
  const [newKeyData, setNewKeyData] = useState({
    provider: '' as 'gemini' | 'perplexity' | '',
    apiKey: '',
    keyName: ''
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [savingKey, setSavingKey] = useState(false)

  useEffect(() => {
    loadApiKeys()
  }, [])

  const loadApiKeys = async () => {
    try {
      setLoading(true)
      setError(null)
      const { apiKeys: keys } = await userService.getApiKeys()
      setApiKeys(keys)
    } catch (err: any) {
      setError(err.message || 'Failed to load API keys')
    } finally {
      setLoading(false)
    }
  }

  const validateApiKey = (provider: string, apiKey: string): boolean => {
    if (!apiKey) return false
    
    switch (provider) {
      case 'gemini':
        return apiKey.startsWith('AIza') && apiKey.length > 20
      case 'perplexity':
        return apiKey.startsWith('pplx-') && apiKey.length > 20
      default:
        return false
    }
  }

  const handleAddApiKey = async () => {
    if (!newKeyData.provider || !newKeyData.apiKey) {
      setError('Provider and API key are required')
      return
    }

    // Client-side validation for faster feedback
    if (!validateApiKey(newKeyData.provider, newKeyData.apiKey)) {
      const expectedFormat = newKeyData.provider === 'gemini' ? 'AIza...' : 'pplx-...'
      setError(`Invalid API key format. ${newKeyData.provider} keys should start with "${expectedFormat}"`)
      return
    }

    try {
      setSavingKey(true)
      setError(null)
      
      await userService.addApiKey(
        newKeyData.provider,
        newKeyData.apiKey,
        newKeyData.keyName || undefined
      )
      
      // Reset form and close dialog
      setNewKeyData({ provider: '', apiKey: '', keyName: '' })
      setAddKeyDialogOpen(false)
      
      // Reload keys
      await loadApiKeys()
    } catch (err: any) {
      setError(err.message || 'Failed to add API key')
    } finally {
      setSavingKey(false)
    }
  }

  const handleDeleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
      return
    }

    try {
      setError(null)
      await userService.deleteApiKey(keyId)
      await loadApiKeys()
    } catch (err: any) {
      setError(err.message || 'Failed to delete API key')
    }
  }

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'gemini':
        return '🧠'
      case 'perplexity':
        return '🔍'
      default:
        return '🔑'
    }
  }

  const getProviderColor = (provider: string) => {
    switch (provider) {
      case 'gemini':
        return 'bg-blue-100 text-blue-800'
      case 'perplexity':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return '••••••••'
    return key.substring(0, 4) + '••••••••' + key.substring(key.length - 4)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">API Key Management</h2>
          <p className="text-gray-600 mt-1">
            Securely store and manage your AI service API keys
          </p>
        </div>
        <Dialog open={addKeyDialogOpen} onOpenChange={setAddKeyDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New API Key</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Provider</label>
                <Select 
                  value={newKeyData.provider} 
                  onValueChange={(value) => setNewKeyData(prev => ({ ...prev, provider: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select AI provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gemini">
                      <div className="flex items-center space-x-2">
                        <span>🧠</span>
                        <span>Google Gemini</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="perplexity">
                      <div className="flex items-center space-x-2">
                        <span>🔍</span>
                        <span>Perplexity Sonar</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">API Key</label>
                <div className="relative">
                  <Input
                    type={showApiKey ? 'text' : 'password'}
                    value={newKeyData.apiKey}
                    onChange={(e) => setNewKeyData(prev => ({ ...prev, apiKey: e.target.value }))}
                    placeholder="Enter your API key"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Key Name (Optional)</label>
                <Input
                  value={newKeyData.keyName}
                  onChange={(e) => setNewKeyData(prev => ({ ...prev, keyName: e.target.value }))}
                  placeholder="e.g., Research Project Key"
                />
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Your API keys are encrypted and stored securely on our servers.
                  They are never transmitted in plain text.
                </AlertDescription>
              </Alert>

              {error && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="flex space-x-2">
                <Button 
                  onClick={handleAddApiKey} 
                  disabled={savingKey || !newKeyData.provider || !newKeyData.apiKey}
                  className="flex-1"
                >
                  {savingKey ? 'Saving...' : 'Save API Key'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setAddKeyDialogOpen(false)}
                  disabled={savingKey}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Security Statement & API Key Help */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Security Assurance */}
        <Alert className="border-green-200 bg-green-50">
          <Shield className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>🔒 Secure Storage:</strong> Your API keys are encrypted and stored securely on our servers. 
            They are never shared with third parties and are only used to make API requests on your behalf.
          </AlertDescription>
        </Alert>

        {/* API Key Help */}
        <Card className="border-blue-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Key className="h-4 w-4" />
              Get Your API Keys
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>
              <strong>🧠 Gemini API:</strong> 
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline ml-1 flex items-center gap-1"
              >
                Get from Google AI Studio <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div>
              <strong>🔍 Perplexity:</strong> 
              <a 
                href="https://www.perplexity.ai/settings/api" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline ml-1 flex items-center gap-1"
              >
                Get from Perplexity Settings <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* API Keys List */}
      <div className="space-y-4">
        {apiKeys.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Key className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No API Keys</h3>
              <p className="text-gray-600 text-center mb-4">
                Add your AI service API keys to enable automatic API calls through our secure proxy.
              </p>
              <Button onClick={() => setAddKeyDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First API Key
              </Button>
            </CardContent>
          </Card>
        ) : (
          apiKeys.map((key) => (
            <Card key={key.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-2xl">
                      {getProviderIcon(key.provider)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium">{key.key_name}</h3>
                        <Badge className={getProviderColor(key.provider)}>
                          {key.provider}
                        </Badge>
                        {key.is_active ? (
                          <Badge variant="outline" className="text-green-600 border-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-500 border-gray-500">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div className="flex items-center space-x-4">
                          <span className="flex items-center space-x-1">
                            <Key className="h-3 w-3" />
                            <span>Added {formatDate(key.created_at)}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>Last used {formatDate(key.last_used)}</span>
                          </span>
                          <span>{key.usage_count} calls</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteApiKey(key.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Security Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Security Notice:</strong> Your API keys are encrypted using industry-standard encryption
          and stored securely. Our proxy service uses these keys to make API calls on your behalf without
          exposing them to the client-side application. You can delete any key at any time.
        </AlertDescription>
      </Alert>
    </div>
  )
}