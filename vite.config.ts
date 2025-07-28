import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

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
    react({
      // Configure SWC to handle JSX properly and detect React imports
      include: "**/*.{jsx,tsx}",
      exclude: /node_modules/,
    }),
  ],
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
        manualChunks: {
          // CRITICAL: Force React ecosystem into same chunk to prevent createContext errors
          'react': [
            'react',
            'react-dom',
            'react-dom/client',
            '@tanstack/react-query'
          ]
        },
        // Ensure proper module order
        inlineDynamicImports: false,
        chunkFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'react') {
            return 'react-[hash].js';
          }
          return '[name]-[hash].js';
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
