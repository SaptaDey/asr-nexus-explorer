/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    exclude: ['**/node_modules/**', '**/dist/**', '**/e2e/**', '**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        'public/',
        'archive/',
        'black-dashboard-react-master/',
        'supabase/',
        'scripts/',
        'server/',
        'docs/',
        'prisma/',
        'error_log/',
        'src/vite-env.d.ts',
        'src/types/plotly.d.ts',
        'src/assets/**',
        'src/workers/**', // Web workers are hard to test in jsdom
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 75,
          statements: 75,
        },
        // Higher thresholds for critical services
        'src/services/AsrGotStageEngine.ts': {
          branches: 85,
          functions: 90,
          lines: 90,
          statements: 90,
        },
        'src/services/apiService.ts': {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85,
        },
        'src/hooks/useASRGoT.ts': {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85,
        },
      },
    },
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
      },
    },
    testTimeout: 15000,
    hookTimeout: 10000,
    server: {
      deps: {
        inline: [
          'cytoscape',
          'cytoscape-dagre',
          'plotly.js-dist-min',
          '@react-three/fiber',
          '@react-three/drei',
          'three',
          'gsap',
          'animejs',
        ],
      },
    },
    env: {
      NODE_ENV: 'test',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/utils': path.resolve(__dirname, './src/utils'),
      '@/types': path.resolve(__dirname, './src/types'),
      '@/config': path.resolve(__dirname, './src/config'),
    },
  },
});