// Registration Form Component
// Provides user registration interface with enhanced backend integration

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAuthContext } from '@/contexts/AuthContext'
import { Loader2, Eye, EyeOff, Check } from 'lucide-react'
import { GoogleIcon, GitHubIcon } from '@/components/icons/BrandIcons'

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
    console.log('RegisterForm: Starting registration process', formData.email)
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
      console.log('RegisterForm: Calling signUp')
      // Register the user using AuthContext
      const result = await signUp({
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        researchInterests: [],
        expertiseAreas: [],
        institution: ''
      })
      console.log('RegisterForm: signUp result:', result)
      
      if (!result.success) {
        console.error('RegisterForm: Registration failed:', result.error)
        setError(result.error || 'Registration failed')
        return
      }
      
      console.log('RegisterForm: Registration successful')
      // Show success message instead of immediately calling onSuccess
      setRegistrationSuccess(true)
    } catch (err: any) {
      console.error('RegisterForm: Caught error:', err)
      setError(err.message || 'Registration failed')
    } finally {
      console.log('RegisterForm: Setting loading to false')
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
    <Card className={`w-full max-w-md mx-auto shadow-xl border-0 ${className}`}>
      <CardHeader className="space-y-1 pb-6">
        <CardTitle className="text-2xl font-bold text-center bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          Create Your Account
        </CardTitle>
        <p className="text-center text-sm text-gray-600">
          Join the scientific research revolution
        </p>
      </CardHeader>
      <CardContent className="px-8 pb-8">
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
            <label htmlFor="fullName" className="text-sm font-medium text-gray-700">
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
              className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
            />
          </div>

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
                placeholder="Create a password"
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
            
            {formData.password && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                <div className="text-xs space-y-1.5">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className={`flex items-center space-x-2 transition-colors ${
                      req.test ? 'text-green-600' : 'text-gray-500'
                    }`}>
                      <Check className={`h-3 w-3 transition-opacity ${req.test ? 'opacity-100' : 'opacity-30'}`} />
                      <span>{req.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
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
                className="h-11 pr-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-500 hover:text-gray-700 transition-colors"
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
              <div className={`text-xs flex items-center space-x-2 mt-2 transition-colors ${
                passwordsMatch ? 'text-green-600' : 'text-red-500'
              }`}>
                <Check className={`h-3 w-3 transition-opacity ${passwordsMatch ? 'opacity-100' : 'opacity-30'}`} />
                <span>{passwordsMatch ? 'Passwords match' : 'Passwords do not match'}</span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="subscriptionTier" className="text-sm font-medium text-gray-700">
              Subscription Plan
            </label>
            <Select 
              value={formData.subscriptionTier} 
              onValueChange={handleSubscriptionChange}
              disabled={loading}
            >
              <SelectTrigger className="h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500 transition-colors">
                <SelectValue placeholder="Select a plan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">
                  <div className="flex flex-col py-1">
                    <span className="font-semibold">Free</span>
                    <span className="text-sm text-gray-600">1,000 API calls/month</span>
                  </div>
                </SelectItem>
                <SelectItem value="pro">
                  <div className="flex flex-col py-1">
                    <span className="font-semibold">Pro</span>
                    <span className="text-sm text-gray-600">10,000 API calls/month</span>
                  </div>
                </SelectItem>
                <SelectItem value="enterprise">
                  <div className="flex flex-col py-1">
                    <span className="font-semibold">Enterprise</span>
                    <span className="text-sm text-gray-600">100,000 API calls/month</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium transition-all duration-200 transform hover:scale-[1.02] disabled:transform-none"
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
              Already have an account?{' '}
              <Button
                type="button"
                variant="link"
                className="text-blue-600 hover:text-blue-700 font-medium p-0 h-auto transition-colors"
                onClick={onSwitchToLogin}
              >
                Sign in
              </Button>
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}