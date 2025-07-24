/**
 * Mobile Responsive Wrapper
 * Provides mobile-optimized layout and interactions
 */

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-mobile';

interface MobileResponsiveWrapperProps {
  children: ReactNode;
  className?: string;
}

export const MobileResponsiveWrapper: React.FC<MobileResponsiveWrapperProps> = ({
  children,
  className,
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');

  return (
    <div 
      className={cn(
        'w-full transition-all duration-300',
        {
          // Mobile styles
          'px-2 py-1': isMobile,
          'space-y-2': isMobile,
          // Tablet styles
          'px-4 py-2': isTablet && !isMobile,
          'space-y-3': isTablet && !isMobile,
          // Desktop styles
          'px-6 py-4': !isTablet,
          'space-y-6': !isTablet,
        },
        className
      )}
    >
      {/* Mobile-specific touch optimizations */}
      <style jsx global>{`
        @media (max-width: 768px) {
          /* Larger touch targets */
          .mobile-touch button {
            min-height: 44px;
            min-width: 44px;
          }
          
          /* Improved text readability */
          .mobile-text {
            font-size: 16px;
            line-height: 1.5;
          }
          
          /* Better spacing for small screens */
          .mobile-spacing > * + * {
            margin-top: 1rem;
          }
          
          /* Optimized form inputs */
          .mobile-input input,
          .mobile-input textarea {
            padding: 12px;
            font-size: 16px; /* Prevents zoom on iOS */
          }
          
          /* Responsive visualizations */
          .mobile-viz {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          
          /* Collapsible sections on mobile */
          .mobile-collapsible {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            margin-bottom: 8px;
          }
          
          .mobile-collapsible summary {
            padding: 12px;
            cursor: pointer;
            background: #f9fafb;
            border-radius: 8px;
          }
          
          .mobile-collapsible[open] summary {
            border-bottom: 1px solid #e5e7eb;
            border-radius: 8px 8px 0 0;
          }
          
          .mobile-collapsible div {
            padding: 12px;
          }
        }
        
        @media (max-width: 1024px) and (min-width: 769px) {
          /* Tablet-specific optimizations */
          .tablet-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }
        }
        
        /* Progressive enhancement for larger screens */
        @media (min-width: 1025px) {
          .desktop-grid {
            display: grid;
            grid-template-columns: 2fr 1fr;
            gap: 2rem;
          }
        }
      `}</style>
      
      <div 
        className={cn(
          'mobile-spacing mobile-text',
          isMobile && 'mobile-touch mobile-input'
        )}
      >
        {children}
      </div>
    </div>
  );
};

// Hook for responsive behavior
export const useResponsiveLayout = () => {
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');
  const isDesktop = !isTablet;

  return {
    isMobile,
    isTablet,
    isDesktop,
    // Helper functions for responsive rendering
    renderMobile: (component: ReactNode) => isMobile ? component : null,
    renderTablet: (component: ReactNode) => isTablet && !isMobile ? component : null,
    renderDesktop: (component: ReactNode) => isDesktop ? component : null,
    // Responsive class helpers
    mobileClass: (classes: string) => isMobile ? classes : '',
    tabletClass: (classes: string) => isTablet && !isMobile ? classes : '',
    desktopClass: (classes: string) => isDesktop ? classes : '',
  };
};