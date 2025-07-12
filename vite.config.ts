import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/engine': resolve(__dirname, 'src/engine'),
      '@/game': resolve(__dirname, 'src/game'),
      '@/entities': resolve(__dirname, 'src/entities'),
      '@/ui': resolve(__dirname, 'src/ui'),
      '@/utils': resolve(__dirname, 'src/utils'),
      '@/types': resolve(__dirname, 'src/types'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
  optimizeDeps: {
    include: ['three', 'cannon-es'],
  },
  publicDir: 'public',
});