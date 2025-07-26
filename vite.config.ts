import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
        changeOrigin: true
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
  ].filter(Boolean),
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@tanstack/react-query',
      '@radix-ui/react-dialog',
      '@radix-ui/react-tabs',
      'cytoscape',
      'framer-motion'
    ],
    exclude: [
      'plotly.js-dist-min',
      '@react-three/fiber',
      'three'
    ]
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React ecosystem - MUST include react-query to avoid createContext errors
          if (id.includes('node_modules/react') || 
              id.includes('node_modules/react-dom') || 
              id.includes('@tanstack/react-query')) {
            return 'react';
          }
          
          // Radix UI components
          if (id.includes('@radix-ui/')) {
            return 'radix-ui';
          }
          
          // Visualization libraries - split heavy ones
          if (id.includes('plotly.js')) {
            return 'plotly';
          }
          if (id.includes('cytoscape') || id.includes('react-cytoscapejs')) {
            return 'cytoscape';
          }
          if (id.includes('@xyflow/react') || id.includes('reactflow')) {
            return 'reactflow';
          }
          if (id.includes('three') || id.includes('@react-three/')) {
            return 'three';
          }
          
          // Animation libraries
          if (id.includes('framer-motion') || id.includes('animejs') || id.includes('@react-spring/')) {
            return 'animation';
          }
          
          // Utility libraries
          if (id.includes('date-fns') || id.includes('clsx') || id.includes('class-variance-authority')) {
            return 'utils';
          }
          
          // Supabase and auth
          if (id.includes('@supabase/')) {
            return 'supabase';
          }
          
          // Form handling
          if (id.includes('react-hook-form') || id.includes('@hookform/')) {
            return 'forms';
          }
          
          // Markdown and text processing
          if (id.includes('react-markdown') || id.includes('remark-') || id.includes('dompurify')) {
            return 'markdown';
          }
          
          // Icons and UI assets
          if (id.includes('lucide-react') || id.includes('embla-carousel')) {
            return 'icons-ui';
          }
          
          // Charts and data visualization
          if (id.includes('recharts') || id.includes('d3-')) {
            return 'charts';
          }
          
          // Large vendor libraries
          if (id.includes('node_modules/')) {
            return 'vendor';
          }
        }
      }
    },
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
        pure_funcs: mode === 'production' ? ['console.log', 'console.info', 'console.debug'] : [],
      },
      mangle: {
        safari10: true,
      },
    },
    cssCodeSplit: true,
    chunkSizeWarningLimit: 1000,
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    'import.meta.env.MODE': JSON.stringify(mode)
  }
}));
