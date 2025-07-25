// Registration Form Component
// Provides user registration interface with enhanced backend integration

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthContext } from '@/contexts/AuthContext'
import { Loader2, Eye, EyeOff, Check, Github, Chrome, Microsoft } from 'lucide-react'

interface RegisterFormProps {
  onSuccess?: () => void
  onSwitchToLogin?: () => void
  className?: string
}

export function RegisterForm({ onSuccess, onSwitchToLogin, className = '' }: RegisterFormProps) {
  const { signUp, signInWithProvider } = useAuthContext()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    subscriptionTier: 'free' as 'free' | 'pro' | 'enterprise'
  })
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)

  const validatePassword = (password: string) => {
    const requirements = [
      { test: password.length >= 8, text: 'At least 8 characters' },
      { test: /[A-Z]/.test(password), text: 'One uppercase letter' },
      { test: /[a-z]/.test(password), text: 'One lowercase letter' },
      { test: /\d/.test(password), text: 'One number' }
    ]
    return requirements
  }

  const passwordRequirements = validatePassword(formData.password)
  const isPasswordValid = passwordRequirements.every(req => req.test)
  const passwordsMatch = formData.password === formData.confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isPasswordValid) {
      setError('Password does not meet requirements')
      return
    }

    if (!passwordsMatch) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      // Register the user using AuthContext
      const result = await signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        researchInterests: [],
        expertiseAreas: [],
        institution: ''
      })
      
      if (!result.success) {
        setError(result.error || 'Registration failed')
        return
      }
      
      // Show success message instead of immediately calling onSuccess
      setRegistrationSuccess(true)
    } catch (err: any) {
      setError(err.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSubscriptionChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      subscriptionTier: value as 'free' | 'pro' | 'enterprise'
    }))
  }

  const handleOAuthSignIn = async (provider: 'google' | 'github' | 'microsoft') => {
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
    <Card className={`w-full max-w-md mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="text-center">Create ASR-GoT Account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {registrationSuccess && (
            <Alert className="border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Registration successful! Please check your email ({formData.email}) for a confirmation link to activate your account. 
                Once confirmed, you can sign in to access the ASR-GoT platform.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <label htmlFor="fullName" className="text-sm font-medium">
              Full Name
            </label>
            <Input
              id="fullName"
              name="fullName"
              type="text"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="Enter your full name"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
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
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <div className="relative">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleChange}
                placeholder="Create a password"
                required
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
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
            
            {formData.password && (
              <div className="text-xs space-y-1">
                {passwordRequirements.map((req, index) => (
                  <div key={index} className={`flex items-center space-x-2 ${
                    req.test ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    <Check className={`h-3 w-3 ${req.test ? 'opacity-100' : 'opacity-30'}`} />
                    <span>{req.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium">
              Confirm Password
            </label>
            <div className="relative">
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your password"
                required
                disabled={loading}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={loading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {formData.confirmPassword && (
              <div className={`text-xs flex items-center space-x-2 ${
                passwordsMatch ? 'text-green-600' : 'text-red-500'
              }`}>
                <Check className={`h-3 w-3 ${passwordsMatch ? 'opacity-100' : 'opacity-30'}`} />
                <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="subscriptionTier" className="text-sm font-medium">
              Subscription Plan
            </label>
            <Select 
              value={formData.subscriptionTier} 
              onValueChange={handleSubscriptionChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">
                  <div className="flex flex-col">
                    <span className="font-medium">Free</span>
                    <span className="text-sm text-gray-500">1,000 API calls/month</span>
                  </div>
                </SelectItem>
                <SelectItem value="pro">
                  <div className="flex flex-col">
                    <span className="font-medium">Pro</span>
                    <span className="text-sm text-gray-500">10,000 API calls/month</span>
                  </div>
                </SelectItem>
                <SelectItem value="enterprise">
                  <div className="flex flex-col">
                    <span className="font-medium">Enterprise</span>
                    <span className="text-sm text-gray-500">100,000 API calls/month</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !isPasswordValid || !passwordsMatch}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              'Create Account'
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

            <div className="grid grid-cols-3 gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleOAuthSignIn('google')}
                disabled={loading || oauthLoading !== null}
              >
                {oauthLoading === 'google' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Chrome className="h-4 w-4" />
                )}
                <span className="sr-only">Sign up with Google</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleOAuthSignIn('github')}
                disabled={loading || oauthLoading !== null}
              >
                {oauthLoading === 'github' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Github className="h-4 w-4" />
                )}
                <span className="sr-only">Sign up with GitHub</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => handleOAuthSignIn('microsoft')}
                disabled={loading || oauthLoading !== null}
              >
                {oauthLoading === 'microsoft' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Microsoft className="h-4 w-4" />
                )}
                <span className="sr-only">Sign up with Microsoft</span>
              </Button>
            </div>
          </div>

          <div className="text-center space-y-2">
            <Button
              type="button"
              variant="link"
              className="text-sm"
              onClick={onSwitchToLogin}
            >
              Already have an account? Sign in
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}