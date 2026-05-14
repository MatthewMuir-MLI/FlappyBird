import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => ({
  // GitHub Pages serves the repo at /FlappyBird/. Use the same base in production
  // so asset URLs resolve correctly. In dev and Playwright preview we serve from /.
  base: mode === 'production' ? '/FlappyBird/' : '/',
  build: {
    target: 'es2022',
    sourcemap: true,
  },
  server: {
    port: 5173,
  },
  preview: {
    port: 4173,
  },
}));
