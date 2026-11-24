import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the API runs on :4000 — proxy both JSON requests and uploaded
// covers so relative /uploads/... URLs work without a second origin.
const API_TARGET = process.env.VITE_DEV_API || 'http://localhost:4000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: false },
      '/uploads': { target: API_TARGET, changeOrigin: false }
    }
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    cssCodeSplit: false
  }
});
