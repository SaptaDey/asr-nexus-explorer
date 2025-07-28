/**
 * Environment Configuration
 * Provides type-safe environment-specific configurations
 */

export type Environment = 'development' | 'staging' | 'production';

export interface EnvironmentConfig {
  NODE_ENV: Environment;
  API_BASE_URL: string;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  ENABLE_DEBUG: boolean;
  ENABLE_PERFORMANCE_MONITORING: boolean;
  ENABLE_ERROR_REPORTING: boolean;
  MAX_GRAPH_NODES: number;
  MAX_API_CALLS_PER_MINUTE: number;
  CACHE_TTL_MINUTES: number;
  LOG_LEVEL: 'error' | 'warn' | 'info' | 'debug';
  FEATURE_FLAGS: {
    treeVisualization: boolean;
    advancedAnalytics: boolean;
    collaborativeMode: boolean;
    exportFunctionality: boolean;
    mobilePWA: boolean;
  };
}

const createConfig = (): EnvironmentConfig => {
  const env = (import.meta.env.MODE || 'development') as Environment;
  
  const baseConfig: EnvironmentConfig = {
    NODE_ENV: env,
    API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://scientific-research.online',
    SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || '',
    SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    ENABLE_DEBUG: false,
    ENABLE_PERFORMANCE_MONITORING: true,
    ENABLE_ERROR_REPORTING: true,
    MAX_GRAPH_NODES: 1000,
    MAX_API_CALLS_PER_MINUTE: 60,
    CACHE_TTL_MINUTES: 15,
    LOG_LEVEL: 'warn',
    FEATURE_FLAGS: {
      treeVisualization: true,
      advancedAnalytics: true,
      collaborativeMode: true,
      exportFunctionality: true,
      mobilePWA: true,
    },
  };

  switch (env) {
    case 'development':
      return {
        ...baseConfig,
        ENABLE_DEBUG: true,
        MAX_GRAPH_NODES: 500,
        MAX_API_CALLS_PER_MINUTE: 30,
        LOG_LEVEL: 'debug',
        FEATURE_FLAGS: {
          ...baseConfig.FEATURE_FLAGS,
          treeVisualization: false, // Disabled for performance in dev
        },
      };

    case 'staging':
      return {
        ...baseConfig,
        ENABLE_DEBUG: true,
        ENABLE_PERFORMANCE_MONITORING: true,
        MAX_GRAPH_NODES: 750,
        MAX_API_CALLS_PER_MINUTE: 45,
        LOG_LEVEL: 'info',
      };

    case 'production':
      return {
        ...baseConfig,
        ENABLE_DEBUG: false,
        ENABLE_PERFORMANCE_MONITORING: true,
        ENABLE_ERROR_REPORTING: true,
        MAX_GRAPH_NODES: 1500,
        MAX_API_CALLS_PER_MINUTE: 100,
        LOG_LEVEL: 'error',
      };

    default:
      return baseConfig;
  }
};

export const config = createConfig();

export const isDevelopment = config.NODE_ENV === 'development';
export const isStaging = config.NODE_ENV === 'staging';
export const isProduction = config.NODE_ENV === 'production';

// Runtime environment validation
export const validateEnvironment = (): void => {
  const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];
  
  for (const envVar of requiredEnvVars) {
    if (!import.meta.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
};

// Feature flag utilities
export const isFeatureEnabled = (feature: keyof EnvironmentConfig['FEATURE_FLAGS']): boolean => {
  return config.FEATURE_FLAGS[feature];
};

export default config;