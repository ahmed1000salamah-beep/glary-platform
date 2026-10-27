import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  build: {
    target: ['es2018', 'chrome64', 'firefox67', 'safari12', 'edge79'],
    cssTarget: ['chrome61', 'firefox60', 'safari11', 'edge16'],
    minify: 'esbuild' as const,
  },
  server: {
    hmr: false,
    ws: false,
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
});
