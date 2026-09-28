import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  cacheDir: '.vite-cache',
  esbuild: { jsx: 'automatic' },
});
