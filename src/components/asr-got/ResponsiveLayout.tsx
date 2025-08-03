/**
 * Ultra-Modern Responsive Layout Component
 * Sophisticated scientific interface with neural network aesthetics
 */

import React, { useState, useEffect } from 'react';
import { ResponsiveNavigation, NavigationItem } from './ResponsiveNavigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2, Sparkles } from 'lucide-react';

interface ResponsiveLayoutProps {
  navigationItems: NavigationItem[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: React.ReactNode;
  headerContent?: React.ReactNode;
  className?: string;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({
  navigationItems,
  activeTab,
  onTabChange,
  children,
  headerContent,
  className = ""
}) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkIsMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Auto-collapse sidebar on mobile
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  // Sidebar dimensions
  const sidebarWidth = sidebarCollapsed ? 'w-16' : 'w-56';

  const findActiveItem = (items: NavigationItem[], targetId: string): NavigationItem | null => {
    for (const item of items) {
      if (item.id === targetId) return item;
      if (item.children) {
        const found = findActiveItem(item.children, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const activeItem = findActiveItem(navigationItems, activeTab);

  if (isMobile) {
    return (
      <div className={`min-h-screen neural-gradient relative overflow-hidden ${className}`}>
        {/* Floating particle effects */}
        <div className="particle-field" />
        <div className="morphing-background" />
        
        {/* Mobile Navigation */}
        <ResponsiveNavigation 
          activeTab={activeTab} 
          onTabChange={onTabChange} 
          navigationItems={navigationItems} 
          className="sticky top-0 z-40 glass-card border-0 border-b border-white/20" 
        />
        
        {/* Mobile Content */}
        <div className="relative z-10">
          {/* Header Content */}
          {headerContent && (
            <div className="glass-card border-0 border-b border-white/20 p-4">
              {headerContent}
            </div>
          )}
          
          {/* Main Content */}
          <div className="p-4">
            {isFullscreen ? (
              <div className="fixed inset-0 z-50 neural-gradient overflow-auto">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full neural-gradient text-white">
                        {activeItem?.icon}
                      </div>
                      <h2 className="text-lg font-bold holographic-text">{activeItem?.label}</h2>
                      {activeItem?.badge && (
                        <Badge className="neural-gradient text-white border-0">
                          {activeItem.badge}
                        </Badge>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsFullscreen(false)}
                      className="quantum-button"
                    >
                      <Minimize2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {children}
                </div>
              </div>
            ) : (
              <Card className="neural-card animate-neural-pulse">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-full neural-gradient text-white animate-breathe">
                        {activeItem?.icon}
                      </div>
                      <h2 className="text-lg font-bold holographic-text">{activeItem?.label}</h2>
                      {activeItem?.badge && (
                        <Badge className="neural-gradient text-white border-0 animate-holographic-shimmer">
                          {activeItem.badge}
                        </Badge>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsFullscreen(true)}
                      className="quantum-button"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {activeItem?.description && (
                    <p className="text-sm text-slate-600 mb-4">{activeItem.description}</p>
                  )}
                  {children}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Desktop Layout - Ultra-modern scientific interface
  return (
    <div className={`min-h-screen neural-gradient flex relative overflow-hidden ${className}`}>
      {/* Floating particle effects */}
      <div className="particle-field" />
      <div className="morphing-background" />
      
      {/* Neural network background effect */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ opacity: 0.1 }}>
        <defs>
          <linearGradient id="neural-gradient-def" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#667eea" />
            <stop offset="25%" stopColor="#764ba2" />
            <stop offset="50%" stopColor="#f093fb" />
            <stop offset="75%" stopColor="#4facfe" />
            <stop offset="100%" stopColor="#00f2fe" />
          </linearGradient>
        </defs>
        {[...Array(20)].map((_, i) => (
          <circle
            key={i}
            cx={Math.random() * 100 + '%'}
            cy={Math.random() * 100 + '%'}
            r={Math.random() * 3 + 1}
            fill="url(#neural-gradient-def)"
            className="animate-quantum-float"
            style={{
              animationDelay: `${Math.random() * 10}s`,
              animationDuration: `${10 + Math.random() * 10}s`
            }}
          />
        ))}
      </svg>

      {/* Desktop Sidebar - Ultra-modern glass design */}
      <div className={`flex-shrink-0 glass-card border-r-2 border-white/20 transition-all duration-500 z-30 backdrop-blur-2xl ${sidebarWidth} min-h-screen relative overflow-hidden`}>
        {/* Holographic background effect */}
        <div className="absolute inset-0 neural-gradient opacity-5 animate-morphing-bg" />
        
        {sidebarCollapsed ? (
          // Collapsed Sidebar
          <div className="p-4 relative z-10">
            <div className="space-y-4">
              {navigationItems.map((item, index) => (
                <Button 
                  key={item.id} 
                  variant={activeTab === item.id ? "default" : "ghost"} 
                  size="sm" 
                  onClick={() => onTabChange(item.id)} 
                  title={item.label} 
                  className={`w-full h-12 p-0 transition-all duration-300 rounded-xl relative overflow-hidden ${
                    activeTab === item.id 
                      ? 'neural-gradient text-white shadow-2xl animate-neural-pulse' 
                      : 'text-slate-600 hover:text-white glass-card hover:neural-gradient'
                  }`}
                  style={{
                    animationDelay: `${index * 100}ms`
                  }}
                >
                  <div className="relative z-10">
                    {item.icon}
                  </div>
                  {activeTab === item.id && (
                    <div className="absolute inset-0 animate-holographic-shimmer" />
                  )}
                </Button>
              ))}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSidebarCollapsed(false)} 
              className="mt-6 w-full quantum-button text-white rounded-xl"
            >
              <ChevronRight className="h-5 w-5" />
              <Sparkles className="h-3 w-3 ml-1" />
            </Button>
          </div>
        ) : (
          // Expanded Sidebar
          <div className="relative h-full w-full z-10">
            <ResponsiveNavigation 
              activeTab={activeTab} 
              onTabChange={onTabChange} 
              navigationItems={navigationItems} 
              className="h-full" 
            />
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute top-6 right-3 quantum-button text-white rounded-xl" 
              onClick={() => setSidebarCollapsed(true)}
            >
              <ChevronLeft className="h-5 w-5" />
              <Sparkles className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* Desktop Content Area - Sophisticated glass container */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden relative z-10">
        {/* Header Content */}
        {headerContent && (
          <div className="glass-card border-0 border-b-2 border-white/20 p-6 flex-shrink-0 backdrop-blur-2xl">
            <div className="relative">
              {headerContent}
              <div className="absolute inset-0 animate-holographic-shimmer opacity-20 pointer-events-none" />
            </div>
          </div>
        )}
        
        {/* Main Content - Ultra-modern scrollable area */}
        <div className="flex-1 overflow-auto">
          <div className="px-6 py-6 h-full">
            {isFullscreen ? (
              <div className="fixed inset-0 z-50 neural-gradient overflow-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-full neural-gradient text-white animate-breathe shadow-2xl">
                        {activeItem?.icon}
                      </div>
                      <h2 className="text-3xl font-bold holographic-text">{activeItem?.label}</h2>
                      {activeItem?.badge && (
                        <Badge className="neural-gradient text-white border-0 px-4 py-2 text-sm animate-holographic-shimmer">
                          {activeItem.badge}
                        </Badge>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setIsFullscreen(false)} 
                      className="quantum-button"
                    >
                      <Minimize2 className="h-5 w-5" />
                    </Button>
                  </div>
                  {children}
                </div>
              </div>
            ) : (
              <div className="h-full">
                <Card className="neural-card h-full animate-fade-in overflow-hidden">
                  <CardContent className="p-8 h-full relative">
                    {/* Floating background particles */}
                    <div className="absolute top-4 right-4 floating-particle w-2 h-2" />
                    <div className="absolute bottom-8 left-8 floating-particle w-3 h-3" style={{ animationDelay: '3s' }} />
                    <div className="absolute top-1/2 right-1/3 floating-particle w-1 h-1" style={{ animationDelay: '6s' }} />
                    
                    <div className="flex items-center justify-between mb-8 relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-full neural-gradient text-white animate-breathe shadow-2xl research-node">
                          {activeItem?.icon}
                        </div>
                        <h2 className="text-3xl font-bold holographic-text">{activeItem?.label}</h2>
                        {activeItem?.badge && (
                          <Badge className="neural-gradient text-white border-0 px-4 py-2 text-sm animate-holographic-shimmer">
                            {activeItem.badge}
                          </Badge>
                        )}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setIsFullscreen(true)} 
                        className="quantum-button"
                      >
                        <Maximize2 className="h-5 w-5" />
                        <Sparkles className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                    {activeItem?.description && (
                      <p className="text-sm text-slate-600 mb-8 font-medium leading-relaxed">
                        {activeItem.description}
                      </p>
                    )}
                    <div className="h-full overflow-auto relative z-10">
                      {children}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};