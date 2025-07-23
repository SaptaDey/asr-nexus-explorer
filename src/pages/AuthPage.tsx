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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 text-blue-600 hover:text-blue-700">
            <ArrowLeft className="h-5 w-5" />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center space-x-2">
            <Brain className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">ASR-GoT</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Welcome Message */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome to ASR-GoT
            </h1>
            <p className="text-gray-600">
              {mode === 'login' 
                ? 'Sign in to access your research sessions and data'
                : 'Create an account to start your scientific research journey'
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
          <div className="flex rounded-lg bg-gray-100 p-1 mb-6">
            <Button
              variant={mode === 'login' ? 'default' : 'ghost'}
              className="flex-1"
              onClick={() => setMode('login')}
            >
              Sign In
            </Button>
            <Button
              variant={mode === 'register' ? 'default' : 'ghost'}
              className="flex-1"
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
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-center text-lg">
                What you'll get with ASR-GoT
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <span>AI-powered scientific research framework with 9-stage pipeline</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <span>Secure API key storage and usage tracking</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <span>Session persistence and research history</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <span>Advanced graph visualizations and analytics</span>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <span>Comprehensive report generation and export</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy Notice */}
          <Alert className="mt-6">
            <AlertDescription className="text-xs text-center">
              Your data is securely encrypted and stored. We never share your information with third parties.
              API keys are encrypted and only used to make requests on your behalf.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </div>
  )
}