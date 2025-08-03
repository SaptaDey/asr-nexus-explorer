/**
 * Responsive Layout Component
 * Modern layout with sidebar navigation and adaptive content area
 */

import React, { useState, useEffect } from 'react';
import { ResponsiveNavigation, NavigationItem } from './ResponsiveNavigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';

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
      <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 ${className}`}>
        {/* Mobile Navigation */}
        <ResponsiveNavigation 
          activeTab={activeTab} 
          onTabChange={onTabChange} 
          navigationItems={navigationItems} 
          className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/60" 
        />
        
        {/* Mobile Content */}
        <div className="relative">
          {/* Header Content */}
          {headerContent && (
            <div className="bg-white/95 backdrop-blur-sm border-b border-slate-200/60 p-4">
              {headerContent}
            </div>
          )}
          
          {/* Main Content */}
          <div className="p-4">
            {isFullscreen ? (
              <div className="fixed inset-0 z-50 bg-white overflow-auto">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {activeItem?.icon}
                      <h2 className="text-lg font-semibold text-slate-800">{activeItem?.label}</h2>
                      {activeItem?.badge && <Badge variant="secondary">{activeItem.badge}</Badge>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(false)}>
                      <Minimize2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {children}
                </div>
              </div>
            ) : (
              <Card className="bg-white/95 backdrop-blur-sm border border-slate-200/60 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {activeItem?.icon}
                      <h2 className="text-lg font-semibold text-slate-800">{activeItem?.label}</h2>
                      {activeItem?.badge && <Badge variant="secondary">{activeItem.badge}</Badge>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(true)}>
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

  // Desktop Layout - Use Flexbox instead of fixed positioning
  return (
    <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex ${className}`}>
      {/* Desktop Sidebar - Properly positioned with flexbox */}
      <div className={`flex-shrink-0 bg-gradient-to-b from-white/95 to-slate-50/95 border-r border-slate-200/60 transition-all duration-300 z-30 shadow-xl backdrop-blur-md ${sidebarWidth} min-h-screen`}>
        {sidebarCollapsed ? (
          // Collapsed Sidebar
          <div className="p-4">
            <div className="space-y-4">
              {navigationItems.map(item => (
                <Button 
                  key={item.id} 
                  variant={activeTab === item.id ? "default" : "ghost"} 
                  size="sm" 
                  onClick={() => onTabChange(item.id)} 
                  title={item.label} 
                  className={`w-full h-11 p-0 transition-all duration-200 rounded-xl ${
                    activeTab === item.id 
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-md hover:shadow-lg' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                >
                  {item.icon}
                </Button>
              ))}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setSidebarCollapsed(false)} 
              className="mt-6 w-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all duration-200 rounded-xl"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          // Expanded Sidebar
          <div className="relative h-full w-full">
            <ResponsiveNavigation 
              activeTab={activeTab} 
              onTabChange={onTabChange} 
              navigationItems={navigationItems} 
              className="h-full" 
            />
            <Button 
              variant="ghost" 
              size="sm" 
              className="absolute top-6 right-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100/80 transition-all duration-200 rounded-xl" 
              onClick={() => setSidebarCollapsed(true)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Desktop Content Area - Flex container for proper layout */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header Content */}
        {headerContent && (
          <div className="bg-white/95 backdrop-blur-sm border-b border-slate-200/60 p-6 shadow-sm flex-shrink-0">
            {headerContent}
          </div>
        )}
        
        {/* Main Content - Scrollable area */}
        <div className="flex-1 overflow-auto">
          <div className="px-6 py-6 h-full">
            {isFullscreen ? (
              <div className="fixed inset-0 z-50 bg-white overflow-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      {activeItem?.icon}
                      <h2 className="text-2xl font-semibold text-slate-800">{activeItem?.label}</h2>
                      {activeItem?.badge && <Badge variant="secondary">{activeItem.badge}</Badge>}
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(false)} className="hover:bg-slate-100">
                      <Minimize2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {children}
                </div>
              </div>
            ) : (
              <div className="h-full">
                <Card className="bg-white/95 backdrop-blur-sm border border-slate-200/60 shadow-sm h-full">
                  <CardContent className="p-6 h-full">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        {activeItem?.icon}
                        <h2 className="text-2xl font-semibold text-slate-800">{activeItem?.label}</h2>
                        {activeItem?.badge && <Badge variant="secondary">{activeItem.badge}</Badge>}
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => setIsFullscreen(true)} className="hover:bg-slate-100">
                        <Maximize2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {activeItem?.description && (
                      <p className="text-sm text-slate-600 mb-6">{activeItem.description}</p>
                    )}
                    <div className="h-full overflow-auto">
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