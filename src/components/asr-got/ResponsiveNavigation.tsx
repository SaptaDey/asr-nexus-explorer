/**
 * Responsive Navigation Component
 * Modern sidebar and mobile-friendly navigation for ASR-GoT interface
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { 
  Menu, 
  X, 
  ChevronDown, 
  ChevronRight,
  Brain,
  TreePine,
  Network,
  BarChart3,
  Settings,
  Code,
  Download,
  Database,
  History,
  Microscope
} from 'lucide-react';

export interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  children?: NavigationItem[];
  description?: string;
}

interface ResponsiveNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  navigationItems: NavigationItem[];
  className?: string;
}

export const ResponsiveNavigation: React.FC<ResponsiveNavigationProps> = ({
  activeTab,
  onTabChange,
  navigationItems,
  className = ""
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

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

  const NavigationContent = () => (
    <div className="space-y-2">
      {navigationItems.map((item) => (
        <div key={item.id}>
          <Button
            variant={activeTab === item.id ? "default" : "ghost"}
            className={`w-full justify-start gap-3 h-12 ${
              activeTab === item.id 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            onClick={() => {
              if (item.children && item.children.length > 0) {
                toggleExpanded(item.id);
              } else {
                onTabChange(item.id);
                setIsMobileMenuOpen(false);
              }
            }}
          >
            <div className="flex items-center gap-3 flex-1">
              {item.icon}
              <span className="font-medium">{item.label}</span>
              {item.badge && (
                <Badge variant="secondary" className="ml-auto text-xs">
                  {item.badge}
                </Badge>
              )}
            </div>
            {item.children && item.children.length > 0 && (
              expandedItems.has(item.id) 
                ? <ChevronDown className="h-4 w-4" />
                : <ChevronRight className="h-4 w-4" />
            )}
          </Button>

          {/* Sub-items */}
          {item.children && expandedItems.has(item.id) && (
            <div className="ml-6 mt-2 space-y-1 border-l-2 border-gray-200 pl-4">
              {item.children.map((child) => (
                <Button
                  key={child.id}
                  variant={activeTab === child.id ? "default" : "ghost"}
                  size="sm"
                  className={`w-full justify-start gap-2 h-10 ${
                    activeTab === child.id 
                      ? 'bg-blue-500 text-white' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => {
                    onTabChange(child.id);
                    setIsMobileMenuOpen(false);
                  }}
                >
                  {child.icon}
                  <span className="text-sm">{child.label}</span>
                  {child.badge && (
                    <Badge variant="outline" className="ml-auto text-xs">
                      {child.badge}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  if (isMobile) {
    return (
      <div className={className}>
        {/* Mobile Header */}
        <div className="flex items-center justify-between p-4 bg-white border-b">
          <div className="flex items-center gap-3">
            {activeItem?.icon}
            <div>
              <h2 className="font-semibold text-gray-900">{activeItem?.label || 'ASR-GoT'}</h2>
              {activeItem?.description && (
                <p className="text-sm text-gray-600">{activeItem.description}</p>
              )}
            </div>
          </div>
          
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80 p-0">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Navigation</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <ScrollArea className="h-[calc(100vh-100px)]">
                  <NavigationContent />
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    );
  }

  // Desktop Sidebar
  return (
    <div className={`bg-white border-r border-gray-200 ${className}`}>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Navigation</h3>
        <ScrollArea className="h-[calc(100vh-200px)]">
          <NavigationContent />
        </ScrollArea>
      </div>
    </div>
  );
};

// Default navigation items for ASR-GoT
export const defaultNavigationItems: NavigationItem[] = [
  {
    id: 'research',
    label: 'Research',
    icon: <Microscope className="h-5 w-5" />,
    description: 'Main research interface with 9-stage analysis',
    children: [
      {
        id: 'research-input',
        label: 'Input & Setup',
        icon: <Settings className="h-4 w-4" />,
        description: 'Configure research parameters'
      },
      {
        id: 'research-analysis',
        label: 'AI Analysis',
        icon: <Brain className="h-4 w-4" />,
        description: 'Stage-by-stage execution'
      },
      {
        id: 'research-results',
        label: 'Results',
        icon: <BarChart3 className="h-4 w-4" />,
        description: 'View analysis results'
      }
    ]
  },
  {
    id: 'tree',
    label: 'Tree View',
    icon: <TreePine className="h-5 w-5" />,
    description: 'Botanical tree visualization of reasoning'
  },
  {
    id: 'advanced',
    label: 'Advanced Graphs',
    icon: <Network className="h-5 w-5" />,
    description: 'Multi-layer network visualization',
    children: [
      {
        id: 'advanced-multi',
        label: 'Multi-Layer',
        icon: <Network className="h-4 w-4" />,
        description: 'Multi-layer network view'
      },
      {
        id: 'advanced-enhanced',
        label: 'Enhanced',
        icon: <Network className="h-4 w-4" />,
        description: 'Enhanced graph visualization'
      }
    ]
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <BarChart3 className="h-5 w-5" />,
    description: 'Visual analytics and insights',
    children: [
      {
        id: 'analytics-standard',
        label: 'Standard',
        icon: <BarChart3 className="h-4 w-4" />,
        description: 'Standard analytics dashboard'
      },
      {
        id: 'analytics-meta',
        label: 'Meta-Analysis',
        icon: <BarChart3 className="h-4 w-4" />,
        description: 'Advanced meta-analysis'
      }
    ]
  },
  {
    id: 'parameters',
    label: 'Parameters',
    icon: <Settings className="h-5 w-5" />,
    description: 'Configure ASR-GoT parameters'
  },
  {
    id: 'developer',
    label: 'Developer',
    icon: <Code className="h-5 w-5" />,
    description: 'Developer tools and debugging'
  },
  {
    id: 'export',
    label: 'Export',
    icon: <Download className="h-5 w-5" />,
    description: 'Export research results'
  },
  {
    id: 'storage',
    label: 'Storage',
    icon: <Database className="h-5 w-5" />,
    description: 'Stored analyses management'
  },
  {
    id: 'history',
    label: 'History',
    icon: <History className="h-5 w-5" />,
    description: 'Query history and RAG reanalysis',
    badge: 'RAG'
  }
];