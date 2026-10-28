import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router') || id.includes('react-dom') || id.includes('/react/')) {
              return 'vendor-react';
            }
            if (id.includes('framer-motion')) {
              return 'vendor-motion';
            }
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'vendor-charts';
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons';
            }
          }
          if (id.includes('src/pages/dashboards/')) {
            return 'page-dashboards';
          }
          if (id.includes('src/pages/admin/')) {
            return 'page-admin';
          }
          if (id.includes('src/pages/student/')) {
            return 'page-student';
          }
          if (id.includes('src/pages/committee/')) {
            return 'page-committee';
          }
          if (id.includes('src/pages/counseling/')) {
            return 'page-counseling';
          }
          if (id.includes('src/constants/')) {
            return 'app-config';
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.js',
    testTimeout: 15000,
  },
  server: {
    port: 5174,
    host: true,
  },
});
