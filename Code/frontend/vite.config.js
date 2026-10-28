import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
    warmup: {
      clientFiles: [
        './src/App.jsx',
        './src/main.jsx',
        './src/pages/Login.jsx',
        './src/pages/Dashboard.jsx'
      ]
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'lucide-react'
    ]
  }
});
