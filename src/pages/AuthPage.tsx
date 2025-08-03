// Authentication Page
// Provides login and registration interface

import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthContext } from '@/contexts/AuthContext'
import { LoginForm } from '@/components/auth/LoginForm'
import { RegisterForm } from '@/components/auth/RegisterForm'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Brain, ArrowLeft, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, loading } = useAuthContext()
  const [emailConfirmed, setEmailConfirmed] = useState(false)

  // Check for redirect parameter
  const redirectTo = searchParams.get('redirect') || '/dashboard'
  
  // Check if user just confirmed their email
  const isConfirmed = searchParams.get('confirmed') === 'true'

  // Redirect if already authenticated
  useEffect(() => {
    if (user && !loading) {
      navigate(redirectTo)
    }
  }, [user, loading, navigate, redirectTo])

  // Set initial mode from URL parameter
  useEffect(() => {
    const authMode = searchParams.get('mode')
    if (authMode === 'register') {
      setMode('register')
    }
    
    // If user came from email confirmation, show success message and switch to login
    if (isConfirmed) {
      setEmailConfirmed(true)
      setMode('login')
    }
  }, [searchParams, isConfirmed])

  const handleAuthSuccess = () => {
    navigate(redirectTo)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 transition-colors group">
            <ArrowLeft className="h-5 w-5 group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium">Back to Home</span>
          </Link>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Brain className="h-10 w-10 text-blue-600" />
              <div className="absolute inset-0 bg-blue-600 opacity-20 blur-xl rounded-full"></div>
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">ASR-GoT</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Welcome Message */}
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-gray-900 mb-3">
              {mode === 'login' ? 'Welcome Back' : 'Get Started'}
            </h1>
            <p className="text-lg text-gray-600 max-w-md mx-auto">
              {mode === 'login' 
                ? 'Continue your journey in AI-powered scientific research'
                : 'Join thousands of researchers revolutionizing scientific discovery'
              }
            </p>
          </div>

          {/* Email Confirmation Success */}
          {emailConfirmed && (
            <Alert className="border-green-200 bg-green-50 mb-6">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Email confirmed successfully! You can now sign in to your account.
              </AlertDescription>
            </Alert>
          )}

          {/* Mode Toggle */}
          <div className="flex rounded-xl bg-gray-100/80 backdrop-blur-sm p-1.5 mb-8 shadow-inner">
            <Button
              variant={mode === 'login' ? 'default' : 'ghost'}
              className={`flex-1 h-10 font-medium transition-all duration-200 ${
                mode === 'login' 
                  ? 'bg-white shadow-md text-gray-900' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setMode('login')}
            >
              Sign In
            </Button>
            <Button
              variant={mode === 'register' ? 'default' : 'ghost'}
              className={`flex-1 h-10 font-medium transition-all duration-200 ${
                mode === 'register' 
                  ? 'bg-white shadow-md text-gray-900' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setMode('register')}
            >
              Sign Up
            </Button>
          </div>

          {/* Auth Forms */}
          {mode === 'login' ? (
            <LoginForm
              onSuccess={handleAuthSuccess}
              onSwitchToRegister={() => setMode('register')}
            />
          ) : (
            <RegisterForm
              onSuccess={handleAuthSuccess}
              onSwitchToLogin={() => setMode('login')}
            />
          )}

          {/* Features Preview */}
          <Card className="mt-10 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-center text-lg font-semibold text-gray-800">
                Why Choose ASR-GoT?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3 group">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 group-hover:scale-125 transition-transform"></div>
                  <span className="text-gray-700 leading-relaxed">AI-powered scientific research framework with 9-stage pipeline</span>
                </div>
                <div className="flex items-start space-x-3 group">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full mt-2 group-hover:scale-125 transition-transform"></div>
                  <span className="text-gray-700 leading-relaxed">Secure API key storage and usage tracking</span>
                </div>
                <div className="flex items-start space-x-3 group">
                  <div className="w-2 h-2 bg-purple-600 rounded-full mt-2 group-hover:scale-125 transition-transform"></div>
                  <span className="text-gray-700 leading-relaxed">Session persistence and research history</span>
                </div>
                <div className="flex items-start space-x-3 group">
                  <div className="w-2 h-2 bg-pink-600 rounded-full mt-2 group-hover:scale-125 transition-transform"></div>
                  <span className="text-gray-700 leading-relaxed">Advanced graph visualizations and analytics</span>
                </div>
                <div className="flex items-start space-x-3 group">
                  <div className="w-2 h-2 bg-rose-600 rounded-full mt-2 group-hover:scale-125 transition-transform"></div>
                  <span className="text-gray-700 leading-relaxed">Comprehensive report generation and export</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Notice */}
          <Alert className="mt-8 border-0 bg-blue-50/50 backdrop-blur-sm">
            <AlertDescription className="text-sm text-center text-gray-700 leading-relaxed">
              🔒 Your data is securely encrypted and stored. We never share your information with third parties.
              API keys are encrypted and only used to make requests on your behalf.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}