import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0', // Changed back to 0.0.0.0 for better accessibility
      cors: true, // Enable CORS for development
      proxy: {
        '/api': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
          // No rewrite - keep /api prefix for backend routes
        },
        '/uploads': {
          target: 'http://localhost:4000',
          changeOrigin: true,
          secure: false,
          // Important: Don't rewrite uploads path
        },
        '/images': {
          target: 'http://localhost:4000', // Add proxy for default images
          changeOrigin: true,
          secure: false,
        }
      },
    },
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    // Add build configuration for better production builds
    build: {
      outDir: 'dist',
      sourcemap: mode === 'development',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['@mui/material', '@mui/icons-material'],
          }
        }
      }
    },
    // Optimize for development
    optimizeDeps: {
      include: ['react', 'react-dom', '@mui/material', '@mui/icons-material']
    }
  };
});