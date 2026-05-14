import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4173',
    headless: true,
    viewport: { width: 540, height: 960 },
  },
  webServer: {
    // Build with production mode so the base path is set to /FlappyBird/,
    // matching the GitHub Pages deploy. Preview serves the built dist/.
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173/FlappyBird/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
