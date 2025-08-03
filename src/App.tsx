import React, { useMemo, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppContextManager } from "@/contexts/AppContextManager";
import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Contact from "./pages/Contact";
import GraphOfThoughtsGuide from "./pages/GraphOfThoughtsGuide";
import StageDetail from "./pages/StageDetail";
import AIPowered from "./pages/AIPowered";
import ResearchFramework from "./pages/ResearchFramework";
import GraphNeuralNetworks from "./pages/GraphNeuralNetworks";
import UserDashboard from "./pages/UserDashboard";
import AuthPage from "./pages/AuthPage";
import ASRGoTInterface from "./pages/ASRGoTInterface";
import EnhancedASRGoTInterface from "./pages/EnhancedASRGoTInterface";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { FloatingIconSystem } from "./components/ui/FloatingIconSystem";

// Lightweight app initialization - services load when needed
const initializeApp = () => {
  console.log('🔄 App: Starting lightweight initialization');
  
  // Initialize debug helper for development (non-blocking)
  if (process.env.NODE_ENV === 'development') {
    import('@/utils/debugHelper').then(({ initializeDebugHelper }) => {
      initializeDebugHelper();
      console.log('🔧 Debug helper initialized');
    }).catch(error => {
      console.warn('⚠️ Debug helper initialization failed:', error);
    });
  }
  
  console.log('✅ App: Lightweight initialization completed');
};

const App = () => {
  // CRITICAL: Create QueryClient inside component to ensure React is loaded
  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
      },
    },
  }), []);

  useEffect(() => {
    // Initialize app on mount
    initializeApp();
    
    console.log('✅ App loaded successfully');
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppContextManager>
            <TooltipProvider>
                    <Toaster />
                    <Sonner />
                    <FloatingIconSystem />
                    <BrowserRouter>
                    <Routes>
                      {/* Public routes */}
                      <Route path="/" element={<Index />} />
                      <Route path="/auth" element={<AuthPage />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/guide" element={<GraphOfThoughtsGuide />} />
                      <Route path="/ai-powered" element={<AIPowered />} />
                      <Route path="/research-framework" element={<ResearchFramework />} />
                      <Route path="/graph-neural-networks" element={<GraphNeuralNetworks />} />
                      <Route path="/asr-got-interface" element={<ASRGoTInterface />} />
                      <Route path="/enhanced-asr-got-interface" element={<EnhancedASRGoTInterface />} />
                      
                      {/* Protected routes - require authentication */}
                      <Route 
                        path="/dashboard" 
                        element={
                          <ProtectedRoute>
                            <UserDashboard />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/stage/:stageId" 
                        element={
                          <ProtectedRoute>
                            <StageDetail />
                          </ProtectedRoute>
                        } 
                      />
                      
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    </BrowserRouter>
            </TooltipProvider>
          </AppContextManager>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
