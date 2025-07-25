
import React from 'react';

/**
 * Graceful Degradation Utilities
 * Provides fallback mechanisms and progressive enhancement for the ASR-GoT application
 */

export interface FeatureSupport {
  webGL: boolean;
  webWorkers: boolean;
  indexedDB: boolean;
  localStorage: boolean;
  sessionStorage: boolean;
  canvas: boolean;
  svg: boolean;
  webSockets: boolean;
  serviceWorker: boolean;
  notifications: boolean;
  geolocation: boolean;
  mediaDevices: boolean;
  intersectionObserver: boolean;
  resizeObserver: boolean;
}

export class GracefulDegradation {
  private static instance: GracefulDegradation;
  private featureSupport: FeatureSupport;
  private fallbackStrategies: Map<string, () => void> = new Map();

  private constructor() {
    this.featureSupport = this.checkFeatureSupport();
    this.setupFallbackStrategies();
  }

  static getInstance(): GracefulDegradation {
    if (!GracefulDegradation.instance) {
      GracefulDegradation.instance = new GracefulDegradation();
    }
    return GracefulDegradation.instance;
  }

  /**
   * Check browser feature support
   */
  private checkFeatureSupport(): FeatureSupport {
    const support: FeatureSupport = {
      webGL: false,
      webWorkers: false,
      indexedDB: false,
      localStorage: false,
      sessionStorage: false,
      canvas: false,
      svg: false,
      webSockets: false,
      serviceWorker: false,
      notifications: false,
      geolocation: false,
      mediaDevices: false,
      intersectionObserver: false,
      resizeObserver: false
    };

    if (typeof window === 'undefined') {
      return support;
    }

    // Check WebGL support
    try {
      const canvas = document.createElement('canvas');
      support.webGL = !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
    } catch (e) {
      support.webGL = false;
    }

    // Check Web Workers
    support.webWorkers = typeof Worker !== 'undefined';

    // Check IndexedDB
    support.indexedDB = 'indexedDB' in window;

    // Check localStorage
    try {
      const test = 'test';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      support.localStorage = true;
    } catch (e) {
      support.localStorage = false;
    }

    // Check sessionStorage
    try {
      const test = 'test';
      sessionStorage.setItem(test, test);
      sessionStorage.removeItem(test);
      support.sessionStorage = true;
    } catch (e) {
      support.sessionStorage = false;
    }

    // Check Canvas
    support.canvas = !!(document.createElement('canvas').getContext);

    // Check SVG
    support.svg = !!(document.createElementNS && document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect);

    // Check WebSockets
    support.webSockets = 'WebSocket' in window;

    // Check Service Worker
    support.serviceWorker = 'serviceWorker' in navigator;

    // Check Notifications
    support.notifications = 'Notification' in window;

    // Check Geolocation
    support.geolocation = 'geolocation' in navigator;

    // Check Media Devices
    support.mediaDevices = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

    // Check Intersection Observer
    support.intersectionObserver = 'IntersectionObserver' in window;

    // Check Resize Observer
    support.resizeObserver = 'ResizeObserver' in window;

    return support;
  }

  /**
   * Setup fallback strategies
   */
  private setupFallbackStrategies(): void {
    // WebGL fallback
    this.fallbackStrategies.set('webGL', () => {
      console.warn('WebGL not supported, falling back to 2D canvas rendering');
    });

    // Web Workers fallback
    this.fallbackStrategies.set('webWorkers', () => {
      console.warn('Web Workers not supported, processing will run on main thread');
    });

    // IndexedDB fallback
    this.fallbackStrategies.set('indexedDB', () => {
      console.warn('IndexedDB not supported, falling back to localStorage');
    });

    // localStorage fallback
    this.fallbackStrategies.set('localStorage', () => {
      console.warn('localStorage not supported, data will not persist');
    });

    // WebSockets fallback
    this.fallbackStrategies.set('webSockets', () => {
      console.warn('WebSockets not supported, falling back to polling');
    });
  }

  /**
   * Get feature support information
   */
  getFeatureSupport(): FeatureSupport {
    return { ...this.featureSupport };
  }

  /**
   * Check if a specific feature is supported
   */
  isSupported(feature: keyof FeatureSupport): boolean {
    return this.featureSupport[feature];
  }

  /**
   * Execute fallback strategy for a feature
   */
  executeFallback(feature: string): void {
    const strategy = this.fallbackStrategies.get(feature);
    if (strategy) {
      strategy();
    }
  }

  /**
   * Safe storage operations with fallbacks
   */
  safeStorage = {
    setItem: (key: string, value: string, useSession = false): boolean => {
      try {
        if (useSession && this.featureSupport.sessionStorage) {
          sessionStorage.setItem(key, value);
          return true;
        } else if (this.featureSupport.localStorage) {
          localStorage.setItem(key, value);
          return true;
        } else {
          // Fallback to memory storage
          if (!this.memoryStorage) {
            this.memoryStorage = new Map();
          }
          this.memoryStorage.set(key, value);
          return true;
        }
      } catch (e) {
        console.warn('Storage operation failed:', e);
        return false;
      }
    },

    getItem: (key: string, useSession = false): string | null => {
      try {
        if (useSession && this.featureSupport.sessionStorage) {
          return sessionStorage.getItem(key);
        } else if (this.featureSupport.localStorage) {
          return localStorage.getItem(key);
        } else {
          // Fallback to memory storage
          return this.memoryStorage?.get(key) || null;
        }
      } catch (e) {
        console.warn('Storage retrieval failed:', e);
        return null;
      }
    },

    removeItem: (key: string, useSession = false): boolean => {
      try {
        if (useSession && this.featureSupport.sessionStorage) {
          sessionStorage.removeItem(key);
          return true;
        } else if (this.featureSupport.localStorage) {
          localStorage.removeItem(key);
          return true;
        } else {
          // Fallback to memory storage
          this.memoryStorage?.delete(key);
          return true;
        }
      } catch (e) {
        console.warn('Storage removal failed:', e);
        return false;
      }
    }
  };

  private memoryStorage: Map<string, string> | null = null;

  /**
   * Progressive enhancement wrapper
   */
  withProgressiveEnhancement<T>(
    baseImplementation: () => T,
    enhancedImplementation: () => T,
    requiredFeatures: (keyof FeatureSupport)[]
  ): T {
    const isEnhanced = requiredFeatures.every(feature => this.featureSupport[feature]);
    
    if (isEnhanced) {
      try {
        return enhancedImplementation();
      } catch (e) {
        console.warn('Enhanced implementation failed, falling back to base:', e);
        return baseImplementation();
      }
    } else {
      return baseImplementation();
    }
  }

  /**
   * Conditional rendering based on feature support
   */
  conditionalRender(
    component: React.ComponentType<any>,
    fallback: React.ComponentType<any>,
    requiredFeatures: (keyof FeatureSupport)[]
  ): React.ComponentType<any> {
    const isSupported = requiredFeatures.every(feature => this.featureSupport[feature]);
    return isSupported ? component : fallback;
  }

  /**
   * Get browser compatibility information
   */
  getBrowserInfo(): {
    userAgent: string;
    platform: string;
    language: string;
    cookieEnabled: boolean;
    onLine: boolean;
    supportScore: number;
  } {
    const supportedFeatures = Object.values(this.featureSupport).filter(Boolean).length;
    const totalFeatures = Object.keys(this.featureSupport).length;
    
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      supportScore: Math.round((supportedFeatures / totalFeatures) * 100)
    };
  }

  /**
   * Performance-aware feature detection
   */
  getPerformanceAwareFeatures(): {
    reducedMotion: boolean;
    lowBandwidth: boolean;
    reducedData: boolean;
    highContrast: boolean;
  } {
    const features = {
      reducedMotion: false,
      lowBandwidth: false,
      reducedData: false,
      highContrast: false
    };

    if (typeof window === 'undefined') {
      return features;
    }

    // Check for reduced motion preference
    if (window.matchMedia) {
      features.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      features.highContrast = window.matchMedia('(prefers-contrast: high)').matches;
    }

    // Check for data saver
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      features.reducedData = connection.saveData || false;
      features.lowBandwidth = connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g';
    }

    return features;
  }

  /**
   * Adaptive loading based on device capabilities
   */
  getAdaptiveLoadingStrategy(): {
    shouldLazyLoad: boolean;
    shouldPreload: boolean;
    imageQuality: 'low' | 'medium' | 'high';
    animationLevel: 'none' | 'reduced' | 'full';
  } {
    const perfFeatures = this.getPerformanceAwareFeatures();
    const browserInfo = this.getBrowserInfo();

    return {
      shouldLazyLoad: perfFeatures.lowBandwidth || perfFeatures.reducedData,
      shouldPreload: !perfFeatures.lowBandwidth && browserInfo.supportScore > 80,
      imageQuality: perfFeatures.reducedData ? 'low' : perfFeatures.lowBandwidth ? 'medium' : 'high',
      animationLevel: perfFeatures.reducedMotion ? 'none' : perfFeatures.lowBandwidth ? 'reduced' : 'full'
    };
  }
}

// Global instance
export const gracefulDegradation = GracefulDegradation.getInstance();

/**
 * React hook for graceful degradation
 */
export function useGracefulDegradation() {
  const [featureSupport, setFeatureSupport] = React.useState<FeatureSupport>(() => 
    gracefulDegradation.getFeatureSupport()
  );

  const [performanceFeatures, setPerformanceFeatures] = React.useState(() =>
    gracefulDegradation.getPerformanceAwareFeatures()
  );

  const [adaptiveStrategy, setAdaptiveStrategy] = React.useState(() =>
    gracefulDegradation.getAdaptiveLoadingStrategy()
  );

  React.useEffect(() => {
    // Update feature support if it changes
    setFeatureSupport(gracefulDegradation.getFeatureSupport());
    setPerformanceFeatures(gracefulDegradation.getPerformanceAwareFeatures());
    setAdaptiveStrategy(gracefulDegradation.getAdaptiveLoadingStrategy());
  }, []);

  return {
    featureSupport,
    performanceFeatures,
    adaptiveStrategy,
    isSupported: gracefulDegradation.isSupported.bind(gracefulDegradation),
    safeStorage: gracefulDegradation.safeStorage,
    withProgressiveEnhancement: gracefulDegradation.withProgressiveEnhancement.bind(gracefulDegradation),
    conditionalRender: gracefulDegradation.conditionalRender.bind(gracefulDegradation),
    getBrowserInfo: gracefulDegradation.getBrowserInfo.bind(gracefulDegradation)
  };
}

/**
 * Higher-order component for progressive enhancement
 */
export function withGracefulDegradation<P extends object>(
  EnhancedComponent: React.ComponentType<P>,
  FallbackComponent: React.ComponentType<P>,
  requiredFeatures: (keyof FeatureSupport)[]
) {
  return function GracefullyEnhancedComponent(props: P) {
    const { isSupported } = useGracefulDegradation();
    
    const canUseEnhanced = requiredFeatures.every(feature => isSupported(feature));
    
    if (canUseEnhanced) {
      return <EnhancedComponent {...props} />;
    } else {
      return <FallbackComponent {...props} />;
    }
  };
}

/**
 * Conditional rendering component
 */
interface ConditionalRenderProps {
  children: React.ReactNode;
  fallback: React.ReactNode;
  requiredFeatures: (keyof FeatureSupport)[];
}

export function ConditionalRender({ children, fallback, requiredFeatures }: ConditionalRenderProps) {
  const { isSupported } = useGracefulDegradation();
  
  const canRender = requiredFeatures.every(feature => isSupported(feature));
  
  return <>{canRender ? children : fallback}</>;
}

/**
 * Adaptive image component
 */
interface AdaptiveImageProps {
  src: string;
  alt: string;
  className?: string;
  highQualitySrc?: string;
  lowQualitySrc?: string;
}

export function AdaptiveImage({ src, alt, className, highQualitySrc, lowQualitySrc }: AdaptiveImageProps) {
  const { adaptiveStrategy } = useGracefulDegradation();
  
  const imageSrc = React.useMemo(() => {
    switch (adaptiveStrategy.imageQuality) {
      case 'low':
        return lowQualitySrc || src;
      case 'high':
        return highQualitySrc || src;
      default:
        return src;
    }
  }, [adaptiveStrategy.imageQuality, src, highQualitySrc, lowQualitySrc]);

  if (adaptiveStrategy.shouldLazyLoad) {
    return (
      <img
        src={imageSrc}
        alt={alt}
        className={className}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      decoding="async"
    />
  );
}

/**
 * Adaptive animation wrapper
 */
interface AdaptiveAnimationProps {
  children: React.ReactNode;
  animation: 'none' | 'reduced' | 'full';
  className?: string;
}

export function AdaptiveAnimation({ children, animation, className }: AdaptiveAnimationProps) {
  const { adaptiveStrategy } = useGracefulDegradation();
  
  const shouldAnimate = adaptiveStrategy.animationLevel !== 'none' && 
                       (adaptiveStrategy.animationLevel === 'full' || animation !== 'full');
  
  return (
    <div className={`${className} ${shouldAnimate ? '' : 'motion-reduce'}`}>
      {children}
    </div>
  );
}
