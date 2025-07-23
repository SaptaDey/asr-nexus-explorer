import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
// Temporarily disabled broken contexts
// import { DatabaseProvider } from "@/contexts/DatabaseContext";
// import { SessionProvider } from "@/contexts/SessionContext";
// import { AuthProvider } from "@/contexts/AuthContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Index from "./pages/Index";
import Contact from "./pages/Contact";
import GraphOfThoughtsGuide from "./pages/GraphOfThoughtsGuide";
import StageDetail from "./pages/StageDetail";
import AIPowered from "./pages/AIPowered";
import ResearchFramework from "./pages/ResearchFramework";
import GraphNeuralNetworks from "./pages/GraphNeuralNetworks";
// import UserDashboard from "./pages/UserDashboard";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";

const queryClient = new QueryClient();

// Initialize Supabase storage on app start
// Temporarily disabled app initialization that may cause issues
const initializeApp = async () => {
  try {
    console.log('🚀 App initialization started (simplified mode)');
    // Removed Supabase initialization to avoid import issues
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
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/guide" element={<GraphOfThoughtsGuide />} />
              <Route path="/stage/:stageId" element={<StageDetail />} />
              <Route path="/ai-powered" element={<AIPowered />} />
              <Route path="/research-framework" element={<ResearchFramework />} />
              <Route path="/graph-neural-networks" element={<GraphNeuralNetworks />} />
              {/* Temporarily disabled routes that depend on broken contexts */}
              {/* <Route path="/auth" element={<AuthPage />} />
              <Route path="/dashboard" element={<UserDashboard />} /> */}
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
