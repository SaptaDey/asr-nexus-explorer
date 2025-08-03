// Login Form Component
// Provides user login interface with enhanced backend integration

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuthContext } from '@/contexts/AuthContext'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { GoogleIcon, GitHubIcon } from '@/components/icons/BrandIcons'

interface LoginFormProps {
  onSuccess?: () => void
  onSwitchToRegister?: () => void
  className?: string
}

export function LoginForm({ onSuccess, onSwitchToRegister, className = '' }: LoginFormProps) {
  const { signIn, signInWithProvider } = useAuthContext()
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log('LoginForm: Starting login process', formData.email)
    setError(null)
    setLoading(true)

    try {
      console.log('LoginForm: Calling signIn')
      const result = await signIn(formData)
      console.log('LoginForm: signIn result:', result)
      
      if (!result.success) {
        console.error('LoginForm: Login failed:', result.error)
        setError(result.error || 'Login failed')
        return
      }
      
      console.log('LoginForm: Login successful, calling onSuccess')
      onSuccess?.()
    } catch (err: any) {
      console.error('LoginForm: Caught error:', err)
      setError(err.message || 'Login failed')
    } finally {
      console.log('LoginForm: Setting loading to false')
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleOAuthSignIn = async (provider: 'google' | 'github') => {
    setError(null)
    setOauthLoading(provider)

    try {
      const result = await signInWithProvider(provider)
      
      if (!result.success) {
        setError(result.error || `${provider} sign-in failed`)
        return
      }
      
      // OAuth redirects to dashboard, so onSuccess may not be called
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || `${provider} sign-in failed`)
    } finally {
      setOauthLoading(null)
    }
  }

  return (
    <Card className={`w-full max-w-md mx-auto shadow-xl border-0 ${className}`}>
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Welcome Back
        </CardTitle>
        <p className="text-center text-sm text-gray-600">
          Sign in to continue your research journey
        </p>
      </CardHeader>
      <CardContent className="px-8 pb-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
              disabled={loading}
              className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                required
                disabled={loading}
                className="h-11 pr-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-500 hover:text-gray-700 transition-colors"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium transition-all duration-200 transform hover:scale-[1.02]"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </Button>

          {/* OAuth Providers */}
          <div className="space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full h-11 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2 group"
                onClick={() => handleOAuthSignIn('google')}
                disabled={loading || oauthLoading !== null}
              >
                {oauthLoading === 'google' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <GoogleIcon className="h-5 w-5" />
                    <span className="text-gray-700 font-medium">Google</span>
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full h-11 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 flex items-center justify-center gap-2 group"
                onClick={() => handleOAuthSignIn('github')}
                disabled={loading || oauthLoading !== null}
              >
                {oauthLoading === 'github' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <>
                    <GitHubIcon className="h-5 w-5 text-gray-800 group-hover:text-gray-900" />
                    <span className="text-gray-700 font-medium">GitHub</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Button
                type="button"
                variant="link"
                className="text-blue-600 hover:text-blue-700 font-medium p-0 h-auto transition-colors"
                onClick={onSwitchToRegister}
              >
                Sign up
              </Button>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}