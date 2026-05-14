import { defineConfig } from 'vite';
import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

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
  plugins: [
    {
      name: 'copy-root-manifest',
      writeBundle: () => {
        const source = resolve(__dirname, 'manifest.json');
        const target = resolve(__dirname, 'dist', 'manifest.json');
        try {
          copyFileSync(source, target);
        } catch (error) {
          throw new Error(
            `Failed to copy manifest.json to dist/. Ensure manifest.json exists at project root: ${String(error)}`
          );
        }
      },
    },
  ],
}));
