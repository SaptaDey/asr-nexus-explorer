import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppContextManager } from "@/contexts/AppContextManager";
import { AuthProvider, DatabaseProvider, SessionProvider } from "@/contexts/ContextCompatibilityLayer";
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
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { useEffect } from "react";

const queryClient = new QueryClient();

// Initialize Supabase storage on app start
const initializeApp = async () => {
  try {
    const { supabaseStorage } = await import("@/services/SupabaseStorageService");
    await supabaseStorage.initializeStorage();
    console.log('🚀 App initialization completed');
  } catch (error) {
    console.warn('⚠️ App initialization had issues:', error);
  }
};

const App = () => {
  useEffect(() => {
    // Initialize app on mount
    initializeApp();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppContextManager>
          <AuthProvider>
            <DatabaseProvider>
              <SessionProvider>
                <TooltipProvider>
                  <Toaster />
                  <Sonner />
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
              </SessionProvider>
            </DatabaseProvider>
          </AuthProvider>
        </AppContextManager>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
