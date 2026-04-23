import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Migrated from webpack 5 (April 2026)
// See: monolith-docs/DEEP_DIVE_Vite_Assessment_2026-04-23.md
export default defineConfig({
  plugins: [react()],
  publicDir: 'public',
  server: {
    port: 3001,
    open: true,
    forwardConsole: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:3000',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    target: 'es2022',
  },
});
