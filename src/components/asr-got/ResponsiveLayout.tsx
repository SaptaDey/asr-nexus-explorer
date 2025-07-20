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

  const sidebarWidth = sidebarCollapsed ? 'w-16' : 'w-80';
  const contentMargin = sidebarCollapsed ? 'ml-16' : 'ml-80';

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
      <div className={`min-h-screen bg-gray-50 ${className}`}>
        {/* Mobile Navigation */}
        <ResponsiveNavigation
          activeTab={activeTab}
          onTabChange={onTabChange}
          navigationItems={navigationItems}
          className="sticky top-0 z-40 bg-white border-b"
        />
        
        {/* Mobile Content */}
        <div className="relative">
          {/* Header Content */}
          {headerContent && (
            <div className="bg-white border-b p-4">
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
                      <h2 className="text-lg font-semibold">{activeItem?.label}</h2>
                      {activeItem?.badge && (
                        <Badge variant="secondary">{activeItem.badge}</Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsFullscreen(false)}
                    >
                      <Minimize2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {children}
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      {activeItem?.icon}
                      <h2 className="text-lg font-semibold">{activeItem?.label}</h2>
                      {activeItem?.badge && (
                        <Badge variant="secondary">{activeItem.badge}</Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsFullscreen(true)}
                    >
                      <Maximize2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {activeItem?.description && (
                    <p className="text-sm text-gray-600 mb-4">{activeItem.description}</p>
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

  // Desktop Layout
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {/* Desktop Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 transition-all duration-300 z-30 ${sidebarWidth}`}>
        {sidebarCollapsed ? (
          // Collapsed Sidebar
          <div className="p-4">
            <div className="space-y-4">
              {navigationItems.map((item) => (
                <Button
                  key={item.id}
                  variant={activeTab === item.id ? "default" : "ghost"}
                  size="sm"
                  className="w-full h-12 p-0"
                  onClick={() => onTabChange(item.id)}
                  title={item.label}
                >
                  {item.icon}
                </Button>
              ))}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="mt-6 w-full"
              onClick={() => setSidebarCollapsed(false)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          // Expanded Sidebar
          <div className="relative h-full">
            <ResponsiveNavigation
              activeTab={activeTab}
              onTabChange={onTabChange}
              navigationItems={navigationItems}
              className="h-full"
            />
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-6 right-2"
              onClick={() => setSidebarCollapsed(true)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Desktop Content Area */}
      <div className={`transition-all duration-300 ${contentMargin}`}>
        {/* Header Content */}
        {headerContent && (
          <div className="bg-white border-b p-6 sticky top-0 z-20">
            {headerContent}
          </div>
        )}
        
        {/* Main Content */}
        <div className="p-6">
          {isFullscreen ? (
            <div className="fixed inset-0 z-50 bg-white overflow-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    {activeItem?.icon}
                    <h2 className="text-2xl font-semibold">{activeItem?.label}</h2>
                    {activeItem?.badge && (
                      <Badge variant="secondary">{activeItem.badge}</Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFullscreen(false)}
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                </div>
                {children}
              </div>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    {activeItem?.icon}
                    <div>
                      <h2 className="text-2xl font-semibold text-gray-900">{activeItem?.label}</h2>
                      {activeItem?.description && (
                        <p className="text-gray-600 mt-1">{activeItem.description}</p>
                      )}
                    </div>
                    {activeItem?.badge && (
                      <Badge variant="secondary" className="ml-auto">{activeItem.badge}</Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsFullscreen(true)}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </div>
                {children}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};